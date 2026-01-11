import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [formData, setFormData] = useState({
    buyer_id: '',
    product_name: '',
    quantity: '',
    unit_price: '',
    total_amount: '',
    order_date: '',
    delivery_date: '',
    status: 'pending',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.quantity && formData.unit_price) {
      const qty = parseFloat(formData.quantity) || 0;
      const price = parseFloat(formData.unit_price) || 0;
      setFormData(prev => ({ ...prev, total_amount: (qty * price).toFixed(2) }));
    }
  }, [formData.quantity, formData.unit_price]);

  const fetchData = async () => {
    try {
      const [ordersRes, buyersRes] = await Promise.all([
        api.get('/orders'),
        api.get('/buyers'),
      ]);
      setOrders(ordersRes.data);
      setBuyers(buyersRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const submitData = {
        ...formData,
        unit_price: parseFloat(formData.unit_price),
        total_amount: parseFloat(formData.total_amount),
      };

      if (editingOrder) {
        await api.put(`/orders/${editingOrder.id}`, submitData);
        toast.success('Order updated successfully');
      } else {
        await api.post('/orders', submitData);
        toast.success('Order created successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;

    try {
      await api.delete(`/orders/${id}`);
      toast.success('Order deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete order');
    }
  };

  const openDialog = (order = null) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        buyer_id: order.buyer_id,
        product_name: order.product_name,
        quantity: order.quantity,
        unit_price: order.unit_price.toString(),
        total_amount: order.total_amount.toString(),
        order_date: order.order_date,
        delivery_date: order.delivery_date || '',
        status: order.status,
        notes: order.notes || '',
      });
    }
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingOrder(null);
    setFormData({
      buyer_id: '',
      product_name: '',
      quantity: '',
      unit_price: '',
      total_amount: '',
      order_date: '',
      delivery_date: '',
      status: 'pending',
      notes: '',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-accent/20 text-accent-foreground',
      confirmed: 'bg-primary/20 text-primary',
      shipped: 'bg-secondary/20 text-secondary-foreground',
      delivered: 'bg-primary/20 text-primary',
      cancelled: 'bg-destructive/20 text-destructive',
    };
    return colors[status] || 'bg-muted';
  };

  return (
    <div className="p-10" data-testid="orders-page">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Orders</h1>
          <p className="text-muted-foreground">Manage confirmed orders and shipments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="add-order-button" onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingOrder ? 'Edit Order' : 'Add New Order'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="buyer_id">Buyer *</Label>
                <Select
                  value={formData.buyer_id}
                  onValueChange={(value) => setFormData({ ...formData, buyer_id: value })}
                  required
                >
                  <SelectTrigger data-testid="buyer-select">
                    <SelectValue placeholder="Select a buyer" />
                  </SelectTrigger>
                  <SelectContent>
                    {buyers.map((buyer) => (
                      <SelectItem key={buyer.id} value={buyer.id}>
                        {buyer.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product_name">Product Name *</Label>
                  <Input
                    id="product_name"
                    data-testid="product-name-input"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    data-testid="quantity-input"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit_price">Unit Price (USD) *</Label>
                  <Input
                    id="unit_price"
                    data-testid="unit-price-input"
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_amount">Total Amount (USD)</Label>
                  <Input
                    id="total_amount"
                    data-testid="total-amount-input"
                    type="number"
                    step="0.01"
                    value={formData.total_amount}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="order_date">Order Date *</Label>
                  <Input
                    id="order_date"
                    data-testid="order-date-input"
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery_date">Delivery Date</Label>
                  <Input
                    id="delivery_date"
                    data-testid="delivery-date-input"
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger data-testid="status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  data-testid="notes-textarea"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="save-order-button">
                  {editingOrder ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border">
        <CardHeader className="border-b border-border bg-muted/20">
          <CardTitle>Orders List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No orders found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/20">
                  <tr>
                    <th className="text-left p-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Buyer</th>
                    <th className="text-left p-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Product</th>
                    <th className="text-left p-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Quantity</th>
                    <th className="text-left p-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Amount</th>
                    <th className="text-left p-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Order Date</th>
                    <th className="text-left p-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</th>
                    <th className="text-right p-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} data-testid={`order-row-${order.id}`} className="table-row border-b border-border hover:bg-muted/50">
                      <td className="p-4 font-medium">{order.buyer_name}</td>
                      <td className="p-4">{order.product_name}</td>
                      <td className="p-4">{order.quantity}</td>
                      <td className="p-4 font-medium">${order.total_amount.toFixed(2)}</td>
                      <td className="p-4">{order.order_date}</td>
                      <td className="p-4">
                        <Badge className={`${getStatusColor(order.status)} rounded-md`}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`edit-order-${order.id}`}
                            onClick={() => openDialog(order)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`delete-order-${order.id}`}
                            onClick={() => handleDelete(order.id)}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}