#!/bin/bash

###############################################################################
# Script de Deploy IPTV Manager - Docker Swarm
# Domínio: admtv.criartebrasil.com.br
###############################################################################

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variáveis
STACK_NAME="iptv-manager"
NETWORK_NAME="CriarteNet"
BASE_PATH="/opt/iptv-manager"
DOMAIN_FRONTEND="admtv.criartebrasil.com.br"
DOMAIN_API="api.admtv.criartebrasil.com.br"

###############################################################################
# Funções Auxiliares
###############################################################################

print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}          ${GREEN}IPTV Manager - Deploy Docker Swarm${NC}             ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "${YELLOW}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 não está instalado!"
        exit 1
    fi
}

###############################################################################
# Verificações Iniciais
###############################################################################

check_requirements() {
    print_step "Verificando requisitos..."
    
    check_command docker
    
    # Verificar se o Swarm está ativo
    if ! docker info | grep -q "Swarm: active"; then
        print_error "Docker Swarm não está ativo!"
        echo "Execute: docker swarm init"
        exit 1
    fi
    
    print_success "Requisitos verificados"
}

###############################################################################
# Verificar/Criar Rede
###############################################################################

setup_network() {
    print_step "Verificando rede ${NETWORK_NAME}..."
    
    if docker network ls | grep -q ${NETWORK_NAME}; then
        print_success "Rede ${NETWORK_NAME} já existe"
    else
        print_step "Criando rede ${NETWORK_NAME}..."
        docker network create --driver overlay ${NETWORK_NAME}
        print_success "Rede ${NETWORK_NAME} criada"
    fi
}

###############################################################################
# Verificar Estrutura de Diretórios
###############################################################################

check_directories() {
    print_step "Verificando estrutura de diretórios..."
    
    if [ ! -d "${BASE_PATH}/backend" ]; then
        print_error "Diretório ${BASE_PATH}/backend não encontrado!"
        echo "Execute: sudo mkdir -p ${BASE_PATH}/backend"
        echo "E faça upload dos arquivos do backend"
        exit 1
    fi
    
    if [ ! -d "${BASE_PATH}/frontend" ]; then
        print_error "Diretório ${BASE_PATH}/frontend não encontrado!"
        echo "Execute: sudo mkdir -p ${BASE_PATH}/frontend"
        echo "E faça upload dos arquivos do frontend"
        exit 1
    fi
    
    if [ ! -f "${BASE_PATH}/backend/.env" ]; then
        print_error "Arquivo ${BASE_PATH}/backend/.env não encontrado!"
        echo "Crie o arquivo .env com as configurações necessárias"
        exit 1
    fi
    
    if [ ! -f "${BASE_PATH}/frontend/.env" ]; then
        print_error "Arquivo ${BASE_PATH}/frontend/.env não encontrado!"
        echo "Crie o arquivo .env com as configurações necessárias"
        exit 1
    fi
    
    print_success "Estrutura de diretórios OK"
}

###############################################################################
# Verificar Arquivos Necessários
###############################################################################

check_files() {
    print_step "Verificando arquivos necessários..."
    
    if [ ! -f "docker-swarm-stack.yaml" ]; then
        print_error "Arquivo docker-swarm-stack.yaml não encontrado!"
        exit 1
    fi
    
    # Verificar backend
    if [ ! -f "${BASE_PATH}/backend/server.py" ]; then
        print_error "Arquivo ${BASE_PATH}/backend/server.py não encontrado!"
        exit 1
    fi
    
    if [ ! -f "${BASE_PATH}/backend/requirements.txt" ]; then
        print_error "Arquivo ${BASE_PATH}/backend/requirements.txt não encontrado!"
        exit 1
    fi
    
    # Verificar frontend
    if [ ! -f "${BASE_PATH}/frontend/package.json" ]; then
        print_error "Arquivo ${BASE_PATH}/frontend/package.json não encontrado!"
        exit 1
    fi
    
    print_success "Arquivos necessários OK"
}

###############################################################################
# Deploy da Stack
###############################################################################

deploy_stack() {
    print_step "Fazendo deploy da stack ${STACK_NAME}..."
    
    docker stack deploy -c docker-swarm-stack.yaml ${STACK_NAME}
    
    print_success "Stack ${STACK_NAME} deployada"
}

###############################################################################
# Verificar Status
###############################################################################

check_status() {
    print_step "Verificando status dos serviços..."
    echo ""
    
    sleep 5  # Aguardar alguns segundos para os serviços iniciarem
    
    docker stack services ${STACK_NAME}
    
    echo ""
    print_step "Aguardando serviços ficarem prontos (isso pode levar alguns minutos)..."
    
    # Aguardar até que todos os serviços estejam rodando
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        local ready=$(docker stack services ${STACK_NAME} --format "{{.Replicas}}" | grep -c "1/1" || true)
        local total=$(docker stack services ${STACK_NAME} | tail -n +2 | wc -l)
        
        if [ $ready -eq $total ]; then
            echo ""
            print_success "Todos os serviços estão prontos!"
            break
        fi
        
        echo -n "."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -eq $max_attempts ]; then
        echo ""
        print_error "Timeout aguardando serviços. Verifique os logs:"
        echo "docker service logs ${STACK_NAME}_iptv_backend"
        echo "docker service logs ${STACK_NAME}_iptv_frontend"
        echo "docker service logs ${STACK_NAME}_iptv_mongodb"
    fi
}

###############################################################################
# Teste de Conectividade
###############################################################################

test_endpoints() {
    print_step "Testando endpoints..."
    echo ""
    
    sleep 10  # Aguardar um pouco mais para garantir que tudo está pronto
    
    # Testar API
    print_step "Testando API (${DOMAIN_API})..."
    if curl -s -k https://${DOMAIN_API}/api/ > /dev/null 2>&1; then
        print_success "API está respondendo"
    else
        print_error "API não está respondendo. Verifique os logs."
    fi
    
    # Testar Frontend
    print_step "Testando Frontend (${DOMAIN_FRONTEND})..."
    if curl -s -k https://${DOMAIN_FRONTEND}/ > /dev/null 2>&1; then
        print_success "Frontend está respondendo"
    else
        print_error "Frontend não está respondendo. Verifique os logs."
    fi
}

###############################################################################
# Informações Finais
###############################################################################

print_info() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}                    ${GREEN}Deploy Concluído!${NC}                      ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}URLs de Acesso:${NC}"
    echo -e "  Frontend: ${BLUE}https://${DOMAIN_FRONTEND}${NC}"
    echo -e "  API:      ${BLUE}https://${DOMAIN_API}${NC}"
    echo ""
    echo -e "${YELLOW}Credenciais Padrão (se aplicável):${NC}"
    echo -e "  Email:    ${BLUE}admin@iptv.com${NC}"
    echo -e "  Senha:    ${BLUE}admin123${NC}"
    echo -e "  ${RED}⚠ ALTERE ESTAS CREDENCIAIS IMEDIATAMENTE!${NC}"
    echo ""
    echo -e "${GREEN}Comandos Úteis:${NC}"
    echo -e "  Ver serviços:         ${BLUE}docker stack services ${STACK_NAME}${NC}"
    echo -e "  Ver logs backend:     ${BLUE}docker service logs ${STACK_NAME}_iptv_backend${NC}"
    echo -e "  Ver logs frontend:    ${BLUE}docker service logs ${STACK_NAME}_iptv_frontend${NC}"
    echo -e "  Ver logs mongodb:     ${BLUE}docker service logs ${STACK_NAME}_iptv_mongodb${NC}"
    echo -e "  Remover stack:        ${BLUE}docker stack rm ${STACK_NAME}${NC}"
    echo ""
    echo -e "${YELLOW}Próximos Passos:${NC}"
    echo -e "  1. Acesse ${BLUE}https://${DOMAIN_FRONTEND}${NC}"
    echo -e "  2. Crie sua conta de administrador"
    echo -e "  3. Configure o WhatsApp de suporte em Configurações"
    echo -e "  4. Adicione seus servidores DNS"
    echo -e "  5. Comece a cadastrar usuários IPTV"
    echo ""
}

###############################################################################
# Menu de Opções
###############################################################################

show_menu() {
    echo ""
    echo -e "${YELLOW}Escolha uma opção:${NC}"
    echo "  1) Deploy completo (recomendado)"
    echo "  2) Apenas verificar status"
    echo "  3) Ver logs do backend"
    echo "  4) Ver logs do frontend"
    echo "  5) Ver logs do MongoDB"
    echo "  6) Remover stack"
    echo "  0) Sair"
    echo ""
    read -p "Opção: " option
    
    case $option in
        1)
            full_deploy
            ;;
        2)
            check_status
            ;;
        3)
            docker service logs ${STACK_NAME}_iptv_backend --tail 100 -f
            ;;
        4)
            docker service logs ${STACK_NAME}_iptv_frontend --tail 100 -f
            ;;
        5)
            docker service logs ${STACK_NAME}_iptv_mongodb --tail 100 -f
            ;;
        6)
            remove_stack
            ;;
        0)
            exit 0
            ;;
        *)
            print_error "Opção inválida!"
            show_menu
            ;;
    esac
}

###############################################################################
# Deploy Completo
###############################################################################

full_deploy() {
    print_header
    check_requirements
    setup_network
    check_directories
    check_files
    deploy_stack
    check_status
    test_endpoints
    print_info
}

###############################################################################
# Remover Stack
###############################################################################

remove_stack() {
    print_step "Removendo stack ${STACK_NAME}..."
    
    read -p "Tem certeza? Isso irá parar todos os serviços. (s/N): " confirm
    
    if [ "$confirm" = "s" ] || [ "$confirm" = "S" ]; then
        docker stack rm ${STACK_NAME}
        print_success "Stack ${STACK_NAME} removida"
        
        read -p "Deseja remover os volumes também? ISSO APAGARÁ TODOS OS DADOS! (s/N): " confirm_volumes
        
        if [ "$confirm_volumes" = "s" ] || [ "$confirm_volumes" = "S" ]; then
            sleep 5  # Aguardar stack ser completamente removida
            docker volume rm iptv_mongodb_data iptv_mongodb_config 2>/dev/null || true
            print_success "Volumes removidos"
        fi
    else
        print_error "Operação cancelada"
    fi
}

###############################################################################
# Main
###############################################################################

main() {
    if [ "$1" = "--deploy" ]; then
        full_deploy
    elif [ "$1" = "--remove" ]; then
        remove_stack
    elif [ "$1" = "--status" ]; then
        check_status
    else
        print_header
        show_menu
    fi
}

main "$@"
