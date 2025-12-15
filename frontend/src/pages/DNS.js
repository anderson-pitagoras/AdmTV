import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Server } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DNS = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingServer, setEditingServer] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    url: '',
    active: true
  });

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      const response = await axiosInstance.get('/dns');
      setServers(response.data);
    } catch (error) {
      toast.error('Erro ao carregar servidores DNS');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingServer) {
        await axiosInstance.put(`/dns/${editingServer.id}`, formData);
        toast.success('Servidor atualizado com sucesso!');
      } else {
        await axiosInstance.post('/dns', formData);
        toast.success('Servidor criado com sucesso!');
      }
      setDialogOpen(false);
      resetForm();
      fetchServers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar servidor');
    }
  };

  const handleDelete = async (serverId) => {
    if (!window.confirm('Tem certeza que deseja excluir este servidor?')) return;
    
    try {
      await axiosInstance.delete(`/dns/${serverId}`);
      toast.success('Servidor excluído com sucesso!');
      fetchServers();
    } catch (error) {
      toast.error('Erro ao excluir servidor');
    }
  };

  const handleEdit = (server) => {
    setEditingServer(server);
    setFormData({
      title: server.title,
      url: server.url,
      active: server.active
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingServer(null);
    setFormData({
      title: '',
      url: '',
      active: true
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-heading font-black mb-2">Servidores DNS</h1>
            <p className="text-muted-foreground">Gerencie os servidores IPTV</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="shadow-lg shadow-primary/20" data-testid="add-dns-button">
                <Plus className="mr-2 h-4 w-4" />
                Novo Servidor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingServer ? 'Editar Servidor' : 'Novo Servidor'}</DialogTitle>
                <DialogDescription>
                  {editingServer ? 'Atualize as informações do servidor' : 'Adicione um novo servidor DNS'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Servidor Principal"
                      required
                      data-testid="dns-title-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url">URL *</Label>
                    <Input
                      id="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="http://meuservidor.iptv"
                      required
                      data-testid="dns-url-input"
                    />
                    <p className="text-xs text-muted-foreground">
                      URL base do servidor (sem /get.php)
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                      data-testid="dns-active-switch"
                    />
                    <Label htmlFor="active">Servidor ativo</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" data-testid="dns-save-button">
                    {editingServer ? 'Atualizar' : 'Criar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum servidor cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                servers.map((server) => (
                  <TableRow key={server.id} className="hover:bg-muted/50" data-testid="dns-table-row">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-secondary" />
                        {server.title}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{server.url}</TableCell>
                    <TableCell>
                      {server.active ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent">
                          Ativo
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                          Inativo
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(server.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(server)}
                          data-testid="edit-dns-button"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(server.id)}
                          className="text-destructive hover:text-destructive"
                          data-testid="delete-dns-button"
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
    </DashboardLayout>
  );
};

export default DNS;