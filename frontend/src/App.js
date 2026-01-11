import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Buyers from '@/pages/Buyers';
import Samples from '@/pages/Samples';
import Orders from '@/pages/Orders';
import PricingCalculator from '@/pages/PricingCalculator';
import Layout from '@/components/Layout';
import { Toaster } from '@/components/ui/sonner';
import '@/App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
          } />
          <Route path="/" element={
            isAuthenticated ? <Layout onLogout={handleLogout} /> : <Navigate to="/login" />
          }>
            <Route index element={<Dashboard />} />
            <Route path="buyers" element={<Buyers />} />
            <Route path="samples" element={<Samples />} />
            <Route path="orders" element={<Orders />} />
            <Route path="pricing" element={<PricingCalculator />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;