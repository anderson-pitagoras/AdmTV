# IPTV Manager - Sistema de Gerenciamento de IPTV

Sistema completo para gerenciamento de usuários, listas M3U, servidores DNS e pagamentos de serviços IPTV.

## 📋 Requisitos

- **Node.js** 18+ e **Yarn**
- **Python** 3.11+
- **MongoDB** 5.0+

## 🚀 Instalação Local

### 1️⃣ Clone o Repositório

```bash
git clone <url-do-seu-repositorio>
cd iptv-manager
```

### 2️⃣ Configurar Backend (FastAPI)

```bash
cd backend

# Criar ambiente virtual Python
python -m venv venv

# Ativar ambiente virtual
# No Windows:
venv\Scripts\activate
# No Linux/Mac:
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt
```

**Configurar variáveis de ambiente:**

Edite o arquivo `backend/.env`:

```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="iptv_management"
CORS_ORIGINS="http://localhost:3000"
SECRET_KEY="sua-chave-secreta-aqui-mude-em-producao"
```

**Iniciar o backend:**

```bash
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

O backend estará rodando em: `http://localhost:8001`

### 3️⃣ Configurar Frontend (React)

Abra um novo terminal:

```bash
cd frontend

# Instalar dependências
yarn install
```

**Configurar variáveis de ambiente:**

Edite o arquivo `frontend/.env`:

```env
REACT_APP_BACKEND_URL=http://localhost:8001
WDS_SOCKET_PORT=3000
REACT_APP_ENABLE_VISUAL_EDITS=false
ENABLE_HEALTH_CHECK=false
```

**Iniciar o frontend:**

```bash
yarn start
```

O frontend estará rodando em: `http://localhost:3000`

### 4️⃣ Configurar MongoDB

**Opção A: MongoDB Local**

1. Instale o MongoDB: https://www.mongodb.com/try/download/community
2. Inicie o serviço MongoDB
3. O banco de dados será criado automaticamente na primeira execução

**Opção B: MongoDB Atlas (Cloud - Grátis)**

1. Crie uma conta em: https://www.mongodb.com/cloud/atlas
2. Crie um cluster gratuito
3. Obtenha a connection string
4. Atualize `MONGO_URL` no arquivo `backend/.env`

```env
MONGO_URL="mongodb+srv://usuario:senha@cluster.mongodb.net/?retryWrites=true&w=majority"
```

## 🎯 Primeiro Acesso

### Criar Conta de Administrador

1. Acesse: `http://localhost:3000/login`
2. Clique na aba **"Registrar"**
3. Preencha:
   - Nome: Seu nome
   - Email: seu@email.com
   - Senha: sua senha segura
4. Clique em **"Criar Conta"**
5. Você será redirecionado para o Dashboard

### Configurar o Sistema

1. **Adicionar Servidor DNS:**
   - Menu lateral → "Servidores DNS"
   - Clique em "Novo Servidor"
   - Título: Nome do servidor
   - URL: `http://seuservidor.iptv.com` (sem /get.php)
   - Ativar servidor

2. **Configurar WhatsApp de Suporte:**
   - Menu lateral → "Configurações"
   - WhatsApp: +55 11 99999-9999
   - Mensagem de boas-vindas (opcional)
   - Salvar

3. **Criar Usuário IPTV:**
   - Menu lateral → "Usuários"
   - Clique em "Novo Usuário"
   - Preencha:
     - Usuário: nome_usuario
     - Senha: senha123
     - Servidor DNS: Selecione o servidor cadastrado
     - Data de Expiração: 31/12/2025
     - MAC Address (opcional): 00:11:22:33:44:55
     - PIN: 0000
   - Salvar

4. **Registrar Pagamento:**
   - Menu lateral → "Pagamentos"
   - Clique em "Registrar Pagamento"
   - Selecione o usuário, valor, método e status
   - Salvar

## 📱 Portal do Usuário

Cada usuário pode acessar suas credenciais em:
```
http://localhost:3000/portal/{username}
```

Exemplo: `http://localhost:3000/portal/nome_usuario`

O portal exibe:
- ✅ Dias restantes até expiração
- ✅ Data de criação e vencimento
- ✅ Credenciais (usuário, senha, DNS)
- ✅ Lista M3U completa (copiável)
- ✅ WhatsApp do suporte
- ✅ Histórico de pagamentos

## 🔑 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar admin
- `POST /api/auth/login` - Login admin
- `GET /api/auth/me` - Dados do admin logado

### Usuários IPTV
- `GET /api/users` - Listar usuários
- `POST /api/users` - Criar usuário
- `PUT /api/users/{id}` - Atualizar usuário
- `DELETE /api/users/{id}` - Excluir usuário
- `POST /api/users/{id}/validate` - Validar lista M3U

### Servidores DNS
- `GET /api/dns` - Listar servidores
- `POST /api/dns` - Criar servidor
- `PUT /api/dns/{id}` - Atualizar servidor
- `DELETE /api/dns/{id}` - Excluir servidor

### Pagamentos
- `GET /api/payments` - Listar pagamentos
- `POST /api/payments` - Registrar pagamento
- `DELETE /api/payments/{id}` - Excluir pagamento

### Configurações
- `GET /api/settings` - Obter configurações
- `PUT /api/settings` - Atualizar configurações

### Portal Público
- `GET /api/portal/{username}` - Dados do usuário para portal

### Estatísticas
- `GET /api/stats` - Estatísticas do dashboard

## 🎨 Tecnologias Utilizadas

### Backend
- **FastAPI** - Framework web Python
- **Motor** - Driver assíncrono MongoDB
- **PyJWT** - Autenticação JWT
- **Bcrypt** - Hash de senhas
- **HTTPX** - Validação de URLs M3U

### Frontend
- **React** 19
- **React Router** - Navegação
- **Shadcn/UI** - Componentes
- **Tailwind CSS** - Estilização
- **Axios** - Requisições HTTP
- **Sonner** - Notificações toast
- **date-fns** - Manipulação de datas
- **Lucide React** - Ícones

### Database
- **MongoDB** - Banco de dados NoSQL

## 🛠️ Estrutura do Projeto

```
/app
├── backend/
│   ├── server.py           # API FastAPI
│   ├── requirements.txt    # Dependências Python
│   └── .env               # Variáveis de ambiente
│
├── frontend/
│   ├── public/            # Arquivos estáticos
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   │   ├── ui/       # Componentes Shadcn
│   │   │   ├── Sidebar.js
│   │   │   ├── Header.js
│   │   │   └── DashboardLayout.js
│   │   ├── contexts/     # Contextos React
│   │   │   ├── AuthContext.js
│   │   │   └── ThemeContext.js
│   │   ├── pages/        # Páginas
│   │   │   ├── Login.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Users.js
│   │   │   ├── DNS.js
│   │   │   ├── Payments.js
│   │   │   ├── Settings.js
│   │   │   └── UserPortal.js
│   │   ├── lib/          # Utilitários
│   │   ├── App.js        # Componente principal
│   │   ├── index.js      # Entry point
│   │   └── index.css     # Estilos globais
│   ├── package.json      # Dependências Node
│   ├── tailwind.config.js
│   └── .env              # Variáveis de ambiente
│
├── design_guidelines.json # Guidelines de design
└── README.md             # Este arquivo
```

## 📊 Modelo de Dados

### Admin
```javascript
{
  id: string,
  email: string,
  name: string,
  password_hash: string,
  created_at: datetime
}
```

### User (Usuário IPTV)
```javascript
{
  id: string,
  username: string,
  password: string,
  dns_id: string,
  mac_address: string (opcional),
  lista_m3u: string (gerado automaticamente),
  created_at: datetime,
  expire_date: datetime,
  active: boolean,
  pin: string
}
```

### DNS
```javascript
{
  id: string,
  title: string,
  url: string,
  active: boolean,
  created_at: datetime
}
```

### Payment
```javascript
{
  id: string,
  user_id: string,
  amount: float,
  date: datetime,
  status: string (completed/pending/failed),
  method: string (pix/card/cash/transfer),
  notes: string (opcional)
}
```

### Settings
```javascript
{
  id: "system_settings",
  whatsapp_support: string,
  welcome_message: string,
  updated_at: datetime
}
```

## 🔒 Segurança

- ✅ Senhas de admin hashadas com bcrypt
- ✅ Autenticação JWT com expiração de 7 dias
- ✅ Rotas protegidas no backend
- ✅ CORS configurável
- ✅ Validação de dados com Pydantic

## 🚢 Deploy em Produção

### Backend

**Recomendações:**
1. Use um servidor com Python 3.11+
2. Configure um reverse proxy (Nginx)
3. Use supervisor ou systemd para gerenciar o processo
4. Configure SSL/HTTPS
5. Use MongoDB Atlas ou servidor dedicado
6. Altere `SECRET_KEY` para valor único e seguro

### Frontend

**Opções:**
1. **Vercel** (recomendado): `vercel deploy`
2. **Netlify**: `netlify deploy`
3. **Build manual**: `yarn build` + servir pasta `build/`

**Importante:** Atualize `REACT_APP_BACKEND_URL` com URL de produção do backend

## 🐛 Troubleshooting

### Backend não inicia
- Verifique se MongoDB está rodando
- Confirme que a porta 8001 está livre
- Verifique o arquivo `.env`

### Frontend não conecta ao backend
- Confirme que `REACT_APP_BACKEND_URL` está correto
- Verifique CORS no backend
- Use Network tab do DevTools para debug

### Erro de autenticação
- Limpe o localStorage do navegador
- Faça logout e login novamente
- Verifique se o token não expirou

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique este README
2. Consulte os logs do backend/frontend
3. Abra uma issue no GitHub

## 📄 Licença

Este projeto foi desenvolvido na plataforma Emergent.

---

**Desenvolvido com ❤️ usando Emergent AI**
