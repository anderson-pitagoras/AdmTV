import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tv, Calendar, Clock, Copy, MessageCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTheme } from '@/contexts/ThemeContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const UserPortal = () => {
  const { username } = useParams();
  const { theme, toggleTheme } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, [username]);

  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${API}/portal/${username}`);
      setData(response.data);
    } catch (error) {
      setError('Usuário não encontrado');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast.success('Copiado!');
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          toast.success('Copiado!');
        } catch (err) {
          toast.error('Erro ao copiar');
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      toast.error('Erro ao copiar');
    }
  };

  const getDaysRemaining = () => {
    if (!data?.user?.expires_at) return 0;
    return differenceInDays(new Date(data.user.expires_at), new Date());
  };

  const openWhatsApp = () => {
    if (data?.whatsapp_support) {
      const phone = data.whatsapp_support.replace(/\D/g, '');
      window.open(`https://wa.me/${phone}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive font-medium">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = getDaysRemaining() < 0;
  const daysRemaining = getDaysRemaining();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div
        className="relative h-64 bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1758876201322-55a41d42b626?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwyfHx3YXRjaGluZyUyMHR2JTIwbGl2aW5nJTIwcm9vbSUyMG1vZGVybnxlbnwwfHx8fDE3NjU4MjE2MTF8MA&ixlib=rb-4.1.0&q=85)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-secondary/90"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <Tv className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-4xl font-heading font-black mb-2">Portal do Usuário</h1>
            <p className="text-xl opacity-90">Bem-vindo, {data?.user?.username}</p>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
          data-testid="portal-theme-toggle"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-8 -mt-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Status Card */}
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" />
                Status da Conta
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isExpired ? (
                <div>
                  <div className="text-3xl font-heading font-black text-destructive mb-2">Expirado</div>
                  <p className="text-sm text-muted-foreground">Sua conta expirou. Entre em contato com o suporte.</p>
                </div>
              ) : (
                <div>
                  <div className="text-3xl font-heading font-black text-accent mb-2">{daysRemaining} dias</div>
                  <p className="text-sm text-muted-foreground">restantes até o vencimento</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Creation Date */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-secondary" />
                Criado em
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-heading font-bold mb-2">
                {format(new Date(data.user.created_at), 'dd/MM/yyyy', { locale: ptBR })}
              </div>
              <p className="text-sm text-muted-foreground">
                Vencimento: {format(new Date(data.user.expires_at), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </CardContent>
          </Card>

          {/* Support Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="h-5 w-5 text-accent" />
                Suporte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={openWhatsApp}
                className="w-full"
                disabled={!data?.whatsapp_support}
                data-testid="portal-whatsapp-button"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </Button>
              {data?.whatsapp_support && (
                <p className="text-xs text-center text-muted-foreground mt-2 font-mono">
                  {data.whatsapp_support}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Credentials Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Suas Credenciais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Usuário</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 rounded-lg bg-muted font-mono text-sm">{data.user.username}</code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(data.user.username)}
                    data-testid="copy-username-button"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Senha</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 rounded-lg bg-muted font-mono text-sm">{data.user.password}</code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(data.user.password)}
                    data-testid="copy-password-button"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {data.dns && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">Servidor DNS</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 rounded-lg bg-muted font-mono text-sm">{data.dns.url}</code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(data.dns.url)}
                      data-testid="copy-dns-button"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              {data.user.lista_m3u && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">Lista M3U</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 rounded-lg bg-muted font-mono text-xs break-all">{data.user.lista_m3u}</code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(data.user.lista_m3u)}
                      data-testid="copy-m3u-button"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        {data.payments && data.payments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-accent" />
                Histórico de Pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center p-4 rounded-lg bg-muted/50"
                    data-testid="portal-payment-item"
                  >
                    <div>
                      <p className="font-heading font-bold text-lg">R$ {payment.amount.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payment.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                      {payment.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{payment.notes}</p>
                      )}
                    </div>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserPortal;