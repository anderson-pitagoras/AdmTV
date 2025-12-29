# 📋 CHECKLIST DE MELHORIAS - ADMTV

## Status: 🟡 Em Progresso

---

## ✅ 0. Campos Opcionais em Usuários

**Status:** ⬜ Pendente

**Alterações:**
- [ ] Backend: Adicionar campos `name` (opcional) e mudar `expire_date` para `expires_at`
- [ ] Frontend: Atualizar formulário com campo "Nome" opcional
- [ ] Frontend: Atualizar tabela de usuários para exibir nome
- [ ] Banco: Migração automática (MongoDB schema-less)

**Arquivos afetados:**
- `/app/backend/server.py` - Models User, UserCreate, UserUpdate
- `/app/frontend/src/pages/Users.js` - Formulário e tabela

---

## ✅ 1. Corrigir Formato URL M3U

**Status:** ⬜ Pendente

**Alterações:**
- [ ] Backend: Alterar geração de URL M3U para formato correto
- [ ] Formato: `http://dns/get.php?username=X&password=Y&type=m3u_plus&output=mpegts`

**Arquivos afetados:**
- `/app/backend/server.py` - Função create_user e update_user

---

## ✅ 2. Importar Lista M3U ao Criar Usuário

**Status:** ⬜ Pendente

**Alterações:**
- [ ] Frontend: Adicionar campo textarea para colar URL M3U
- [ ] Frontend: Parser de URL M3U para extrair username, password, dns
- [ ] Frontend: Auto-preencher campos se URL for colada
- [ ] Backend: Verificar se DNS existe, senão criar automaticamente

**Arquivos afetados:**
- `/app/frontend/src/pages/Users.js` - Formulário
- `/app/backend/server.py` - Endpoint create_user

---

## ✅ 3. Sistema de Pagamentos Recorrentes

**Status:** ⬜ Pendente

**Alterações:**
- [ ] Banco: Novo modelo `Subscription` (plano, valor, status, próximo_vencimento)
- [ ] Backend: Campo `plan_price` em User
- [ ] Backend: Campo `pay_url` em User
- [ ] Frontend: Gerenciar assinaturas (ativar/suspender)
- [ ] Frontend: Campo "Observações" em pagamentos
- [ ] Frontend: Status de pagamento (pendente/confirmado/suspenso)

**Novos Campos User:**
- `plan_price: float` (valor do plano)
- `pay_url: string` (link de pagamento)
- `subscription_status: string` (active/suspended/pending)

**Arquivos afetados:**
- `/app/backend/server.py` - Model User, Payment
- `/app/frontend/src/pages/Users.js`
- `/app/frontend/src/pages/Payments.js`

---

## ✅ 4. Integração WhatsApp (WuzAPI)

**Status:** ⬜ Pendente

**Credenciais WuzAPI:**
```
URL: https://wuzapi.criartebrasil.com.br/api/
Instance ID: b2b170f60d445656efca18d92edc916d
Token: Arte@2025
JID: 5511970727049:26@s.whatsapp.net
```

**Alterações:**
- [ ] Backend: Novo arquivo `/app/backend/wuzapi.py` com funções:
  - `send_message(phone, message)`
  - `send_template_expiring_soon(user_data)`
  - `send_payment_reminder(user_data)`
- [ ] Backend: Endpoint `/api/notifications/send`
- [ ] Frontend: Página "Notificações" em Settings
- [ ] Frontend: Templates de mensagem editáveis
- [ ] Frontend: Botão "Enviar lembrete" por usuário

**Template de Mensagem:**
```
Olá querido(a) cliente *{name}*,

*SUA CONTA EXPIRA EM BREVE!*

Seu plano de *R$ {plan_price}* vence em:
*{expires_at}*

Seu usuário atual é *{username}*

Evite o bloqueio automático do seu sinal

Para renovar o seu plano agora, clique no link abaixo:
{pay_url}

*Observações:* {notes}

Por favor, nos envie o comprovante de pagamento assim que possível.

É sempre um prazer te atender.
```

**Arquivos novos:**
- `/app/backend/wuzapi.py` - Integração API
- `/app/frontend/src/pages/Notifications.js` - Interface

**Arquivos afetados:**
- `/app/backend/server.py` - Novos endpoints
- `/app/backend/requirements.txt` - Adicionar `httpx`
- `/app/frontend/src/App.js` - Nova rota

---

## ✅ 5. Melhorias Login + Área do Usuário

**Status:** ⬜ Pendente

### 5.1 Login Admin (Melhorias)

**Alterações:**
- [ ] Frontend: Adicionar "Esqueci minha senha"
- [ ] Backend: Endpoint `/api/auth/forgot-password` (envia email)
- [ ] Backend: Endpoint `/api/auth/reset-password` (token)
- [ ] Frontend: Página de reset de senha
- [ ] Backend: Magic Link (login sem senha via email)

### 5.2 Portal do Usuário (Expansão)

**Alterações:**
- [ ] Backend: Novo modelo `Ticket` (chamados de suporte)
- [ ] Backend: Novo modelo `Notification` (notificações)
- [ ] Frontend: `/portal/:username/tickets` - Abrir chamados
- [ ] Frontend: `/portal/:username/notifications` - Ver notificações
- [ ] Frontend: `/portal/:username/payments` - Histórico detalhado
- [ ] Frontend: Melhorar design do portal

**Novos Endpoints:**
- `POST /api/portal/:username/tickets` - Criar ticket
- `GET /api/portal/:username/tickets` - Listar tickets
- `GET /api/portal/:username/notifications` - Listar notificações

**Arquivos novos:**
- `/app/frontend/src/pages/UserTickets.js`
- `/app/frontend/src/pages/UserNotifications.js`

**Arquivos afetados:**
- `/app/backend/server.py` - Novos models e endpoints
- `/app/frontend/src/pages/UserPortal.js` - Menu expandido

---

## 📂 Estrutura de Arquivos (Após Melhorias)

```
backend/
├── server.py (atualizado)
├── wuzapi.py (novo)
├── requirements.txt (atualizado)
└── .env

frontend/src/
├── pages/
│   ├── Login.js (atualizado)
│   ├── Users.js (atualizado)
│   ├── Payments.js (atualizado)
│   ├── Notifications.js (novo)
│   ├── UserPortal.js (atualizado)
│   ├── UserTickets.js (novo)
│   └── UserNotifications.js (novo)
└── components/
    └── (existentes)
```

---

## 🔄 Ordem de Implementação Sugerida

1. ✅ Item 0 e 1 (campos + URL M3U) - Simples, rápido
2. ✅ Item 2 (importar M3U) - Melhoria UX
3. ✅ Item 4 (WhatsApp básico) - Integração crítica
4. ✅ Item 3 (pagamentos recorrentes) - Depende do WhatsApp
5. ✅ Item 5 (login + área usuário) - Mais complexo

---

## 📝 Notas para Próximo Assistente

- Credenciais WuzAPI estão no item 4
- Templates de mensagem estão documentados
- MongoDB é schema-less, não precisa migration
- Manter padrão de nomenclatura (snake_case backend, camelCase frontend)
- Sempre adicionar `data-testid` em novos elementos
- Seguir design guidelines em `/app/design_guidelines.json`

---

## 🚀 Como Continuar

**Próximo passo:** Implementar Item 0 e 1 (mais simples)

```bash
# Ver este checklist
cat /app/CHECKLIST-MELHORIAS.md

# Começar implementação
# 1. Atualizar backend/server.py
# 2. Atualizar frontend/src/pages/Users.js
# 3. Testar
```

---

**Última atualização:** $(date)
**Assistente:** E1
