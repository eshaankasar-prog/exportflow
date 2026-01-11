import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash, Search } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function Buyers() {
  const [buyers, setBuyers] = useState([]);
  const [filteredBuyers, setFilteredBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    country: '',
    stage: 'contacted',
    notes: '',
    next_followup_date: '',
  });

  useEffect(() => {
    fetchBuyers();
  }, []);

  useEffect(() => {
    filterBuyers();
  }, [buyers, searchTerm, stageFilter]);

  const fetchBuyers = async () => {
    try {
      const response = await api.get('/buyers');
      setBuyers(response.data);
    } catch (error) {
      toast.error('Failed to load buyers');
    } finally {
      setLoading(false);
    }
  };

  const filterBuyers = () => {
    let filtered = buyers;

    if (stageFilter !== 'all') {
      filtered = filtered.filter((b) => b.stage === stageFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (b) =>
          b.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredBuyers(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingBuyer) {
        await api.put(`/buyers/${editingBuyer.id}`, formData);
        toast.success('Buyer updated successfully');
      } else {
        await api.post('/buyers', formData);
        toast.success('Buyer created successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchBuyers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this buyer?')) return;

    try {
      await api.delete(`/buyers/${id}`);
      toast.success('Buyer deleted successfully');
      fetchBuyers();
    } catch (error) {
      toast.error('Failed to delete buyer');
    }
  };

  const openDialog = (buyer = null) => {
    if (buyer) {
      setEditingBuyer(buyer);
      setFormData({
        company_name: buyer.company_name,
        contact_person: buyer.contact_person,
        email: buyer.email,
        phone: buyer.phone,
        country: buyer.country,
        stage: buyer.stage,
        notes: buyer.notes || '',
        next_followup_date: buyer.next_followup_date || '',
      });
    }
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingBuyer(null);
    setFormData({
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      country: '',
      stage: 'contacted',
      notes: '',
      next_followup_date: '',
    });
  };

  const getStageColor = (stage) => {
    const colors = {
      contacted: 'bg-muted text-muted-foreground',
      replied: 'bg-accent/20 text-accent-foreground',
      sample: 'bg-secondary/20 text-secondary-foreground',
      order: 'bg-primary/20 text-primary',
    };
    return colors[stage] || 'bg-muted';
  };

  return (
    <div className="p-10" data-testid="buyers-page">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Buyers</h1>
          <p className="text-muted-foreground">Manage your export buyers and importers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="add-buyer-button" onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Buyer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBuyer ? 'Edit Buyer' : 'Add New Buyer'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    data-testid="company-name-input"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Contact Person *</Label>
                  <Input
                    id="contact_person"
                    data-testid="contact-person-input"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    data-testid="email-input"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    data-testid="phone-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    data-testid="country-input"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stage">Stage *</Label>
                  <Select
                    value={formData.stage}
                    onValueChange={(value) => setFormData({ ...formData, stage: value })}
                  >
                    <SelectTrigger data-testid="stage-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="replied">Replied</SelectItem>
                      <SelectItem value="sample">Sample</SelectItem>
                      <SelectItem value="order">Order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="next_followup_date">Next Follow-up Date</Label>
                <Input
                  id="next_followup_date"
                  data-testid="followup-date-input"
                  type="date"
                  value={formData.next_followup_date}
                  onChange={(e) => setFormData({ ...formData, next_followup_date: e.target.value })}
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
                <Button type="submit" data-testid="save-buyer-button">
                  {editingBuyer ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border mb-6">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                data-testid="search-input"
                placeholder="Search buyers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-48" data-testid="stage-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="sample">Sample</SelectItem>
                <SelectItem value="order">Order</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="border-b border-border bg-muted/20">
          <CardTitle>Buyers List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">Loading buyers...</div>
          ) : filteredBuyers.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No buyers found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/20">
                  <tr>
                    <th className="text-left p-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Company</th>
                    <th className="text-left p-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Contact</th>
                    <th className="text-left p-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Country</th>
                    <th className="text-left p-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Stage</th>
                    <th className="text-left p-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Next Follow-up</th>
                    <th className="text-right p-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBuyers.map((buyer) => (
                    <tr key={buyer.id} data-testid={`buyer-row-${buyer.id}`} className="table-row border-b border-border hover:bg-muted/50">
                      <td className="p-4">
                        <div className="font-medium">{buyer.company_name}</div>
                        <div className="text-sm text-muted-foreground">{buyer.email}</div>
                      </td>
                      <td className="p-4">
                        <div>{buyer.contact_person}</div>
                        <div className="text-sm text-muted-foreground">{buyer.phone}</div>
                      </td>
                      <td className="p-4">{buyer.country}</td>
                      <td className="p-4">
                        <Badge className={`${getStageColor(buyer.stage)} rounded-md`}>
                          {buyer.stage}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {buyer.next_followup_date || <span className="text-muted-foreground">Not set</span>}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`edit-buyer-${buyer.id}`}
                            onClick={() => openDialog(buyer)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`delete-buyer-${buyer.id}`}
                            onClick={() => handleDelete(buyer.id)}
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