import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Ship } from 'lucide-react';
import { API } from '@/lib/api';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister
        ? formData
        : { email: formData.email, password: formData.password };

      const response = await axios.post(`${API}${endpoint}`, payload);
      const { access_token, user } = response.data;

      onLogin(access_token, user);
      toast.success(isRegister ? 'Account created successfully!' : 'Welcome back!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div 
        className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1703977883249-d959f2b0c1ae?crop=entropy&cs=srgb&fm=jpg&q=85)',
        }}
      >
        <div className="absolute inset-0 bg-primary/80"></div>
        <div className="relative z-10 p-12 flex flex-col justify-center text-primary-foreground">
          <div className="flex items-center gap-3 mb-6">
            <Ship className="w-10 h-10" />
            <h1 className="text-4xl font-bold">ExportFlow</h1>
          </div>
          <p className="text-xl leading-relaxed opacity-90">
            Streamline your export business with intelligent buyer tracking, 
            sample management, and pricing tools.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Ship className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">ExportFlow</h1>
            </div>
          </div>

          <Card data-testid="login-card">
            <CardHeader>
              <CardTitle className="text-2xl">{isRegister ? 'Create Account' : 'Welcome Back'}</CardTitle>
              <CardDescription>
                {isRegister ? 'Register your export business' : 'Sign in to your account'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {isRegister && (
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      data-testid="full-name-input"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required={isRegister}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    data-testid="email-input"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    data-testid="password-input"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  data-testid="submit-button"
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
                </Button>
              </form>

              <div className="mt-4 text-center text-sm">
                <button
                  type="button"
                  data-testid="toggle-auth-mode"
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-primary hover:underline"
                >
                  {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}