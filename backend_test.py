import requests
import sys
from datetime import datetime, date, timedelta
import json

class ExportFlowAPITester:
    def __init__(self, base_url="https://exporttracker.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_buyer_id = None
        self.created_sample_id = None
        self.created_order_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response text: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_login(self):
        """Test login with existing credentials"""
        success, response = self.run_test(
            "Login with existing user",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@exportflow.com", "password": "admin123"}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_get_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_dashboard_stats(self):
        """Test dashboard stats"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        if success:
            print(f"   Stats: {response}")
        return success

    def test_get_buyers(self):
        """Test get all buyers"""
        success, response = self.run_test(
            "Get All Buyers",
            "GET",
            "buyers",
            200
        )
        if success:
            print(f"   Found {len(response)} buyers")
            if response:
                print(f"   First buyer: {response[0].get('company_name', 'N/A')}")
        return success

    def test_create_buyer(self):
        """Test create new buyer"""
        tomorrow = (date.today() + timedelta(days=1)).isoformat()
        buyer_data = {
            "company_name": "XYZ Trading Co",
            "contact_person": "Jane Smith",
            "email": "jane@xyztrading.com",
            "phone": "+44-555-9876",
            "country": "UK",
            "stage": "replied",
            "next_followup_date": tomorrow,
            "notes": "Interested in organic jaggery"
        }
        
        success, response = self.run_test(
            "Create New Buyer",
            "POST",
            "buyers",
            200,
            data=buyer_data
        )
        
        if success and 'id' in response:
            self.created_buyer_id = response['id']
            print(f"   Created buyer ID: {self.created_buyer_id}")
        return success

    def test_update_buyer(self):
        """Test update buyer"""
        if not self.created_buyer_id:
            print("❌ No buyer ID available for update test")
            return False
            
        update_data = {
            "stage": "sample",
            "notes": "Updated: Sample requested for quality testing"
        }
        
        success, response = self.run_test(
            "Update Buyer",
            "PUT",
            f"buyers/{self.created_buyer_id}",
            200,
            data=update_data
        )
        return success

    def test_get_buyer_by_id(self):
        """Test get specific buyer"""
        if not self.created_buyer_id:
            print("❌ No buyer ID available for get test")
            return False
            
        success, response = self.run_test(
            "Get Buyer by ID",
            "GET",
            f"buyers/{self.created_buyer_id}",
            200
        )
        return success

    def test_filter_buyers_by_stage(self):
        """Test filter buyers by stage"""
        success, response = self.run_test(
            "Filter Buyers by Stage",
            "GET",
            "buyers?stage=sample",
            200
        )
        if success:
            print(f"   Found {len(response)} buyers with 'sample' stage")
        return success

    def test_create_sample(self):
        """Test create sample"""
        if not self.created_buyer_id:
            print("❌ No buyer ID available for sample creation")
            return False
            
        tomorrow = (date.today() + timedelta(days=1)).isoformat()
        sample_data = {
            "buyer_id": self.created_buyer_id,
            "product_name": "Organic Jaggery Powder",
            "quantity": "5 kg",
            "shipping_date": tomorrow,
            "status": "pending",
            "tracking_number": "TRACK123456",
            "notes": "Sample for quality testing"
        }
        
        success, response = self.run_test(
            "Create Sample",
            "POST",
            "samples",
            200,
            data=sample_data
        )
        
        if success and 'id' in response:
            self.created_sample_id = response['id']
            print(f"   Created sample ID: {self.created_sample_id}")
        return success

    def test_get_samples(self):
        """Test get all samples"""
        success, response = self.run_test(
            "Get All Samples",
            "GET",
            "samples",
            200
        )
        if success:
            print(f"   Found {len(response)} samples")
        return success

    def test_update_sample(self):
        """Test update sample"""
        if not self.created_sample_id:
            print("❌ No sample ID available for update test")
            return False
            
        update_data = {
            "status": "shipped",
            "notes": "Updated: Sample shipped successfully"
        }
        
        success, response = self.run_test(
            "Update Sample",
            "PUT",
            f"samples/{self.created_sample_id}",
            200,
            data=update_data
        )
        return success

    def test_create_order(self):
        """Test create order"""
        if not self.created_buyer_id:
            print("❌ No buyer ID available for order creation")
            return False
            
        order_data = {
            "buyer_id": self.created_buyer_id,
            "product_name": "Organic Jaggery Blocks",
            "quantity": "1000 kg",
            "unit_price": 2.50,
            "total_amount": 2500.00,
            "order_date": "2025-01-10",
            "delivery_date": "2025-02-15",
            "status": "confirmed",
            "notes": "First bulk order"
        }
        
        success, response = self.run_test(
            "Create Order",
            "POST",
            "orders",
            200,
            data=order_data
        )
        
        if success and 'id' in response:
            self.created_order_id = response['id']
            print(f"   Created order ID: {self.created_order_id}")
        return success

    def test_get_orders(self):
        """Test get all orders"""
        success, response = self.run_test(
            "Get All Orders",
            "GET",
            "orders",
            200
        )
        if success:
            print(f"   Found {len(response)} orders")
        return success

    def test_update_order(self):
        """Test update order"""
        if not self.created_order_id:
            print("❌ No order ID available for update test")
            return False
            
        update_data = {
            "status": "shipped",
            "notes": "Updated: Order shipped successfully"
        }
        
        success, response = self.run_test(
            "Update Order",
            "PUT",
            f"orders/{self.created_order_id}",
            200,
            data=update_data
        )
        return success

    def test_pricing_calculator(self):
        """Test pricing calculator"""
        pricing_data = {
            "product_name": "Premium Jaggery",
            "base_price": 3.00,
            "quantity": 500.0,
            "unit": "kg",
            "freight_cost": 250.00,
            "insurance_cost": 50.00,
            "fob_price": 0,  # Will be calculated
            "cif_price": 0   # Will be calculated
        }
        
        success, response = self.run_test(
            "Pricing Calculator",
            "POST",
            "pricing/calculate",
            200,
            data=pricing_data
        )
        
        if success:
            expected_fob = 3.00 * 500.0  # 1500
            expected_cif = expected_fob + 250.00 + 50.00  # 1800
            actual_fob = response.get('fob_price', 0)
            actual_cif = response.get('cif_price', 0)
            
            print(f"   FOB Price: Expected {expected_fob}, Got {actual_fob}")
            print(f"   CIF Price: Expected {expected_cif}, Got {actual_cif}")
            
            if actual_fob == expected_fob and actual_cif == expected_cif:
                print("   ✅ Pricing calculations are correct")
            else:
                print("   ❌ Pricing calculations are incorrect")
                
        return success

    def test_dashboard_stats_after_creation(self):
        """Test dashboard stats after creating data"""
        success, response = self.run_test(
            "Dashboard Stats (After Data Creation)",
            "GET",
            "dashboard/stats",
            200
        )
        if success:
            print(f"   Updated Stats: {response}")
            stats = response
            if stats.get('total_buyers', 0) > 0:
                print("   ✅ Total buyers count updated")
            if stats.get('orders_confirmed', 0) > 0:
                print("   ✅ Orders confirmed count updated")
        return success

def main():
    print("🚀 Starting ExportFlow API Testing...")
    print("=" * 60)
    
    tester = ExportFlowAPITester()
    
    # Test sequence
    tests = [
        ("Root Endpoint", tester.test_root_endpoint),
        ("Login", tester.test_login),
        ("Get Current User", tester.test_get_me),
        ("Dashboard Stats", tester.test_dashboard_stats),
        ("Get Buyers", tester.test_get_buyers),
        ("Create Buyer", tester.test_create_buyer),
        ("Update Buyer", tester.test_update_buyer),
        ("Get Buyer by ID", tester.test_get_buyer_by_id),
        ("Filter Buyers by Stage", tester.test_filter_buyers_by_stage),
        ("Create Sample", tester.test_create_sample),
        ("Get Samples", tester.test_get_samples),
        ("Update Sample", tester.test_update_sample),
        ("Create Order", tester.test_create_order),
        ("Get Orders", tester.test_get_orders),
        ("Update Order", tester.test_update_order),
        ("Pricing Calculator", tester.test_pricing_calculator),
        ("Dashboard Stats (Final)", tester.test_dashboard_stats_after_creation),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print final results
    print("\n" + "=" * 60)
    print("📊 FINAL TEST RESULTS")
    print("=" * 60)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {len(failed_tests)}")
    
    if failed_tests:
        print(f"\n❌ Failed Tests:")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print(f"\n✅ All tests passed!")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"\nSuccess Rate: {success_rate:.1f}%")
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())