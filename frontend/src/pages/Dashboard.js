import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Bell, TrendingUp, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Buyers',
      value: stats?.total_buyers || 0,
      icon: Users,
      color: 'text-primary',
      testId: 'total-buyers-stat'
    },
    {
      title: 'Follow-ups Due',
      value: stats?.followups_due || 0,
      icon: Bell,
      color: 'text-secondary',
      testId: 'followups-due-stat'
    },
    {
      title: 'Active Leads',
      value: stats?.active_leads || 0,
      icon: TrendingUp,
      color: 'text-accent',
      testId: 'active-leads-stat'
    },
    {
      title: 'Orders Confirmed',
      value: stats?.orders_confirmed || 0,
      icon: Package,
      color: 'text-primary',
      testId: 'orders-confirmed-stat'
    },
  ];

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
    <div className="p-10" data-testid="dashboard">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your export business overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="stat-card border-border" data-testid={stat.testId}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {stat.title}
                </CardTitle>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {stats?.upcoming_followups && stats.upcoming_followups.length > 0 && (
        <Card className="border-border" data-testid="upcoming-followups-card">
          <CardHeader className="border-b border-border bg-muted/20">
            <CardTitle className="text-xl">Upcoming Follow-ups</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {stats.upcoming_followups.map((followup) => (
                <div
                  key={followup.id}
                  data-testid={`followup-item-${followup.id}`}
                  className="flex items-center justify-between p-4 rounded-sm border border-border hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{followup.company_name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Follow-up date: {followup.next_followup_date}
                    </p>
                  </div>
                  <Badge className={`${getStageColor(followup.stage)} rounded-md`}>
                    {followup.stage}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats?.upcoming_followups && stats.upcoming_followups.length === 0 && (
        <Card className="border-border">
          <CardContent className="p-12 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No upcoming follow-ups scheduled</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}