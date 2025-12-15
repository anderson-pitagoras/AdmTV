# 🐳 Deploy IPTV Manager no Docker Swarm

Guia completo para deploy do IPTV Manager usando Docker Swarm com Traefik e SSL.

## 📋 Pré-requisitos

- Docker Swarm inicializado
- Traefik configurado com Let's Encrypt
- Portainer (opcional, mas recomendado)
- Rede `CriarteNet` criada
- Domínio `admtv.criartebrasil.com.br` apontando para seu servidor

## 🚀 Preparação do Ambiente

### 1️⃣ Criar Diretórios no Servidor

```bash
# Criar estrutura de diretórios
sudo mkdir -p /opt/iptv-manager/backend
sudo mkdir -p /opt/iptv-manager/frontend

# Dar permissões adequadas
sudo chown -R $USER:$USER /opt/iptv-manager
```

### 2️⃣ Fazer Upload dos Arquivos

**Opção A: Via Git (Recomendado)**

```bash
# Clonar o repositório
cd /opt/iptv-manager
git clone <url-do-seu-repositorio> .

# Ou copiar apenas backend e frontend
cp -r <repo-local>/backend /opt/iptv-manager/
cp -r <repo-local>/frontend /opt/iptv-manager/
```

**Opção B: Via SCP/SFTP**

```bash
# No seu computador local
scp -r backend/ usuario@seu-servidor:/opt/iptv-manager/
scp -r frontend/ usuario@seu-servidor:/opt/iptv-manager/
```

### 3️⃣ Configurar Variáveis de Ambiente

#### Backend (.env)

Edite `/opt/iptv-manager/backend/.env`:

```env
MONGO_URL="mongodb://iptv_mongodb:27017"
DB_NAME="iptv_management"
CORS_ORIGINS="https://admtv.criartebrasil.com.br,https://api.admtv.criartebrasil.com.br"
SECRET_KEY="GERE_UMA_CHAVE_SECRETA_FORTE_AQUI_USE_openssl_rand_-hex_32"
```

**Gerar SECRET_KEY forte:**
```bash
openssl rand -hex 32
```

#### Frontend (.env)

Edite `/opt/iptv-manager/frontend/.env`:

```env
REACT_APP_BACKEND_URL=https://api.admtv.criartebrasil.com.br
NODE_ENV=production
```

### 4️⃣ Verificar Rede do Docker Swarm

```bash
# Verificar se a rede CriarteNet existe
docker network ls | grep CriarteNet

# Se não existir, criar:
docker network create --driver overlay CriarteNet
```

## 📦 Deploy da Stack

### Método 1: Via Portainer (Recomendado)

1. Acesse o Portainer: `https://portainer.seu-dominio.com.br`
2. Vá em **Stacks** → **Add stack**
3. Dê um nome: `iptv-manager`
4. Cole o conteúdo do arquivo `docker-swarm-stack.yaml`
5. Clique em **Deploy the stack**

### Método 2: Via CLI

```bash
# Fazer deploy da stack
docker stack deploy -c docker-swarm-stack.yaml iptv-manager

# Verificar o status dos serviços
docker stack services iptv-manager

# Ver logs em tempo real
docker service logs -f iptv-manager_iptv_backend
docker service logs -f iptv-manager_iptv_frontend
docker service logs -f iptv-manager_iptv_mongodb
```

## 🔍 Verificação do Deploy

### Verificar Serviços

```bash
# Listar todos os serviços da stack
docker stack services iptv-manager

# Ver detalhes de um serviço específico
docker service ps iptv-manager_iptv_backend
docker service ps iptv-manager_iptv_frontend
docker service ps iptv-manager_iptv_mongodb

# Ver logs
docker service logs iptv-manager_iptv_backend --tail 100
docker service logs iptv-manager_iptv_frontend --tail 100
```

### Testar os Endpoints

```bash
# Testar o backend
curl -k https://api.admtv.criartebrasil.com.br/api/

# Testar o frontend
curl -k https://admtv.criartebrasil.com.br/

# Testar MongoDB (dentro do container)
docker exec -it $(docker ps -q -f name=iptv-manager_iptv_mongodb) mongosh
```

## 🌐 Configuração de DNS

Certifique-se de que os seguintes registros DNS estão configurados:

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| A | admtv | IP_DO_SEU_SERVIDOR | 3600 |
| A | api.admtv | IP_DO_SEU_SERVIDOR | 3600 |

## 🔒 SSL/TLS (Traefik)

O SSL é gerenciado automaticamente pelo Traefik usando Let's Encrypt.

**Verificar certificados:**

```bash
# Ver logs do Traefik
docker service logs traefik --tail 100

# Verificar se o certificado foi emitido
curl -vI https://admtv.criartebrasil.com.br 2>&1 | grep -i "SSL certificate"
```

## 🛠️ Manutenção e Atualizações

### Atualizar o Código

```bash
# Método 1: Pull do Git
cd /opt/iptv-manager
git pull origin main

# Método 2: Upload manual via SCP
# (faça upload dos arquivos atualizados)

# Reiniciar os serviços para aplicar mudanças
docker service update --force iptv-manager_iptv_backend
docker service update --force iptv-manager_iptv_frontend
```

### Backup do MongoDB

```bash
# Criar backup
docker exec -t $(docker ps -q -f name=iptv-manager_iptv_mongodb) \
  mongodump --out=/backup --db=iptv_management

# Copiar backup para o host
docker cp $(docker ps -q -f name=iptv-manager_iptv_mongodb):/backup \
  /opt/backups/iptv-manager-$(date +%Y%m%d).tar.gz

# Restaurar backup
docker exec -i $(docker ps -q -f name=iptv-manager_iptv_mongodb) \
  mongorestore --db=iptv_management /backup/iptv_management
```

### Escalar Serviços

```bash
# Escalar backend para 2 réplicas
docker service scale iptv-manager_iptv_backend=2

# Escalar frontend para 2 réplicas
docker service scale iptv-manager_iptv_frontend=2

# Verificar
docker service ls | grep iptv-manager
```

## 🐛 Troubleshooting

### Backend não está respondendo

```bash
# Ver logs do backend
docker service logs iptv-manager_iptv_backend --tail 100

# Verificar se o MongoDB está acessível
docker exec -it $(docker ps -q -f name=iptv-manager_iptv_backend) \
  ping iptv_mongodb

# Reiniciar o serviço
docker service update --force iptv-manager_iptv_backend
```

### Frontend não carrega

```bash
# Ver logs do frontend
docker service logs iptv-manager_iptv_frontend --tail 100

# Verificar variáveis de ambiente
docker service inspect iptv-manager_iptv_frontend | grep -A 10 Env

# Verificar build
docker exec -it $(docker ps -q -f name=iptv-manager_iptv_frontend) ls -la /app/build
```

### MongoDB não inicia

```bash
# Ver logs do MongoDB
docker service logs iptv-manager_iptv_mongodb --tail 100

# Verificar volumes
docker volume ls | grep iptv

# Verificar espaço em disco
df -h
```

### SSL não funciona

```bash
# Ver certificados do Traefik
docker service logs traefik | grep -i "admtv.criartebrasil.com.br"

# Verificar se o domínio está acessível externamente
nslookup admtv.criartebrasil.com.br

# Forçar renovação do certificado (remova o certificado antigo)
docker exec -it $(docker ps -q -f name=traefik) \
  rm -rf /letsencrypt/acme.json
```

## 🔄 Remover a Stack

```bash
# Remover completamente a stack
docker stack rm iptv-manager

# Remover volumes (CUIDADO: Isso apaga todos os dados!)
docker volume rm iptv_mongodb_data
docker volume rm iptv_mongodb_config
```

## 📊 Monitoramento

### Métricas em Tempo Real

```bash
# CPU e Memória de todos os serviços
docker stats

# Ver apenas serviços da stack IPTV
docker stats $(docker ps -q -f name=iptv-manager)
```

### Health Check Manual

```bash
# Backend Health
curl https://api.admtv.criartebrasil.com.br/api/

# Frontend Health
curl -I https://admtv.criartebrasil.com.br/

# MongoDB (de dentro do container)
docker exec -it $(docker ps -q -f name=iptv-manager_iptv_mongodb) \
  mongosh --eval "db.adminCommand('ping')"
```

## ⚙️ Ajustes de Performance

### Para servidores com mais recursos:

Edite o arquivo `docker-swarm-stack.yaml`:

```yaml
# Backend - Aumentar recursos
resources:
  limits:
    cpus: "2"
    memory: 2048M
  reservations:
    cpus: "1"
    memory: 1024M

# Frontend - Aumentar réplicas
replicas: 2

# MongoDB - Aumentar memória
resources:
  limits:
    cpus: "2"
    memory: 4096M
```

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `docker service logs <nome-do-servico>`
2. Verifique a conectividade de rede
3. Confirme que as variáveis de ambiente estão corretas
4. Verifique os certificados SSL do Traefik

---

**✅ Deploy Completo!**

Acesse seu painel em: **https://admtv.criartebrasil.com.br**
