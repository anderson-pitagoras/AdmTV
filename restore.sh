#!/bin/bash

###############################################################################
# Script de Restauração - IPTV Manager MongoDB
# Uso: ./restore.sh <arquivo-backup.tar.gz>
# Exemplo: ./restore.sh /opt/backups/iptv-manager/iptv-backup-20250101_020000.tar.gz
###############################################################################

set -e

# Configurações
STACK_NAME="iptv-manager"
DB_NAME="iptv_management"

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

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
# Verificar argumentos
###############################################################################

if [ $# -eq 0 ]; then
    error "Nenhum arquivo de backup especificado!"
    echo ""
    echo "Uso: $0 <arquivo-backup.tar.gz>"
    echo ""
    echo "Backups disponíveis:"
    ls -lh /opt/backups/iptv-manager/iptv-backup-*.tar.gz 2>/dev/null || echo "  Nenhum backup encontrado"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
    error "Arquivo de backup não encontrado: ${BACKUP_FILE}"
    exit 1
fi

###############################################################################
# Verificar MongoDB
###############################################################################

check_mongodb() {
    log "Verificando se MongoDB está rodando..."
    
    local container_id=$(docker ps -q -f name=${STACK_NAME}_iptv_mongodb)
    
    if [ -z "$container_id" ]; then
        error "Container MongoDB não encontrado!"
        error "Certifique-se de que a stack ${STACK_NAME} está rodando"
        exit 1
    fi
    
    log "MongoDB encontrado: $container_id"
}

###############################################################################
# Confirmação
###############################################################################

confirm_restore() {
    warning "⚠️  ATENÇÃO: Esta operação irá SUBSTITUIR todos os dados atuais!"
    warning "Banco de dados: ${DB_NAME}"
    warning "Backup: ${BACKUP_FILE}"
    echo ""
    read -p "Tem certeza que deseja continuar? Digite 'SIM' para confirmar: " confirm
    
    if [ "$confirm" != "SIM" ]; then
        log "Restauração cancelada pelo usuário"
        exit 0
    fi
}

###############################################################################
# Fazer Backup Atual (Segurança)
###############################################################################

backup_current() {
    log "Criando backup de segurança dos dados atuais..."
    
    local safety_backup="/tmp/iptv-safety-backup-$(date +%Y%m%d_%H%M%S)"
    local container_id=$(docker ps -q -f name=${STACK_NAME}_iptv_mongodb)
    
    docker exec ${container_id} \
        mongodump \
        --db=${DB_NAME} \
        --out=/tmp/safety-backup \
        --quiet
    
    docker cp ${container_id}:/tmp/safety-backup/${DB_NAME} ${safety_backup}
    docker exec ${container_id} rm -rf /tmp/safety-backup
    
    tar -czf ${safety_backup}.tar.gz -C /tmp $(basename ${safety_backup})
    rm -rf ${safety_backup}
    
    log "Backup de segurança criado: ${safety_backup}.tar.gz"
    echo "   (Em caso de problemas, use este arquivo para restaurar)"
}

###############################################################################
# Extrair Backup
###############################################################################

extract_backup() {
    log "Extraindo backup..."
    
    local temp_dir="/tmp/iptv-restore-$(date +%Y%m%d_%H%M%S)"
    mkdir -p ${temp_dir}
    
    tar -xzf ${BACKUP_FILE} -C ${temp_dir}
    
    echo ${temp_dir}
}

###############################################################################
# Restaurar Dados
###############################################################################

restore_data() {
    local temp_dir=$1
    log "Restaurando dados no MongoDB..."
    
    local container_id=$(docker ps -q -f name=${STACK_NAME}_iptv_mongodb)
    
    # Copiar dados para o container
    docker cp ${temp_dir} ${container_id}:/tmp/restore
    
    # Dropar banco existente (opcional - comente se quiser fazer merge)
    log "Removendo banco de dados existente..."
    docker exec ${container_id} mongosh --quiet --eval "db.getSiblingDB('${DB_NAME}').dropDatabase()"
    
    # Restaurar backup
    log "Executando mongorestore..."
    docker exec ${container_id} \
        mongorestore \
        --db=${DB_NAME} \
        /tmp/restore/$(basename ${temp_dir}) \
        --quiet
    
    if [ $? -ne 0 ]; then
        error "Falha ao restaurar backup!"
        exit 1
    fi
    
    # Limpar
    docker exec ${container_id} rm -rf /tmp/restore
    rm -rf ${temp_dir}
    
    log "Restauração concluída com sucesso!"
}

###############################################################################
# Verificar Dados
###############################################################################

verify_restore() {
    log "Verificando dados restaurados..."
    
    local container_id=$(docker ps -q -f name=${STACK_NAME}_iptv_mongodb)
    
    # Contar documentos
    local users=$(docker exec ${container_id} mongosh ${DB_NAME} --quiet --eval "db.users.countDocuments()" || echo "0")
    local dns=$(docker exec ${container_id} mongosh ${DB_NAME} --quiet --eval "db.dns_servers.countDocuments()" || echo "0")
    local payments=$(docker exec ${container_id} mongosh ${DB_NAME} --quiet --eval "db.payments.countDocuments()" || echo "0")
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Dados Restaurados:"
    echo "  Usuários: ${users}"
    echo "  DNS: ${dns}"
    echo "  Pagamentos: ${payments}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

###############################################################################
# Main
###############################################################################

main() {
    log "═══════════════════════════════════════════"
    log "  Restauração IPTV Manager - Iniciando"
    log "═══════════════════════════════════════════"
    
    check_mongodb
    confirm_restore
    backup_current
    
    local temp_dir=$(extract_backup)
    restore_data ${temp_dir}
    verify_restore
    
    log "═══════════════════════════════════════════"
    log "  Restauração IPTV Manager - Concluída"
    log "═══════════════════════════════════════════"
    
    warning "⚠️  Reinicie os serviços backend e frontend para aplicar as mudanças:"
    echo "   docker service update --force ${STACK_NAME}_iptv_backend"
    echo "   docker service update --force ${STACK_NAME}_iptv_frontend"
}

# Executar
main

exit 0
