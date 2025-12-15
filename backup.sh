#!/bin/bash

###############################################################################
# Script de Backup Automático - IPTV Manager MongoDB
# Uso: ./backup.sh
# Crontab: 0 2 * * * /opt/iptv-manager/backup.sh
###############################################################################

set -e

# Configurações
STACK_NAME="iptv-manager"
BACKUP_DIR="/opt/backups/iptv-manager"
DB_NAME="iptv_management"
RETENTION_DAYS=30  # Manter backups por 30 dias

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="iptv-backup-${TIMESTAMP}"

###############################################################################
# Funções
###############################################################################

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

###############################################################################
# Criar diretório de backup
###############################################################################

create_backup_dir() {
    if [ ! -d "${BACKUP_DIR}" ]; then
        log "Criando diretório de backup: ${BACKUP_DIR}"
        mkdir -p "${BACKUP_DIR}"
    fi
}

###############################################################################
# Verificar se MongoDB está rodando
###############################################################################

check_mongodb() {
    log "Verificando se MongoDB está rodando..."
    
    local container_id=$(docker ps -q -f name=${STACK_NAME}_iptv_mongodb)
    
    if [ -z "$container_id" ]; then
        error "Container MongoDB não encontrado!"
        exit 1
    fi
    
    log "MongoDB encontrado: $container_id"
}

###############################################################################
# Fazer Backup
###############################################################################

perform_backup() {
    log "Iniciando backup do banco de dados ${DB_NAME}..."
    
    local container_id=$(docker ps -q -f name=${STACK_NAME}_iptv_mongodb)
    
    # Criar backup dentro do container
    log "Executando mongodump..."
    docker exec ${container_id} \
        mongodump \
        --db=${DB_NAME} \
        --out=/tmp/backup \
        --quiet
    
    if [ $? -ne 0 ]; then
        error "Falha ao executar mongodump!"
        exit 1
    fi
    
    # Copiar backup para o host
    log "Copiando backup para o host..."
    docker cp ${container_id}:/tmp/backup/${DB_NAME} ${BACKUP_DIR}/${BACKUP_FILE}
    
    if [ $? -ne 0 ]; then
        error "Falha ao copiar backup!"
        exit 1
    fi
    
    # Limpar backup temporário no container
    docker exec ${container_id} rm -rf /tmp/backup
    
    # Comprimir backup
    log "Comprimindo backup..."
    tar -czf ${BACKUP_DIR}/${BACKUP_FILE}.tar.gz -C ${BACKUP_DIR} ${BACKUP_FILE}
    rm -rf ${BACKUP_DIR}/${BACKUP_FILE}
    
    # Calcular tamanho
    local size=$(du -h ${BACKUP_DIR}/${BACKUP_FILE}.tar.gz | cut -f1)
    
    log "Backup criado com sucesso!"
    log "Arquivo: ${BACKUP_FILE}.tar.gz"
    log "Tamanho: ${size}"
}

###############################################################################
# Limpar Backups Antigos
###############################################################################

cleanup_old_backups() {
    log "Limpando backups com mais de ${RETENTION_DAYS} dias..."
    
    find ${BACKUP_DIR} -name "iptv-backup-*.tar.gz" -type f -mtime +${RETENTION_DAYS} -delete
    
    local remaining=$(ls -1 ${BACKUP_DIR}/iptv-backup-*.tar.gz 2>/dev/null | wc -l)
    log "Backups mantidos: ${remaining}"
}

###############################################################################
# Verificar Integridade
###############################################################################

verify_backup() {
    log "Verificando integridade do backup..."
    
    if tar -tzf ${BACKUP_DIR}/${BACKUP_FILE}.tar.gz > /dev/null 2>&1; then
        log "Backup íntegro!"
    else
        error "Backup corrompido!"
        exit 1
    fi
}

###############################################################################
# Enviar Notificação (Opcional)
###############################################################################

send_notification() {
    # Descomente e configure se quiser notificações via webhook
    # local webhook_url="https://seu-webhook.com/notify"
    # curl -X POST ${webhook_url} -d "status=success&backup=${BACKUP_FILE}"
    
    log "Backup concluído com sucesso!"
}

###############################################################################
# Estatísticas
###############################################################################

show_statistics() {
    log "Estatísticas de Backup:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    local total_backups=$(ls -1 ${BACKUP_DIR}/iptv-backup-*.tar.gz 2>/dev/null | wc -l)
    local total_size=$(du -sh ${BACKUP_DIR} | cut -f1)
    local newest=$(ls -1t ${BACKUP_DIR}/iptv-backup-*.tar.gz 2>/dev/null | head -1 | xargs basename)
    local oldest=$(ls -1t ${BACKUP_DIR}/iptv-backup-*.tar.gz 2>/dev/null | tail -1 | xargs basename)
    
    echo "Total de backups: ${total_backups}"
    echo "Espaço total: ${total_size}"
    echo "Mais recente: ${newest}"
    echo "Mais antigo: ${oldest}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

###############################################################################
# Main
###############################################################################

main() {
    log "═══════════════════════════════════════════"
    log "  Backup IPTV Manager - Iniciando"
    log "═══════════════════════════════════════════"
    
    create_backup_dir
    check_mongodb
    perform_backup
    verify_backup
    cleanup_old_backups
    show_statistics
    send_notification
    
    log "═══════════════════════════════════════════"
    log "  Backup IPTV Manager - Concluído"
    log "═══════════════════════════════════════════"
}

# Executar
main

exit 0
