# 🚀 Quick Start - Deploy Docker Swarm

Guia rápido para fazer deploy do IPTV Manager em 5 minutos!

## ⚡ Deploy Rápido (Passo a Passo)

### 1️⃣ No Seu Servidor

```bash
# Criar diretórios
sudo mkdir -p /opt/iptv-manager/{backend,frontend}
sudo chown -R $USER:$USER /opt/iptv-manager

# Fazer upload dos arquivos (via Git ou SCP)
# Opção A - Git:
cd /opt/iptv-manager
git clone <seu-repositorio> .

# Opção B - SCP (do seu computador local):
scp -r backend/ usuario@servidor:/opt/iptv-manager/
scp -r frontend/ usuario@servidor:/opt/iptv-manager/
scp docker-swarm-stack.yaml usuario@servidor:/opt/iptv-manager/
scp deploy.sh usuario@servidor:/opt/iptv-manager/
```

### 2️⃣ Configurar Variáveis de Ambiente

**Backend** (`/opt/iptv-manager/backend/.env`):
```env
MONGO_URL="mongodb://iptv_mongodb:27017"
DB_NAME="iptv_management"
CORS_ORIGINS="https://admtv.criartebrasil.com.br,https://api.admtv.criartebrasil.com.br"
SECRET_KEY="cole-aqui-resultado-do-comando-abaixo"
```

**Gerar SECRET_KEY:**
```bash
openssl rand -hex 32
```

**Frontend** (`/opt/iptv-manager/frontend/.env`):
```env
REACT_APP_BACKEND_URL=https://api.admtv.criartebrasil.com.br
NODE_ENV=production
```

### 3️⃣ Fazer Deploy

```bash
cd /opt/iptv-manager
chmod +x deploy.sh
./deploy.sh --deploy
```

### 4️⃣ Acessar o Sistema

Aguarde 2-3 minutos e acesse:
- **Frontend:** https://admtv.criartebrasil.com.br
- **API:** https://api.admtv.criartebrasil.com.br/api/

---

## 🎯 Deploy Manual (Alternativa)

Se preferir fazer manualmente sem o script:

```bash
# 1. Criar rede (se não existir)
docker network create --driver overlay CriarteNet

# 2. Deploy da stack
docker stack deploy -c docker-swarm-stack.yaml iptv-manager

# 3. Verificar status
docker stack services iptv-manager

# 4. Ver logs
docker service logs iptv-manager_iptv_backend -f
```

---

## 📋 Checklist Pré-Deploy

- [ ] Docker Swarm inicializado (`docker swarm init`)
- [ ] Traefik rodando com Let's Encrypt configurado
- [ ] Rede `CriarteNet` criada
- [ ] Domínios DNS configurados:
  - [ ] `admtv.criartebrasil.com.br` → IP do servidor
  - [ ] `api.admtv.criartebrasil.com.br` → IP do servidor
- [ ] Arquivos do projeto em `/opt/iptv-manager/`
- [ ] Arquivos `.env` configurados (backend e frontend)
- [ ] Portas 80 e 443 abertas no firewall

---

## 🔧 Comandos Úteis

```bash
# Ver status de todos os serviços
docker stack services iptv-manager

# Ver logs em tempo real
docker service logs iptv-manager_iptv_backend -f
docker service logs iptv-manager_iptv_frontend -f
docker service logs iptv-manager_iptv_mongodb -f

# Reiniciar um serviço
docker service update --force iptv-manager_iptv_backend

# Escalar serviços (aumentar réplicas)
docker service scale iptv-manager_iptv_backend=2
docker service scale iptv-manager_iptv_frontend=2

# Remover a stack
docker stack rm iptv-manager

# Ver uso de recursos
docker stats
```

---

## 🐛 Problemas Comuns

### Serviço não inicia

```bash
# Ver logs detalhados
docker service ps iptv-manager_iptv_backend --no-trunc

# Ver logs do container
docker service logs iptv-manager_iptv_backend --tail 200
```

### SSL não funciona

```bash
# Verificar logs do Traefik
docker service logs traefik | grep admtv

# Testar DNS
nslookup admtv.criartebrasil.com.br
nslookup api.admtv.criartebrasil.com.br

# Aguardar alguns minutos - Let's Encrypt pode demorar
```

### MongoDB não conecta

```bash
# Verificar se o MongoDB está rodando
docker service ls | grep mongodb

# Testar conexão dentro do container backend
docker exec -it $(docker ps -q -f name=iptv-manager_iptv_backend) \
  ping iptv_mongodb
```

---

## 📊 Monitoramento

### Via Portainer (Recomendado)
1. Acesse seu Portainer
2. Vá em **Stacks** → `iptv-manager`
3. Veja status, logs e métricas de cada serviço

### Via CLI
```bash
# Uso de CPU e Memória
docker stats $(docker ps -q -f name=iptv-manager)

# Ver todos os containers
docker ps -f name=iptv-manager
```

---

## 🔄 Atualização do Sistema

```bash
# 1. Atualizar código (Git)
cd /opt/iptv-manager
git pull origin main

# 2. Reiniciar serviços
docker service update --force iptv-manager_iptv_backend
docker service update --force iptv-manager_iptv_frontend

# 3. Verificar
docker stack services iptv-manager
```

---

## 💾 Backup

```bash
# Backup do MongoDB
docker exec $(docker ps -q -f name=iptv-manager_iptv_mongodb) \
  mongodump --out=/backup --db=iptv_management

# Copiar para o host
docker cp $(docker ps -q -f name=iptv-manager_iptv_mongodb):/backup \
  /opt/backups/iptv-$(date +%Y%m%d).tar.gz

# Automatizar backup (crontab)
0 2 * * * /opt/iptv-manager/backup.sh
```

---

## 📞 Suporte

**Logs são seus amigos!** Sempre verifique os logs primeiro:

```bash
docker service logs iptv-manager_iptv_backend --tail 100
```

**Documentação completa:** Veja `DEPLOY-DOCKER-SWARM.md`

---

## ✅ Checklist Pós-Deploy

Após o deploy, faça:

1. [ ] Acesse https://admtv.criartebrasil.com.br
2. [ ] Crie sua conta de administrador
3. [ ] Configure WhatsApp de suporte (Configurações)
4. [ ] Adicione pelo menos 1 servidor DNS
5. [ ] Crie um usuário IPTV de teste
6. [ ] Teste o portal do usuário: `/portal/usuario-teste`
7. [ ] Registre um pagamento de teste
8. [ ] Verifique o dashboard com estatísticas
9. [ ] Teste alternância de tema (claro/escuro)
10. [ ] Configure backup automático do MongoDB

---

🎉 **Pronto! Seu IPTV Manager está no ar!**
