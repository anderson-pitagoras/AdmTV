import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    user_id: '',
    amount: '',
    status: 'completed',
    method: 'pix',
    notes: ''
  });

  useEffect(() => {
    fetchPayments();
    fetchUsers();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await axiosInstance.get('/payments');
      setPayments(response.data);
    } catch (error) {
      toast.error('Erro ao carregar pagamentos');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Erro ao carregar usuários');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/payments', {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      toast.success('Pagamento registrado com sucesso!');
      setDialogOpen(false);
      resetForm();
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao registrar pagamento');
    }
  };

  const handleDelete = async (paymentId) => {
    if (!window.confirm('Tem certeza que deseja excluir este pagamento?')) return;
    
    try {
      await axiosInstance.delete(`/payments/${paymentId}`);
      toast.success('Pagamento excluído com sucesso!');
      fetchPayments();
    } catch (error) {
      toast.error('Erro ao excluir pagamento');
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      amount: '',
      status: 'completed',
      method: 'pix',
      notes: ''
    });
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.username : 'N/A';
  };

  const getTotalRevenue = () => {
    return payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)
      .toFixed(2);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-heading font-black mb-2">Pagamentos</h1>
            <p className="text-muted-foreground">Histórico de pagamentos dos clientes</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="shadow-lg shadow-primary/20" data-testid="add-payment-button">
                <Plus className="mr-2 h-4 w-4" />
                Registrar Pagamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Pagamento</DialogTitle>
                <DialogDescription>
                  Adicione um novo pagamento ao histórico
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="user_id">Usuário *</Label>
                    <Select
                      value={formData.user_id}
                      onValueChange={(value) => setFormData({ ...formData, user_id: value })}
                      required
                    >
                      <SelectTrigger data-testid="payment-user-select">
                        <SelectValue placeholder="Selecione o usuário" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor (R$) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="50.00"
                      required
                      data-testid="payment-amount-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="method">Método *</Label>
                    <Select
                      value={formData.method}
                      onValueChange={(value) => setFormData({ ...formData, method: value })}
                    >
                      <SelectTrigger data-testid="payment-method-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="card">Cartão</SelectItem>
                        <SelectItem value="cash">Dinheiro</SelectItem>
                        <SelectItem value="transfer">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger data-testid="payment-status-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Confirmado</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="failed">Falhou</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Informações adicionais"
                      data-testid="payment-notes-input"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" data-testid="payment-save-button">
                    Registrar
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-heading font-bold mb-2">Receita Total</h3>
          <p className="text-4xl font-heading font-black text-accent">R$ {getTotalRevenue()}</p>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhum pagamento registrado
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-muted/50" data-testid="payment-table-row">
                    <TableCell className="font-medium">{getUserName(payment.user_id)}</TableCell>
                    <TableCell className="font-mono font-bold">R$ {payment.amount.toFixed(2)}</TableCell>
                    <TableCell className="capitalize">{payment.method}</TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          payment.status === 'completed'
                            ? 'bg-accent/20 text-accent'
                            : payment.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-500'
                            : 'bg-destructive/20 text-destructive'
                        }`}
                      >
                        {payment.status === 'completed' ? 'Confirmado' : payment.status === 'pending' ? 'Pendente' : 'Falhou'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(payment.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {payment.notes || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(payment.id)}
                        className="text-destructive hover:text-destructive"
                        data-testid="delete-payment-button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Payments;