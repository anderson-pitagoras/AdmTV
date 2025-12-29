import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import axiosInstance from '@/lib/axios';
import { toast } from 'sonner';

const WhatsAppDialog = ({ open, onClose, userId }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) fetchTemplates();
  }, [open]);

  const fetchTemplates = async () => {
    try {
      const response = await axiosInstance.get('/templates');
      setTemplates(response.data);
    } catch (error) {}
  };

  const handleTemplateChange = (templateId) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) setMessage(template.message);
  };

  const handleSend = async () => {
    if (!message.trim()) return toast.error('Digite uma mensagem');
    setSending(true);
    try {
      await axiosInstance.post('/notifications/send-whatsapp', { user_id: userId, message });
      toast.success('WhatsApp enviado!');
      onClose();
      setMessage('');
      setSelectedTemplate('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Enviar WhatsApp</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Template</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger><SelectValue placeholder="Escolha template" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Personalizada</SelectItem>
                {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={10} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSend} disabled={sending}>{sending ? 'Enviando...' : 'Enviar'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppDialog;