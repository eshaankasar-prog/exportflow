import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function PricingCalculator() {
  const [formData, setFormData] = useState({
    product_name: '',
    base_price: '',
    quantity: '',
    unit: 'kg',
    freight_cost: '',
    insurance_cost: '',
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        product_name: formData.product_name,
        base_price: parseFloat(formData.base_price),
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        freight_cost: parseFloat(formData.freight_cost),
        insurance_cost: parseFloat(formData.insurance_cost),
        fob_price: 0,
        cif_price: 0,
      };

      const response = await api.post('/pricing/calculate', payload);
      setResult(response.data);
      toast.success('Pricing calculated successfully');
    } catch (error) {
      toast.error('Failed to calculate pricing');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      product_name: '',
      base_price: '',
      quantity: '',
      unit: 'kg',
      freight_cost: '',
      insurance_cost: '',
    });
    setResult(null);
  };

  return (
    <div className="p-10" data-testid="pricing-calculator-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Pricing Calculator</h1>
        <p className="text-muted-foreground">Calculate FOB and CIF pricing for your exports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-border">
          <CardHeader className="border-b border-border bg-muted/20">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Input Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleCalculate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product_name">Product Name *</Label>
                <Input
                  id="product_name"
                  data-testid="product-name-input"
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  placeholder="e.g., Organic Jaggery"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base_price">Base Price (USD per unit) *</Label>
                  <Input
                    id="base_price"
                    data-testid="base-price-input"
                    type="number"
                    step="0.01"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    data-testid="quantity-input"
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  data-testid="unit-input"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="kg, tons, pieces"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="freight_cost">Freight Cost (USD) *</Label>
                  <Input
                    id="freight_cost"
                    data-testid="freight-cost-input"
                    type="number"
                    step="0.01"
                    value={formData.freight_cost}
                    onChange={(e) => setFormData({ ...formData, freight_cost: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insurance_cost">Insurance Cost (USD) *</Label>
                  <Input
                    id="insurance_cost"
                    data-testid="insurance-cost-input"
                    type="number"
                    step="0.01"
                    value={formData.insurance_cost}
                    onChange={(e) => setFormData({ ...formData, insurance_cost: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" data-testid="calculate-button" className="flex-1" disabled={loading}>
                  {loading ? 'Calculating...' : 'Calculate'}
                </Button>
                <Button type="button" variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="border-b border-border bg-muted/20">
            <CardTitle>Price Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {result ? (
              <div className="space-y-6" data-testid="pricing-results">
                <div>
                  <h3 className="text-lg font-semibold mb-3">{result.product_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {result.quantity} {result.unit} @ ${result.base_price.toFixed(2)} per {result.unit}
                  </p>
                </div>

                <div className="space-y-3 border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Cost:</span>
                    <span className="font-medium">${(result.base_price * result.quantity).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Freight Cost:</span>
                    <span className="font-medium">${result.freight_cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Insurance Cost:</span>
                    <span className="font-medium">${result.insurance_cost.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-3 border-t border-border pt-4">
                  <div className="flex justify-between items-center p-4 bg-primary/10 rounded-sm">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">FOB Price</p>
                      <p className="text-sm text-muted-foreground">Free On Board</p>
                    </div>
                    <span className="text-2xl font-bold text-primary" data-testid="fob-price">
                      ${result.fob_price.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-secondary/10 rounded-sm">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">CIF Price</p>
                      <p className="text-sm text-muted-foreground">Cost, Insurance & Freight</p>
                    </div>
                    <span className="text-2xl font-bold text-secondary" data-testid="cif-price">
                      ${result.cif_price.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-border pt-4 text-sm text-muted-foreground">
                  <p><strong>FOB:</strong> Price of goods loaded onto the vessel</p>
                  <p className="mt-2"><strong>CIF:</strong> FOB + Freight + Insurance to destination port</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <Calculator className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Enter product details and costs to calculate pricing</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}