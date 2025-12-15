# 📜 Scripts de Gerenciamento - IPTV Manager

Documentação dos scripts auxiliares para gerenciar o IPTV Manager no Docker Swarm.

## 📂 Scripts Disponíveis

| Script | Descrição | Uso |
|--------|-----------|-----|
| `deploy.sh` | Deploy automático da stack | `./deploy.sh --deploy` |
| `backup.sh` | Backup automático do MongoDB | `./backup.sh` |
| `restore.sh` | Restaurar backup do MongoDB | `./restore.sh backup.tar.gz` |

---

## 🚀 deploy.sh

Script principal para fazer deploy e gerenciar a stack do IPTV Manager.

### Uso

```bash
# Deploy completo (interativo)
./deploy.sh

# Deploy direto (sem menu)
./deploy.sh --deploy

# Apenas verificar status
./deploy.sh --status

# Remover stack
./deploy.sh --remove
```

### O que o script faz

✅ Verifica requisitos (Docker Swarm ativo)  
✅ Cria/verifica rede `CriarteNet`  
✅ Valida estrutura de diretórios  
✅ Verifica arquivos necessários  
✅ Faz deploy da stack  
✅ Monitora status dos serviços  
✅ Testa endpoints (API e Frontend)  
✅ Exibe informações de acesso  

### Menu Interativo

Quando executado sem argumentos, apresenta um menu:

```
1) Deploy completo (recomendado)
2) Apenas verificar status
3) Ver logs do backend
4) Ver logs do frontend
5) Ver logs do MongoDB
6) Remover stack
0) Sair
```

---

## 💾 backup.sh

Script para fazer backup automático do banco de dados MongoDB.

### Uso

```bash
# Backup manual
./backup.sh

# Backup automático (crontab)
# Adicionar ao crontab para backup diário às 2h da manhã:
crontab -e
# Adicionar linha:
0 2 * * * /opt/iptv-manager/backup.sh >> /var/log/iptv-backup.log 2>&1
```

### O que o script faz

✅ Cria diretório de backup `/opt/backups/iptv-manager/`  
✅ Verifica se MongoDB está rodando  
✅ Executa `mongodump` no container  
✅ Copia backup para o host  
✅ Comprime backup (`.tar.gz`)  
✅ Verifica integridade do backup  
✅ Remove backups com mais de 30 dias  
✅ Exibe estatísticas  

### Configurações

Edite o arquivo para alterar:

```bash
BACKUP_DIR="/opt/backups/iptv-manager"  # Diretório de backups
RETENTION_DAYS=30                       # Dias para manter backups
```

### Formato dos Backups

```
iptv-backup-YYYYMMDD_HHMMSS.tar.gz
```

Exemplo: `iptv-backup-20250115_020000.tar.gz`

### Exemplo de Log

```
[2025-01-15 02:00:00] Iniciando backup do banco de dados...
[2025-01-15 02:00:05] Executando mongodump...
[2025-01-15 02:00:10] Copiando backup para o host...
[2025-01-15 02:00:15] Comprimindo backup...
[2025-01-15 02:00:20] Backup criado com sucesso!
[2025-01-15 02:00:20] Arquivo: iptv-backup-20250115_020000.tar.gz
[2025-01-15 02:00:20] Tamanho: 2.5M
[2025-01-15 02:00:25] Limpando backups antigos...
[2025-01-15 02:00:25] Backups mantidos: 30
```

---

## 🔄 restore.sh

Script para restaurar backup do MongoDB.

### Uso

```bash
# Listar backups disponíveis
./restore.sh

# Restaurar um backup específico
./restore.sh /opt/backups/iptv-manager/iptv-backup-20250115_020000.tar.gz
```

### O que o script faz

✅ Verifica se o arquivo de backup existe  
✅ Confirma operação com o usuário  
✅ Cria backup de segurança antes de restaurar  
✅ Extrai o arquivo de backup  
✅ Remove banco de dados atual  
✅ Restaura dados do backup  
✅ Verifica dados restaurados  
✅ Exibe estatísticas  

### ⚠️ Importante

- O script **SUBSTITUI** todos os dados atuais
- Sempre cria um backup de segurança antes
- Requer confirmação manual (digitar "SIM")
- Após restauração, reinicie os serviços:

```bash
docker service update --force iptv-manager_iptv_backend
docker service update --force iptv-manager_iptv_frontend
```

### Exemplo de Uso

```bash
$ ./restore.sh /opt/backups/iptv-manager/iptv-backup-20250115_020000.tar.gz

[2025-01-15 10:00:00] Verificando se MongoDB está rodando...
[2025-01-15 10:00:00] MongoDB encontrado: abc123def456

⚠️  ATENÇÃO: Esta operação irá SUBSTITUIR todos os dados atuais!
Banco de dados: iptv_management
Backup: /opt/backups/iptv-manager/iptv-backup-20250115_020000.tar.gz

Tem certeza que deseja continuar? Digite 'SIM' para confirmar: SIM

[2025-01-15 10:00:05] Criando backup de segurança...
[2025-01-15 10:00:10] Backup de segurança criado: /tmp/iptv-safety-backup-20250115_100000.tar.gz
[2025-01-15 10:00:15] Extraindo backup...
[2025-01-15 10:00:20] Restaurando dados no MongoDB...
[2025-01-15 10:00:25] Removendo banco de dados existente...
[2025-01-15 10:00:30] Executando mongorestore...
[2025-01-15 10:00:40] Restauração concluída com sucesso!
[2025-01-15 10:00:45] Verificando dados restaurados...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dados Restaurados:
  Usuários: 150
  DNS: 5
  Pagamentos: 320
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔧 Permissões

Todos os scripts devem ser executáveis:

```bash
chmod +x deploy.sh backup.sh restore.sh
```

---

## 📍 Localização Recomendada

```
/opt/iptv-manager/
├── deploy.sh
├── backup.sh
├── restore.sh
├── docker-swarm-stack.yaml
├── backend/
└── frontend/
```

---

## 🔐 Segurança

### Backup

- Backups contêm dados sensíveis (senhas de usuários, etc)
- Recomenda-se:
  - Criptografar backups em repouso
  - Armazenar em local seguro
  - Implementar rotação de backups
  - Testar restaurações periodicamente

### Scripts

- Scripts têm acesso ao Docker
- Devem ser executados por usuário confiável
- Recomenda-se limitar permissões:

```bash
chown root:root *.sh
chmod 750 *.sh
```

---

## 📊 Monitoramento

### Verificar último backup

```bash
ls -lht /opt/backups/iptv-manager/ | head -5
```

### Espaço usado por backups

```bash
du -sh /opt/backups/iptv-manager/
```

### Verificar crontab

```bash
crontab -l | grep backup
```

---

## 🆘 Troubleshooting

### Erro: "Docker Swarm não está ativo"

```bash
docker swarm init
```

### Erro: "Container MongoDB não encontrado"

```bash
docker stack ps iptv-manager
docker service ls | grep mongodb
```

### Erro: "Permission denied"

```bash
chmod +x *.sh
```

### Backup muito grande

Ajuste a retenção de dias:

```bash
# No arquivo backup.sh
RETENTION_DAYS=15  # Ao invés de 30
```

### Restauração falhou

Use o backup de segurança criado automaticamente:

```bash
ls -lh /tmp/iptv-safety-backup-*.tar.gz
./restore.sh /tmp/iptv-safety-backup-XXXXXXXXX_XXXXXX.tar.gz
```

---

## 📝 Logs

### Deploy

```bash
# Logs em tempo real durante deploy
tail -f /var/log/iptv-deploy.log
```

### Backup

```bash
# Logs de backup automático (se configurado no crontab)
tail -f /var/log/iptv-backup.log
```

### Restauração

Logs são exibidos diretamente no terminal.

---

## 🔄 Automação Completa

### Backup Diário + Limpeza + Notificação

```bash
# /opt/iptv-manager/backup-full.sh

#!/bin/bash
/opt/iptv-manager/backup.sh

if [ $? -eq 0 ]; then
    # Backup bem-sucedido
    curl -X POST https://seu-webhook.com/notify \
         -d "status=success&message=Backup IPTV concluído"
else
    # Backup falhou
    curl -X POST https://seu-webhook.com/notify \
         -d "status=error&message=Backup IPTV falhou"
fi
```

### Crontab Completo

```bash
# Backup diário às 2h
0 2 * * * /opt/iptv-manager/backup.sh >> /var/log/iptv-backup.log 2>&1

# Verificar status às 6h
0 6 * * * /opt/iptv-manager/deploy.sh --status >> /var/log/iptv-status.log 2>&1

# Reiniciar serviços toda segunda às 3h (opcional)
0 3 * * 1 docker service update --force iptv-manager_iptv_backend iptv-manager_iptv_frontend
```

---

## ✅ Checklist de Manutenção

### Diário
- [ ] Verificar logs de backup
- [ ] Verificar status dos serviços

### Semanal
- [ ] Testar endpoints (API e Frontend)
- [ ] Verificar espaço em disco
- [ ] Revisar logs de erros

### Mensal
- [ ] Testar restauração de backup
- [ ] Atualizar código (se houver)
- [ ] Revisar métricas de uso

---

**💡 Dica:** Mantenha esses scripts versionados junto com o código do projeto!
