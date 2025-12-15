import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle, XCircle, Server, DollarSign } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get('/stats');
      setStats(response.data);
    } catch (error) {
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    {
      title: 'Total de Usuários',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'text-primary'
    },
    {
      title: 'Usuários Ativos',
      value: stats?.active_users || 0,
      icon: CheckCircle,
      color: 'text-accent'
    },
    {
      title: 'Usuários Expirados',
      value: stats?.expired_users || 0,
      icon: XCircle,
      color: 'text-destructive'
    },
    {
      title: 'Servidores DNS',
      value: stats?.total_dns || 0,
      icon: Server,
      color: 'text-secondary'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-heading font-black mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema IPTV</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className="hover:border-primary/30 transition-colors duration-300"
                data-testid={`stat-card-${stat.title.toLowerCase().replace(/ /g, '-')}`}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-heading font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Revenue Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-accent" />
                Receita Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-heading font-black text-accent">
                R$ {(stats?.total_revenue || 0).toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">Total de pagamentos confirmados</p>
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Pagamentos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.recent_payments && stats.recent_payments.length > 0 ? (
                <div className="space-y-3">
                  {stats.recent_payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex justify-between items-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      data-testid="recent-payment-item"
                    >
                      <div>
                        <p className="font-medium">R$ {payment.amount.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(payment.date), "dd MMM yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          payment.status === 'completed'
                            ? 'bg-accent/20 text-accent'
                            : payment.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-500'
                            : 'bg-destructive/20 text-destructive'
                        }`}
                      >
                        {payment.status === 'completed' ? 'Pago' : payment.status === 'pending' ? 'Pendente' : 'Falhou'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum pagamento registrado</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;