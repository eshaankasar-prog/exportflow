from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

# ===== MODELS =====

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: EmailStr
    full_name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class BuyerCreate(BaseModel):
    company_name: str
    contact_person: str
    email: EmailStr
    phone: str
    country: str
    stage: str = "contacted"
    notes: Optional[str] = None
    next_followup_date: Optional[str] = None

class BuyerUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    stage: Optional[str] = None
    notes: Optional[str] = None
    next_followup_date: Optional[str] = None

class Buyer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    company_name: str
    contact_person: str
    email: EmailStr
    phone: str
    country: str
    stage: str
    notes: Optional[str] = None
    next_followup_date: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class SampleCreate(BaseModel):
    buyer_id: str
    product_name: str
    quantity: str
    shipping_date: str
    tracking_number: Optional[str] = None
    status: str = "pending"
    notes: Optional[str] = None

class SampleUpdate(BaseModel):
    product_name: Optional[str] = None
    quantity: Optional[str] = None
    shipping_date: Optional[str] = None
    tracking_number: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class Sample(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    buyer_id: str
    buyer_name: str
    product_name: str
    quantity: str
    shipping_date: str
    tracking_number: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime

class OrderCreate(BaseModel):
    buyer_id: str
    product_name: str
    quantity: str
    unit_price: float
    total_amount: float
    order_date: str
    delivery_date: Optional[str] = None
    status: str = "pending"
    notes: Optional[str] = None

class OrderUpdate(BaseModel):
    product_name: Optional[str] = None
    quantity: Optional[str] = None
    unit_price: Optional[float] = None
    total_amount: Optional[float] = None
    order_date: Optional[str] = None
    delivery_date: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    buyer_id: str
    buyer_name: str
    product_name: str
    quantity: str
    unit_price: float
    total_amount: float
    order_date: str
    delivery_date: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime

class PricingCalculation(BaseModel):
    product_name: str
    base_price: float
    quantity: float
    unit: str
    freight_cost: float
    insurance_cost: float
    fob_price: float
    cif_price: float

class DashboardStats(BaseModel):
    total_buyers: int
    followups_due: int
    active_leads: int
    orders_confirmed: int
    upcoming_followups: List[dict]

# ===== AUTH HELPERS =====

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"email": email}, {"_id": 0, "password": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ===== ROUTES =====

@api_router.get("/")
async def root():
    return {"message": "ExportFlow API"}

# AUTH ROUTES
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = {
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "full_name": user_data.full_name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_dict)
    
    access_token = create_access_token(data={"sub": user_data.email})
    
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        created_at=datetime.fromisoformat(user_dict["created_at"])
    )
    
    return TokenResponse(access_token=access_token, user=user)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": user_data.email})
    
    user_obj = User(
        email=user["email"],
        full_name=user["full_name"],
        created_at=datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"]
    )
    
    return TokenResponse(access_token=access_token, user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(**current_user)

# BUYER ROUTES
@api_router.post("/buyers", response_model=Buyer)
async def create_buyer(buyer_data: BuyerCreate, current_user: dict = Depends(get_current_user)):
    import uuid
    buyer_dict = buyer_data.model_dump()
    buyer_dict["id"] = str(uuid.uuid4())
    buyer_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    buyer_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    buyer_dict["user_email"] = current_user["email"]
    
    await db.buyers.insert_one(buyer_dict)
    
    return Buyer(
        id=buyer_dict["id"],
        company_name=buyer_dict["company_name"],
        contact_person=buyer_dict["contact_person"],
        email=buyer_dict["email"],
        phone=buyer_dict["phone"],
        country=buyer_dict["country"],
        stage=buyer_dict["stage"],
        notes=buyer_dict.get("notes"),
        next_followup_date=buyer_dict.get("next_followup_date"),
        created_at=datetime.fromisoformat(buyer_dict["created_at"]),
        updated_at=datetime.fromisoformat(buyer_dict["updated_at"])
    )

@api_router.get("/buyers", response_model=List[Buyer])
async def get_buyers(stage: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"user_email": current_user["email"]}
    if stage:
        query["stage"] = stage
    
    buyers = await db.buyers.find(query, {"_id": 0}).to_list(1000)
    
    for buyer in buyers:
        if isinstance(buyer.get("created_at"), str):
            buyer["created_at"] = datetime.fromisoformat(buyer["created_at"])
        if isinstance(buyer.get("updated_at"), str):
            buyer["updated_at"] = datetime.fromisoformat(buyer["updated_at"])
    
    return [Buyer(**buyer) for buyer in buyers]

@api_router.get("/buyers/{buyer_id}", response_model=Buyer)
async def get_buyer(buyer_id: str, current_user: dict = Depends(get_current_user)):
    buyer = await db.buyers.find_one({"id": buyer_id, "user_email": current_user["email"]}, {"_id": 0})
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")
    
    if isinstance(buyer.get("created_at"), str):
        buyer["created_at"] = datetime.fromisoformat(buyer["created_at"])
    if isinstance(buyer.get("updated_at"), str):
        buyer["updated_at"] = datetime.fromisoformat(buyer["updated_at"])
    
    return Buyer(**buyer)

@api_router.put("/buyers/{buyer_id}", response_model=Buyer)
async def update_buyer(buyer_id: str, buyer_data: BuyerUpdate, current_user: dict = Depends(get_current_user)):
    existing_buyer = await db.buyers.find_one({"id": buyer_id, "user_email": current_user["email"]}, {"_id": 0})
    if not existing_buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")
    
    update_data = {k: v for k, v in buyer_data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.buyers.update_one({"id": buyer_id}, {"$set": update_data})
    
    updated_buyer = await db.buyers.find_one({"id": buyer_id}, {"_id": 0})
    
    if isinstance(updated_buyer.get("created_at"), str):
        updated_buyer["created_at"] = datetime.fromisoformat(updated_buyer["created_at"])
    if isinstance(updated_buyer.get("updated_at"), str):
        updated_buyer["updated_at"] = datetime.fromisoformat(updated_buyer["updated_at"])
    
    return Buyer(**updated_buyer)

@api_router.delete("/buyers/{buyer_id}")
async def delete_buyer(buyer_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.buyers.delete_one({"id": buyer_id, "user_email": current_user["email"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Buyer not found")
    return {"message": "Buyer deleted successfully"}

# SAMPLE ROUTES
@api_router.post("/samples", response_model=Sample)
async def create_sample(sample_data: SampleCreate, current_user: dict = Depends(get_current_user)):
    import uuid
    
    buyer = await db.buyers.find_one({"id": sample_data.buyer_id, "user_email": current_user["email"]}, {"_id": 0})
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")
    
    sample_dict = sample_data.model_dump()
    sample_dict["id"] = str(uuid.uuid4())
    sample_dict["buyer_name"] = buyer["company_name"]
    sample_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    sample_dict["user_email"] = current_user["email"]
    
    await db.samples.insert_one(sample_dict)
    
    return Sample(
        id=sample_dict["id"],
        buyer_id=sample_dict["buyer_id"],
        buyer_name=sample_dict["buyer_name"],
        product_name=sample_dict["product_name"],
        quantity=sample_dict["quantity"],
        shipping_date=sample_dict["shipping_date"],
        tracking_number=sample_dict.get("tracking_number"),
        status=sample_dict["status"],
        notes=sample_dict.get("notes"),
        created_at=datetime.fromisoformat(sample_dict["created_at"])
    )

@api_router.get("/samples", response_model=List[Sample])
async def get_samples(current_user: dict = Depends(get_current_user)):
    samples = await db.samples.find({"user_email": current_user["email"]}, {"_id": 0}).to_list(1000)
    
    for sample in samples:
        if isinstance(sample.get("created_at"), str):
            sample["created_at"] = datetime.fromisoformat(sample["created_at"])
    
    return [Sample(**sample) for sample in samples]

@api_router.put("/samples/{sample_id}", response_model=Sample)
async def update_sample(sample_id: str, sample_data: SampleUpdate, current_user: dict = Depends(get_current_user)):
    existing_sample = await db.samples.find_one({"id": sample_id, "user_email": current_user["email"]}, {"_id": 0})
    if not existing_sample:
        raise HTTPException(status_code=404, detail="Sample not found")
    
    update_data = {k: v for k, v in sample_data.model_dump().items() if v is not None}
    
    await db.samples.update_one({"id": sample_id}, {"$set": update_data})
    
    updated_sample = await db.samples.find_one({"id": sample_id}, {"_id": 0})
    
    if isinstance(updated_sample.get("created_at"), str):
        updated_sample["created_at"] = datetime.fromisoformat(updated_sample["created_at"])
    
    return Sample(**updated_sample)

@api_router.delete("/samples/{sample_id}")
async def delete_sample(sample_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.samples.delete_one({"id": sample_id, "user_email": current_user["email"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sample not found")
    return {"message": "Sample deleted successfully"}

# ORDER ROUTES
@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate, current_user: dict = Depends(get_current_user)):
    import uuid
    
    buyer = await db.buyers.find_one({"id": order_data.buyer_id, "user_email": current_user["email"]}, {"_id": 0})
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")
    
    order_dict = order_data.model_dump()
    order_dict["id"] = str(uuid.uuid4())
    order_dict["buyer_name"] = buyer["company_name"]
    order_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    order_dict["user_email"] = current_user["email"]
    
    await db.orders.insert_one(order_dict)
    
    return Order(
        id=order_dict["id"],
        buyer_id=order_dict["buyer_id"],
        buyer_name=order_dict["buyer_name"],
        product_name=order_dict["product_name"],
        quantity=order_dict["quantity"],
        unit_price=order_dict["unit_price"],
        total_amount=order_dict["total_amount"],
        order_date=order_dict["order_date"],
        delivery_date=order_dict.get("delivery_date"),
        status=order_dict["status"],
        notes=order_dict.get("notes"),
        created_at=datetime.fromisoformat(order_dict["created_at"])
    )

@api_router.get("/orders", response_model=List[Order])
async def get_orders(current_user: dict = Depends(get_current_user)):
    orders = await db.orders.find({"user_email": current_user["email"]}, {"_id": 0}).to_list(1000)
    
    for order in orders:
        if isinstance(order.get("created_at"), str):
            order["created_at"] = datetime.fromisoformat(order["created_at"])
    
    return [Order(**order) for order in orders]

@api_router.put("/orders/{order_id}", response_model=Order)
async def update_order(order_id: str, order_data: OrderUpdate, current_user: dict = Depends(get_current_user)):
    existing_order = await db.orders.find_one({"id": order_id, "user_email": current_user["email"]}, {"_id": 0})
    if not existing_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    update_data = {k: v for k, v in order_data.model_dump().items() if v is not None}
    
    await db.orders.update_one({"id": order_id}, {"$set": update_data})
    
    updated_order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    
    if isinstance(updated_order.get("created_at"), str):
        updated_order["created_at"] = datetime.fromisoformat(updated_order["created_at"])
    
    return Order(**updated_order)

@api_router.delete("/orders/{order_id}")
async def delete_order(order_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.orders.delete_one({"id": order_id, "user_email": current_user["email"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order deleted successfully"}

# PRICING CALCULATOR
@api_router.post("/pricing/calculate", response_model=PricingCalculation)
async def calculate_pricing(pricing_data: PricingCalculation, current_user: dict = Depends(get_current_user)):
    fob_price = pricing_data.base_price * pricing_data.quantity
    cif_price = fob_price + pricing_data.freight_cost + pricing_data.insurance_cost
    
    return PricingCalculation(
        product_name=pricing_data.product_name,
        base_price=pricing_data.base_price,
        quantity=pricing_data.quantity,
        unit=pricing_data.unit,
        freight_cost=pricing_data.freight_cost,
        insurance_cost=pricing_data.insurance_cost,
        fob_price=fob_price,
        cif_price=cif_price
    )

# DASHBOARD STATS
@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    from datetime import date
    
    total_buyers = await db.buyers.count_documents({"user_email": current_user["email"]})
    
    today = date.today().isoformat()
    buyers_with_followup = await db.buyers.find(
        {"user_email": current_user["email"], "next_followup_date": {"$lte": today}},
        {"_id": 0}
    ).to_list(1000)
    followups_due = len(buyers_with_followup)
    
    active_leads = await db.buyers.count_documents({
        "user_email": current_user["email"],
        "stage": {"$in": ["contacted", "replied", "sample"]}
    })
    
    orders_confirmed = await db.orders.count_documents({
        "user_email": current_user["email"],
        "status": "confirmed"
    })
    
    upcoming_followups_data = await db.buyers.find(
        {
            "user_email": current_user["email"],
            "next_followup_date": {"$exists": True, "$ne": None}
        },
        {"_id": 0, "id": 1, "company_name": 1, "next_followup_date": 1, "stage": 1}
    ).sort("next_followup_date", 1).limit(10).to_list(10)
    
    return DashboardStats(
        total_buyers=total_buyers,
        followups_due=followups_due,
        active_leads=active_leads,
        orders_confirmed=orders_confirmed,
        upcoming_followups=upcoming_followups_data
    )

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()