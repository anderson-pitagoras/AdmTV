import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import WhatsAppDialog from '@/components/WhatsAppDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, CheckCircle, Copy, MessageCircle } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [dnsServers, setDnsServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [whatsappDialog, setWhatsappDialog] = useState({ open: false, userId: null });
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    dns_id: '',
    name: '',
    mac_address: '',
    expires_at: '',
    pin: '0000',
    plan_price: '',
    pay_url: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchDNS();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const fetchDNS = async () => {
    try {
      const response = await axiosInstance.get('/dns');
      setDnsServers(response.data);
    } catch (error) {
      toast.error('Erro ao carregar servidores DNS');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await axiosInstance.put(`/users/${editingUser.id}`, formData);
        toast.success('Usuário atualizado com sucesso!');
      } else {
        await axiosInstance.post('/users', formData);
        toast.success('Usuário criado com sucesso!');
      }
      setDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar usuário');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;
    
    try {
      await axiosInstance.delete(`/users/${userId}`);
      toast.success('Usuário excluído com sucesso!');
      fetchUsers();
    } catch (error) {
      toast.error('Erro ao excluir usuário');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: user.password,
      dns_id: user.dns_id,
      name: user.name || '',
      mac_address: user.mac_address || '',
      expires_at: format(new Date(user.expires_at), 'yyyy-MM-dd'),
      pin: user.pin,
      plan_price: user.plan_price || '',
      pay_url: user.pay_url || ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      dns_id: '',
      name: '',
      mac_address: '',
      expires_at: '',
      pin: '0000',
      plan_price: '',
      pay_url: ''
    });
  };

  const handleValidate = async (userId) => {
    try {
      const response = await axiosInstance.post(`/users/${userId}/validate`);
      if (response.data.valid) {
        toast.success('Lista M3U válida e acessível!');
      } else {
        toast.error(`Lista M3U inválida: ${response.data.message}`);
      }
    } catch (error) {
      toast.error('Erro ao validar lista M3U');
    }
  };

  const handleSendWhatsApp = (userId) => {
    setWhatsappDialog({ open: true, userId });
  };

  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast.success('Copiado para área de transferência!');
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          toast.success('Copiado para área de transferência!');
        } catch (err) {
          toast.error('Erro ao copiar');
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      toast.error('Erro ao copiar');
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.mac_address && user.mac_address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-heading font-black mb-2">Usuários IPTV</h1>
            <p className="text-muted-foreground">Gerencie as credenciais dos seus clientes</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="shadow-lg shadow-primary/20" data-testid="add-user-button">
                <Plus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
                <DialogDescription>
                  {editingUser ? 'Atualize as informações do usuário' : 'Adicione um novo usuário IPTV'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Usuário *</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                      data-testid="user-username-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha *</Label>
                    <Input
                      id="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      data-testid="user-password-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nome do cliente"
                      data-testid="user-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dns_id">Servidor DNS *</Label>
                    <Select
                      value={formData.dns_id}
                      onValueChange={(value) => setFormData({ ...formData, dns_id: value })}
                      required
                    >
                      <SelectTrigger data-testid="user-dns-select">
                        <SelectValue placeholder="Selecione o DNS" />
                      </SelectTrigger>
                      <SelectContent>
                        {dnsServers.map((dns) => (
                          <SelectItem key={dns.id} value={dns.id}>
                            {dns.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expires_at">Data de Expiração *</Label>
                    <Input
                      id="expires_at"
                      type="date"
                      value={formData.expires_at}
                      onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                      required
                      data-testid="user-expire-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan_price">Valor do Plano (R$)</Label>
                    <Input
                      id="plan_price"
                      type="number"
                      step="0.01"
                      value={formData.plan_price}
                      onChange={(e) => setFormData({ ...formData, plan_price: e.target.value })}
                      placeholder="50.00"
                      data-testid="user-plan-price-input"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="pay_url">Link de Pagamento</Label>
                    <Input
                      id="pay_url"
                      value={formData.pay_url}
                      onChange={(e) => setFormData({ ...formData, pay_url: e.target.value })}
                      placeholder="https://..."
                      data-testid="user-pay-url-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mac_address">Endereço MAC</Label>
                    <Input
                      id="mac_address"
                      value={formData.mac_address}
                      onChange={(e) => setFormData({ ...formData, mac_address: e.target.value })}
                      placeholder="00:00:00:00:00:00"
                      data-testid="user-mac-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pin">PIN</Label>
                    <Input
                      id="pin"
                      value={formData.pin}
                      onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                      placeholder="0000"
                      maxLength={4}
                      data-testid="user-pin-input"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" data-testid="user-save-button">
                    {editingUser ? 'Atualizar' : 'Criar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-4">
          <Input
            placeholder="Buscar por usuário ou MAC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
            data-testid="search-users-input"
          />
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome/Usuário</TableHead>
                <TableHead>Senha</TableHead>
                <TableHead>MAC Address</TableHead>
                <TableHead>Expiração</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lista M3U</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/50" data-testid="user-table-row">
                    <TableCell>
                      <div className="font-medium">{user.name || user.username}</div>
                      <div className="text-xs text-muted-foreground font-mono">{user.username}</div>
                    </TableCell>
                    <TableCell className="font-mono">{user.password}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {user.mac_address || 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(user.expires_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {isExpired(user.expires_at) ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-destructive/20 text-destructive">
                          Expirado
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent">
                          Ativo
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(user.lista_m3u)}
                          data-testid="copy-m3u-button"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleValidate(user.id)}
                          data-testid="validate-m3u-button"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSendWhatsApp(user.id)}
                          title="Enviar WhatsApp"
                          data-testid="send-whatsapp-button"
                        >
                          <MessageCircle className="h-4 w-4 text-accent" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(user)}
                          data-testid="edit-user-button"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(user.id)}
                          className="text-destructive hover:text-destructive"
                          data-testid="delete-user-button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <WhatsAppDialog
        open={whatsappDialog.open}
        onClose={() => setWhatsappDialog({ open: false, userId: null })}
        userId={whatsappDialog.userId}
      />
    </DashboardLayout>
  );
};

export default Users;