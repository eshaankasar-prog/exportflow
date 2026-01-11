import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Package, ShoppingCart, Calculator, LogOut, Ship } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Layout({ onLogout }) {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/buyers', icon: Users, label: 'Buyers' },
    { path: '/samples', icon: Package, label: 'Samples' },
    { path: '/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/pricing', icon: Calculator, label: 'Pricing Calculator' },
  ];

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 border-r border-border bg-card">
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <Ship className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">ExportFlow</h1>
                <p className="text-xs text-muted-foreground">{user.full_name || 'User'}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                      className={`nav-link flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-4 border-t border-border">
            <Button
              variant="outline"
              data-testid="logout-button"
              className="w-full justify-start gap-3"
              onClick={onLogout}
            >
              <LogOut className="w-5 h-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}