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

export default function Samples() {
  const [samples, setSamples] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSample, setEditingSample] = useState(null);
  const [formData, setFormData] = useState({
    buyer_id: '',
    product_name: '',
    quantity: '',
    shipping_date: '',
    tracking_number: '',
    status: 'pending',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [samplesRes, buyersRes] = await Promise.all([
        api.get('/samples'),
        api.get('/buyers'),
      ]);
      setSamples(samplesRes.data);
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
      if (editingSample) {
        await api.put(`/samples/${editingSample.id}`, formData);
        toast.success('Sample updated successfully');
      } else {
        await api.post('/samples', formData);
        toast.success('Sample created successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sample?')) return;

    try {
      await api.delete(`/samples/${id}`);
      toast.success('Sample deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete sample');
    }
  };

  const openDialog = (sample = null) => {
    if (sample) {
      setEditingSample(sample);
      setFormData({
        buyer_id: sample.buyer_id,
        product_name: sample.product_name,
        quantity: sample.quantity,
        shipping_date: sample.shipping_date,
        tracking_number: sample.tracking_number || '',
        status: sample.status,
        notes: sample.notes || '',
      });
    }
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingSample(null);
    setFormData({
      buyer_id: '',
      product_name: '',
      quantity: '',
      shipping_date: '',
      tracking_number: '',
      status: 'pending',
      notes: '',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-accent/20 text-accent-foreground',
      shipped: 'bg-secondary/20 text-secondary-foreground',
      delivered: 'bg-primary/20 text-primary',
      cancelled: 'bg-destructive/20 text-destructive',
    };
    return colors[status] || 'bg-muted';
  };

  return (
    <div className="p-10" data-testid="samples-page">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Samples</h1>
          <p className="text-muted-foreground">Track sample shipments to buyers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="add-sample-button" onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Sample
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingSample ? 'Edit Sample' : 'Add New Sample'}</DialogTitle>
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
                  <Label htmlFor="shipping_date">Shipping Date *</Label>
                  <Input
                    id="shipping_date"
                    data-testid="shipping-date-input"
                    type="date"
                    value={formData.shipping_date}
                    onChange={(e) => setFormData({ ...formData, shipping_date: e.target.value })}
                    required
                  />
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
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tracking_number">Tracking Number</Label>
                <Input
                  id="tracking_number"
                  data-testid="tracking-number-input"
                  value={formData.tracking_number}
                  onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                />
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
                <Button type="submit" data-testid="save-sample-button">
                  {editingSample ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border">
        <CardHeader className="border-b border-border bg-muted/20">
          <CardTitle>Samples List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">Loading samples...</div>
          ) : samples.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No samples found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/20">
                  <tr>
                    <th className="text-left p-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Buyer</th>
                    <th className="text-left p-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Product</th>
                    <th className="text-left p-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Quantity</th>
                    <th className="text-left p-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Shipping Date</th>
                    <th className="text-left p-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Tracking</th>
                    <th className="text-right p-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {samples.map((sample) => (
                    <tr key={sample.id} data-testid={`sample-row-${sample.id}`} className="table-row border-b border-border hover:bg-muted/50">
                      <td className="p-4 font-medium">{sample.buyer_name}</td>
                      <td className="p-4">{sample.product_name}</td>
                      <td className="p-4">{sample.quantity}</td>
                      <td className="p-4">{sample.shipping_date}</td>
                      <td className="p-4">
                        <Badge className={`${getStatusColor(sample.status)} rounded-md`}>
                          {sample.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {sample.tracking_number || <span className="text-muted-foreground">N/A</span>}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`edit-sample-${sample.id}`}
                            onClick={() => openDialog(sample)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`delete-sample-${sample.id}`}
                            onClick={() => handleDelete(sample.id)}
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