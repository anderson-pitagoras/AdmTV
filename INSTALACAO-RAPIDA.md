# 🚀 Instalação Rápida - ADMTV

## 📋 Pré-requisitos

✅ VPS com Docker Swarm  
✅ Traefik rodando com Let's Encrypt  
✅ Rede `CriarteNet` criada  
✅ DNS configurado  

---

## 🎯 Instalação em 5 Passos

### 1️⃣ Criar Diretórios

```bash
sudo mkdir -p /opt/admtv/backend
sudo mkdir -p /opt/admtv/frontend
sudo chown -R $USER:$USER /opt/admtv
```

### 2️⃣ Upload dos Arquivos

Faça upload via Git, SCP ou FTP:

```bash
# Estrutura necessária:
/opt/admtv/
├── admtv.yaml          # Stack do Docker
├── backend/
│   ├── server.py
│   ├── requirements.txt
│   └── .env
└── frontend/
    ├── src/
    ├── package.json
    └── .env
```

### 3️⃣ Configurar Backend (.env)

Criar `/opt/admtv/backend/.env`:

```env
MONGO_URL="mongodb://admtv_mongodb:27017"
DB_NAME="iptv_management"
CORS_ORIGINS="https://admtv.criartebrasil.com.br,https://api.admtv.criartebrasil.com.br"
SECRET_KEY="COLE_AQUI_RESULTADO_DO_COMANDO_ABAIXO"
```

**Gerar SECRET_KEY:**
```bash
openssl rand -hex 32
```

### 4️⃣ Configurar Frontend (.env)

Criar `/opt/admtv/frontend/.env`:

```env
REACT_APP_BACKEND_URL=https://api.admtv.criartebrasil.com.br
NODE_ENV=production
```

### 5️⃣ Criar Volumes e Deploy

```bash
# Criar volumes externos
docker volume create admtv_mongodb_data
docker volume create admtv_mongodb_config

# Fazer deploy
cd /opt/admtv
docker stack deploy -c admtv.yaml admtv

# Verificar status
docker stack services admtv
```

---

## ✅ Verificação

```bash
# Ver logs
docker service logs admtv_admtv_backend -f
docker service logs admtv_admtv_frontend -f

# Testar endpoints
curl https://api.admtv.criartebrasil.com.br/api/
curl https://admtv.criartebrasil.com.br/
```

---

## 🌐 Acessar Sistema

**Frontend:** https://admtv.criartebrasil.com.br  
**API:** https://api.admtv.criartebrasil.com.br

**Primeiro acesso:**
1. Clique em "Registrar"
2. Crie sua conta de administrador
3. Configure o sistema

---

## 🔧 Comandos Úteis

```bash
# Ver serviços
docker stack services admtv

# Ver logs
docker service logs admtv_admtv_backend --tail 100
docker service logs admtv_admtv_frontend --tail 100
docker service logs admtv_admtv_mongodb --tail 100

# Reiniciar serviço
docker service update --force admtv_admtv_backend
docker service update --force admtv_admtv_frontend

# Escalar
docker service scale admtv_admtv_backend=2
docker service scale admtv_admtv_frontend=2

# Remover stack
docker stack rm admtv
```

---

## 💾 Backup

```bash
# Backup manual
docker exec $(docker ps -q -f name=admtv_admtv_mongodb) \
  mongodump --db=iptv_management --out=/backup

docker cp $(docker ps -q -f name=admtv_admtv_mongodb):/backup \
  /opt/backups/admtv-$(date +%Y%m%d).tar.gz
```

---

## 🐛 Problemas Comuns

### Backend não inicia
```bash
docker service logs admtv_admtv_backend
# Verifique se requirements.txt está correto
```

### Frontend não compila
```bash
docker service logs admtv_admtv_frontend
# Verifique se package.json está correto
```

### MongoDB não conecta
```bash
# Verifique se os volumes foram criados
docker volume ls | grep admtv
```

---

## 📞 Próximos Passos

1. ✅ Acesse https://admtv.criartebrasil.com.br
2. ✅ Crie conta admin
3. ✅ Configure WhatsApp (Configurações)
4. ✅ Adicione servidores DNS
5. ✅ Cadastre usuários IPTV

---

🎉 **Sistema instalado e pronto para uso!**
