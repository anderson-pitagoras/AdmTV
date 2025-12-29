import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axiosInstance from '@/lib/axios';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Save, Plus, Trash2, QrCode } from 'lucide-react';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    whatsapp_support: '',
    welcome_message: '',
    whatsapp_enabled: false,
    whatsapp_url: 'https://wuzapi.criartebrasil.com.br/api',
    whatsapp_instance: '',
    whatsapp_token: ''
  });
  const [templates, setTemplates] = useState([]);
  const [newTemplate, setNewTemplate] = useState({ name: '', message: '' });

  useEffect(() => {
    fetchSettings();
    fetchTemplates();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axiosInstance.get('/settings');
      setFormData(response.data);
    } catch (error) {
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await axiosInstance.get('/templates');
      setTemplates(response.data);
    } catch (error) {}

  const handleAddTemplate = async () => {
    if (!newTemplate.name || !newTemplate.message) return toast.error('Preencha nome e mensagem');
    try {
      await axiosInstance.post(`/templates?name=${encodeURIComponent(newTemplate.name)}&message=${encodeURIComponent(newTemplate.message)}`);
      toast.success('Template criado!');
      setNewTemplate({ name: '', message: '' });
      fetchTemplates();
    } catch (error) {
      toast.error('Erro ao criar template');
    }
  };

  const handleDeleteTemplate = async (id) => {
    try {
      await axiosInstance.delete(`/templates/${id}`);
      toast.success('Template excluído!');
      fetchTemplates();
    } catch (error) {
      toast.error('Erro');
    }
  };

  const handleGetQR = async () => {
    try {
      const response = await axiosInstance.get('/whatsapp/qrcode');
      if (response.data.qrcode) {
        window.open(response.data.qrcode, '_blank');
      }
    } catch (error) {
      toast.error('Erro ao obter QR Code');
    }
  };

  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axiosInstance.put('/settings', formData);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
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

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-4xl font-heading font-black">Configurações</h1>
            <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="geral">
            <TabsList>
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="geral">
              <Card>
                <CardHeader><CardTitle>Suporte</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>WhatsApp do Suporte</Label>
                    <Input value={formData.whatsapp_support} onChange={(e) => setFormData({ ...formData, whatsapp_support: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Mensagem de Boas-Vindas</Label>
                    <Textarea value={formData.welcome_message} onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })} rows={4} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="whatsapp">
              <Card>
                <CardHeader><CardTitle>Configuração WhatsApp</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch checked={formData.whatsapp_enabled} onCheckedChange={(checked) => setFormData({ ...formData, whatsapp_enabled: checked })} />
                    <Label>Ativar WhatsApp</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>URL Server</Label>
                    <Input value={formData.whatsapp_url} onChange={(e) => setFormData({ ...formData, whatsapp_url: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Instance ID</Label>
                    <Input value={formData.whatsapp_instance} onChange={(e) => setFormData({ ...formData, whatsapp_instance: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Token</Label>
                    <Input type="password" value={formData.whatsapp_token} onChange={(e) => setFormData({ ...formData, whatsapp_token: e.target.value })} />
                  </div>
                  <Button type="button" onClick={handleGetQR} variant="outline"><QrCode className="mr-2 h-4 w-4" />Ver QR Code</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="templates">
              <Card>
                <CardHeader><CardTitle>Templates de Mensagem</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input value={newTemplate.name} onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })} placeholder="Ex: Vencimento Próximo" />
                  </div>
                  <div className="space-y-2">
                    <Label>Mensagem (use {'{name}'}, {'{username}'}, {'{expires_at}'}, {'{plan_price}'}, {'{pay_url}'})</Label>
                    <Textarea value={newTemplate.message} onChange={(e) => setNewTemplate({ ...newTemplate, message: e.target.value })} rows={6} />
                  </div>
                  <Button type="button" onClick={handleAddTemplate}><Plus className="mr-2 h-4 w-4" />Adicionar Template</Button>
                  <div className="space-y-2 mt-4">
                    {templates.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-3 bg-muted rounded">
                        <span className="font-medium">{t.name}</span>
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleDeleteTemplate(t.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default Settings;