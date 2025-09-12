// Dashboard.js - Sistema de Dashboard para CDs

// Função para mostrar notificações ao usuário
function showNotification(message, type = 'info') {
    console.log(`Notificação (${type}): ${message}`);
    
    // Verificar se o elemento de notificação existe
    let notificationEl = document.getElementById('notification-container');
    
    // Se não existir, criar um novo
    if (!notificationEl) {
        notificationEl = document.createElement('div');
        notificationEl.id = 'notification-container';
        notificationEl.style.position = 'fixed';
        notificationEl.style.top = '20px';
        notificationEl.style.right = '20px';
        notificationEl.style.zIndex = '9999';
        document.body.appendChild(notificationEl);
    }
    
    // Criar notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.padding = '15px 20px';
    notification.style.marginBottom = '10px';
    notification.style.borderRadius = '5px';
    notification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    notification.style.fontWeight = 'bold';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease-in-out';
    
    // Definir cor de acordo com o tipo
    switch (type) {
        case 'error':
            notification.style.backgroundColor = '#f44336';
            notification.style.color = 'white';
            break;
        case 'success':
            notification.style.backgroundColor = '#4CAF50';
            notification.style.color = 'white';
            break;
        case 'warning':
            notification.style.backgroundColor = '#ff9800';
            notification.style.color = 'white';
            break;
        default:
            notification.style.backgroundColor = '#2196F3';
            notification.style.color = 'white';
    }
    
    // Adicionar texto
    notification.textContent = message;
    
    // Adicionar ao container
    notificationEl.appendChild(notification);
    
    // Mostrar com fade in
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    // Remover após 5 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notificationEl.removeChild(notification);
        }, 300);
    }, 5000);
}

class CDDashboard {
    constructor() {
        this.agendamentos = [];
        this.filteredAgendamentos = [];
        this.currentView = 'cards';
        this.currentAgendamentoId = null;
        
        // Propriedades de paginação
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalPages = 1;
        
        this.init();
    }

    // Função para formatar datas de forma segura
    formatDate(dateString) {
        if (!dateString) {
            return 'Data não informada';
        }
        
        try {
            let date;
            
            // Se a data já está no formato correto (YYYY-MM-DD)
            if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                date = new Date(dateString + 'T00:00:00');
            }
            // Se a data está em formato ISO completo
            else if (dateString.includes('T')) {
                date = new Date(dateString);
            }
            // Outros formatos
            else {
                date = new Date(dateString);
            }
            
            // Verificar se a data é válida
            if (isNaN(date.getTime())) {
                return 'Data inválida';
            }
            
            return date.toLocaleDateString('pt-BR');
        } catch (error) {
            console.error('Erro ao formatar data:', error, 'Data:', dateString);
            return 'Data inválida';
        }
    }

    // Função para formatar data e hora de forma segura
    formatDateTime(dateString) {
        if (!dateString) {
            return 'Data/Hora não informada';
        }
        
        try {
            const date = new Date(dateString);
            
            // Verificar se a data é válida
            if (isNaN(date.getTime())) {
                return 'Data/Hora inválida';
            }
            
            return date.toLocaleString('pt-BR');
        } catch (error) {
            console.error('Erro ao formatar data/hora:', error, 'Data:', dateString);
            return 'Data/Hora inválida';
        }
    }

    // Função para criar objeto Date de forma segura
    createSafeDate(dateString) {
        if (!dateString) {
            return new Date();
        }
        
        try {
            let date;
            
            if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                date = new Date(dateString + 'T00:00:00');
            } else {
                date = new Date(dateString);
            }
            
            return isNaN(date.getTime()) ? new Date() : date;
        } catch (error) {
            console.error('Erro ao criar data:', error, 'Data:', dateString);
            return new Date();
        }
    }

    init() {
        this.checkAuthentication();
        this.setupEventListeners();
        this.loadUserInfo();
        this.loadAgendamentos();
        this.setMinDate();
    }

    checkAuthentication() {
        const token = sessionStorage.getItem('token');
        const usuario = sessionStorage.getItem('usuario');
        
        if (!token || !usuario) {
            window.location.href = 'login.html';
            return;
        }

        try {
            if (token.includes('.')) { // Token JWT
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.exp && payload.exp * 1000 < Date.now()) {
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                    return;
                }
            } else { // Token simples
                const payload = JSON.parse(atob(token));
                if (payload.exp && payload.exp < Date.now()) {
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                    return;
                }
            }
        } catch (error) {
            console.warn('Token não pôde ser decodificado, mantendo sessão:', error);
        }
    }

    setupEventListeners() {
        // User menu toggle
        document.getElementById('user-menu-button').addEventListener('click', this.toggleUserMenu);
        
        // Close user menu when clicking outside (LÓGICA CORRIGIDA)
        document.addEventListener('click', (e) => {
            const userMenu = document.getElementById('user-menu');
            const userMenuButton = document.getElementById('user-menu-button');
            
            // Só fecha se o clique for fora do botão E fora do menu
            if (!userMenuButton.contains(e.target) && !userMenu.contains(e.target)) {
                userMenu.classList.add('hidden');
            }
        });

        // Suggest date form
        document.getElementById('suggest-date-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSuggestDate();
        });
        
        // Atualizar horários disponíveis quando a data mudar
        document.getElementById('nova-data').addEventListener('change', () => {
            this.carregarHorariosDisponiveis();
        });

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                this.closeDetailModal();
                this.closeSuggestDateModal();
            }
        });

        // Setup consulta form
        const consultaForm = document.getElementById('consulta-form');
        if (consultaForm) {
            consultaForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.consultarAgendamento(); // Chama o método da classe
            });
        }
    }

    loadUserInfo() {
        const usuario = sessionStorage.getItem('usuario');
        const cd = sessionStorage.getItem('cd');
        const cdInfo = sessionStorage.getItem('cdInfo');
        
        // Extrair ID do CD do token ou cdInfo
        if (cdInfo) {
            try {
                const cdInfoObj = JSON.parse(cdInfo);
                this.cdId = cdInfoObj.id;
                console.log('CD ID carregado do cdInfo:', this.cdId);
            } catch (error) {
                console.error('Erro ao parsear cdInfo:', error);
            }
        }
        
        // Se não conseguiu obter o ID do CD do cdInfo, tentar extrair do token
        if (!this.cdId) {
            const token = sessionStorage.getItem('token');
            if (token && token.includes('.')) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    this.cdId = payload.id;
                    console.log('CD ID extraído do token:', this.cdId);
                } catch (error) {
                    console.error('Erro ao decodificar token:', error);
                }
            }
        }
        
        // Se ainda não conseguiu o ID, usar o valor armazenado em 'cdId'
        if (!this.cdId) {
            this.cdId = sessionStorage.getItem('cdId');
            console.log('CD ID obtido diretamente do sessionStorage:', this.cdId);
        }
        
        document.getElementById('usuario-nome').textContent = usuario;
        document.getElementById('cd-nome').textContent = `Centro de Distribuição ${cd}`;
    }
    
    // Método para extrair o ID do CD do token JWT ou sessão
    getCDFromToken() {
        // Primeiro, tentar pegar o cdId que já está armazenado na classe
        if (this.cdId) {
            return this.cdId;
        }
        
        // Tentar obter do cdInfo
        const cdInfo = sessionStorage.getItem('cdInfo');
        if (cdInfo) {
            try {
                const cdInfoObj = JSON.parse(cdInfo);
                if (cdInfoObj.id) {
                    return cdInfoObj.id;
                }
            } catch (error) {
                console.error('Erro ao parsear cdInfo:', error);
            }
        }
        
        // Tentar extrair do token JWT
        const token = sessionStorage.getItem('token');
        if (token && token.includes('.')) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.id) {
                    return payload.id;
                }
            } catch (error) {
                console.error('Erro ao decodificar token:', error);
            }
        }
        
        // Por último, tentar pegar diretamente do sessionStorage
        return sessionStorage.getItem('cdId');
    }

    setMinDate() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) { // Pular fins de semana
            tomorrow.setDate(tomorrow.getDate() + 1);
        }
        
        document.getElementById('nova-data').min = tomorrow.toISOString().split('T')[0];
    }

    toggleUserMenu() {
        const userMenu = document.getElementById('user-menu');
        userMenu.classList.toggle('hidden');
    }

    async loadAgendamentos() {
        console.log('🔄 Recarregando agendamentos...');
        this.showLoading(true);
        
        try {
            const token = sessionStorage.getItem('token');
            console.log('🔑 Token encontrado:', !!token);
            
            // Adicionar timestamp para evitar cache
            const url = `http://localhost:3000/api/agendamentos?t=${Date.now()}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });

            console.log('📡 Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Erro na resposta:', errorText);
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log('📊 Dados recebidos:', data);
            
            if (data.success) {
                this.agendamentos = data.data || [];
                this.filteredAgendamentos = [...this.agendamentos];
                console.log('✅ Agendamentos carregados:', this.agendamentos.length);
                console.log('📋 Status dos agendamentos:', this.agendamentos.map(a => ({ id: a.id, codigo: a.codigo, status: a.status })));
            } else {
                throw new Error(data.error || 'Erro ao carregar agendamentos');
            }
            
            this.updateStats();
            this.renderAgendamentos();
            
        } catch (error) {
            console.error('❌ Erro ao carregar agendamentos:', error);
            this.showNotification('Erro ao carregar agendamentos. Verifique sua conexão e tente novamente.', 'error');
            
            // Manter listas vazias quando não há dados do banco
            this.agendamentos = [];
            this.filteredAgendamentos = [];
            this.updateStats();
            this.renderAgendamentos();
        } finally {
            this.showLoading(false);
        }
    }

    updateStats() {
        const stats = {
            total: this.agendamentos.length,
            pendente: this.agendamentos.filter(a => a.status === 'pendente').length,
            confirmado: this.agendamentos.filter(a => a.status === 'confirmado').length,
            entregue: this.agendamentos.filter(a => a.status === 'entregue').length,
            'nao-veio': this.agendamentos.filter(a => a.status === 'nao-veio').length
        };

        Object.keys(stats).forEach(key => {
            const element = document.getElementById(`stat-${key}`);
            if (element) {
                this.animateNumber(element, parseInt(element.textContent), stats[key]);
            }
        });
    }

    animateNumber(element, start, end) {
        const duration = 1000;
        const startTime = Date.now();
        
        const updateNumber = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);
            const current = Math.floor(start + (end - start) * progress);
            
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        };
        
        updateNumber();
    }

    renderAgendamentos() {
        if (this.currentView === 'cards') {
            this.renderKanbanColumns();
        } else {
            this.renderList();
        }
    }

    renderKanbanColumns() {
        const agendamentosPorStatus = {
            'pendente': [],
            'confirmado': [],
            'entregue': [],
            'nao-veio': [],
            'reagendamento': []
        };

        this.filteredAgendamentos.forEach(agendamento => {
            let status = agendamento.status;
            
            // Mapear status que não têm coluna específica para status existentes
            if (status === 'aguardando_resposta_fornecedor') {
                status = 'reagendamento'; // Mapear para reagendamento
            }
            
            if (agendamentosPorStatus[status]) {
                agendamentosPorStatus[status].push(agendamento);
            }
        });

        Object.keys(agendamentosPorStatus).forEach(status => {
            agendamentosPorStatus[status] = this.sortByPriority(agendamentosPorStatus[status], status);
        });

        Object.keys(agendamentosPorStatus).forEach(status => {
            this.renderColumn(status, agendamentosPorStatus[status]);
        });

        this.checkTodayDeliveries();
        this.hideEmptyState();
    }

    sortByPriority(agendamentos, status) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        return agendamentos.sort((a, b) => {
            const dataA = this.createSafeDate(a.dataEntrega);
            const dataB = this.createSafeDate(b.dataEntrega);

            if (status === 'pendente') {
                return this.createSafeDate(a.dataCriacao) - this.createSafeDate(b.dataCriacao);
            } else if (status === 'confirmado') {
                const diffA = Math.abs(dataA - hoje);
                const diffB = Math.abs(dataB - hoje);
                return diffA - diffB;
            } else {
                return dataA - dataB;
            }
        });
    }

    renderColumn(status, agendamentos) {
        // Status válidos que têm colunas no dashboard
        const statusValidos = ['pendente', 'confirmado', 'entregue', 'nao-veio', 'reagendamento'];
        
        if (!statusValidos.includes(status)) {
            console.warn(`Status '${status}' não tem coluna correspondente no dashboard`);
            return;
        }
        
        const container = document.getElementById(`column-${status}`);
        const badge = document.getElementById(`badge-${status}`);
        const moreButton = document.getElementById(`more-${status}`);

        if (!badge) {
            console.error(`Badge element not found: badge-${status}`);
            return;
        }

        if (!container) {
            console.error(`Container element not found: column-${status}`);
            return;
        }

        badge.textContent = agendamentos.length;

        const visibleAgendamentos = agendamentos.slice(0, 3);
        const hasMore = agendamentos.length > 3;

        if (hasMore && moreButton) {
            moreButton.classList.remove('hidden');
            moreButton.querySelector('span') ? 
                moreButton.querySelector('span').textContent = `+${agendamentos.length - 3} mais` :
                moreButton.innerHTML = `<i class="fas fa-plus mr-1"></i>+${agendamentos.length - 3} mais`;
        } else if (moreButton) {
            moreButton.classList.add('hidden');
        }

        if (visibleAgendamentos.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-inbox text-3xl mb-2"></i>
                    <p>Nenhum agendamento</p>
                </div>
            `;
            return;
        }

        container.innerHTML = visibleAgendamentos.map(agendamento => {
            return this.renderColumnCard(agendamento);
        }).join('');
    }

    renderColumnCard(agendamento) {
        const statusClass = `status-${agendamento.status}`;
        const statusIcon = this.getStatusIcon(agendamento.status);
        const dataEntrega = this.createSafeDate(agendamento.dataEntrega);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        const isToday = dataEntrega.getTime() === hoje.getTime();
        
        const daysDiff = Math.ceil((dataEntrega - hoje) / (1000 * 60 * 60 * 24));
        let priorityClass = '';
        let urgentClass = '';
        
        if (agendamento.status === 'confirmado') {
            if (isToday) {
                // Removido a classe que pintava o card para entrega hoje
                urgentClass = '';
            } else if (daysDiff <= 1) {
                priorityClass = 'priority-high';
            } else if (daysDiff <= 3) {
                priorityClass = 'priority-medium';
            } else {
                priorityClass = 'priority-low';
            }
        } else if (agendamento.status === 'pendente') {
            const daysSinceCreated = Math.ceil((hoje - this.createSafeDate(agendamento.dataCriacao)) / (1000 * 60 * 60 * 24));
            if (daysSinceCreated >= 3) {
                priorityClass = 'priority-high';
            } else if (daysSinceCreated >= 1) {
                priorityClass = 'priority-medium';
            }
        }

        // Verificar se a entrega foi incluída pelo CD
        const incluidoPeloCD = agendamento.incluidoPeloCD;
        const cdIndicator = incluidoPeloCD ? 
            `<div class="bg-yellow-100 text-yellow-800 font-bold text-xs p-2 rounded mb-2 flex items-center">
                <i class="fas fa-exclamation-circle mr-1"></i>
                ENTREGA INCLUÍDA PELO CD
            </div>` : '';

        return `
            <div class="column-card bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-all ${priorityClass} ${urgentClass}"
                 onclick="dashboard.showAgendamentoDetails(${agendamento.id})">
                
                <!-- Alerta de entrega para hoje removido conforme solicitado -->
                
                <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                        <h4 class="font-bold text-gray-dark text-sm">${agendamento.codigo}</h4>
                        <p class="text-gray-600 text-xs truncate">${agendamento.fornecedor.nome}</p>
                    </div>
                    <div class="px-2 py-1 rounded text-white text-xs font-semibold ${statusClass}">
                        <i class="${statusIcon}"></i>
                    </div>
                </div>
                
                ${cdIndicator}
                
                <div class="space-y-1 mb-3 text-xs text-gray-600">
                    <div class="flex items-center">
                        <i class="fas fa-calendar w-3 mr-2 text-orange-primary"></i>
                        <span class="${isToday ? 'font-bold text-gray-700' : ''}">${this.formatDate(agendamento.dataEntrega)}</span>
                        ${isToday ? '<i class="fas fa-exclamation-circle text-gray-600 ml-1"></i>' : ''}
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-clock w-3 mr-2 text-orange-primary"></i>
                        <span>${agendamento.horarioEntrega}</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-boxes w-3 mr-2 text-orange-primary"></i>
                        <span class="truncate">${this.getTipoCargaText(agendamento.tipoCarga)}</span>
                    </div>
                </div>
                
                ${this.getColumnCardActions(agendamento)}
                
                ${this.getPriorityIndicator(agendamento, daysDiff)}
            </div>
        `;
    }

    getColumnCardActions(agendamento) {
        if (agendamento.status === 'pendente') {
            return `
                <div class="flex space-x-1">
                    <button onclick="event.stopPropagation(); dashboard.updateAgendamentoStatus(${agendamento.id}, 'confirmado')" 
                        class="flex-1 bg-green-500 text-white py-1 px-2 rounded text-xs hover:bg-green-600 transition-all">
                        <i class="fas fa-check mr-1"></i>Aceitar
                    </button>
                    <button onclick="event.stopPropagation(); dashboard.suggestNewDate(${agendamento.id})" 
                        class="flex-1 bg-blue-500 text-white py-1 px-2 rounded text-xs hover:bg-blue-600 transition-all">
                        <i class="fas fa-calendar mr-1"></i>Reagendar
                    </button>
                </div>
            `;
        } else if (agendamento.status === 'confirmado') {
            return `
                <div class="flex space-x-1">
                    <button onclick="event.stopPropagation(); dashboard.updateAgendamentoStatus(${agendamento.id}, 'entregue')" 
                        class="flex-1 bg-blue-500 text-white py-1 px-2 rounded text-xs hover:bg-blue-600 transition-all">
                        <i class="fas fa-truck mr-1"></i>Entregue
                    </button>
                    <button onclick="event.stopPropagation(); dashboard.updateAgendamentoStatus(${agendamento.id}, 'nao-veio')" 
                        class="flex-1 bg-red-500 text-white py-1 px-2 rounded text-xs hover:bg-red-600 transition-all">
                        <i class="fas fa-times mr-1"></i>Não Veio
                    </button>
                </div>
            `;
        }
        return `
            <button onclick="event.stopPropagation(); dashboard.showAgendamentoDetails(${agendamento.id})" 
                class="w-full bg-gray-500 text-white py-1 px-2 rounded text-xs hover:bg-gray-600 transition-all">
                <i class="fas fa-eye mr-1"></i>Ver Detalhes
            </button>
        `;
    }

    getPriorityIndicator(agendamento, daysDiff) {
        const hoje = new Date();
        const dataCriacao = this.createSafeDate(agendamento.dataCriacao);
        const daysSinceCreated = Math.ceil((hoje - dataCriacao) / (1000 * 60 * 60 * 24));

        if (agendamento.status === 'pendente' && daysSinceCreated >= 3) {
            return `
                <div class="mt-2 text-xs text-red-600 font-semibold flex items-center">
                    <i class="fas fa-exclamation-triangle mr-1"></i>
                    Há ${daysSinceCreated} dias
                </div>
            `;
        } else if (agendamento.status === 'confirmado' && daysDiff <= 1 && daysDiff >= 0) {
            return `
                <div class="mt-2 text-xs text-yellow-600 font-semibold flex items-center">
                    <i class="fas fa-clock mr-1"></i>
                    ${daysDiff === 0 ? 'Hoje' : 'Amanhã'}
                </div>
            `;
        }
        return '';
    }

    checkTodayDeliveries() {
        // Função mantida mas sem exibir o alerta no topo, já que a informação é exibida nos cards
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        const entregasHoje = this.filteredAgendamentos.filter(agendamento => {
            const dataEntrega = this.createSafeDate(agendamento.dataEntrega);
            return agendamento.status === 'confirmado' && dataEntrega.getTime() === hoje.getTime();
        });

        // Alerta no topo removido conforme solicitado
        const alertDiv = document.getElementById('today-alert');
        if (alertDiv) {
            alertDiv.classList.add('hidden');
        }
    }

    showAllStatus(status) {
        const agendamentos = this.filteredAgendamentos.filter(a => a.status === status);
        const modal = document.getElementById('all-status-modal');
        const title = document.getElementById('all-status-title');
        const content = document.getElementById('all-status-list');

        title.textContent = `Todos os ${this.getStatusText(status)} (${agendamentos.length})`;

        content.innerHTML = agendamentos.map(agendamento => {
            return this.renderDetailedCard(agendamento);
        }).join('');

        modal.classList.remove('hidden');
    }

    showTodayDeliveries() {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        const entregasHoje = this.agendamentos.filter(agendamento => {
            const dataEntrega = this.createSafeDate(agendamento.dataEntrega);
            return agendamento.status === 'confirmado' && dataEntrega.getTime() === hoje.getTime();
        });

        const modal = document.getElementById('today-deliveries-modal');
        const content = document.getElementById('today-deliveries-list');

        content.innerHTML = entregasHoje.map(agendamento => {
            return this.renderTodayCard(agendamento);
        }).join('');

        modal.classList.remove('hidden');
    }

    renderDetailedCard(agendamento) {
        const statusClass = `status-${agendamento.status}`;
        const statusIcon = this.getStatusIcon(agendamento.status);
        const statusText = this.getStatusText(agendamento.status);
        
        // Verificar se a entrega foi incluída pelo CD
        const incluidoPeloCD = agendamento.incluidoPeloCD;
        const cdIndicator = incluidoPeloCD ? 
            `<div class="bg-yellow-100 text-yellow-800 font-bold text-sm p-2 rounded mb-3 flex items-center">
                <i class="fas fa-exclamation-circle mr-1"></i>
                ENTREGA INCLUÍDA PELO CD
            </div>` : '';
        
        return `
            <div class="bg-white rounded-xl p-6 border shadow-sm hover:shadow-md transition-all">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-lg font-bold text-gray-dark">${agendamento.codigo}</h3>
                        <p class="text-gray-medium">${agendamento.fornecedor.nome}</p>
                        <p class="text-sm text-gray-500">${agendamento.fornecedor.email}</p>
                    </div>
                    <div class="px-3 py-1 rounded-full text-white text-sm font-semibold ${statusClass}">
                        <i class="${statusIcon} mr-1"></i>
                        ${statusText}
                    </div>
                </div>
                
                ${cdIndicator}
                
                <div class="grid md:grid-cols-2 gap-4 mb-4">
                    <div class="space-y-2">
                        <div class="flex items-center text-gray-600">
                            <i class="fas fa-calendar mr-2 text-orange-primary w-4"></i>
                            <span>${this.formatDate(agendamento.dataEntrega)}</span>
                        </div>
                        <div class="flex items-center text-gray-600">
                            <i class="fas fa-clock mr-2 text-orange-primary w-4"></i>
                            <span>${agendamento.horarioEntrega}</span>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <div class="flex items-center text-gray-600">
                            <i class="fas fa-boxes mr-2 text-orange-primary w-4"></i>
                            <span>${this.getTipoCargaText(agendamento.tipoCarga)}</span>
                        </div>
                        <div class="flex items-center text-gray-600">
                            <i class="fas fa-file-invoice mr-2 text-orange-primary w-4"></i>
                            <span>${agendamento.pedidos.length} pedido(s)</span>
                        </div>
                    </div>
                </div>
                
                <div class="flex space-x-2">
                    <button onclick="dashboard.showAgendamentoDetails(${agendamento.id})" 
                        class="flex-1 bg-orange-primary text-white py-2 px-4 rounded-lg hover:bg-orange-secondary transition-all">
                        <i class="fas fa-eye mr-2"></i>Ver Detalhes
                    </button>
                    ${this.getActionButtons(agendamento)}
                </div>
            </div>
        `;
    }

    renderTodayCard(agendamento) {
        // Verificar se a entrega foi incluída pelo CD
        const incluidoPeloCD = agendamento.incluidoPeloCD;
        const cdIndicator = incluidoPeloCD ? 
            `<div class="bg-yellow-100 text-yellow-800 font-bold text-sm p-2 rounded mb-3 border border-yellow-400 flex items-center">
                <i class="fas fa-exclamation-circle mr-1"></i>
                ENTREGA INCLUÍDA PELO CD
            </div>` : '';
        
        return `
            <div class="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-xl p-6 shadow-sm">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-lg font-bold text-gray-dark flex items-center">
                            <i class="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                            ${agendamento.codigo}
                        </h3>
                        <p class="text-gray-dark font-semibold">${agendamento.fornecedor.nome}</p>
                        <p class="text-sm text-gray-600">${agendamento.fornecedor.telefone}</p>
                    </div>
                    <div class="text-right">
                        <div class="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold mb-2">
                            HOJE
                        </div>
                        <div class="text-lg font-bold text-yellow-700">${agendamento.horarioEntrega}</div>
                    </div>
                </div>
                
                ${cdIndicator}
                
                <div class="grid md:grid-cols-2 gap-4 mb-4">
                    <div class="space-y-2">
                        <div class="flex items-center text-gray-700">
                            <i class="fas fa-boxes mr-2 text-yellow-600 w-4"></i>
                            <span>${this.getTipoCargaText(agendamento.tipoCarga)}</span>
                        </div>
                        <div class="flex items-center text-gray-700">
                            <i class="fas fa-file-invoice mr-2 text-yellow-600 w-4"></i>
                            <span>${agendamento.pedidos.length} pedido(s)</span>
                        </div>
                    </div>
                    ${agendamento.observacoes ? `
                        <div>
                            <p class="text-sm text-gray-600"><strong>Observações:</strong></p>
                            <p class="text-sm text-gray-700">${agendamento.observacoes}</p>
                        </div>
                    ` : ''}
                </div>
                
                <div class="flex space-x-2">
                    <button onclick="dashboard.showAgendamentoDetails(${agendamento.id})" 
                        class="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-all">
                        <i class="fas fa-eye mr-2"></i>Ver Detalhes
                    </button>
                    <button onclick="dashboard.updateAgendamentoStatus(${agendamento.id}, 'entregue')" 
                        class="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-all">
                        <i class="fas fa-truck mr-2"></i>Marcar Entregue
                    </button>
                    <button onclick="dashboard.updateAgendamentoStatus(${agendamento.id}, 'nao-veio')" 
                        class="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-all">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    }

    closeAllStatusModal() {
        document.getElementById('all-status-modal').classList.add('hidden');
    }

    closeTodayDeliveriesModal() {
        document.getElementById('today-deliveries-modal').classList.add('hidden');
    }

    renderList() {
        if (this.filteredAgendamentos.length === 0) {
            this.showEmptyState();
            this.updateListInfo(0, 0, 0);
            return;
        }
        
        this.hideEmptyState();
        
        // Calcular paginação
        this.totalPages = Math.ceil(this.filteredAgendamentos.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const currentPageItems = this.filteredAgendamentos.slice(startIndex, endIndex);
        
        // Renderizar tabela
        const tbody = document.getElementById('list-tbody');
        tbody.innerHTML = currentPageItems.map((agendamento, index) => {
            const statusClass = `status-${agendamento.status}`;
            const statusIcon = this.getStatusIcon(agendamento.status);
            const statusText = this.getStatusText(agendamento.status);
            const rowIndex = startIndex + index + 1;
            
            return `
                <tr class="table-row hover:bg-gray-50 transition-colors">
                    <td class="w-24 px-4 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <span class="text-xs text-gray-400 mr-2">${rowIndex}</span>
                            <div>
                                <div class="text-sm font-bold text-gray-900 truncate">${agendamento.codigo}</div>
                                <div class="text-xs text-gray-500 truncate">${agendamento.tipoCarga || 'N/A'}</div>
                            </div>
                        </div>
                    </td>
                    <td class="w-40 px-4 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 h-8 w-8">
                                <div class="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                                    <i class="fas fa-building text-orange-600 text-xs"></i>
                                </div>
                            </div>
                            <div class="ml-3 min-w-0 flex-1">
                                <div class="text-sm font-medium text-gray-900 truncate">${agendamento.fornecedor?.nome || 'N/A'}</div>
                                <div class="text-xs text-gray-500 truncate">${agendamento.fornecedor?.email || 'N/A'}</div>
                            </div>
                        </div>
                    </td>
                    <td class="w-28 px-4 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900 font-medium">${this.formatDate(agendamento.dataEntrega)}</div>
                        <div class="text-xs text-gray-500">${this.formatDateTime(agendamento.createdAt) || 'Criação'}</div>
                    </td>
                    <td class="w-24 px-4 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <i class="fas fa-clock text-gray-400 mr-1"></i>
                            <span class="text-xs text-gray-900 font-medium">${agendamento.horarioEntrega}</span>
                        </div>
                    </td>
                    <td class="w-32 px-4 py-4 whitespace-nowrap">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-white text-xs font-bold ${statusClass}">
                            <i class="${statusIcon} mr-1"></i>
                            ${statusText}
                        </span>
                    </td>
                    <td class="w-24 px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div class="flex items-center justify-center space-x-1">
                            <button onclick="dashboard.showAgendamentoDetails(${agendamento.id})" 
                                class="text-blue-600 hover:text-blue-900 p-1 rounded-lg hover:bg-blue-50 transition-colors"
                                title="Ver Detalhes">
                                <i class="fas fa-eye text-xs"></i>
                            </button>
                            ${this.getActionButtonsCompact(agendamento)}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Atualizar informações da página
        this.updateListInfo(startIndex + 1, Math.min(endIndex, this.filteredAgendamentos.length), this.filteredAgendamentos.length);
        
        // Atualizar controles de paginação
        this.updatePaginationControls();
    }

    updateListInfo(start, end, total) {
        document.getElementById('page-start').textContent = start;
        document.getElementById('page-end').textContent = end;
        document.getElementById('page-total').textContent = total;
        document.getElementById('list-total-items').textContent = `${total} itens`;
    }

    updatePaginationControls() {
        const firstBtn = document.getElementById('first-page-btn');
        const prevBtn = document.getElementById('prev-page-btn');
        const nextBtn = document.getElementById('next-page-btn');
        const lastBtn = document.getElementById('last-page-btn');
        
        // Habilitar/desabilitar botões
        firstBtn.disabled = this.currentPage === 1;
        prevBtn.disabled = this.currentPage === 1;
        nextBtn.disabled = this.currentPage === this.totalPages || this.totalPages === 0;
        lastBtn.disabled = this.currentPage === this.totalPages || this.totalPages === 0;
        
        // Gerar números das páginas
        this.generatePageNumbers();
    }

    generatePageNumbers() {
        const pageNumbersContainer = document.getElementById('page-numbers');
        pageNumbersContainer.innerHTML = '';
        
        if (this.totalPages <= 1) return;
        
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const button = document.createElement('button');
            button.className = `px-3 py-2 text-sm font-medium border ${
                i === this.currentPage 
                    ? 'bg-orange-primary text-white border-orange-primary' 
                    : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
            } transition-colors`;
            button.textContent = i;
            button.onclick = () => this.goToPage(i);
            pageNumbersContainer.appendChild(button);
        }
    }

    // Métodos de navegação de página
    goToPage(page) {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.renderList();
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.renderList();
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderList();
        }
    }

    changeItemsPerPage(newItemsPerPage) {
        this.itemsPerPage = parseInt(newItemsPerPage);
        this.currentPage = 1; // Resetar para primeira página
        this.renderList();
    }

    // Método de ordenação
    sortTable(column) {
        const currentSort = this.currentSort || { column: null, direction: 'asc' };
        
        if (currentSort.column === column) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.column = column;
            currentSort.direction = 'asc';
        }
        
        this.currentSort = currentSort;
        
        this.filteredAgendamentos.sort((a, b) => {
            let valueA, valueB;
            
            switch (column) {
                case 'codigo':
                    valueA = a.codigo;
                    valueB = b.codigo;
                    break;
                case 'fornecedor':
                    valueA = a.fornecedor?.nome || '';
                    valueB = b.fornecedor?.nome || '';
                    break;
                case 'dataEntrega':
                    valueA = new Date(a.dataEntrega);
                    valueB = new Date(b.dataEntrega);
                    break;
                case 'status':
                    valueA = a.status;
                    valueB = b.status;
                    break;
                default:
                    return 0;
            }
            
            if (valueA < valueB) return currentSort.direction === 'asc' ? -1 : 1;
            if (valueA > valueB) return currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
        
        this.currentPage = 1; // Resetar para primeira página após ordenação
        this.renderList();
        
        // Atualizar ícones de ordenação
        this.updateSortIcons(column, currentSort.direction);
    }

    updateSortIcons(activeColumn, direction) {
        // Resetar todos os ícones
        document.querySelectorAll('th i.fas').forEach(icon => {
            icon.className = 'fas fa-sort text-gray-400';
        });
        
        // Atualizar ícone da coluna ativa
        const activeHeader = document.querySelector(`th[onclick="dashboard.sortTable('${activeColumn}')"] i`);
        if (activeHeader) {
            activeHeader.className = `fas fa-sort-${direction === 'asc' ? 'up' : 'down'} text-orange-primary`;
        }
    }

    // --- MÉTODOS DE UTILIDADE E FORMATAÇÃO ---

    getStatusIcon(status) {
        const icons = {
            'pendente': 'fas fa-clock',
            'confirmado': 'fas fa-check-circle',
            'entregue': 'fas fa-truck',
            'nao-veio': 'fas fa-times-circle',
            'reagendamento': 'fas fa-calendar-alt',
            'aguardando_resposta_fornecedor': 'fas fa-hourglass-half'
        };
        return icons[status] || 'fas fa-question-circle';
    }

    getStatusText(status) {
        const texts = {
            'pendente': 'Pendente',
            'confirmado': 'Confirmado',
            'entregue': 'Entregue',
            'nao-veio': 'Não Veio',
            'reagendamento': 'Reagendamento',
            'aguardando_resposta_fornecedor': 'Aguardando Fornecedor'
        };
        return texts[status] || 'Desconhecido';
    }

    getStatusClass(status) {
        const classes = {
            'pendente': 'bg-orange-500 text-white',
            'confirmado': 'bg-green-500 text-white',
            'entregue': 'bg-blue-500 text-white',
            'nao-veio': 'bg-red-500 text-white',
            'reagendamento': 'bg-purple-500 text-white',
            'aguardando_resposta_fornecedor': 'bg-yellow-500 text-white',
            'reagendamento-solicitado': 'bg-purple-500 text-white',
            'cancelado': 'bg-gray-500 text-white'
        };
        return classes[status] || 'bg-gray-400 text-white';
    }

    getTipoCargaText(tipo) {
        const tipos = {
            'equipamentos': 'Equipamentos de Rede',
            'materiais': 'Materiais de Instalação',
            'componentes': 'Componentes Eletrônicos',
            'outros': 'Outros'
        };
        return tipos[tipo] || tipo;
    }

    getActionButtons(agendamento) {
        if (agendamento.status === 'pendente') {
            return `
                <button onclick="dashboard.updateAgendamentoStatus(${agendamento.id}, 'confirmado')" 
                    class="flex-1 bg-green-500 text-white py-2 px-3 rounded-lg hover:bg-green-600 transition-all text-sm btn-3d">
                    <i class="fas fa-check mr-1"></i>Aceitar
                </button>
                <button onclick="dashboard.suggestNewDate(${agendamento.id})" 
                    class="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg hover:bg-blue-600 transition-all text-sm btn-3d">
                    <i class="fas fa-calendar mr-1"></i>Reagendar
                </button>
            `;
        } else if (agendamento.status === 'confirmado') {
            return `
                <button onclick="dashboard.updateAgendamentoStatus(${agendamento.id}, 'entregue')" 
                    class="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg hover:bg-blue-600 transition-all text-sm btn-3d">
                    <i class="fas fa-truck mr-1"></i>Entregue
                </button>
                <button onclick="dashboard.updateAgendamentoStatus(${agendamento.id}, 'nao-veio')" 
                    class="flex-1 bg-red-500 text-white py-2 px-3 rounded-lg hover:bg-red-600 transition-all text-sm btn-3d">
                    <i class="fas fa-times mr-1"></i>Não Veio
                </button>
            `;
        }
        return '';
    }

    getActionButtonsCompact(agendamento) {
        if (agendamento.status === 'pendente') {
            return `
                <button onclick="dashboard.updateAgendamentoStatus(${agendamento.id}, 'confirmado')" 
                    class="text-green-500 hover:text-green-700" title="Aceitar">
                    <i class="fas fa-check"></i>
                </button>
                <button onclick="dashboard.suggestNewDate(${agendamento.id})" 
                    class="text-blue-500 hover:text-blue-700" title="Reagendar">
                    <i class="fas fa-calendar"></i>
                </button>
            `;
        } else if (agendamento.status === 'confirmado') {
            return `
                <button onclick="dashboard.updateAgendamentoStatus(${agendamento.id}, 'entregue')" 
                    class="text-blue-500 hover:text-blue-700" title="Marcar como Entregue">
                    <i class="fas fa-truck"></i>
                </button>
                <button onclick="dashboard.updateAgendamentoStatus(${agendamento.id}, 'nao-veio')" 
                    class="text-red-500 hover:text-red-700" title="Marcar como Não Veio">
                    <i class="fas fa-times"></i>
                </button>
            `;
        }
        return '';
    }

    // --- MÉTODOS DE AÇÃO E MODAIS ---

    showAgendamentoDetails(id) {
        const agendamento = this.agendamentos.find(a => a.id === id);
        if (!agendamento) return;

        this.currentAgendamentoId = id;
        
        // Verificar se a entrega foi incluída pelo CD
        const incluidoPeloCD = agendamento.incluidoPeloCD;
        const cdIndicatorHtml = incluidoPeloCD ? 
            `<div class="bg-yellow-100 border border-yellow-400 text-yellow-800 font-bold p-3 rounded-lg mb-4 flex items-center">
                <i class="fas fa-exclamation-circle mr-2 text-yellow-600"></i>
                ENTREGA INCLUÍDA PELO CD
            </div>` : '';
        
        const detailContent = document.getElementById('detail-content');
        detailContent.innerHTML = `
            <div class="space-y-4">
                ${cdIndicatorHtml}
                
                <!-- Informações Básicas -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <!-- Informações Gerais -->
                    <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div class="flex items-center mb-3">
                            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                                <i class="fas fa-info-circle text-blue-600 text-sm"></i>
                            </div>
                            <h3 class="text-md font-semibold text-gray-800">Informações Gerais</h3>
                        </div>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Código:</span>
                                <span class="font-semibold">${agendamento.codigo}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600">Status:</span>
                                <span class="status-${agendamento.status} px-2 py-1 rounded-full text-xs font-medium">
                                    <i class="${this.getStatusIcon(agendamento.status)} mr-1"></i>
                                    ${this.getStatusText(agendamento.status)}
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Data:</span>
                                <span class="font-semibold">${this.formatDate(agendamento.dataEntrega)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Horário:</span>
                                <span class="font-semibold">${agendamento.horarioEntrega}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Tipo:</span>
                                <span class="font-semibold text-xs">${this.getTipoCargaText(agendamento.tipoCarga)}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Dados do Fornecedor -->
                    <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div class="flex items-center mb-3">
                            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-2">
                                <i class="fas fa-building text-green-600 text-sm"></i>
                            </div>
                            <h3 class="text-md font-semibold text-gray-800">Fornecedor</h3>
                        </div>
                        <div class="space-y-2 text-sm">
                            <div>
                                <span class="text-gray-600 text-xs">Empresa</span>
                                <p class="font-semibold truncate" title="${agendamento.fornecedor.nome}">${agendamento.fornecedor.nome}</p>
                            </div>
                            <div>
                                <span class="text-gray-600 text-xs">E-mail</span>
                                <p class="font-semibold truncate" title="${agendamento.fornecedor.email}">${agendamento.fornecedor.email}</p>
                            </div>
                            <div>
                                <span class="text-gray-600 text-xs">Telefone</span>
                                <p class="font-semibold">${agendamento.fornecedor.telefone}</p>
                            </div>
                            ${agendamento.fornecedor.documento ? `
                                <div>
                                    <span class="text-gray-600 text-xs">CNPJ</span>
                                    <p class="font-semibold text-xs">${agendamento.fornecedor.documento}</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Resumo de Notas -->
                    <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div class="flex items-center mb-3">
                            <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-2">
                                <i class="fas fa-file-invoice text-purple-600 text-sm"></i>
                            </div>
                            <h3 class="text-md font-semibold text-gray-800">Resumo</h3>
                        </div>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Notas Fiscais:</span>
                                <span class="font-semibold">${agendamento.notasFiscais ? agendamento.notasFiscais.length : 0}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Valor Total:</span>
                                <span class="font-semibold text-green-600 text-xs">
                                    R$ ${agendamento.notasFiscais ? 
                                        agendamento.notasFiscais.reduce((total, nf) => 
                                            total + parseFloat(nf.valor?.replace(',', '.') || 0), 0
                                        ).toLocaleString('pt-BR', {minimumFractionDigits: 2}) 
                                        : '0,00'}
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Criado em:</span>
                                <span class="font-semibold text-xs">${agendamento.createdAt ? this.formatDate(agendamento.createdAt) : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Histórico de Comunicação -->
                <div class="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div class="border-b border-gray-200 p-4">
                        <div class="flex items-center">
                            <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-2">
                                <i class="fas fa-comments text-yellow-600 text-sm"></i>
                            </div>
                            <h3 class="text-md font-semibold text-gray-800">Histórico de Comunicação</h3>
                        </div>
                    </div>
                    <div class="p-4">
                        ${this.renderCommunicationHistory(agendamento)}
                    </div>
                </div>

                <!-- Notas Fiscais Detalhadas -->
                <div class="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div class="border-b border-gray-200 p-4">
                        <div class="flex items-center">
                            <div class="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-2">
                                <i class="fas fa-file-invoice-dollar text-indigo-600 text-sm"></i>
                            </div>
                            <h3 class="text-md font-semibold text-gray-800">Notas Fiscais</h3>
                        </div>
                    </div>
                    <div class="p-4">
                        ${agendamento.notasFiscais && agendamento.notasFiscais.length > 0 ? `
                            <div class="space-y-3">
                                ${agendamento.notasFiscais.map(nf => `
                                    <div class="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                                        <div class="flex justify-between items-center">
                                            <div class="flex-1">
                                                <div class="flex items-center space-x-3 mb-1">
                                                    <span class="font-semibold text-gray-900">NF: ${nf.numeroNF}</span>
                                                    <span class="text-xs text-gray-500">Pedido: ${nf.numeroPedido}</span>
                                                    ${nf.serie ? `<span class="text-xs text-gray-500">Série: ${nf.serie}</span>` : ''}
                                                </div>
                                                <div class="text-lg font-bold text-green-600">
                                                    ${nf.valor ? `R$ ${nf.valor}` : 'Valor não informado'}
                                                </div>
                                            </div>
                                            <div class="flex items-center space-x-2">
                                                ${nf.arquivoPath ? `
                                                    <button onclick="dashboard.viewPDF('${nf.arquivoPath}')" 
                                                        class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium hover:bg-green-200 transition-colors">
                                                        <i class="fas fa-file-pdf mr-1"></i>PDF
                                                    </button>
                                                ` : `
                                                    <span class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-medium">
                                                        <i class="fas fa-exclamation-triangle mr-1"></i>Sem PDF
                                                    </span>
                                                `}
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="text-center py-6 text-gray-500">
                                <i class="fas fa-inbox text-2xl mb-2"></i>
                                <p class="text-sm">Nenhuma nota fiscal encontrada</p>
                            </div>
                        `}
                    </div>
                </div>

                <!-- Observações -->
                ${agendamento.observacoes ? `
                    <div class="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div class="border-b border-gray-200 p-4">
                            <div class="flex items-center">
                                <div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-2">
                                    <i class="fas fa-comment-alt text-gray-600 text-sm"></i>
                                </div>
                                <h3 class="text-md font-semibold text-gray-800">Observações</h3>
                            </div>
                        </div>
                        <div class="p-4">
                            <p class="text-gray-700 text-sm leading-relaxed">${agendamento.observacoes}</p>
                        </div>
                    </div>
                ` : ''}

                <!-- Ações -->
                <div class="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div class="border-b border-gray-200 p-4">
                        <div class="flex items-center">
                            <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-2">
                                <i class="fas fa-cogs text-orange-600 text-sm"></i>
                            </div>
                            <h3 class="text-md font-semibold text-gray-800">Ações Disponíveis</h3>
                        </div>
                    </div>
                    <div class="p-4">
                        <div class="flex flex-wrap gap-2">
                            ${this.getDetailActionButtons(agendamento)}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('detail-modal').classList.remove('hidden');
    }

    shouldShowCommunicationHistory(agendamento) {
        return agendamento.status === 'reagendamento' || agendamento.status === 'nao-veio' || 
               (agendamento.historicoAcoes && agendamento.historicoAcoes.some(h => 
                   h.acao.includes('reagendamento') || h.acao.includes('sugestao')));
    }

    renderCommunicationHistory(agendamento) {
        // Usar apenas histórico real do banco de dados
        let historico = agendamento.historicoAcoes || [];

        if (historico.length === 0) {
            return `
                <div class="text-center py-8 text-gray-500">
                    <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-comments text-2xl text-gray-400"></i>
                    </div>
                    <p class="text-lg font-medium text-gray-600">Nenhuma comunicação registrada</p>
                    <p class="text-sm text-gray-500 mt-1">As atualizações do agendamento aparecerão aqui</p>
                </div>
            `;
        }

        return `
            <div class="space-y-4">
                ${historico.map((evento, index) => `
                    <div class="flex items-start space-x-4 ${index < historico.length - 1 ? 'border-b border-gray-100 pb-4' : ''}">
                        <div class="flex-shrink-0">
                            <div class="w-12 h-12 rounded-full ${this.getHistoryIconClass(evento.acao)} flex items-center justify-center shadow-sm">
                                <i class="${this.getHistoryIcon(evento.acao)} text-white text-lg"></i>
                            </div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between mb-2">
                                <p class="text-base font-semibold text-gray-900">
                                    ${this.getHistoryTitle(evento.acao, evento.autor)}
                                </p>
                                <div class="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                    <i class="fas fa-clock mr-1"></i>
                                    ${evento.createdAt ? this.formatDateTime(evento.createdAt) : 'Agora'}
                                </div>
                            </div>
                            ${evento.descricao ? `
                                <p class="text-sm text-gray-700 leading-relaxed mb-2">
                                    ${evento.descricao}
                                </p>
                            ` : ''}
                            ${evento.novaData ? `
                                <div class="mt-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                                    <div class="flex items-center mb-2">
                                        <i class="fas fa-calendar-alt text-blue-600 mr-2"></i>
                                        <span class="font-medium text-blue-900">Nova Data Proposta</span>
                                    </div>
                                    <div class="grid grid-cols-2 gap-4 text-sm">
                                        <div class="flex items-center">
                                            <i class="fas fa-calendar mr-2 text-blue-600"></i>
                                            <span class="font-medium text-blue-800">${this.formatDate(evento.novaData)}</span>
                                        </div>
                                        <div class="flex items-center">
                                            <i class="fas fa-clock mr-2 text-blue-600"></i>
                                            <span class="font-medium text-blue-800">${evento.novoHorario}</span>
                                        </div>
                                    </div>
                                </div>
                            ` : ''}
                            ${evento.autor ? `
                                <div class="mt-2 flex items-center text-xs text-gray-500">
                                    <i class="fas fa-user mr-1"></i>
                                    <span>Por: ${evento.autor}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            ${agendamento.status === 'reagendamento' ? `
                <div class="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg">
                    <div class="flex items-center mb-3">
                        <div class="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                            <i class="fas fa-hourglass-half text-white text-sm"></i>
                        </div>
                        <span class="font-semibold text-yellow-800">Aguardando resposta do fornecedor</span>
                    </div>
                    <p class="text-sm text-yellow-700 leading-relaxed">
                        O fornecedor foi notificado sobre a solicitação de reagendamento e deve responder em breve.
                    </p>
                </div>
            ` : ''}
        `;
    }

    getHistoryIconClass(acao) {
        const classes = {
            'agendamento_criado': 'bg-blue-500',
            'pendente': 'bg-yellow-500',
            'confirmado': 'bg-green-500',
            'agendado': 'bg-blue-600',
            'em-transito': 'bg-indigo-500',
            'entregue': 'bg-emerald-600',
            'reagendamento_fornecedor': 'bg-orange-500',
            'reagendamento_sugerido': 'bg-purple-500',
            'reagendamento_aceito': 'bg-green-600',
            'nao-veio': 'bg-red-500',
            'cd_sugeriu_reagendamento': 'bg-orange-600',
            'fornecedor_respondeu': 'bg-purple-600',
            'status_alterado': 'bg-indigo-600',
            'agendamento_confirmado': 'bg-green-500',
            'agendamento_entregue': 'bg-emerald-600',
            'agendamento_nao_veio': 'bg-red-500',
            'data_aceita': 'bg-green-600',
            'data_rejeitada': 'bg-red-600',
            'fornecedor_nao_compareceu': 'bg-red-500',
            'agendamento_cancelado': 'bg-gray-600'
        };
        return classes[acao] || 'bg-gray-500';
    }

    getHistoryIcon(acao) {
        const icons = {
            'agendamento_criado': 'fas fa-plus-circle',
            'pendente': 'fas fa-clock',
            'confirmado': 'fas fa-check-circle',
            'agendado': 'fas fa-calendar-check',
            'em-transito': 'fas fa-shipping-fast',
            'entregue': 'fas fa-truck-loading',
            'reagendamento_fornecedor': 'fas fa-calendar-times',
            'reagendamento_sugerido': 'fas fa-calendar-plus',
            'reagendamento_aceito': 'fas fa-handshake',
            'nao-veio': 'fas fa-user-times',
            'cd_sugeriu_reagendamento': 'fas fa-calendar-alt',
            'fornecedor_respondeu': 'fas fa-reply-all',
            'status_alterado': 'fas fa-edit',
            'agendamento_confirmado': 'fas fa-check-double',
            'agendamento_entregue': 'fas fa-truck',
            'agendamento_nao_veio': 'fas fa-user-slash',
            'data_aceita': 'fas fa-thumbs-up',
            'data_rejeitada': 'fas fa-thumbs-down',
            'fornecedor_nao_compareceu': 'fas fa-exclamation-triangle',
            'agendamento_cancelado': 'fas fa-ban'
        };
        return icons[acao] || 'fas fa-info-circle';
    }

    getHistoryTitle(acao, autor) {
        const titles = {
            'agendamento_criado': 'Agendamento Criado',
            'pendente': 'Status: Pendente',
            'confirmado': 'Status: Confirmado',
            'agendado': 'Status: Agendado',
            'em-transito': 'Em Trânsito',
            'entregue': 'Entrega Realizada',
            'reagendamento_fornecedor': 'Fornecedor Solicitou Reagendamento',
            'reagendamento_sugerido': 'Nova Data Sugerida',
            'reagendamento_aceito': 'Reagendamento Aceito',
            'nao-veio': 'Fornecedor Não Compareceu',
            'cd_sugeriu_reagendamento': 'CD Solicitou Reagendamento',
            'fornecedor_respondeu': 'Fornecedor Respondeu',
            'status_alterado': 'Status Alterado',
            'agendamento_confirmado': 'Agendamento Confirmado',
            'agendamento_entregue': 'Entrega Realizada',
            'agendamento_nao_veio': 'Ausência Registrada',
            'data_aceita': 'Nova Data Aceita',
            'data_rejeitada': 'Nova Data Rejeitada',
            'fornecedor_nao_compareceu': 'Ausência Registrada',
            'agendamento_cancelado': 'Agendamento Cancelado'
        };
        return titles[acao] || 'Evento do Sistema';
    }

    getDetailActionButtons(agendamento) {
        if (agendamento.status === 'pendente') {
            return `
                <button onclick="dashboard.updateAgendamentoStatus(${agendamento.id}, 'confirmado')" 
                    class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all font-medium text-sm">
                    <i class="fas fa-check mr-1"></i>Aceitar Data
                </button>
                <button onclick="dashboard.suggestNewDate(${agendamento.id})" 
                    class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all font-medium text-sm">
                    <i class="fas fa-calendar mr-1"></i>Sugerir Nova Data
                </button>
            `;
        } else if (agendamento.status === 'confirmado') {
            return `
                <button onclick="dashboard.updateAgendamentoStatus(${agendamento.id}, 'entregue')" 
                    class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all font-medium text-sm">
                    <i class="fas fa-truck mr-1"></i>Marcar Entregue
                </button>
                <button onclick="dashboard.updateAgendamentoStatus(${agendamento.id}, 'nao-veio')" 
                    class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all font-medium text-sm">
                    <i class="fas fa-times mr-1"></i>Não Veio
                </button>
            `;
        } else if (agendamento.status === 'reagendamento') {
            return `
                <div class="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                    <i class="fas fa-clock text-yellow-600 text-lg mb-1"></i>
                    <p class="text-yellow-800 font-medium text-sm">Aguardando resposta do fornecedor</p>
                    <p class="text-yellow-700 text-xs">Nova data foi sugerida e notificação enviada</p>
                </div>
            `;
        } else if (agendamento.status === 'nao-veio') {
            return `
                <button onclick="dashboard.suggestNewDate(${agendamento.id})" 
                    class="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-all font-medium text-sm">
                    <i class="fas fa-redo mr-1"></i>Reagendar
                </button>
                <button onclick="dashboard.cancelAgendamento(${agendamento.id})" 
                    class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all font-medium text-sm">
                    <i class="fas fa-ban mr-1"></i>Cancelar
                </button>
            `;
        } else if (agendamento.status === 'entregue') {
            return `
                <div class="w-full bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <i class="fas fa-check-circle text-green-600 text-lg mb-1"></i>
                    <p class="text-green-800 font-medium text-sm">Entrega realizada com sucesso</p>
                </div>
            `;
        }
        return `
            <div class="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                <i class="fas fa-info-circle text-gray-600 text-lg mb-1"></i>
                <p class="text-gray-700 text-sm">Nenhuma ação disponível para este status</p>
            </div>
        `;
    }

    closeDetailModal() {
        document.getElementById('detail-modal').classList.add('hidden');
        this.currentAgendamentoId = null;
    }

    async updateAgendamentoStatus(id, newStatus) {
        try {
            const token = sessionStorage.getItem('token');
            
            console.log('Atualizando status:', { id, newStatus, token: token ? 'presente' : 'ausente' });
            
            const response = await fetch(`/api/agendamentos/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            console.log('Response status:', response.status, response.statusText);
            
            if (response.ok) {
                const result = await response.json();
                console.log('Status atualizado com sucesso:', result);
                
                // Recarregar dados do dashboard
                await this.loadAgendamentos();
                
                // Fechar modal se estiver aberto
                this.closeDetailModal();
                
                // Mostrar notificação de sucesso
                this.showNotification(`Status atualizado para: ${this.getStatusText(newStatus)}`, 'success');
                
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Erro na resposta:', response.status, errorData);
                throw new Error(errorData.error || `Erro HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            this.showNotification(`Erro ao atualizar status: ${error.message}`, 'error');
        }
    }

    async cancelAgendamento(id) {
        const motivo = prompt('Digite o motivo do cancelamento (obrigatório):');
        
        if (!motivo || motivo.trim() === '') {
            this.showNotification('Motivo do cancelamento é obrigatório.', 'warning');
            return;
        }

        if (!confirm('Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
            
            const response = await fetch(`/api/agendamentos/${id}/cancelar`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ motivo: motivo.trim() })
            });

            if (response.ok) {
                await this.loadAgendamentos();
                this.closeDetailModal();
                this.showNotification('Agendamento cancelado com sucesso.', 'success');
            } else {
                throw new Error('Erro ao cancelar agendamento');
            }
        } catch (error) {
            console.error('Erro ao cancelar agendamento:', error);
            this.showNotification('Erro ao cancelar agendamento.', 'error');
        }
    }

    async suggestNewDate(id) {
        this.currentAgendamentoId = id;
        document.getElementById('suggest-date-form').reset();
        this.setMinDate();
        
        // Configurar data mínima como hoje
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('nova-data').min = today;
        document.getElementById('nova-data').value = today;
        
        // Carregar horários disponíveis para o CD logado
        await this.carregarHorariosDisponiveis();
        
        document.getElementById('suggest-date-modal').classList.remove('hidden');
    }
    
    // Função para carregar horários disponíveis do CD logado
    async carregarHorariosDisponiveis() {
        try {
            const novaData = document.getElementById('nova-data').value;
            const horarioSelect = document.getElementById('novo-horario');
            
            // Limpar opções existentes
            horarioSelect.innerHTML = '<option value="">Carregando horários...</option>';
            
            // Obter ID do CD logado
            let cdId = this.cdId;
            
            // Se não tiver o cdId na instância, tentar recuperar do sessionStorage
            if (!cdId) {
                console.log('this.cdId não encontrado, tentando recuperar de outras fontes');
                
                // Tentar obter do cdInfo
                const cdInfo = sessionStorage.getItem('cdInfo');
                if (cdInfo) {
                    try {
                        const cdInfoObj = JSON.parse(cdInfo);
                        cdId = cdInfoObj.id;
                        this.cdId = cdId; // Salvar na instância
                        console.log('CD ID recuperado do cdInfo:', cdId);
                    } catch (error) {
                        console.error('Erro ao parsear cdInfo:', error);
                    }
                }
                
                // Tentar obter do token
                if (!cdId) {
                    const token = sessionStorage.getItem('token');
                    if (token && token.includes('.')) {
                        try {
                            const payload = JSON.parse(atob(token.split('.')[1]));
                            cdId = payload.id;
                            this.cdId = cdId; // Salvar na instância
                            console.log('CD ID recuperado do token JWT:', cdId);
                        } catch (error) {
                            console.error('Erro ao decodificar token:', error);
                        }
                    }
                }
                
                // Tentar obter diretamente do sessionStorage
                if (!cdId) {
                    cdId = sessionStorage.getItem('cdId');
                    if (cdId) {
                        this.cdId = cdId; // Salvar na instância
                        console.log('CD ID recuperado diretamente do sessionStorage:', cdId);
                    }
                }
            }
            
            // Se ainda não tiver o cdId, usar um valor padrão ou avisar o usuário
            if (!cdId) {
                console.error('CD ID não encontrado em nenhuma fonte');
                
                // Usar horários padrão
                horarioSelect.innerHTML = '<option value="">Selecione o horário</option>';
                const horariosDefault = [
                    { valor: '08:00', label: '08:00' },
                    { valor: '09:00', label: '09:00' },
                    { valor: '10:00', label: '10:00' },
                    { valor: '11:00', label: '11:00' },
                    { valor: '13:00', label: '13:00' },
                    { valor: '14:00', label: '14:00' },
                    { valor: '15:00', label: '15:00' },
                    { valor: '16:00', label: '16:00' }
                ];
                
                horariosDefault.forEach(horario => {
                    const option = document.createElement('option');
                    option.value = horario.valor;
                    option.textContent = horario.label;
                    horarioSelect.appendChild(option);
                });
                
                return;
            }
            
            console.log('Carregando horários disponíveis para data:', novaData, 'CD ID:', cdId);
            
            // Chamar API para obter horários disponíveis
            const response = await fetch(`/api/horarios-disponiveis?date=${novaData}&cd=${cdId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Erro ao buscar horários: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Horários disponíveis recebidos:', data);
            
            // Limpar opções existentes novamente
            horarioSelect.innerHTML = '<option value="">Selecione o horário</option>';
            
            // Adicionar horários à lista
            if (data.horarios && Array.isArray(data.horarios)) {
                data.horarios.forEach(horario => {
                    const option = document.createElement('option');
                    option.value = horario.valor;
                    option.textContent = horario.label;
                    
                    // Desabilitar horários indisponíveis
                    if (horario.disponivel === false) {
                        option.disabled = true;
                        option.textContent += ` (${horario.motivo || 'Indisponível'})`;
                    }
                    
                    horarioSelect.appendChild(option);
                });
            } else {
                // Horários padrão caso a API não retorne dados
                const horariosDefault = [
                    { valor: '08:00', label: '08:00' },
                    { valor: '09:00', label: '09:00' },
                    { valor: '10:00', label: '10:00' },
                    { valor: '11:00', label: '11:00' },
                    { valor: '13:00', label: '13:00' },
                    { valor: '14:00', label: '14:00' },
                    { valor: '15:00', label: '15:00' },
                    { valor: '16:00', label: '16:00' }
                ];
                
                horariosDefault.forEach(horario => {
                    const option = document.createElement('option');
                    option.value = horario.valor;
                    option.textContent = horario.label;
                    horarioSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar horários disponíveis:', error);
            
            // Em caso de erro, carregar horários padrão
            const horarioSelect = document.getElementById('novo-horario');
            horarioSelect.innerHTML = '<option value="">Selecione o horário</option>';
            const horariosDefault = [
                { valor: '08:00', label: '08:00' },
                { valor: '09:00', label: '09:00' },
                { valor: '10:00', label: '10:00' },
                { valor: '11:00', label: '11:00' },
                { valor: '13:00', label: '13:00' },
                { valor: '14:00', label: '14:00' },
                { valor: '15:00', label: '15:00' },
                { valor: '16:00', label: '16:00' }
            ];
            
            horariosDefault.forEach(horario => {
                const option = document.createElement('option');
                option.value = horario.valor;
                option.textContent = horario.label;
                horarioSelect.appendChild(option);
            });
        }
    }

    closeSuggestDateModal() {
        document.getElementById('suggest-date-modal').classList.add('hidden');
        this.currentAgendamentoId = null;
    }

    async handleSuggestDate() {
        const novaData = document.getElementById('nova-data').value;
        const novoHorario = document.getElementById('novo-horario').value;
        const motivo = document.getElementById('motivo-reagendamento').value;

        if (!novaData || !novoHorario) {
            this.showNotification('Preencha todos os campos obrigatórios.', 'error');
            return;
        }

        try {
            console.log(`🔄 Sugerindo nova data para agendamento ${this.currentAgendamentoId}:`, {
                novaData,
                novoHorario,
                motivo
            });

            const token = sessionStorage.getItem('token');
            
            // Fazer chamada real para a API de reagendamento
            const response = await fetch(`/api/agendamentos/${this.currentAgendamentoId}/reagendar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    novaData: novaData,
                    novoHorario: novoHorario,
                    motivo: motivo
                })
            });

            console.log('📡 Response status:', response.status);
            const responseText = await response.text();
            console.log('📋 Response body:', responseText);

            if (response.ok) {
                console.log('✅ Reagendamento sugerido com sucesso');
                
                // Recarregar dados do dashboard para pegar os dados atualizados do banco
                await this.loadAgendamentos();
                
                this.closeSuggestDateModal();
                this.closeDetailModal();
                
                this.showNotification('Sugestão de nova data enviada ao fornecedor.', 'success');
            } else {
                let errorData;
                try {
                    errorData = JSON.parse(responseText);
                } catch {
                    errorData = { error: responseText };
                }
                console.error('❌ Erro na resposta:', errorData);
                throw new Error(errorData.error || 'Erro ao enviar sugestão');
            }
        } catch (error) {
            console.error('❌ Erro ao enviar sugestão:', error);
            this.showNotification('Erro ao enviar sugestão: ' + error.message, 'error');
        }
    }

    viewPDF(filename) {
        this.showNotification(`Abrindo arquivo: ${filename}`, 'info');
        // Em um sistema real, abriria o PDF em uma nova aba ou modal
    }

    // --- CONTROLES DE VISUALIZAÇÃO E FILTROS ---

    changeView(view) {
        this.currentView = view;
        
        document.getElementById('view-cards').className = view === 'cards' ? 
            'px-4 py-2 rounded-md bg-orange-primary text-white transition-all' :
            'px-4 py-2 rounded-md text-gray-600 hover:bg-white transition-all';
            
        document.getElementById('view-list').className = view === 'list' ? 
            'px-4 py-2 rounded-md bg-orange-primary text-white transition-all' :
            'px-4 py-2 rounded-md text-gray-600 hover:bg-white transition-all';
        
        document.getElementById('cards-view').classList.toggle('hidden', view !== 'cards');
        document.getElementById('list-view').classList.toggle('hidden', view !== 'list');
        
        this.renderAgendamentos();
    }

    applyFilters() {
        const statusFilter = document.getElementById('filter-status').value;
        const searchText = document.getElementById('search-input').value.toLowerCase();
        
        this.filteredAgendamentos = this.agendamentos.filter(agendamento => {
            const matchesStatus = !statusFilter || agendamento.status === statusFilter;
            const matchesSearch = !searchText || 
                agendamento.codigo.toLowerCase().includes(searchText) ||
                agendamento.fornecedor.nome.toLowerCase().includes(searchText) ||
                agendamento.fornecedor.email.toLowerCase().includes(searchText);
                
            return matchesStatus && matchesSearch;
        });
        
        // Resetar para primeira página quando aplicar filtros
        this.currentPage = 1;
        
        this.renderAgendamentos();
    }

    async exportData(format) {
        try {
            this.showNotification(`Exportando dados em formato ${format.toUpperCase()}...`, 'info');
            
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simular exportação
            
            const data = this.filteredAgendamentos.map(a => ({
                'Código': a.codigo,
                'Fornecedor': a.fornecedor.nome,
                'Email': a.fornecedor.email,
                'Telefone': a.fornecedor.telefone,
                'Data': this.formatDate(a.dataEntrega),
                'Horário': a.horarioEntrega,
                'Status': this.getStatusText(a.status),
                'Tipo de Carga': this.getTipoCargaText(a.tipoCarga),
                'Observações': a.observacoes || ''
            }));
            
            if (format === 'excel') {
                this.downloadCSV(data, 'agendamentos.csv');
            } else {
                this.showNotification('Funcionalidade de export PDF será implementada.', 'info');
            }
            
        } catch (error) {
            this.showNotification('Erro ao exportar dados.', 'error');
        }
    }

    downloadCSV(data, filename) {
        if (data.length === 0) {
            this.showNotification('Não há dados para exportar.', 'warning');
            return;
        }
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // BOM para Excel
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('Arquivo CSV baixado com sucesso!', 'success');
    }

    // --- CONTROLES DE ESTADO (LOADING, EMPTY) E NOTIFICAÇÕES ---

    showLoading(show) {
        const loadingState = document.getElementById('loading-state');
        const container = document.getElementById('agendamentos-container');
        
        if (show) {
            loadingState.classList.remove('hidden');
            container.classList.add('hidden');
        } else {
            loadingState.classList.add('hidden');
            container.classList.remove('hidden');
        }
    }

    showEmptyState() {
        document.getElementById('empty-state').classList.remove('hidden');
        document.getElementById('cards-view').classList.add('hidden');
        document.getElementById('list-view').classList.add('hidden');
    }

    hideEmptyState() {
        document.getElementById('empty-state').classList.add('hidden');
        if (this.filteredAgendamentos.length > 0) {
            document.getElementById('cards-view').classList.toggle('hidden', this.currentView !== 'cards');
            document.getElementById('list-view').classList.toggle('hidden', this.currentView !== 'list');
        } else {
            this.showEmptyState();
        }
    }
    
    showNotification(message, type = 'info') {
        const colors = {
            success: 'bg-green-500', error: 'bg-red-500',
            warning: 'bg-yellow-500', info: 'bg-blue-500'
        };
        const icons = {
            success: 'fa-check-circle', error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle', info: 'fa-info-circle'
        };
        
        const notification = document.createElement('div');
        notification.className = `notification ${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3`;
        notification.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" class="ml-4 hover:bg-white hover:bg-opacity-20 rounded p-1">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.getElementById('notification-container').appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 5000); // Notificação some após 5 segundos
    }

    // --- MODAL DE CONSULTA PÚBLICA ---

    async consultarAgendamento() {
        const codigo = document.getElementById('codigo-consulta').value.trim();
        
        if (!codigo) {
            this.showNotification('Digite o código do agendamento', 'error');
            return;
        }

        try {
            // Buscar agendamento pelos dados carregados do banco de dados
            const agendamento = this.agendamentos.find(a => a.codigo.toLowerCase() === codigo.toLowerCase());
            
            if (agendamento) {
                this.closeConsultaModal();
                this.showStatusModal(agendamento);
            } else {
                this.showNotification('Agendamento não encontrado', 'error');
            }
        } catch (error) {
            console.error('Erro ao consultar agendamento:', error);
            this.showNotification('Erro ao consultar agendamento', 'error');
        }
    }

    showStatusModal(agendamento) {
        const statusContent = document.getElementById('status-content');
        const statusClass = this.getStatusClass(agendamento.status);
        const statusIcon = this.getStatusIcon(agendamento.status);
        const statusText = this.getStatusText(agendamento.status);
    
        statusContent.innerHTML = `
            <div class="space-y-6">
                <div class="bg-gradient-to-r from-orange-primary to-orange-secondary rounded-xl p-6 text-white text-center">
                    <h3 class="text-2xl font-bold mb-2">Status do Agendamento</h3>
                    <p class="text-lg"><strong>Código:</strong> ${agendamento.codigo}</p>
                </div>
                <div class="text-center">
                    <span class="px-4 py-2 rounded-full text-white text-lg font-semibold ${statusClass}">
                        <i class="${statusIcon} mr-2"></i>${statusText}
                    </span>
                </div>
                <div class="bg-gray-50 rounded-lg p-6 space-y-3">
                    <p><strong>Fornecedor:</strong> ${agendamento.fornecedor.nome}</p>
                    <p><strong>Data Programada:</strong> ${this.formatDate(agendamento.dataEntrega)}</p>
                    <p><strong>Horário:</strong> ${agendamento.horarioEntrega}</p>
                </div>
            </div>
        `;
        
        document.getElementById('status-modal').classList.remove('hidden');
    }

    // --- MÉTODOS PARA CONTROLE DE MODAL (ENCAPSULADOS) ---

    openConsultaModal() {
        document.getElementById('consulta-modal').classList.remove('hidden');
        document.getElementById('codigo-consulta').focus();
    }

    closeConsultaModal() {
        document.getElementById('consulta-modal').classList.add('hidden');
        document.getElementById('codigo-consulta').value = '';
    }

    closeStatusModal() {
        document.getElementById('status-modal').classList.add('hidden');
    }
}

// --- FIM DA CLASSE ---

// --- INICIALIZAÇÃO E FUNÇÕES GLOBAIS ---

let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new CDDashboard();
});

// Funções globais que delegam para a instância do dashboard
function refreshData() {
    dashboard.loadAgendamentos();
}

function changeView(view) {
    dashboard.changeView(view);
}

function applyFilters() {
    dashboard.applyFilters();
}

function exportData(format) {
    dashboard.exportData(format);
}

function showAllStatus(status) {
    dashboard.showAllStatus(status);
}

function showTodayDeliveries() {
    dashboard.showTodayDeliveries();
}

function closeAllStatusModal() {
    dashboard.closeAllStatusModal();
}

function closeTodayDeliveriesModal() {
    dashboard.closeTodayDeliveriesModal();
}

function openConsultaModal() {
    dashboard.openConsultaModal();
}

function closeConsultaModal() {
    dashboard.closeConsultaModal();
}

function closeStatusModal() {
    dashboard.closeStatusModal();
}

function closeDetailModal() {
    dashboard.closeDetailModal();
}

function closeSuggestDateModal() {
    dashboard.closeSuggestDateModal();
}

function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        sessionStorage.clear();
        localStorage.removeItem('rememberedUser');
        window.location.href = 'login.html';
    }
}

// Registrar funções globais no objeto window para acesso a partir do HTML
window.openDashboardKPIModal = openDashboardKPIModal;
window.closeDashboardKPIModal = closeDashboardKPIModal;
window.aplicarFiltroPeriodoKPI = aplicarFiltroPeriodoKPI;
window.exportarDadosKPI = exportarDadosKPI;
window.imprimirRelatorioKPI = imprimirRelatorioKPI;
window.carregarDadosKPI = carregarDadosKPI;
window.refreshData = refreshData;
window.logout = logout;
window.changeView = changeView;
window.applyFilters = applyFilters;
window.exportData = exportData;
window.showAllStatus = showAllStatus;
window.showTodayDeliveries = showTodayDeliveries;
window.closeAllStatusModal = closeAllStatusModal;
window.closeTodayDeliveriesModal = closeTodayDeliveriesModal;
window.openConsultaModal = openConsultaModal;
window.closeConsultaModal = closeConsultaModal;
window.closeStatusModal = closeStatusModal;
window.closeDetailModal = closeDetailModal;
window.closeSuggestDateModal = closeSuggestDateModal;

// ============================================================================
// FUNÇÕES DE BLOQUEIO DE HORÁRIO
// ============================================================================

function openBloqueioModal() {
    const modal = document.getElementById('bloqueio-modal');
    modal.classList.remove('hidden');
    
    // Configurar data mínima (amanhã)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    document.getElementById('data-bloqueio').min = tomorrowStr;
    document.getElementById('data-bloqueio').value = tomorrowStr;
    
    // Reset do formulário
    document.getElementById('bloqueio-form').reset();
    document.getElementById('data-bloqueio').value = tomorrowStr;
    
    // Event listeners
    setupBloqueioEventListeners();
}

function closeBloqueioModal() {
    const modal = document.getElementById('bloqueio-modal');
    modal.classList.add('hidden');
    
    // Limpar formulário
    document.getElementById('bloqueio-form').reset();
    document.getElementById('motivo-outros').classList.add('hidden');
    document.getElementById('preview-bloqueio').innerHTML = '<p>Selecione os dados acima para ver a prévia</p>';
}

function setupBloqueioEventListeners() {
    const form = document.getElementById('bloqueio-form');
    const motivoSelect = document.getElementById('motivo-bloqueio');
    const motivoOutros = document.getElementById('motivo-outros');
    
    // Mostrar/ocultar campo "outros"
    motivoSelect.addEventListener('change', (e) => {
        if (e.target.value === 'outros') {
            motivoOutros.classList.remove('hidden');
        } else {
            motivoOutros.classList.add('hidden');
        }
        updateBloqueioPreview();
    });
    
    // Atualizar preview quando campos mudarem
    const previewFields = ['data-bloqueio', 'hora-inicio', 'hora-fim', 'motivo-bloqueio', 'motivo-custom'];
    previewFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('change', updateBloqueioPreview);
            field.addEventListener('input', updateBloqueioPreview);
        }
    });
    
    // Validação de horários
    document.getElementById('hora-inicio').addEventListener('change', validateHorarios);
    document.getElementById('hora-fim').addEventListener('change', validateHorarios);
    
    // Submit do formulário
    form.addEventListener('submit', handleBloqueioSubmit);
}

function updateBloqueioPreview() {
    const data = document.getElementById('data-bloqueio').value;
    const horaInicio = document.getElementById('hora-inicio').value;
    const horaFim = document.getElementById('hora-fim').value;
    const motivo = document.getElementById('motivo-bloqueio').value;
    const motivoCustom = document.getElementById('motivo-custom').value;
    
    const preview = document.getElementById('preview-bloqueio');
    
    if (!data || !horaInicio || !horaFim || !motivo) {
        preview.innerHTML = '<p class="text-gray-500">Selecione os dados acima para ver a prévia</p>';
        return;
    }
    
    const dataFormatada = new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
    const motivoTexto = motivo === 'outros' ? motivoCustom : 
                       document.querySelector(`#motivo-bloqueio option[value="${motivo}"]`).textContent;
    
    preview.innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded-lg p-3">
            <h5 class="font-semibold text-red-800 mb-2">
                <i class="fas fa-ban mr-2"></i>Bloqueio Programado
            </h5>
            <div class="text-red-700 space-y-1">
                <p><strong>Data:</strong> ${dataFormatada}</p>
                <p><strong>Período:</strong> ${horaInicio} às ${horaFim}</p>
                <p><strong>Motivo:</strong> ${motivoTexto}</p>
            </div>
            <div class="mt-2 text-sm text-red-600">
                <i class="fas fa-exclamation-triangle mr-1"></i>
                Nenhum agendamento será permitido neste período.
            </div>
        </div>
    `;
}

function validateHorarios() {
    const horaInicio = document.getElementById('hora-inicio').value;
    const horaFim = document.getElementById('hora-fim').value;
    
    if (horaInicio && horaFim) {
        const inicio = parseInt(horaInicio.replace(':', ''));
        const fim = parseInt(horaFim.replace(':', ''));
        
        if (fim <= inicio) {
            dashboard.showNotification('O horário de fim deve ser posterior ao horário de início', 'error');
            document.getElementById('hora-fim').value = '';
        }
    }
}

async function handleBloqueioSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        dataBloqueio: formData.get('dataBloqueio'),
        horaInicio: formData.get('horaInicio'),
        horaFim: formData.get('horaFim'),
        motivo: formData.get('motivoBloqueio') === 'outros' ? formData.get('motivoCustom') : formData.get('motivoBloqueio')
    };
    
    // Validações
    if (!data.dataBloqueio || !data.horaInicio || !data.horaFim || !data.motivo) {
        dashboard.showNotification('Todos os campos são obrigatórios', 'error');
        return;
    }
    
    const hoje = new Date();
    const dataBloqueio = new Date(data.dataBloqueio + 'T00:00:00');
    
    if (dataBloqueio <= hoje) {
        dashboard.showNotification('A data do bloqueio deve ser futura', 'error');
        return;
    }
    
    // Verificar se é dia útil
    if (dataBloqueio.getDay() === 0 || dataBloqueio.getDay() === 6) {
        dashboard.showNotification('Bloqueios só podem ser feitos em dias úteis', 'error');
        return;
    }
    
    try {
        dashboard.showLoading(true);
        
        const token = sessionStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/bloqueios-horario', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            dashboard.showNotification('Bloqueio de horário criado com sucesso!', 'success');
            closeBloqueioModal();
            dashboard.loadAgendamentos(); // Recarregar dados
        } else {
            dashboard.showNotification(result.error || 'Erro ao criar bloqueio', 'error');
        }
        
    } catch (error) {
        console.error('Erro ao criar bloqueio:', error);
        dashboard.showNotification('Erro ao criar bloqueio de horário', 'error');
    } finally {
        dashboard.showLoading(false);
    }
}

// ============================================================================
// FUNÇÕES DE GERENCIAMENTO DE BLOQUEIOS
// ============================================================================

function openGerenciarBloqueiosModal() {
    const modal = document.getElementById('gerenciar-bloqueios-modal');
    
    if (!modal) {
        console.error('Modal gerenciar-bloqueios-modal não encontrado no DOM');
        dashboard.showNotification('Erro ao abrir modal de bloqueios', 'error');
        return;
    }
    
    modal.classList.remove('hidden');
    
    // Configurar filtros padrão
    const hoje = new Date();
    const proximoMes = new Date();
    proximoMes.setMonth(proximoMes.getMonth() + 1);
    
    const filtroDataInicio = document.getElementById('filtro-data-inicio');
    const filtroDataFim = document.getElementById('filtro-data-fim');
    
    if (filtroDataInicio) {
        filtroDataInicio.value = hoje.toISOString().split('T')[0];
    }
    
    if (filtroDataFim) {
        filtroDataFim.value = proximoMes.toISOString().split('T')[0];
    }
    
    // Verificar se o token está presente antes de carregar
    if (!sessionStorage.getItem('token')) {
        const emptyEl = document.getElementById('bloqueios-empty');
        if (emptyEl) emptyEl.classList.remove('hidden');
        
        dashboard.showNotification('Sessão expirada. Faça login novamente.', 'error');
        
        setTimeout(() => {
            sessionStorage.clear();
            window.location.href = 'login.html';
        }, 2000);
        
        return;
    }
    
    // Carregar dados
    carregarBloqueios();
}

function closeGerenciarBloqueiosModal() {
    const modal = document.getElementById('gerenciar-bloqueios-modal');
    modal.classList.add('hidden');
}

function openEditarBloqueioModal(bloqueio) {
    const modal = document.getElementById('editar-bloqueio-modal');
    modal.classList.remove('hidden');
    
    // Preencher formulário com ID
    document.getElementById('edit-bloqueio-id').value = bloqueio.id;
    
    // Tratamento da data do bloqueio (agora usando dataInicio)
    let dataValue = '';
    if (bloqueio.dataInicio) {
        // Verificar formato da data e converter para formato de data ISO (YYYY-MM-DD)
        if (bloqueio.dataInicio.includes('T')) {
            dataValue = bloqueio.dataInicio.split('T')[0];
        } else if (bloqueio.dataInicio.includes('/')) {
            // Converter formato DD/MM/YYYY para YYYY-MM-DD
            const parts = bloqueio.dataInicio.split('/');
            if (parts.length === 3) {
                dataValue = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        } else {
            // Assumir que já está no formato correto YYYY-MM-DD
            dataValue = bloqueio.dataInicio;
        }
    }
    document.getElementById('edit-data-bloqueio').value = dataValue;
    
    // Preencher horários (com valores padrão se não existirem)
    // Usando horarioInicio e horarioFim em vez de horaInicio e horaFim
    document.getElementById('edit-hora-inicio').value = bloqueio.horarioInicio || '';
    document.getElementById('edit-hora-fim').value = bloqueio.horarioFim || '';
    
    // Verificar se é um motivo predefinido ou customizado
    const motivoSelect = document.getElementById('edit-motivo-bloqueio');
    const motivoCustomDiv = document.getElementById('edit-motivo-outros');
    const motivoCustomInput = document.getElementById('edit-motivo-custom');
    
    const motivosPredefinidos = [
        'Manutenção Preventiva',
        'Inventário', 
        'Feriado Local',
        'Treinamento da Equipe',
        'Sobrecarga de Demanda'
    ];
    
    if (motivosPredefinidos.includes(bloqueio.motivo)) {
        motivoSelect.value = bloqueio.motivo;
        motivoCustomDiv.classList.add('hidden');
        motivoCustomInput.value = '';
    } else {
        motivoSelect.value = 'outros';
        motivoCustomDiv.classList.remove('hidden');
        motivoCustomInput.value = bloqueio.motivo;
    }
    
    // Event listener para mostrar/ocultar campo outros
    motivoSelect.addEventListener('change', (e) => {
        if (e.target.value === 'outros') {
            motivoCustomDiv.classList.remove('hidden');
        } else {
            motivoCustomDiv.classList.add('hidden');
            motivoCustomInput.value = '';
        }
    });
    
    // Event listener para submit
    document.getElementById('editar-bloqueio-form').onsubmit = handleEditarBloqueio;
}

function closeEditarBloqueioModal() {
    const modal = document.getElementById('editar-bloqueio-modal');
    modal.classList.add('hidden');
}

async function carregarBloqueios() {
    const loadingEl = document.getElementById('bloqueios-loading');
    const listaEl = document.getElementById('bloqueios-lista');
    const emptyEl = document.getElementById('bloqueios-empty');
    
    try {
        loadingEl.classList.remove('hidden');
        listaEl.innerHTML = '';
        emptyEl.classList.add('hidden');
        
        // Verificar se o token está presente
        const token = sessionStorage.getItem('token');
        if (!token) {
            throw new Error('Token de autenticação não encontrado');
        }
        
        console.log('Fazendo requisição para carregar bloqueios...');
        const response = await fetch('http://localhost:3000/api/bloqueios-horario', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        // Verificar resposta com detalhes
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Resposta não-OK:', response.status, errorText);
            throw new Error(`Erro ao carregar bloqueios: ${response.status} - ${errorText || response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Bloqueios carregados:', result);
        
        const bloqueios = result.success ? (result.data || []) : [];
        
        // Atualizar estatísticas
        atualizarEstatisticasBloqueios(bloqueios);
        
        // Aplicar filtros
        const bloqueiosFiltrados = aplicarFiltrosBloqueios(bloqueios);
        
        if (bloqueiosFiltrados.length === 0) {
            emptyEl.classList.remove('hidden');
        } else {
            renderizarListaBloqueios(bloqueiosFiltrados);
        }
        
    } catch (error) {
        console.error('Erro ao carregar bloqueios:', error);
        
        // Mensagem de erro mais detalhada
        let errorMessage = 'Erro ao carregar bloqueios';
        if (error.message) {
            errorMessage += `: ${error.message}`;
        }
        
        dashboard.showNotification(errorMessage, 'error');
        
        // Se for erro de autenticação, redirecionar para login
        if (error.message && (
            error.message.includes('401') || 
            error.message.includes('403') || 
            error.message.includes('Token') ||
            error.message.includes('autenticação')
        )) {
            setTimeout(() => {
                sessionStorage.clear();
                window.location.href = 'login.html';
            }, 2000);
        }
        
        emptyEl.classList.remove('hidden');
    } finally {
        loadingEl.classList.add('hidden');
    }
}

function atualizarEstatisticasBloqueios(bloqueios) {
    const hoje = new Date();
    const proximaSemana = new Date();
    proximaSemana.setDate(proximaSemana.getDate() + 7);
    
    const ativos = bloqueios.filter(b => {
        // Usar dataInicio em vez de dataBloqueio
        const data = parseDataBloqueio(b.dataInicio);
        return data && data >= hoje;
    }).length;
    
    const proximos = bloqueios.filter(b => {
        // Usar dataInicio em vez de dataBloqueio
        const data = parseDataBloqueio(b.dataInicio);
        return data && data >= hoje && data <= proximaSemana;
    }).length;
    
    document.getElementById('stat-ativos').textContent = ativos;
    document.getElementById('stat-proximos').textContent = proximos;
    document.getElementById('stat-total').textContent = bloqueios.length;
}

// Função auxiliar para analisar datas de bloqueio em vários formatos
function parseDataBloqueio(dataStr) {
    if (!dataStr) return null;
    
    // Se a data já estiver no formato ISO completo
    if (dataStr.includes('T')) {
        const data = new Date(dataStr);
        return isNaN(data.getTime()) ? null : data;
    }
    
    // Se a data estiver em formato brasileiro (DD/MM/YYYY)
    if (dataStr.includes('/')) {
        const parts = dataStr.split('/');
        if (parts.length === 3) {
            // Formato brasileiro: dia/mês/ano
            const data = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            return isNaN(data.getTime()) ? null : data;
        }
    }
    
    // Tentar formato ISO simples (YYYY-MM-DD)
    if (dataStr.includes('-')) {
        const data = new Date(`${dataStr}T00:00:00`);
        return isNaN(data.getTime()) ? null : data;
    }
    
    // Última tentativa: analisar como timestamp numérico
    const timestamp = parseInt(dataStr);
    if (!isNaN(timestamp)) {
        const data = new Date(timestamp);
        return isNaN(data.getTime()) ? null : data;
    }
    
    return null; // Não foi possível analisar a data
}

function aplicarFiltrosBloqueios(bloqueios) {
    const dataInicio = document.getElementById('filtro-data-inicio').value;
    const dataFim = document.getElementById('filtro-data-fim').value;
    const status = document.getElementById('filtro-status').value;
    
    return bloqueios.filter(bloqueio => {
        // Usar dataInicio em vez de dataBloqueio
        const dataBloqueio = parseDataBloqueio(bloqueio.dataInicio);
        
        // Se não conseguirmos analisar a data, não filtramos este item
        if (!dataBloqueio) return true;
        
        const hoje = new Date();
        
        // Filtro por data
        if (dataInicio) {
            const dataInicioObj = new Date(`${dataInicio}T00:00:00`);
            if (!isNaN(dataInicioObj.getTime()) && dataBloqueio < dataInicioObj) return false;
        }
        
        if (dataFim) {
            const dataFimObj = new Date(`${dataFim}T23:59:59`);
            if (!isNaN(dataFimObj.getTime()) && dataBloqueio > dataFimObj) return false;
        }
        
        // Filtro por status
        if (status === 'ativo' && dataBloqueio < hoje) return false;
        if (status === 'expirado' && dataBloqueio >= hoje) return false;
        
        return true;
    });
}

function renderizarListaBloqueios(bloqueios) {
    const listaEl = document.getElementById('bloqueios-lista');
    const hoje = new Date();
    
    listaEl.innerHTML = bloqueios.map(bloqueio => {
        // Garantir que temos uma data válida, convertendo para formato ISO se necessário
        // Usar dataInicio em vez de dataBloqueio
        let dataInicioStr = bloqueio.dataInicio;
        if (dataInicioStr && !dataInicioStr.includes('T')) {
            dataInicioStr = `${dataInicioStr}T00:00:00`;
        }
        
        const dataInicio = new Date(dataInicioStr);
        const isValidDate = !isNaN(dataInicio.getTime());
        
        const isExpirado = isValidDate && dataInicio < hoje;
        const isProximo = isValidDate && !isExpirado && dataInicio <= new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        let statusClass = 'bg-green-100 text-green-800';
        let statusIcon = 'fa-check-circle';
        let statusText = 'Ativo';
        
        if (isExpirado) {
            statusClass = 'bg-gray-100 text-gray-800';
            statusIcon = 'fa-history';
            statusText = 'Expirado';
        } else if (isProximo) {
            statusClass = 'bg-yellow-100 text-yellow-800';
            statusIcon = 'fa-clock';
            statusText = 'Próximo';
        }
        
        // Formatar data para exibição
        const dataFormatada = isValidDate 
            ? dataInicio.toLocaleDateString('pt-BR')
            : 'Data Inválida';
        
        // Garantir que temos horários válidos
        // Usar horarioInicio/horarioFim em vez de horaInicio/horaFim
        const horarioInicio = bloqueio.horarioInicio || 'Não definido';
        const horarioFim = bloqueio.horarioFim || 'Não definido';
        
        // Formatar data de criação
        let dataCreatedAt = 'Não definida';
        if (bloqueio.createdAt) {
            const createdAtDate = new Date(bloqueio.createdAt);
            if (!isNaN(createdAtDate.getTime())) {
                dataCreatedAt = createdAtDate.toLocaleDateString('pt-BR');
            }
        }
        
        return `
            <div class="p-6 hover:bg-gray-50 transition-colors">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="flex items-center space-x-4 mb-3">
                            <div class="flex items-center space-x-2">
                                <div class="w-3 h-3 rounded-full ${isExpirado ? 'bg-gray-400' : isProximo ? 'bg-yellow-400' : 'bg-green-400'}"></div>
                                <span class="font-semibold text-gray-900">
                                    ${dataFormatada}
                                </span>
                            </div>
                            <span class="px-2 py-1 rounded-full text-xs font-medium ${statusClass}">
                                <i class="fas ${statusIcon} mr-1"></i>
                                ${statusText}
                            </span>
                        </div>
                        
                        <div class="grid md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <span class="text-gray-500">Período:</span>
                                <span class="font-medium text-gray-900 ml-1">
                                    ${horarioInicio} às ${horarioFim}
                                </span>
                            </div>
                            <div>
                                <span class="text-gray-500">Motivo:</span>
                                <span class="font-medium text-gray-900 ml-1">${bloqueio.motivo || 'Não especificado'}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">Criado:</span>
                                <span class="font-medium text-gray-900 ml-1">
                                    ${dataCreatedAt}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex items-center space-x-2 ml-6">
                        ${!isExpirado ? `
                            <button onclick="editarBloqueio(${JSON.stringify(bloqueio).replace(/"/g, '&quot;')})" 
                                class="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition-all" 
                                title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                        ` : ''}
                        
                        <button onclick="excluirBloqueio(${bloqueio.id}, '${dataFormatada}')" 
                            class="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-all" 
                            title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function filtrarBloqueios() {
    carregarBloqueios();
}

function editarBloqueio(bloqueio) {
    openEditarBloqueioModal(bloqueio);
}

async function handleEditarBloqueio(e) {
    e.preventDefault();
    
    const id = document.getElementById('edit-bloqueio-id').value;
    const dataBloqueio = document.getElementById('edit-data-bloqueio').value;
    const horaInicio = document.getElementById('edit-hora-inicio').value;
    const horaFim = document.getElementById('edit-hora-fim').value;
    
    // Determinar motivo (dropdown ou custom)
    const motivoSelect = document.getElementById('edit-motivo-bloqueio').value;
    const motivoCustom = document.getElementById('edit-motivo-custom').value;
    const motivo = motivoSelect === 'outros' ? motivoCustom : motivoSelect;
    
    if (!motivo.trim()) {
        dashboard.showNotification('Por favor, informe o motivo do bloqueio', 'error');
        return;
    }
    
    // Usar os novos nomes de campos do modelo BloqueioHorario atualizado
    const data = {
        dataBloqueio, // No backend, será mapeado para dataInicio e dataFim
        horaInicio,   // No backend, será mapeado para horarioInicio
        horaFim,      // No backend, será mapeado para horarioFim
        motivo: motivo.trim()
    };
    
    try {
        dashboard.showLoading(true);
        
        const token = sessionStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/bloqueios-horario/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            dashboard.showNotification('Bloqueio atualizado com sucesso!', 'success');
            closeEditarBloqueioModal();
            carregarBloqueios();
        } else {
            dashboard.showNotification(result.error || 'Erro ao atualizar bloqueio', 'error');
        }
        
    } catch (error) {
        console.error('Erro ao atualizar bloqueio:', error);
        dashboard.showNotification('Erro ao atualizar bloqueio', 'error');
    } finally {
        dashboard.showLoading(false);
    }
}

async function excluirBloqueio(id, dataFormatada) {
    if (!confirm(`Tem certeza que deseja excluir o bloqueio do dia ${dataFormatada}?`)) {
        return;
    }
    
    try {
        dashboard.showLoading(true);
        
        const token = sessionStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/bloqueios-horario/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            dashboard.showNotification('Bloqueio excluído com sucesso!', 'success');
            carregarBloqueios();
        } else {
            dashboard.showNotification(result.error || 'Erro ao excluir bloqueio', 'error');
        }
        
    } catch (error) {
        console.error('Erro ao excluir bloqueio:', error);
        dashboard.showNotification('Erro ao excluir bloqueio', 'error');
    } finally {
        dashboard.showLoading(false);
    }
}

// ========================================
// SISTEMA DE REGISTRAR ENTREGA
// ========================================

let entregaCurrentStep = 1;
let entregaPedidos = [];
let entregaCurrentPedido = 0;

function openRegistrarEntregaModal() {
    const modal = document.getElementById('registrar-entrega-modal');
    modal.classList.remove('hidden');
    
    // Reset do formulário
    entregaCurrentStep = 1;
    entregaPedidos = [];
    entregaCurrentPedido = 0;
    
    // Mostrar apenas o primeiro step
    mostrarStepEntrega(1);
    
    // Definir data atual como padrão
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('entrega-data').value = today;
    
    // Configurar máscaras
    configurarMascarasEntrega();
    
    // Event listener para submit
    document.getElementById('registrar-entrega-form').onsubmit = handleRegistrarEntrega;
}

function closeRegistrarEntregaModal() {
    const modal = document.getElementById('registrar-entrega-modal');
    modal.classList.add('hidden');
    
    // Limpar formulário
    document.getElementById('registrar-entrega-form').reset();
    entregaPedidos = [];
    entregaCurrentPedido = 0;
    entregaCurrentStep = 1;
    
    // Limpar container de pedidos
    document.getElementById('entrega-pedidos-container').innerHTML = '';
    document.getElementById('entrega-pedidos-tabs').innerHTML = '';
}

function configurarMascarasEntrega() {
    // Configurar máscara para CNPJ
    const cnpjInput = document.getElementById('entrega-cnpj-fornecedor');
    cnpjInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 14) {
            value = value.replace(/(\d{2})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1/$2');
            value = value.replace(/(\d{4})(\d)/, '$1-$2');
        }
        e.target.value = value;
    });
    
    // Configurar máscara para telefone
    const telefoneInput = document.getElementById('entrega-telefone-fornecedor');
    telefoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 11) {
            value = value.replace(/(\d{2})(\d)/, '($1) $2');
            value = value.replace(/(\d{5})(\d)/, '$1-$2');
        }
        e.target.value = value;
    });
}

function mostrarStepEntrega(step) {
    // Esconder todos os steps
    document.querySelectorAll('.entrega-form-step').forEach(el => el.classList.add('hidden'));
    
    // Mostrar step atual
    document.getElementById(`entrega-form-step-${step}`).classList.remove('hidden');
    
    // Atualizar indicadores visuais
    document.querySelectorAll('.step-entrega').forEach((el, index) => {
        if (index + 1 < step) {
            el.className = 'step-entrega flex items-center justify-center w-10 h-10 rounded-full bg-green-500 text-white font-bold';
        } else if (index + 1 === step) {
            el.className = 'step-entrega flex items-center justify-center w-10 h-10 rounded-full bg-orange-500 text-white font-bold';
        } else {
            el.className = 'step-entrega flex items-center justify-center w-10 h-10 rounded-full bg-orange-200 text-orange-600 font-bold';
        }
    });
    
    // Gerenciar botões
    const btnAnterior = document.getElementById('entrega-btn-anterior');
    const btnProximo = document.getElementById('entrega-btn-proximo');
    const btnFinalizar = document.getElementById('entrega-btn-finalizar');
    
    if (step === 1) {
        btnAnterior.classList.add('hidden');
        btnProximo.classList.remove('hidden');
        btnFinalizar.classList.add('hidden');
    } else if (step === 3) {
        btnAnterior.classList.remove('hidden');
        btnProximo.classList.add('hidden');
        btnFinalizar.classList.remove('hidden');
    } else {
        btnAnterior.classList.remove('hidden');
        btnProximo.classList.remove('hidden');
        btnFinalizar.classList.add('hidden');
    }
    
    entregaCurrentStep = step;
    
    // Se for step 3, gerar resumo
    if (step === 3) {
        gerarResumoEntrega();
    }
}

function entregaAnteriorStep() {
    if (entregaCurrentStep > 1) {
        mostrarStepEntrega(entregaCurrentStep - 1);
    }
}

function entregaProximoStep() {
    if (validarStepEntrega(entregaCurrentStep)) {
        if (entregaCurrentStep < 3) {
            mostrarStepEntrega(entregaCurrentStep + 1);
            
            // Se for step 2 e não há pedidos, adicionar o primeiro
            if (entregaCurrentStep === 2 && entregaPedidos.length === 0) {
                adicionarPedidoEntrega();
            }
        }
    }
}

function validarStepEntrega(step) {
    if (step === 1) {
        const campos = [
            'entrega-data',
            'entrega-horario', 
            'entrega-nome-fornecedor',
            'entrega-cnpj-fornecedor',
            'entrega-email-fornecedor',
            'entrega-telefone-fornecedor',
            'entrega-tipo-carga'
        ];
        
        for (const campo of campos) {
            const elemento = document.getElementById(campo);
            if (!elemento.value.trim()) {
                dashboard.showNotification(`Por favor, preencha o campo: ${elemento.previousElementSibling.textContent}`, 'error');
                elemento.focus();
                return false;
            }
        }
        
        // Validar CNPJ
        const cnpj = document.getElementById('entrega-cnpj-fornecedor').value.replace(/\D/g, '');
        if (cnpj.length !== 14) {
            dashboard.showNotification('CNPJ deve ter 14 dígitos', 'error');
            return false;
        }
        
        // Validar telefone
        const telefone = document.getElementById('entrega-telefone-fornecedor').value.replace(/\D/g, '');
        if (telefone.length < 10) {
            dashboard.showNotification('Telefone deve ter pelo menos 10 dígitos', 'error');
            return false;
        }
        
        return true;
    } else if (step === 2) {
        if (entregaPedidos.length === 0) {
            dashboard.showNotification('Adicione pelo menos um pedido', 'error');
            return false;
        }
        
        // Validar cada pedido
        for (const pedido of entregaPedidos) {
            if (!pedido.numero.trim()) {
                dashboard.showNotification('Número do pedido é obrigatório', 'error');
                return false;
            }
            if (pedido.notasFiscais.length === 0) {
                dashboard.showNotification(`Adicione pelo menos uma nota fiscal para o pedido ${pedido.numero}`, 'error');
                return false;
            }
        }
        
        return true;
    }
    
    return true;
}

function adicionarPedidoEntrega() {
    const numeroPedido = entregaPedidos.length + 1;
    const pedido = {
        numero: '',
        notasFiscais: []
    };
    
    entregaPedidos.push(pedido);
    entregaCurrentPedido = entregaPedidos.length - 1;
    
    criarTabPedidoEntrega(entregaCurrentPedido);
    criarFormularioPedidoEntrega(entregaCurrentPedido);
    selecionarTabPedidoEntrega(entregaCurrentPedido);
}

function criarTabPedidoEntrega(index) {
    const tabsContainer = document.getElementById('entrega-pedidos-tabs');
    
    const tab = document.createElement('div');
    tab.className = 'tab-pedido-entrega px-4 py-2 rounded-lg cursor-pointer transition-colors bg-gray-200 text-gray-600';
    tab.dataset.index = index;
    tab.innerHTML = `
        <span>Pedido ${index + 1}</span>
        ${index > 0 ? '<button onclick="removerPedidoEntrega(' + index + ')" class="ml-2 text-red-500 hover:text-red-700"><i class="fas fa-times"></i></button>' : ''}
    `;
    
    tab.addEventListener('click', () => selecionarTabPedidoEntrega(index));
    tabsContainer.appendChild(tab);
}

function selecionarTabPedidoEntrega(index) {
    entregaCurrentPedido = index;
    
    // Atualizar appearance das tabs
    document.querySelectorAll('.tab-pedido-entrega').forEach((tab, i) => {
        if (i === index) {
            tab.className = 'tab-pedido-entrega px-4 py-2 rounded-lg cursor-pointer transition-colors bg-orange-500 text-white';
        } else {
            tab.className = 'tab-pedido-entrega px-4 py-2 rounded-lg cursor-pointer transition-colors bg-gray-200 text-gray-600';
        }
    });
    
    // Mostrar formulário do pedido
    document.querySelectorAll('.pedido-entrega-form').forEach((form, i) => {
        if (i === index) {
            form.classList.remove('hidden');
        } else {
            form.classList.add('hidden');
        }
    });
}

function criarFormularioPedidoEntrega(index) {
    const container = document.getElementById('entrega-pedidos-container');
    
    const formHtml = `
        <div class="pedido-entrega-form bg-white border border-gray-200 rounded-lg p-6 ${index > 0 ? 'hidden' : ''}" data-index="${index}">
            <div class="mb-6">
                <label class="block text-gray-dark font-semibold mb-2">
                    <i class="fas fa-hashtag mr-2 text-orange-primary"></i>
                    Número do Pedido *
                </label>
                <input type="text" 
                       id="entrega-pedido-numero-${index}" 
                       placeholder="Ex: PED-2024-001" 
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-orange-primary focus:ring-2 focus:ring-orange-primary focus:ring-opacity-20 transition-all"
                       onchange="atualizarNumeroPedidoEntrega(${index}, this.value)">
            </div>

            <!-- Notas Fiscais -->
            <div class="mb-6">
                <div class="flex justify-between items-center mb-4">
                    <h4 class="text-lg font-semibold text-gray-dark">
                        <i class="fas fa-file-invoice mr-2 text-orange-primary"></i>
                        Notas Fiscais
                    </h4>
                    <button type="button" onclick="adicionarNotaFiscalEntrega(${index})" 
                            class="bg-orange-primary text-white px-4 py-2 rounded-lg hover:bg-orange-secondary transition-all">
                        <i class="fas fa-plus mr-2"></i>Adicionar NF
                    </button>
                </div>
                
                <div id="entrega-notas-fiscais-${index}" class="space-y-4">
                    <!-- Notas fiscais serão adicionadas aqui -->
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', formHtml);
}

function atualizarNumeroPedidoEntrega(pedidoIndex, numero) {
    entregaPedidos[pedidoIndex].numero = numero;
}

function adicionarNotaFiscalEntrega(pedidoIndex) {
    const nf = {
        numero: '',
        valor: '',
        arquivo: null
    };
    
    entregaPedidos[pedidoIndex].notasFiscais.push(nf);
    
    const nfIndex = entregaPedidos[pedidoIndex].notasFiscais.length - 1;
    criarFormularioNotaFiscalEntrega(pedidoIndex, nfIndex);
}

function criarFormularioNotaFiscalEntrega(pedidoIndex, nfIndex) {
    const container = document.getElementById(`entrega-notas-fiscais-${pedidoIndex}`);
    
    const nfHtml = `
        <div class="nota-fiscal-entrega bg-gray-50 border border-gray-200 rounded-lg p-4" data-pedido="${pedidoIndex}" data-nf="${nfIndex}">
            <div class="flex justify-between items-start mb-4">
                <h5 class="font-semibold text-gray-dark">Nota Fiscal ${nfIndex + 1}</h5>
                <button type="button" onclick="removerNotaFiscalEntrega(${pedidoIndex}, ${nfIndex})" 
                        class="text-red-500 hover:text-red-700 transition-colors">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            
            <div class="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Número da NF *</label>
                    <input type="text" 
                           id="entrega-nf-numero-${pedidoIndex}-${nfIndex}"
                           placeholder="Ex: 123456"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-primary focus:ring-1 focus:ring-orange-primary transition-all"
                           onchange="atualizarNotaFiscalEntrega(${pedidoIndex}, ${nfIndex}, 'numero', this.value)">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Valor (R$) *</label>
                    <input type="number" 
                           id="entrega-nf-valor-${pedidoIndex}-${nfIndex}"
                           step="0.01" 
                           placeholder="0,00"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-primary focus:ring-1 focus:ring-orange-primary transition-all"
                           onchange="atualizarNotaFiscalEntrega(${pedidoIndex}, ${nfIndex}, 'valor', this.value)">
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Arquivo PDF da NF</label>
                <input type="file" 
                       id="entrega-nf-arquivo-${pedidoIndex}-${nfIndex}"
                       accept=".pdf"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-primary transition-all"
                       onchange="atualizarArquivoNotaFiscalEntrega(${pedidoIndex}, ${nfIndex}, this)">
                <p class="text-xs text-gray-500 mt-1">Apenas arquivos PDF (opcional)</p>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', nfHtml);
}

function atualizarNotaFiscalEntrega(pedidoIndex, nfIndex, campo, valor) {
    entregaPedidos[pedidoIndex].notasFiscais[nfIndex][campo] = valor;
}

function atualizarArquivoNotaFiscalEntrega(pedidoIndex, nfIndex, input) {
    entregaPedidos[pedidoIndex].notasFiscais[nfIndex].arquivo = input.files[0];
}

function removerNotaFiscalEntrega(pedidoIndex, nfIndex) {
    if (confirm('Tem certeza que deseja remover esta nota fiscal?')) {
        entregaPedidos[pedidoIndex].notasFiscais.splice(nfIndex, 1);
        
        // Recriar lista de notas fiscais
        const container = document.getElementById(`entrega-notas-fiscais-${pedidoIndex}`);
        container.innerHTML = '';
        
        entregaPedidos[pedidoIndex].notasFiscais.forEach((nf, index) => {
            criarFormularioNotaFiscalEntrega(pedidoIndex, index);
            // Repopular valores
            document.getElementById(`entrega-nf-numero-${pedidoIndex}-${index}`).value = nf.numero;
            document.getElementById(`entrega-nf-valor-${pedidoIndex}-${index}`).value = nf.valor;
        });
    }
}

function removerPedidoEntrega(index) {
    if (confirm('Tem certeza que deseja remover este pedido?')) {
        entregaPedidos.splice(index, 1);
        
        // Recriar tabs e formulários
        document.getElementById('entrega-pedidos-tabs').innerHTML = '';
        document.getElementById('entrega-pedidos-container').innerHTML = '';
        
        entregaPedidos.forEach((pedido, i) => {
            criarTabPedidoEntrega(i);
            criarFormularioPedidoEntrega(i);
        });
        
        // Selecionar primeira tab
        if (entregaPedidos.length > 0) {
            selecionarTabPedidoEntrega(0);
        }
    }
}

function gerarResumoEntrega() {
    const resumoContainer = document.getElementById('entrega-resumo');
    
    // Coletar dados do step 1
    const dadosBasicos = {
        data: document.getElementById('entrega-data').value,
        horario: document.getElementById('entrega-horario').value,
        fornecedor: document.getElementById('entrega-nome-fornecedor').value,
        cnpj: document.getElementById('entrega-cnpj-fornecedor').value,
        email: document.getElementById('entrega-email-fornecedor').value,
        telefone: document.getElementById('entrega-telefone-fornecedor').value,
        tipoCarga: document.getElementById('entrega-tipo-carga').value,
        observacoes: document.getElementById('entrega-observacoes').value
    };
    
    let resumoHtml = `
        <div class="space-y-6">
            <div>
                <h4 class="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">Dados da Entrega</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Data:</strong> ${new Date(dadosBasicos.data).toLocaleDateString('pt-BR')}</div>
                    <div><strong>Horário:</strong> ${dadosBasicos.horario}</div>
                    <div><strong>Fornecedor:</strong> ${dadosBasicos.fornecedor}</div>
                    <div><strong>CNPJ:</strong> ${dadosBasicos.cnpj}</div>
                    <div><strong>Email:</strong> ${dadosBasicos.email}</div>
                    <div><strong>Telefone:</strong> ${dadosBasicos.telefone}</div>
                    <div><strong>Tipo de Carga:</strong> ${dadosBasicos.tipoCarga}</div>
                    ${dadosBasicos.observacoes ? `<div class="col-span-2"><strong>Observações:</strong> ${dadosBasicos.observacoes}</div>` : ''}
                </div>
            </div>
            
            <div>
                <h4 class="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">Pedidos e Notas Fiscais</h4>
                <div class="space-y-4">
    `;
    
    entregaPedidos.forEach((pedido, index) => {
        resumoHtml += `
            <div class="bg-white border border-gray-200 rounded-lg p-4">
                <h5 class="font-semibold mb-2">Pedido: ${pedido.numero}</h5>
                <div class="space-y-2">
        `;
        
        pedido.notasFiscais.forEach((nf, nfIndex) => {
            resumoHtml += `
                <div class="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                    <span>NF: ${nf.numero} - R$ ${parseFloat(nf.valor || 0).toFixed(2)}</span>
                    ${nf.arquivo ? '<span class="text-green-600"><i class="fas fa-file-pdf mr-1"></i>PDF anexado</span>' : '<span class="text-gray-500">Sem arquivo</span>'}
                </div>
            `;
        });
        
        resumoHtml += `
                </div>
            </div>
        `;
    });
    
    resumoHtml += `
                </div>
            </div>
        </div>
    `;
    
    resumoContainer.innerHTML = resumoHtml;
}

async function handleRegistrarEntrega(e) {
    e.preventDefault();
    
    if (!validarStepEntrega(2)) {
        return;
    }
    
    // Verificar se há token de autenticação
    const token = sessionStorage.getItem('token');
    if (!token) {
        dashboard.showNotification('Token de autenticação não encontrado. Faça login novamente.', 'error');
        return;
    }
    
    // Criar FormData para incluir arquivos
    const formData = new FormData();
    
    // Dados básicos da entrega
    const dadosEntrega = {
        fornecedor: {
            nomeEmpresa: document.getElementById('entrega-nome-fornecedor').value,
            email: document.getElementById('entrega-email-fornecedor').value,
            telefone: document.getElementById('entrega-telefone-fornecedor').value,
            documento: document.getElementById('entrega-cnpj-fornecedor').value
        },
        entrega: {
            cdDestino: 'Default CD', // Será usado o CD do usuário logado
            dataEntrega: document.getElementById('entrega-data').value,
            horarioEntrega: document.getElementById('entrega-horario').value,
            tipoCarga: document.getElementById('entrega-tipo-carga').value,
            observacoes: document.getElementById('entrega-observacoes').value || ''
        },
        pedidos: entregaPedidos.map(pedido => ({
            numero: pedido.numero,
            notasFiscais: pedido.notasFiscais.map(nf => ({
                numero: nf.numero,
                valor: parseFloat(nf.valor || 0)
            }))
        })),
        tipoRegistro: 'fora_agendamento',
        // Definindo o status como 'entregue' automaticamente
        status: 'entregue',
        // Adicionando flag para indicar que foi incluído pelo CD
        incluidoPeloCD: true,
        // Adicionando observação sobre inclusão pelo CD
        observacaoInterna: 'ENTREGA INCLUÍDA PELO CD'
    };
    
    console.log('📦 [Frontend] Dados da entrega a serem enviados:', dadosEntrega);
    
    // Adicionar dados como JSON
    formData.append('agendamento', JSON.stringify(dadosEntrega));
    
    // Adicionar arquivos das notas fiscais
    let fileIndex = 0;
    entregaPedidos.forEach((pedido, pedidoIndex) => {
        pedido.notasFiscais.forEach((nf, nfIndex) => {
            if (nf.arquivo) {
                formData.append(`file_${fileIndex}`, nf.arquivo);
                formData.append(`file_${fileIndex}_info`, JSON.stringify({
                    pedido: pedido.numero,
                    nf: nf.numero
                }));
                fileIndex++;
            }
        });
    });
    
    try {
        dashboard.showLoading(true);
        
        console.log('🚀 [Frontend] Enviando requisição para /api/agendamentos');
        
        // Verificar se o token está válido antes de fazer a requisição
        const checkTokenResponse = await fetch('/api/verify-token', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        // Se o token não for válido, renovar o token
        if (!checkTokenResponse.ok) {
            console.log('🔑 Token expirado ou inválido, tentando renovar...');
            const cdId = dashboard.getCDFromToken();
            
            if (!cdId) {
                dashboard.showNotification('Não foi possível identificar o CD. Faça login novamente.', 'error');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
                return;
            }
            
            // Tentar renovar o token
            const renewTokenResponse = await fetch('/api/renew-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ cdId })
            });
            
            if (renewTokenResponse.ok) {
                const renewData = await renewTokenResponse.json();
                if (renewData.token) {
                    // Atualizar o token na sessão
                    sessionStorage.setItem('token', renewData.token);
                    console.log('🔑 Token renovado com sucesso!');
                } else {
                    dashboard.showNotification('Erro ao renovar sessão. Faça login novamente.', 'error');
                    setTimeout(() => {
                        window.location.href = '/login.html';
                    }, 2000);
                    return;
                }
            } else {
                dashboard.showNotification('Erro ao renovar sessão. Faça login novamente.', 'error');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
                return;
            }
        }
        
        // Obter o token atualizado
        const currentToken = sessionStorage.getItem('token');
        
        const response = await fetch('/api/agendamentos', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            },
            body: formData
        });
        
        const result = await response.json();
        
        console.log('📥 [Frontend] Resposta do servidor:', result);
        
        if (response.ok) {
            dashboard.showNotification('Entrega registrada com sucesso com status ENTREGUE!', 'success');
            closeRegistrarEntregaModal();
            dashboard.loadAgendamentos(); // Recarregar lista de agendamentos
        } else {
            console.error('❌ [Frontend] Erro na resposta:', result);
            
            // Se o erro for relacionado ao CD não encontrado, sugerir novo login
            if (result.error && (result.error.includes('Centro de distribuição não encontrado') || 
                                result.error.includes('Faça login novamente') ||
                                result.error.includes('Token inválido') ||
                                result.error.includes('Token expirado'))) {
                dashboard.showNotification('Erro de autenticação. Por favor, faça login novamente.', 'error');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
            } else {
                dashboard.showNotification(`Erro: ${result.error}`, 'error');
            }
        }
    } catch (error) {
        console.error('❌ [Frontend] Erro na requisição:', error);
        dashboard.showNotification('Erro ao registrar entrega. Verifique sua conexão ou faça login novamente.', 'error');
        // Registrar detalhes do erro no console para depuração
        console.error('Detalhes do erro:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        // Se for erro de rede, sugerir verificar conexão
        if (error.name === 'NetworkError' || error.message.includes('NetworkError')) {
            dashboard.showNotification('Erro de conexão. Verifique sua internet e tente novamente.', 'error');
        }
        // Se for erro de CORS, pode ser um problema de configuração
        else if (error.name === 'TypeError' && error.message.includes('CORS')) {
            dashboard.showNotification('Erro de conexão com o servidor. Informe o suporte.', 'error');
        }
    } finally {
        dashboard.showLoading(false);
    }
}

// ========================================
// MODAL DE VISUALIZAÇÃO DE ENTREGAS
// ========================================

// Variáveis globais para o modal de entregas
window.entregasData = [];
window.entregasFiltradas = [];
let paginaAtual = 1;
const itensPorPagina = 12;

function openEntregasModal() {
    const modal = document.getElementById('modal-entregas-entregues');
    if (!modal) {
        console.error('❌ Modal não encontrado!');
        return;
    }
    
    modal.classList.remove('hidden');
    configurarFiltrosEntregas();
    carregarTodasEntregas();
}

function fecharModalEntregas() {
    const modal = document.getElementById('modal-entregas-entregues');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function closeEntregasModal() {
    const modal = document.getElementById('modal-entregas');
    modal.classList.add('hidden');
    
    // Limpar dados
    window.entregasData = [];
    window.entregasFiltradas = [];
    paginaAtual = 1;
}

function configurarFiltrosEntregas() {
    try {
        // Configurar data atual
        const hoje = new Date().toISOString().split('T')[0];
        const dataFimEl = document.getElementById('data-fim');
        if (dataFimEl) {
            dataFimEl.value = hoje;
        }
        
        const inicioMes = new Date();
        inicioMes.setDate(1);
        const dataInicioEl = document.getElementById('data-inicio');
        if (dataInicioEl) {
            dataInicioEl.value = inicioMes.toISOString().split('T')[0];
        }

        // Adicionar event listeners para filtros
        const buscaEl = document.getElementById('busca-entregas');
        const periodoEl = document.getElementById('filtro-periodo');
        
        if (buscaEl) {
            buscaEl.addEventListener('input', aplicarFiltrosEntregas);
        }
        
        if (periodoEl) {
            periodoEl.addEventListener('change', aplicarFiltrosEntregas);
        }
        
        if (dataInicioEl) {
            dataInicioEl.addEventListener('change', aplicarFiltrosEntregas);
        }
        
        if (dataFimEl) {
            dataFimEl.addEventListener('change', aplicarFiltrosEntregas);
        }
        
    } catch (error) {
        console.error('❌ Erro ao configurar filtros:', error);
    }
}

async function carregarTodasEntregas() {
    mostrarLoadingEntregas(true);
    
    try {
        const token = sessionStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/agendamentos', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            const agendamentos = Array.isArray(result) ? result : (result.data || result.agendamentos || []);
            window.entregasData = agendamentos.filter(agendamento => agendamento.status === 'entregue');
            window.entregasFiltradas = [...window.entregasData];
            
            console.log('🔍 DEBUG:', {
                totalAgendamentos: agendamentos.length,
                entregas: window.entregasData.length,
                primeirasEntregas: window.entregasData.slice(0, 2).map(e => ({id: e.id, codigo: e.codigo, status: e.status}))
            });
            
            atualizarEstatisticasEntregas();
            renderizarEntregas();
            atualizarPaginacao();
            
        } else {
            dashboard.showNotification('Erro ao carregar entregas', 'error');
        }
    } catch (error) {
        console.error('❌ Erro ao carregar entregas:', error);
        mostrarErroEntregas();
    } finally {
        mostrarLoadingEntregas(false);
    }
}

function mostrarLoadingEntregas(show) {
    const loading = document.getElementById('entregas-loading');
    const container = document.getElementById('entregas-container');
    const vazio = document.getElementById('entregas-vazio');
    
    if (show) {
        loading.classList.remove('hidden');
        container.classList.add('hidden');
        vazio.classList.add('hidden');
    } else {
        loading.classList.add('hidden');
        container.classList.remove('hidden');
    }
}

function mostrarErroEntregas() {
    const loading = document.getElementById('entregas-loading');
    const container = document.getElementById('entregas-container');
    const vazio = document.getElementById('entregas-vazio');
    
    loading.classList.add('hidden');
    container.classList.add('hidden');
    vazio.classList.remove('hidden');
}

function atualizarEstatisticasEntregas() {
    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    
    const estatisticas = {
        total: window.entregasData.length,
        hoje: 0,
        semana: 0,
        mes: 0
    };
    
    window.entregasData.forEach(entrega => {
        const dataEntrega = new Date(entrega.dataEntrega);
        
        // Hoje
        if (dataEntrega.toDateString() === hoje.toDateString()) {
            estatisticas.hoje++;
        }
        
        // Esta semana
        if (dataEntrega >= inicioSemana) {
            estatisticas.semana++;
        }
        
        // Este mês
        if (dataEntrega >= inicioMes) {
            estatisticas.mes++;
        }
    });
    
    document.getElementById('stat-total').textContent = estatisticas.total;
    document.getElementById('stat-hoje').textContent = estatisticas.hoje;
    document.getElementById('stat-semana').textContent = estatisticas.semana;
    document.getElementById('stat-mes').textContent = estatisticas.mes;
}

function aplicarFiltrosEntregas() {
    const textoPesquisa = document.getElementById('busca-entregas').value.toLowerCase();
    const periodo = document.getElementById('filtro-periodo').value;
    
    let entregasFiltradas = [...window.entregasData];
    
    // Filtro por texto
    if (textoPesquisa) {
        entregasFiltradas = entregasFiltradas.filter(entrega => {
            return (
                entrega.fornecedor?.nome?.toLowerCase().includes(textoPesquisa) ||
                entrega.codigo?.toLowerCase().includes(textoPesquisa) ||
                entrega.tipoCarga?.toLowerCase().includes(textoPesquisa) ||
                entrega.observacoes?.toLowerCase().includes(textoPesquisa)
            );
        });
    }
    
    // Filtro por período
    if (periodo !== 'todos') {
        const hoje = new Date();
        let dataInicio;
        
        switch (periodo) {
            case 'hoje':
                dataInicio = new Date(hoje);
                dataInicio.setHours(0, 0, 0, 0);
                break;
            case 'semana':
                dataInicio = new Date(hoje);
                dataInicio.setDate(hoje.getDate() - hoje.getDay());
                dataInicio.setHours(0, 0, 0, 0);
                break;
            case 'mes':
                dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                break;
            case 'customizado':
                const inicioCustom = document.getElementById('data-inicio').value;
                const fimCustom = document.getElementById('data-fim').value;
                if (inicioCustom && fimCustom) {
                    entregasFiltradas = entregasFiltradas.filter(entrega => {
                        const dataEntrega = new Date(entrega.dataEntrega).toISOString().split('T')[0];
                        return dataEntrega >= inicioCustom && dataEntrega <= fimCustom;
                    });
                }
                break;
        }
        
        if (periodo !== 'customizado' && dataInicio) {
            entregasFiltradas = entregasFiltradas.filter(entrega => {
                const dataEntrega = new Date(entrega.dataEntrega);
                return dataEntrega >= dataInicio;
            });
        }
    }
    
    // Ordenar por data mais recente
    entregasFiltradas.sort((a, b) => new Date(b.dataEntrega) - new Date(a.dataEntrega));
    
    window.entregasFiltradas = entregasFiltradas;
    paginaAtual = 1;
    
    renderizarEntregas();
    atualizarPaginacao();
}

function renderizarEntregas() {
    console.log('🎨 RENDERIZAR:', window.entregasFiltradas.length, 'entregas');
    const container = document.getElementById('entregas-container');
    const vazio = document.getElementById('entregas-vazio');
    
    if (!container || !vazio) {
        console.error('❌ Elementos do modal não encontrados');
        return;
    }
    
    if (window.entregasFiltradas.length === 0) {
        console.log('❌ Nenhuma entrega - mostrando vazio');
        container.classList.add('hidden');
        vazio.classList.remove('hidden');
        return;
    }
    
    console.log('✅ Exibindo', window.entregasFiltradas.length, 'entregas');
    // Garantir que o container seja exibido e o vazio seja oculto
    vazio.classList.add('hidden');
    container.classList.remove('hidden');
    
    const startIndex = (paginaAtual - 1) * itensPorPagina;
    const endIndex = startIndex + itensPorPagina;
    const itensParaExibir = window.entregasFiltradas.slice(startIndex, endIndex);
    
    container.innerHTML = itensParaExibir.map(entrega => criarCardEntrega(entrega)).join('');
    console.log('✅ HTML inserido no container');
}

function criarCardEntrega(entrega) {
    const dataFormatada = new Date(entrega.dataEntrega).toLocaleDateString('pt-BR');
    const tempoRelativo = calcularTempoRelativo(entrega.dataEntrega);
    
    return `
        <div class="bg-white rounded-lg shadow-md border-l-4 border-blue-500 p-4 hover:shadow-lg transition-all transform hover:-translate-y-1">
            <div class="flex justify-between items-start mb-3">
                <div class="text-xs text-gray-500 font-medium">
                    ${entrega.codigo}
                </div>
                <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    <i class="fas fa-check-circle mr-1"></i>Entregue
                </span>
            </div>
            
            <h4 class="font-semibold text-gray-800 mb-2 line-clamp-2">
                ${entrega.fornecedor?.nome || 'Fornecedor não informado'}
            </h4>
            
            <div class="space-y-2 text-sm text-gray-600">
                <div class="flex items-center">
                    <i class="fas fa-calendar w-4 text-blue-500"></i>
                    <span class="ml-2">${dataFormatada} às ${entrega.horarioEntrega}</span>
                </div>
                
                <div class="flex items-center">
                    <i class="fas fa-box w-4 text-blue-500"></i>
                    <span class="ml-2">${entrega.tipoCarga}</span>
                </div>
                
                ${entrega.observacoes ? `
                <div class="flex items-start">
                    <i class="fas fa-sticky-note w-4 text-blue-500 mt-0.5"></i>
                    <span class="ml-2 line-clamp-2">${entrega.observacoes}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                <span class="text-xs text-gray-500">${tempoRelativo}</span>
                <button onclick="dashboard.showAgendamentoDetails(${entrega.id})" 
                        class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    <i class="fas fa-eye mr-1"></i>Detalhes
                </button>
            </div>
        </div>
    `;
}

function calcularTempoRelativo(data) {
    const agora = new Date();
    const dataEntrega = new Date(data);
    const diffMs = agora - dataEntrega;
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDias === 0) {
        return 'Hoje';
    } else if (diffDias === 1) {
        return 'Ontem';
    } else if (diffDias < 7) {
        return `${diffDias} dias atrás`;
    } else if (diffDias < 30) {
        const semanas = Math.floor(diffDias / 7);
        return `${semanas} ${semanas === 1 ? 'semana' : 'semanas'} atrás`;
    } else {
        const meses = Math.floor(diffDias / 30);
        return `${meses} ${meses === 1 ? 'mês' : 'meses'} atrás`;
    }
}

function atualizarPaginacao() {
    const totalItens = window.entregasFiltradas.length;
    const totalPaginas = Math.ceil(totalItens / itensPorPagina);
    
    const inicioInfo = totalItens > 0 ? ((paginaAtual - 1) * itensPorPagina) + 1 : 0;
    const fimInfo = Math.min(paginaAtual * itensPorPagina, totalItens);
    
    console.log('📊 PAGINAÇÃO:', { totalItens, inicioInfo, fimInfo });
    
    // Usar seletores específicos do modal de entregas entregues
    const modal = document.getElementById('modal-entregas-entregues');
    const infoInicioEl = modal?.querySelector('#info-inicio');
    const infoFimEl = modal?.querySelector('#info-fim');
    const infoTotalEl = modal?.querySelector('#info-total');
    
    console.log('🔍 ELEMENTOS:', {
        inicio: !!infoInicioEl,
        fim: !!infoFimEl, 
        total: !!infoTotalEl,
        inicioValue: infoInicioEl?.textContent,
        fimValue: infoFimEl?.textContent,
        totalValue: infoTotalEl?.textContent
    });
    
    if (infoInicioEl) {
        infoInicioEl.textContent = inicioInfo;
        console.log('✅ info-inicio atualizado para:', inicioInfo, '- DOM value:', infoInicioEl.textContent);
        console.log('🔍 info-inicio parent:', infoInicioEl.parentElement?.textContent);
    }
    if (infoFimEl) {
        infoFimEl.textContent = fimInfo;
        console.log('✅ info-fim atualizado para:', fimInfo, '- DOM value:', infoFimEl.textContent);
    }
    if (infoTotalEl) {
        infoTotalEl.textContent = totalItens;
        console.log('✅ info-total atualizado para:', totalItens, '- DOM value:', infoTotalEl.textContent);
    }
    
    // Atualizar botões
    const btnAnterior = document.getElementById('btn-anterior');
    const btnProximo = document.getElementById('btn-proximo');
    
    btnAnterior.disabled = paginaAtual <= 1;
    btnProximo.disabled = paginaAtual >= totalPaginas;
    
    // Gerar números das páginas
    const containerNumeros = document.getElementById('numeros-pagina');
    containerNumeros.innerHTML = '';
    
    if (totalPaginas <= 1) return;
    
    const maxBotoes = 5;
    let inicio = Math.max(1, paginaAtual - Math.floor(maxBotoes / 2));
    let fim = Math.min(totalPaginas, inicio + maxBotoes - 1);
    
    if (fim - inicio + 1 < maxBotoes) {
        inicio = Math.max(1, fim - maxBotoes + 1);
    }
    
    for (let i = inicio; i <= fim; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = `px-3 py-1 rounded ${i === paginaAtual ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`;
        btn.onclick = () => irParaPagina(i);
        containerNumeros.appendChild(btn);
    }
}

function paginaAnterior() {
    if (paginaAtual > 1) {
        paginaAtual--;
        renderizarEntregas();
        atualizarPaginacao();
    }
}

function proximaPagina() {
    const totalPaginas = Math.ceil(window.entregasFiltradas.length / itensPorPagina);
    if (paginaAtual < totalPaginas) {
        paginaAtual++;
        renderizarEntregas();
        atualizarPaginacao();
    }
}

function irParaPagina(pagina) {
    paginaAtual = pagina;
    renderizarEntregas();
    atualizarPaginacao();
}

// ========================================
// DASHBOARD KPIs - PowerBI Style
// ========================================

// Variáveis globais para o Dashboard KPIs
let kpiData = {
    periodoAtual: {
        agendamentos: [],
        metricas: {}
    },
    periodoAnterior: {
        agendamentos: [],
        metricas: {}
    },
    topFornecedores: [],
    tendencias: {
        entregasSemanais: [],
        distribuicaoHorarios: {}
    }
};

function openDashboardKPIModal() {
    const modal = document.getElementById('dashboard-kpi-modal');
    if (!modal) {
        console.error('Modal dashboard-kpi-modal não encontrado');
        return;
    }
    
    // Exibir o modal
    modal.classList.remove('hidden');
    
    // Inicializar período (últimos 30 dias por padrão)
    const hoje = new Date();
    const dataFim = hoje.toISOString().split('T')[0];
    
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - 30);
    const dataInicioStr = dataInicio.toISOString().split('T')[0];
    
    document.getElementById('kpi-data-inicio').value = dataInicioStr;
    document.getElementById('kpi-data-fim').value = dataFim;
    
    // Configurar dropdown de período
    const periodoSelect = document.getElementById('kpi-periodo-select');
    if (periodoSelect) {
        periodoSelect.addEventListener('change', function() {
            const valor = this.value;
            const hoje = new Date();
            let inicio = new Date();
            
            switch(valor) {
                case 'ultimos-7':
                    inicio.setDate(hoje.getDate() - 7);
                    break;
                case 'ultimos-30':
                    inicio.setDate(hoje.getDate() - 30);
                    break;
                case 'ultimos-90':
                    inicio.setDate(hoje.getDate() - 90);
                    break;
                case 'ano-atual':
                    inicio = new Date(hoje.getFullYear(), 0, 1);
                    break;
                case 'custom':
                    // Não alterar as datas, usar as já configuradas
                    return;
            }
            
            document.getElementById('kpi-data-inicio').value = inicio.toISOString().split('T')[0];
            document.getElementById('kpi-data-fim').value = hoje.toISOString().split('T')[0];
            aplicarFiltroPeriodoKPI();
        });
    }
    
    // Carregar dados de KPI
    carregarDadosKPI(dataInicioStr, dataFim);
}

function closeDashboardKPIModal() {
    const modal = document.getElementById('dashboard-kpi-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

async function carregarDadosKPI(dataInicio, dataFim) {
    try {
        console.log('Carregando dados KPI para período:', dataInicio, 'até', dataFim);
        
        // Mostrar indicador de carregamento
        const elementosCarregamento = [
            'kpi-total-agendamentos', 'kpi-taxa-entrega', 
            'kpi-taxa-ausencia', 'kpi-tempo-resposta', 'kpi-ocupacao-atual'
        ];
        
        elementosCarregamento.forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            }
        });
        
        // Calcular período anterior (mesmo número de dias)
        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);
        const numDias = Math.round((fim - inicio) / (1000 * 60 * 60 * 24));
        
        const inicioAnterior = new Date(inicio);
        inicioAnterior.setDate(inicioAnterior.getDate() - numDias);
        const fimAnterior = new Date(inicio);
        fimAnterior.setDate(fimAnterior.getDate() - 1);
        
        const dataInicioAnterior = inicioAnterior.toISOString().split('T')[0];
        const dataFimAnterior = fimAnterior.toISOString().split('T')[0];
        
        console.log('Período anterior:', dataInicioAnterior, 'até', dataFimAnterior);
        
        // Carregar dados do banco
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        if (!token) {
            console.error('Token não encontrado');
            showNotification('Sessão expirada, faça login novamente', 'error');
            return;
        }
        
        // Recuperar ID do CD logado
        const cdId = sessionStorage.getItem('cdId') || localStorage.getItem('cdId');
        if (!cdId) {
            console.error('ID do CD não encontrado');
            showNotification('Informações do CD não encontradas, faça login novamente', 'error');
            return;
        }
        
        // Buscar todos os agendamentos do período para o CD atual
        const response = await fetch(`http://localhost:3000/api/agendamentos?cdId=${cdId}&dataInicio=${dataInicio}&dataFim=${dataFim}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro ao buscar agendamentos: ${response.status}`);
        }
        
        const agendamentos = await response.json();
        console.log(`Recuperados ${agendamentos.length} agendamentos do banco`);
        
        // Buscar agendamentos do período anterior para comparação
        const responseAnterior = await fetch(`http://localhost:3000/api/agendamentos?cdId=${cdId}&dataInicio=${dataInicioAnterior}&dataFim=${dataFimAnterior}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!responseAnterior.ok) {
            throw new Error(`Erro ao buscar agendamentos do período anterior: ${responseAnterior.status}`);
        }
        
        const agendamentosAnteriores = await responseAnterior.json();
        console.log(`Recuperados ${agendamentosAnteriores.length} agendamentos do período anterior`);
        
        // Calcular os KPIs com os dados reais do banco
        atualizarKPIs(agendamentos, agendamentosAnteriores);
        
        // Renderizar os gráficos com dados reais
        renderizarGraficoStatus(agendamentos);
        renderizarGraficoDiaSemana(agendamentos);
        renderizarGraficoTendencia(agendamentos);
        renderizarGraficoHorarios(agendamentos);
        renderizarGraficoDesempenhoFornecedores(agendamentos);
        atualizarTabelaFornecedores(agendamentos);
        atualizarInsights(agendamentos);
        atualizarIndicadoresNegocio(agendamentos);
        
    } catch (error) {
        console.error('Erro ao carregar dados KPI:', error);
        
        // Mostrar erro ao usuário
        showNotification('Erro ao carregar dados KPI: ' + error.message, 'error');
        
        // Carregar dados simulados em caso de falha
        console.log('Usando dados simulados como fallback...');
        carregarDadosSimulados();
    }
}

function carregarDadosSimulados() {
    // Simular carregamento
    setTimeout(() => {
        // Gerar dados simulados
        const dadosSimulados = gerarDadosSimulados();
        
        // Atualizar KPIs
        atualizarKPIsSimulados(dadosSimulados);
        
        // Renderizar gráficos com dados simulados
        renderizarGraficoStatusSimulado(dadosSimulados);
        renderizarGraficoDiaSemanaSimulado(dadosSimulados);
        renderizarGraficoTendenciaSimulado(dadosSimulados);
        renderizarGraficoHorariosSimulado(dadosSimulados);
        atualizarTabelaFornecedoresSimulado(dadosSimulados);
        atualizarInsightsSimulado(dadosSimulados);
        atualizarIndicadoresNegocioSimulado(dadosSimulados);
    }, 1000);
}

function gerarDadosSimulados() {
    return {
        totalAgendamentos: Math.floor(Math.random() * 500) + 100,
        taxaEntrega: Math.floor(Math.random() * 30) + 70,
        taxaAusencia: Math.floor(Math.random() * 10) + 1,
        tempoResposta: (Math.random() * 5 + 1).toFixed(1),
        ocupacaoCD: Math.floor(Math.random() * 40) + 60,
        statusDistribuicao: {
            pendentes: Math.floor(Math.random() * 50) + 10,
            confirmados: Math.floor(Math.random() * 100) + 50,
            entregues: Math.floor(Math.random() * 200) + 100,
            ausentes: Math.floor(Math.random() * 20) + 5
        },
        diaSemanaDistribuicao: [
            Math.floor(Math.random() * 30) + 10, // Segunda
            Math.floor(Math.random() * 30) + 20, // Terça
            Math.floor(Math.random() * 30) + 30, // Quarta
            Math.floor(Math.random() * 30) + 25, // Quinta
            Math.floor(Math.random() * 30) + 15, // Sexta
            Math.floor(Math.random() * 10) + 5,  // Sábado
            Math.floor(Math.random() * 5)        // Domingo
        ],
        horarios: gerarDadosHorariosSimulados(),
        fornecedores: gerarDadosFornecedoresSimulados()
    };
}

function gerarDadosHorariosSimulados() {
    const horarios = [];
    
    // Gerar dados para cada hora do dia (8h às 18h)
    for (let hora = 8; hora <= 18; hora++) {
        // Distribuição em forma de sino com pico no meio do dia
        let valor;
        if (hora < 10) {
            valor = Math.floor(Math.random() * 10) + (hora - 7) * 5;
        } else if (hora > 16) {
            valor = Math.floor(Math.random() * 10) + (19 - hora) * 5;
        } else {
            valor = Math.floor(Math.random() * 15) + 25;
        }
        
        horarios.push({
            hora: `${hora}:00`,
            valor: valor
        });
    }
    
    return horarios;
}

function gerarDadosFornecedoresSimulados() {
    const fornecedores = [
        "Transportadora Rápida",
        "Logística Express",
        "Entregas Brasil",
        "TransBrasa",
        "LogiTech Transportes",
        "Fretes & Cia",
        "Mercado Expresso",
        "BrasLog",
        "TransporteJá",
        "Cargas BR"
    ];
    
    return fornecedores.map(nome => {
        const total = Math.floor(Math.random() * 100) + 20;
        const entregas = Math.floor(total * (Math.random() * 0.3 + 0.7)); // 70% a 100% de entregas
        const ausencias = total - entregas;
        const taxa = Math.floor((entregas / total) * 100);
        
        return {
            nome: nome,
            total: total,
            entregas: entregas,
            ausencias: ausencias,
            taxa: taxa
        };
    }).sort((a, b) => b.total - a.total); // Ordenar por total
}

// Função para carregar dados KPI do período
async function carregarDadosKPI(dataInicio, dataFim) {
    try {
        console.log('Carregando dados KPI para período:', dataInicio, 'até', dataFim);
        
        // Mostrar indicador de carregamento
        const elementosCarregamento = [
            'kpi-total-agendamentos', 'kpi-taxa-entrega', 
            'kpi-taxa-ausencia', 'kpi-tempo-resposta', 'kpi-ocupacao-atual'
        ];
        
        elementosCarregamento.forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            }
        });
        
        // Calcular período anterior (mesmo número de dias)
        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);
        const numDias = Math.round((fim - inicio) / (1000 * 60 * 60 * 24));
        
        const inicioAnterior = new Date(inicio);
        inicioAnterior.setDate(inicioAnterior.getDate() - numDias);
        const fimAnterior = new Date(inicio);
        fimAnterior.setDate(fimAnterior.getDate() - 1);
        
        const dataInicioAnterior = inicioAnterior.toISOString().split('T')[0];
        const dataFimAnterior = fimAnterior.toISOString().split('T')[0];
        
        console.log('Período anterior:', dataInicioAnterior, 'até', dataFimAnterior);
        
        // Carregar dados do banco
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        if (!token) {
            console.error('Token não encontrado');
            showNotification('Sessão expirada, faça login novamente', 'error');
            // Usar dados simulados em caso de falha de autenticação
            carregarDadosSimulados();
            return;
        }
        
        // Recuperar ID do CD logado
        const cdId = sessionStorage.getItem('cdId') || localStorage.getItem('cdId') || sessionStorage.getItem('cd') || localStorage.getItem('cd');
        if (!cdId) {
            console.warn('ID do CD não encontrado, tentando carregar dados sem filtro de CD');
            showNotification('Informações do CD não encontradas, dados podem estar incompletos', 'warning');
            // Continuar sem o filtro de CD ou usar dados simulados
            // carregarDadosSimulados();
            // return;
        }
        
        // Construir URL com ou sem filtro de CD
        const baseUrl = '/api/agendamentos';
        const params = new URLSearchParams();
        params.append('dataInicio', dataInicio);
        params.append('dataFim', dataFim);
        if (cdId) params.append('cdId', cdId);
        
        // Buscar todos os agendamentos do período para o CD atual
        const response = await fetch(`${baseUrl}?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro ao buscar agendamentos: ${response.status}`);
        }
        
        const result = await response.json();
        const agendamentos = Array.isArray(result) ? result : (result.data || []);
        console.log(`Recuperados ${agendamentos.length} agendamentos do banco`);
        
        // Construir URL para período anterior
        const paramsAnterior = new URLSearchParams();
        paramsAnterior.append('dataInicio', dataInicioAnterior);
        paramsAnterior.append('dataFim', dataFimAnterior);
        if (cdId) paramsAnterior.append('cdId', cdId);
        
        // Buscar agendamentos do período anterior para comparação
        const responseAnterior = await fetch(`${baseUrl}?${paramsAnterior.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!responseAnterior.ok) {
            throw new Error(`Erro ao buscar agendamentos do período anterior: ${responseAnterior.status}`);
        }
        
        const resultAnterior = await responseAnterior.json();
        const agendamentosAnteriores = Array.isArray(resultAnterior) ? resultAnterior : (resultAnterior.data || []);
        console.log(`Recuperados ${agendamentosAnteriores.length} agendamentos do período anterior`);
        
        // Filtrar por períodos
        kpiData.periodoAtual.agendamentos = filtrarAgendamentosPorPeriodo(agendamentos, dataInicio, dataFim);
        kpiData.periodoAnterior.agendamentos = filtrarAgendamentosPorPeriodo(agendamentosAnteriores, dataInicioAnterior, dataFimAnterior);
        
        // Calcular métricas
        calcularMetricas();
        
        // Atualizar interface
        try {
            atualizarKPIs();
        } catch (error) {
            console.error('Erro ao atualizar KPIs:', error);
        }
        
        try {
            atualizarGraficos();
        } catch (error) {
            console.error('Erro ao atualizar gráficos:', error);
        }
        
        try {
            atualizarTabelaFornecedores();
        } catch (error) {
            console.error('Erro ao atualizar tabela de fornecedores:', error);
        }
        
    } catch (error) {
        console.error('Erro ao carregar dados KPI:', error);
        
        // Mostrar erro ao usuário
        showNotification('Erro ao carregar dados KPI: ' + error.message, 'error');
        
        // Carregar dados vazios em caso de falha (não mais simulados)
        console.log('Carregando dashboard sem dados...');
        carregarDadosSimulados();
    }
}

// Função para carregar dashboard sem dados reais
function carregarDadosSimulados() {
    // Inicializar estrutura de dados
    kpiData = {
        periodoAtual: {
            agendamentos: [],
            metricas: {
                total: 0,
                entregues: 0,
                ausencias: 0,
                taxaEntrega: 0,
                taxaAusencia: 0,
                tempoMedioResposta: 0
            }
        },
        periodoAnterior: {
            agendamentos: [],
            metricas: {
                total: 0,
                entregues: 0,
                ausencias: 0,
                taxaEntrega: 0,
                taxaAusencia: 0,
                tempoMedioResposta: 0
            }
        },
        tendencias: {
            distribuicaoDiaSemana: {},
            distribuicaoHorarios: {},
            desempenhoFornecedores: []
        }
    };
    
    // Atualizar interface com dados vazios
    try {
        atualizarKPIs();
    } catch (error) {
        console.error('Erro ao atualizar KPIs vazios:', error);
    }
    
    try {
        atualizarGraficos();
    } catch (error) {
        console.error('Erro ao atualizar gráficos vazios:', error);
    }
    
    try {
        atualizarTabelaFornecedores();
    } catch (error) {
        console.error('Erro ao atualizar tabela de fornecedores vazia:', error);
    }
    
    // Mostrar mensagens em elementos vazios
    const elementos = [
        'grafico-status',
        'grafico-dia-semana',
        'grafico-horarios',
        'grafico-fornecedores',
        'grafico-tendencia',
        'tabela-fornecedores'
    ];
    
    elementos.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.innerHTML = `
                <div class="flex flex-col items-center justify-center p-6 h-full">
                    <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 class="mt-2 text-lg font-medium text-gray-900">Sem dados disponíveis</h3>
                    <p class="mt-1 text-sm text-gray-500">Não foi possível carregar dados reais do banco de dados.</p>
                    <p class="mt-1 text-xs text-gray-500">Verifique sua conexão e credenciais.</p>
                </div>
            `;
        }
    });
    
    showNotification("Não foi possível carregar dados reais. Verifique sua conexão com o banco de dados.", "warning");
}

function filtrarAgendamentosPorPeriodo(agendamentos, dataInicio, dataFim) {
    return agendamentos.filter(agendamento => {
        const dataEntrega = new Date(agendamento.dataEntrega);
        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999); // Fim do dia
        
        return dataEntrega >= inicio && dataEntrega <= fim;
    });
}

function calcularMetricas() {
    // Função auxiliar para normalizar os status
    function normalizarStatus(status) {
        if (!status) return 'desconhecido';
        
        const statusLower = status.toLowerCase();
        
        // Mapeamento de diferentes possíveis status para valores normalizados
        if (statusLower.includes('entreg')) return 'entregue';
        if (statusLower.includes('nao-veio') || statusLower.includes('ausente') || statusLower.includes('ausência')) return 'nao-veio';
        if (statusLower.includes('confirm')) return 'confirmado';
        if (statusLower.includes('pend')) return 'pendente';
        if (statusLower.includes('canc')) return 'cancelado';
        if (statusLower.includes('agend')) return 'agendado';
        if (statusLower.includes('aguard')) return 'aguardando';
        if (statusLower.includes('reagend')) return 'reagendamento';
        
        return statusLower;
    }
    
    // Métricas do período atual
    const atual = kpiData.periodoAtual;
    atual.metricas = {
        total: atual.agendamentos.length,
        entregues: atual.agendamentos.filter(a => normalizarStatus(a.status) === 'entregue').length,
        ausencias: atual.agendamentos.filter(a => normalizarStatus(a.status) === 'nao-veio').length,
        taxaEntrega: 0,
        taxaAusencia: 0,
        tempoMedioResposta: 0
    };
    
    // Calcular taxas
    if (atual.metricas.total > 0) {
        atual.metricas.taxaEntrega = (atual.metricas.entregues / atual.metricas.total) * 100;
        atual.metricas.taxaAusencia = (atual.metricas.ausencias / atual.metricas.total) * 100;
    }
    
    // Calcular tempo médio de resposta (do status pendente até confirmado)
    const agendamentosComHistorico = atual.agendamentos.filter(a => a.historicoAcoes && a.historicoAcoes.length >= 2);
    if (agendamentosComHistorico.length > 0) {
        let tempoTotalHoras = 0;
        let agendamentosValidos = 0;
        
        agendamentosComHistorico.forEach(agendamento => {
            // Buscar ação de criação (ou pendente)
            const criacao = agendamento.historicoAcoes.find(h => 
                h.acao === 'agendamento_criado' || h.acao === 'pendente');
            
            // Buscar ação de confirmação
            const confirmacao = agendamento.historicoAcoes.find(h => 
                h.acao === 'confirmado' || h.acao === 'agendamento_confirmado');
            
            if (criacao && confirmacao) {
                const dataCriacao = new Date(criacao.createdAt);
                const dataConfirmacao = new Date(confirmacao.createdAt);
                
                // Calcular diferença em horas
                const diffHoras = (dataConfirmacao - dataCriacao) / (1000 * 60 * 60);
                
                if (diffHoras > 0 && diffHoras < 120) { // Filtrar valores extremos
                    tempoTotalHoras += diffHoras;
                    agendamentosValidos++;
                }
            }
        });
        
        if (agendamentosValidos > 0) {
            atual.metricas.tempoMedioResposta = tempoTotalHoras / agendamentosValidos;
        }
    }
    
    // Métricas do período anterior
    const anterior = kpiData.periodoAnterior;
    anterior.metricas = {
        total: anterior.agendamentos.length,
        entregues: anterior.agendamentos.filter(a => a.status === 'entregue').length,
        ausencias: anterior.agendamentos.filter(a => a.status === 'nao-veio').length,
        taxaEntrega: 0,
        taxaAusencia: 0,
        tempoMedioResposta: 0
    };
    
    // Calcular taxas do período anterior
    if (anterior.metricas.total > 0) {
        anterior.metricas.taxaEntrega = (anterior.metricas.entregues / anterior.metricas.total) * 100;
        anterior.metricas.taxaAusencia = (anterior.metricas.ausencias / anterior.metricas.total) * 100;
    }
    
    // Calcular tempo médio de resposta do período anterior
    const agendamentosAnteriorComHistorico = anterior.agendamentos.filter(a => a.historicoAcoes && a.historicoAcoes.length >= 2);
    if (agendamentosAnteriorComHistorico.length > 0) {
        let tempoTotalHoras = 0;
        let agendamentosValidos = 0;
        
        agendamentosAnteriorComHistorico.forEach(agendamento => {
            const criacao = agendamento.historicoAcoes.find(h => 
                h.acao === 'agendamento_criado' || h.acao === 'pendente');
            
            const confirmacao = agendamento.historicoAcoes.find(h => 
                h.acao === 'confirmado' || h.acao === 'agendamento_confirmado');
            
            if (criacao && confirmacao) {
                const dataCriacao = new Date(criacao.createdAt);
                const dataConfirmacao = new Date(confirmacao.createdAt);
                
                const diffHoras = (dataConfirmacao - dataCriacao) / (1000 * 60 * 60);
                
                if (diffHoras > 0 && diffHoras < 120) {
                    tempoTotalHoras += diffHoras;
                    agendamentosValidos++;
                }
            }
        });
        
        if (agendamentosValidos > 0) {
            anterior.metricas.tempoMedioResposta = tempoTotalHoras / agendamentosValidos;
        }
    }
    
    // Calcular top fornecedores
    calcularTopFornecedores();
}

function calcularTopFornecedores() {
    const fornecedores = {};
    
    // Agrupar agendamentos por fornecedor
    kpiData.periodoAtual.agendamentos.forEach(agendamento => {
        const fornecedorId = agendamento.fornecedor?.id;
        const fornecedorNome = agendamento.fornecedor?.nome || 'Desconhecido';
        
        if (!fornecedorId) return;
        
        if (!fornecedores[fornecedorId]) {
            fornecedores[fornecedorId] = {
                nome: fornecedorNome,
                total: 0,
                entregues: 0,
                ausencias: 0,
                taxaEntrega: 0
            };
        }
        
        fornecedores[fornecedorId].total++;
        
        if (agendamento.status === 'entregue') {
            fornecedores[fornecedorId].entregues++;
        } else if (agendamento.status === 'nao-veio') {
            fornecedores[fornecedorId].ausencias++;
        }
    });
    
    // Calcular taxas e criar array
    kpiData.topFornecedores = Object.values(fornecedores)
        .map(f => {
            if (f.total > 0) {
                f.taxaEntrega = (f.entregues / f.total) * 100;
            }
            return f;
        })
        .filter(f => f.total >= 3) // Apenas fornecedores com pelo menos 3 agendamentos
        .sort((a, b) => b.total - a.total) // Ordenar por total de agendamentos
        .slice(0, 10); // Top 10
}

function calcularVariacaoPercentual(atual, anterior) {
    if (anterior === 0) {
        return atual > 0 ? 100 : 0;
    }
    return ((atual - anterior) / anterior) * 100;
}

function formatarVariacao(variacao) {
    const valor = Math.abs(variacao).toFixed(1);
    const sinal = variacao >= 0 ? '+' : '-';
    const classe = variacao >= 0 ? 'text-green-600' : 'text-red-600';
    
    return `<span class="${classe}">${sinal}${valor}%</span>`;
}

function formatarVariacaoSimples(variacao) {
    const valor = Math.abs(variacao).toFixed(0);
    const sinal = variacao >= 0 ? '+' : '-';
    return `${sinal}${valor}%`;
}

function atualizarKPIs(agendamentos, agendamentosAnteriores) {
    try {
        // Verificar se temos dados reais ou devemos usar dados simulados
        let atual, anterior;
        
        if (agendamentos && agendamentosAnteriores) {
            // Processar dados reais do banco
            console.log("Atualizando KPIs com dados reais do banco");
            
            // Calcular métricas do período atual
            atual = {
                total: agendamentos.length,
                entregues: agendamentos.filter(a => a.status === 'ENTREGUE').length,
                confirmados: agendamentos.filter(a => a.status === 'CONFIRMADO').length,
                ausencias: agendamentos.filter(a => a.status === 'AUSENTE').length,
                pendentes: agendamentos.filter(a => a.status === 'PENDENTE').length,
                cancelados: agendamentos.filter(a => a.status === 'CANCELADO').length
            };
            
            // Calcular taxas
            atual.taxaEntrega = atual.total > 0 ? (atual.entregues / atual.total) * 100 : 0;
            atual.taxaAusencia = atual.total > 0 ? (atual.ausencias / atual.total) * 100 : 0;
            
            // Calcular tempo médio de resposta (em horas)
            const temposSomados = agendamentos
                .filter(a => a.dataConfirmacao && a.dataCriacao) // Apenas agendamentos com datas válidas
                .map(a => {
                    const criacao = new Date(a.dataCriacao);
                    const confirmacao = new Date(a.dataConfirmacao);
                    return (confirmacao - criacao) / (1000 * 60 * 60); // Converter para horas
                });
            
            atual.tempoMedioResposta = temposSomados.length > 0 
                ? temposSomados.reduce((sum, tempo) => sum + tempo, 0) / temposSomados.length 
                : 0;
            
            // Calcular métricas do período anterior
            anterior = {
                total: agendamentosAnteriores.length,
                entregues: agendamentosAnteriores.filter(a => a.status === 'ENTREGUE').length,
                confirmados: agendamentosAnteriores.filter(a => a.status === 'CONFIRMADO').length,
                ausencias: agendamentosAnteriores.filter(a => a.status === 'AUSENTE').length,
                pendentes: agendamentosAnteriores.filter(a => a.status === 'PENDENTE').length,
                cancelados: agendamentosAnteriores.filter(a => a.status === 'CANCELADO').length
            };
            
            // Calcular taxas para o período anterior
            anterior.taxaEntrega = anterior.total > 0 ? (anterior.entregues / anterior.total) * 100 : 0;
            anterior.taxaAusencia = anterior.total > 0 ? (anterior.ausencias / anterior.total) * 100 : 0;
            
            // Calcular tempo médio de resposta para o período anterior (em horas)
            const temposSomadosAnteriores = agendamentosAnteriores
                .filter(a => a.dataConfirmacao && a.dataCriacao)
                .map(a => {
                    const criacao = new Date(a.dataCriacao);
                    const confirmacao = new Date(a.dataConfirmacao);
                    return (confirmacao - criacao) / (1000 * 60 * 60);
                });
            
            anterior.tempoMedioResposta = temposSomadosAnteriores.length > 0 
                ? temposSomadosAnteriores.reduce((sum, tempo) => sum + tempo, 0) / temposSomadosAnteriores.length 
                : 0;
            
        } else {
            // Se não temos agendamentos reais, mas estamos em modo de dados reais,
            // vamos inicializar com valores zerados em vez de simulados
            console.warn("Dados reais não estão disponíveis. Inicializando com valores zerados.");
            
            // Dados do período atual zerados
            atual = {
                total: 0,
                entregues: 0,
                confirmados: 0,
                ausencias: 0,
                pendentes: 0,
                taxaEntrega: 0,
                taxaAusencia: 0,
                tempoMedioResposta: 0
            };
            
            // Dados do período anterior também zerados
            anterior = {
                total: 0,
                entregues: 0,
                confirmados: 0,
                ausencias: 0,
                pendentes: 0,
                taxaEntrega: 0,
                taxaAusencia: 0,
                tempoMedioResposta: 0
            };
            
            // Notificar o usuário sobre a falta de dados
            showNotification("Não há dados disponíveis para o período selecionado. Tente outro período ou verifique a conexão com o banco de dados.", "warning");
        }
        
        // Cálculo de variações
        const variacaoTotal = calcularVariacaoPercentual(atual.total, anterior.total);
        const variacaoEntrega = calcularVariacaoPercentual(atual.taxaEntrega, anterior.taxaEntrega);
        const variacaoAusencia = calcularVariacaoPercentual(atual.taxaAusencia, anterior.taxaAusencia);
        const variacaoTempo = calcularVariacaoPercentual(atual.tempoMedioResposta, anterior.tempoMedioResposta);
        
        // Ocupação do CD simulada (não há dados reais sobre isso)
        const ocupacaoCD = Math.floor(Math.random() * 40) + 60; // 60% a 100%
        const variacaoOcupacao = Math.floor(Math.random() * 20) - 10; // -10% a +10%
        
        // Atualizar KPIs principais
        const totalAgendamentos = document.getElementById('kpi-total-agendamentos');
        if (totalAgendamentos) totalAgendamentos.textContent = atual.total;
        
        const totalTrend = document.getElementById('kpi-total-trend');
        if (totalTrend) {
            totalTrend.textContent = formatarVariacaoSimples(variacaoTotal);
            totalTrend.className = `text-xs px-2 py-1 rounded-full ${variacaoTotal >= 0 ? 'bg-orange-500' : 'bg-red-500'} text-white font-bold`;
        }
        
        const taxaEntrega = document.getElementById('kpi-taxa-entrega');
        if (taxaEntrega) taxaEntrega.textContent = `${atual.taxaEntrega.toFixed(1)}%`;
        
        const entregaTrend = document.getElementById('kpi-entrega-trend');
        if (entregaTrend) {
            entregaTrend.textContent = formatarVariacaoSimples(variacaoEntrega);
            entregaTrend.className = `text-xs px-2 py-1 rounded-full ${variacaoEntrega >= 0 ? 'bg-emerald-500' : 'bg-red-500'} text-white font-bold`;
        }
        
        const taxaAusencia = document.getElementById('kpi-taxa-ausencia');
        if (taxaAusencia) taxaAusencia.textContent = `${atual.taxaAusencia.toFixed(1)}%`;
        
        const ausenciaTrend = document.getElementById('kpi-ausencia-trend');
        if (ausenciaTrend) {
            ausenciaTrend.textContent = formatarVariacaoSimples(-variacaoAusencia); // Invertido, pois menos ausência é melhor
            ausenciaTrend.className = `text-xs px-2 py-1 rounded-full ${variacaoAusencia <= 0 ? 'bg-green-500' : 'bg-red-500'} text-white font-bold`;
        }
        
        const tempoResposta = document.getElementById('kpi-tempo-resposta');
        if (tempoResposta) tempoResposta.textContent = `${atual.tempoMedioResposta.toFixed(1)}h`;
        
        const tempoTrend = document.getElementById('kpi-tempo-trend');
        if (tempoTrend) {
            tempoTrend.textContent = formatarVariacaoSimples(-variacaoTempo); // Invertido, pois menos tempo é melhor
            tempoTrend.className = `text-xs px-2 py-1 rounded-full ${variacaoTempo <= 0 ? 'bg-blue-500' : 'bg-red-500'} text-white font-bold`;
        }
        
        // Ocupação do CD (simulada)
        const ocupacaoAtual = document.getElementById('kpi-ocupacao-atual');
        if (ocupacaoAtual) ocupacaoAtual.textContent = `${ocupacaoCD}%`;
        
        const ocupacaoTrend = document.getElementById('kpi-ocupacao-trend');
        if (ocupacaoTrend) {
            ocupacaoTrend.textContent = formatarVariacaoSimples(variacaoOcupacao);
            ocupacaoTrend.className = `text-xs px-2 py-1 rounded-full ${Math.abs(variacaoOcupacao) < 5 ? 'bg-purple-500' : (variacaoOcupacao > 5 ? 'bg-red-500' : 'bg-green-500')} text-white font-bold`;
        }
        
        // Atualizar contadores e informações adicionais
        const entregaCount = document.getElementById('kpi-entrega-count');
        if (entregaCount) entregaCount.textContent = `${atual.entregues} entregas`;
        
        const ausenciaCount = document.getElementById('kpi-ausencia-count');
        if (ausenciaCount) ausenciaCount.textContent = `${atual.ausencias} ausências`;
        
        // Barras de progresso
        const totalProgressBar = document.getElementById('kpi-total-progress');
        if (totalProgressBar) {
            const meta = 150; // Meta fixa para exemplo
            const porcentagemMeta = Math.min(Math.round((atual.total / meta) * 100), 100);
            totalProgressBar.style.width = `${porcentagemMeta}%`;
        }
        
        const entregaProgressBar = document.getElementById('kpi-entrega-progress');
        if (entregaProgressBar) {
            const metaEntrega = 95; // Meta fixa para exemplo
            const porcentagemMetaEntrega = Math.min(Math.round((atual.taxaEntrega / metaEntrega) * 100), 100);
            entregaProgressBar.style.width = `${porcentagemMetaEntrega}%`;
        }
        
        const ausenciaProgressBar = document.getElementById('kpi-ausencia-progress');
        if (ausenciaProgressBar) {
            // Para ausência, é melhor estar abaixo da meta
            const metaAusencia = 5; // Meta fixa para exemplo
            const porcentagemMetaAusencia = Math.min(Math.round((atual.taxaAusencia / metaAusencia) * 100), 100);
            ausenciaProgressBar.style.width = `${porcentagemMetaAusencia}%`;
        }
        
        const tempoProgressBar = document.getElementById('kpi-tempo-progress');
        if (tempoProgressBar) {
            // Para tempo, é melhor estar abaixo da meta
            const metaTempo = 4; // Meta fixa para exemplo
            const porcentagemMetaTempo = Math.min(Math.round((atual.tempoMedioResposta / metaTempo) * 100), 100);
            tempoProgressBar.style.width = `${porcentagemMetaTempo}%`;
        }
        
        const ocupacaoProgressBar = document.getElementById('kpi-ocupacao-progress');
        if (ocupacaoProgressBar) {
            const metaOcupacao = 85; // Meta fixa para exemplo
            const porcentagemMetaOcupacao = Math.min(Math.round((ocupacaoCD / metaOcupacao) * 100), 100);
            ocupacaoProgressBar.style.width = `${porcentagemMetaOcupacao}%`;
        }
        
    } catch (error) {
        console.error("Erro ao atualizar KPIs:", error);
        showNotification("Erro ao atualizar indicadores. Verifique o console para detalhes.", "error");
    }
}

function atualizarDadosCompletos() {
    try {
        atualizarInsights();
    } catch (error) {
        console.warn('Erro ao atualizar insights:', error);
    }
    
    // Atualizar indicadores de negócio
    try {
        atualizarIndicadoresNegocio();
    } catch (error) {
        console.warn('Erro ao atualizar indicadores de negócio:', error);
    }
}

function atualizarGraficos() {
    // Função auxiliar para normalizar os status (duplicada para usar aqui também)
    function normalizarStatus(status) {
        if (!status) return 'desconhecido';
        
        const statusLower = status.toLowerCase();
        
        // Mapeamento de diferentes possíveis status para valores normalizados
        if (statusLower.includes('entreg')) return 'entregue';
        if (statusLower.includes('nao-veio') || statusLower.includes('ausente') || statusLower.includes('ausência')) return 'nao-veio';
        if (statusLower.includes('confirm')) return 'confirmado';
        if (statusLower.includes('pend')) return 'pendente';
        if (statusLower.includes('canc')) return 'cancelado';
        if (statusLower.includes('agend')) return 'agendado';
        if (statusLower.includes('aguard')) return 'aguardando';
        if (statusLower.includes('reagend')) return 'reagendamento';
        
        return statusLower;
    }
    
    // Dados para o gráfico de status
    const statusData = {
        pendente: 0,
        confirmado: 0,
        entregue: 0,
        'nao-veio': 0,
        reagendamento: 0,
        cancelado: 0,
        aguardando: 0,
        desconhecido: 0
    };
    
    kpiData.periodoAtual.agendamentos.forEach(agendamento => {
        const statusNormalizado = normalizarStatus(agendamento.status);
        if (statusData[statusNormalizado] !== undefined) {
            statusData[statusNormalizado]++;
        } else {
            statusData.desconhecido++;
        }
    });
    
    // Dados para o gráfico de dia da semana
    const diasSemanaData = {
        0: 0, // Domingo
        1: 0, // Segunda
        2: 0, // Terça
        3: 0, // Quarta
        4: 0, // Quinta
        5: 0, // Sexta
        6: 0  // Sábado
    };
    
    kpiData.periodoAtual.agendamentos.forEach(agendamento => {
        const dataEntrega = new Date(agendamento.dataEntrega);
        const diaSemana = dataEntrega.getDay();
        diasSemanaData[diaSemana]++;
    });
    
    // Dados para gráfico de tendência semanal
    calcularTendenciaSemanal();
    
    // Dados para distribuição de horários
    calcularDistribuicaoHorarios();
    
    // Renderizar gráficos se o Chart.js estiver disponível
    if (typeof Chart !== 'undefined') {
        renderizarGraficoStatus(statusData);
        renderizarGraficoDiaSemana(diasSemanaData);
        renderizarGraficoTendencia();
        renderizarGraficoHorarios();
        renderizarGraficoDesempenhoFornecedores();
    } else {
        // Chart.js não está carregado, mostrar dados em texto
        mostrarPlaceholderGraficos(statusData, diasSemanaData);
    }
}

function calcularTendenciaSemanal() {
    // Organizar dados por semana
    const agendamentosPorSemana = {};
    
    kpiData.periodoAtual.agendamentos.forEach(agendamento => {
        const dataEntrega = new Date(agendamento.dataEntrega);
        // Calcular o número da semana (ano + semana)
        const ano = dataEntrega.getFullYear();
        const inicioAno = new Date(ano, 0, 1);
        const dias = Math.floor((dataEntrega - inicioAno) / (24 * 60 * 60 * 1000));
        const semana = Math.ceil(dias / 7);
        const chave = `${ano}-${semana}`;
        
        if (!agendamentosPorSemana[chave]) {
            agendamentosPorSemana[chave] = {
                dataInicio: new Date(dataEntrega.getTime()),
                total: 0,
                entregues: 0,
                ausencias: 0
            };
            // Ajustar para o início da semana (domingo)
            agendamentosPorSemana[chave].dataInicio.setDate(dataEntrega.getDate() - dataEntrega.getDay());
        }
        
        agendamentosPorSemana[chave].total++;
        
        if (agendamento.status === 'entregue') {
            agendamentosPorSemana[chave].entregues++;
        } else if (agendamento.status === 'nao-veio') {
            agendamentosPorSemana[chave].ausencias++;
        }
    });
    
    // Ordenar por data e converter para array
    kpiData.tendencias.entregasSemanais = Object.values(agendamentosPorSemana)
        .sort((a, b) => a.dataInicio - b.dataInicio)
        .map(semana => ({
            dataInicio: semana.dataInicio,
            dataFormatada: `${semana.dataInicio.getDate()}/${semana.dataInicio.getMonth() + 1}`,
            total: semana.total,
            entregues: semana.entregues,
            ausencias: semana.ausencias,
            taxaEntrega: semana.total > 0 ? (semana.entregues / semana.total) * 100 : 0
        }));
}

function calcularDistribuicaoHorarios() {
    // Resetar dados
    kpiData.tendencias.distribuicaoHorarios = {};
    
    // Contagem por horário
    kpiData.periodoAtual.agendamentos.forEach(agendamento => {
        const horario = agendamento.horarioEntrega;
        
        if (!horario) return;
        
        // Normalizar o formato do horário (HH:MM)
        let horarioNormalizado = horario;
        if (horario.match(/^\d{1,2}$/)) {
            horarioNormalizado = `${horario}:00`; // Adicionar minutos se só tiver hora
        }
        
        if (!kpiData.tendencias.distribuicaoHorarios[horarioNormalizado]) {
            kpiData.tendencias.distribuicaoHorarios[horarioNormalizado] = {
                total: 0,
                entregues: 0,
                ausencias: 0
            };
        }
        
        kpiData.tendencias.distribuicaoHorarios[horarioNormalizado].total++;
        
        if (agendamento.status === 'entregue') {
            kpiData.tendencias.distribuicaoHorarios[horarioNormalizado].entregues++;
        } else if (agendamento.status === 'nao-veio') {
            kpiData.tendencias.distribuicaoHorarios[horarioNormalizado].ausencias++;
        }
    });
}

function renderizarGraficoStatus(statusData) {
    const ctx = document.getElementById('grafico-status');
    
    if (!ctx) return;
    
    // Limpar conteúdo anterior
    ctx.innerHTML = '';
    
    // Criar canvas
    const canvas = document.createElement('canvas');
    ctx.appendChild(canvas);
    
    // Cores do tema laranja
    const cores = {
        pendente: '#ff8c00',      // Laranja
        confirmado: '#4caf50',    // Verde
        entregue: '#2196f3',      // Azul
        'nao-veio': '#f44336',    // Vermelho
        reagendamento: '#9c27b0'  // Roxo
    };
    
    new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Pendente', 'Confirmado', 'Entregue', 'Não Veio', 'Reagendamento'],
            datasets: [{
                data: [
                    statusData.pendente,
                    statusData.confirmado,
                    statusData.entregue,
                    statusData['nao-veio'],
                    statusData.reagendamento
                ],
                backgroundColor: [
                    cores.pendente,
                    cores.confirmado,
                    cores.entregue,
                    cores['nao-veio'],
                    cores.reagendamento
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#333333',
                        padding: 10,
                        font: {
                            size: 11
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Distribuição por Status',
                    color: '#333333',
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    padding: {
                        top: 10,
                        bottom: 15
                    }
                }
            }
        }
    });
}

function renderizarGraficoDiaSemana(diasSemanaData) {
    const ctx = document.getElementById('grafico-dia-semana');
    
    if (!ctx) return;
    
    // Limpar conteúdo anterior
    ctx.innerHTML = '';
    
    // Criar canvas
    const canvas = document.createElement('canvas');
    ctx.appendChild(canvas);
    
    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
            datasets: [{
                label: 'Agendamentos',
                data: [
                    diasSemanaData[0],
                    diasSemanaData[1],
                    diasSemanaData[2],
                    diasSemanaData[3],
                    diasSemanaData[4],
                    diasSemanaData[5],
                    diasSemanaData[6]
                ],
                backgroundColor: 'rgba(255, 140, 0, 0.7)',
                borderColor: 'rgba(255, 140, 0, 1)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Agendamentos por Dia da Semana',
                    color: '#333333',
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    padding: {
                        top: 10,
                        bottom: 15
                    }
                }
            }
        }
    });
}

function renderizarGraficoDiaSemana(agendamentos) {
    const ctx = document.getElementById('grafico-dia-semana');
    if (!ctx) {
        console.warn('Elemento do gráfico de dia da semana não encontrado');
        return;
    }
    
    // Dados para o gráfico de dia da semana
    const diasSemanaData = {
        0: 0, // Domingo
        1: 0, // Segunda
        2: 0, // Terça
        3: 0, // Quarta
        4: 0, // Quinta
        5: 0, // Sexta
        6: 0  // Sábado
    };
    
    // Processar agendamentos por dia da semana
    if (agendamentos && agendamentos.length > 0) {
        agendamentos.forEach(agendamento => {
            const data = new Date(agendamento.dataEntrega);
            const diaSemana = data.getDay();
            diasSemanaData[diaSemana]++;
        });
    } else {
        // Dados simulados
        diasSemanaData[0] = 5;   // Domingo
        diasSemanaData[1] = 28;  // Segunda
        diasSemanaData[2] = 32;  // Terça
        diasSemanaData[3] = 42;  // Quarta
        diasSemanaData[4] = 35;  // Quinta
        diasSemanaData[5] = 25;  // Sexta
        diasSemanaData[6] = 10;  // Sábado
    }
    
    // Criar ou atualizar gráfico
    if (window.graficoDiaSemana) {
        window.graficoDiaSemana.data.datasets[0].data = [
            diasSemanaData[0], diasSemanaData[1], diasSemanaData[2], 
            diasSemanaData[3], diasSemanaData[4], diasSemanaData[5], 
            diasSemanaData[6]
        ];
        window.graficoDiaSemana.update();
    } else {
        window.graficoDiaSemana = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
                datasets: [{
                    label: 'Agendamentos',
                    data: [
                        diasSemanaData[0],
                        diasSemanaData[1],
                        diasSemanaData[2],
                        diasSemanaData[3],
                        diasSemanaData[4],
                        diasSemanaData[5],
                        diasSemanaData[6]
                    ],
                    backgroundColor: '#ff8c00',
                    borderColor: '#e67e00',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            precision: 0,
                            color: '#666666'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#666666'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Volume por Dia da Semana',
                        color: '#666666',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: {
                            top: 10,
                            bottom: 15
                        }
                    }
                }
            }
        });
    }
}

function renderizarGraficoTendencia() {
    const ctx = document.getElementById('grafico-tendencia');
    
    if (!ctx) return;
    
    // Limpar conteúdo anterior
    ctx.innerHTML = '';
    
    // Verificar se há dados suficientes
    if (kpiData.tendencias.entregasSemanais.length < 2) {
        ctx.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-chart-line text-3xl mb-2"></i>
                <p>Dados insuficientes para gerar tendência</p>
            </div>
        `;
        return;
    }
    
    // Criar canvas
    const canvas = document.createElement('canvas');
    ctx.appendChild(canvas);
    
    // Preparar dados
    const labels = kpiData.tendencias.entregasSemanais.map(semana => semana.dataFormatada);
    const totais = kpiData.tendencias.entregasSemanais.map(semana => semana.total);
    const taxas = kpiData.tendencias.entregasSemanais.map(semana => semana.taxaEntrega);
    
    new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Agendamentos',
                    data: totais,
                    borderColor: '#ff8c00',
                    backgroundColor: 'rgba(255, 140, 0, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'y'
                },
                {
                    label: 'Taxa de Entrega (%)',
                    data: taxas,
                    borderColor: '#4caf50',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.3,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    position: 'left',
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        precision: 0,
                        color: '#666666'
                    },
                    title: {
                        display: true,
                        text: 'Quantidade',
                        color: '#666666'
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    grid: {
                        display: false
                    },
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        },
                        color: '#666666'
                    },
                    title: {
                        display: true,
                        text: 'Taxa',
                        color: '#666666'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#666666'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#333333',
                        padding: 10,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                title: {
                    display: true,
                    text: 'Tendência de Entregas',
                    color: '#333333',
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    padding: {
                        top: 10,
                        bottom: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            if (context.datasetIndex === 1) {
                                return `${label}: ${value.toFixed(1)}%`;
                            }
                            return `${label}: ${value}`;
                        }
                    }
                }
            }
        }
    });
}

function renderizarGraficoHorarios() {
    const ctx = document.getElementById('grafico-horarios');
    
    if (!ctx) return;
    
    // Limpar conteúdo anterior
    ctx.innerHTML = '';
    
    // Verificar se há dados suficientes
    if (Object.keys(kpiData.tendencias.distribuicaoHorarios).length === 0) {
        ctx.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-clock text-3xl mb-2"></i>
                <p>Dados insuficientes para análise de horários</p>
            </div>
        `;
        return;
    }
    
    // Criar canvas
    const canvas = document.createElement('canvas');
    ctx.appendChild(canvas);
    
    // Ordenar horários e preparar dados
    const horarios = Object.keys(kpiData.tendencias.distribuicaoHorarios).sort();
    const dados = horarios.map(h => kpiData.tendencias.distribuicaoHorarios[h].total);
    const taxaEntrega = horarios.map(h => {
        const item = kpiData.tendencias.distribuicaoHorarios[h];
        return item.total > 0 ? (item.entregues / item.total) * 100 : 0;
    });
    
    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: horarios,
            datasets: [
                {
                    label: 'Agendamentos',
                    data: dados,
                    backgroundColor: 'rgba(255, 140, 0, 0.7)',
                    borderColor: 'rgba(255, 140, 0, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                    order: 1
                },
                {
                    label: 'Taxa de Entrega (%)',
                    data: taxaEntrega,
                    type: 'line',
                    borderColor: '#4caf50',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointBackgroundColor: '#4caf50',
                    pointRadius: 3,
                    tension: 0.3,
                    yAxisID: 'y1',
                    order: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    position: 'left',
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        precision: 0,
                        color: '#666666'
                    },
                    title: {
                        display: true,
                        text: 'Quantidade',
                        color: '#666666'
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    grid: {
                        display: false
                    },
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        },
                        color: '#666666'
                    },
                    title: {
                        display: true,
                        text: 'Taxa',
                        color: '#666666'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#666666'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#333333',
                        padding: 10,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                title: {
                    display: true,
                    text: 'Distribuição por Horário',
                    color: '#333333',
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                }
            }
        }
    });
}

function renderizarGraficoDesempenhoFornecedores() {
    const ctx = document.getElementById('grafico-fornecedores');
    
    if (!ctx) return;
    
    // Limpar conteúdo anterior
    ctx.innerHTML = '';
    
    // Verificar se há dados suficientes
    if (kpiData.topFornecedores.length < 3) {
        ctx.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-building text-3xl mb-2"></i>
                <p>Dados insuficientes para análise de fornecedores</p>
            </div>
        `;
        return;
    }
    
    // Criar canvas
    const canvas = document.createElement('canvas');
    ctx.appendChild(canvas);
    
    // Limitar aos top 5 fornecedores
    const top5 = kpiData.topFornecedores.slice(0, 5);
    
    // Preparar dados
    const labels = top5.map(f => f.nome.length > 15 ? f.nome.substring(0, 12) + '...' : f.nome);
    const totais = top5.map(f => f.total);
    const taxas = top5.map(f => f.taxaEntrega);
    
    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Agendamentos',
                    data: totais,
                    backgroundColor: 'rgba(255, 140, 0, 0.7)',
                    borderColor: 'rgba(255, 140, 0, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                    yAxisID: 'y'
                },
                {
                    label: 'Taxa de Entrega (%)',
                    data: taxas,
                    type: 'line',
                    borderColor: '#4caf50',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.3,
                    pointStyle: 'circle',
                    pointRadius: 4,
                    pointBackgroundColor: '#4caf50',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        color: '#666666'
                    }
                },
                x: {
                    beginAtZero: true,
                    position: 'bottom',
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        precision: 0,
                        color: '#666666'
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'top',
                    grid: {
                        display: false
                    },
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        },
                        color: '#e0e0e0'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#e0e0e0',
                        padding: 10,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                title: {
                    display: true,
                    text: 'Top 5 Fornecedores',
                    color: '#e0e0e0',
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    padding: {
                        top: 10,
                        bottom: 15
                    }
                }
            }
        }
    });
}

function mostrarPlaceholderGraficos(statusData, diasSemanaData) {
    // Placeholder para quando o Chart.js não está disponível
    document.getElementById('grafico-status').innerHTML = `
        <div class="text-center py-8 text-gray-400">
            <i class="fas fa-chart-pie text-3xl mb-2"></i>
            <p>Biblioteca Chart.js não encontrada.</p>
        </div>
    `;
    
    document.getElementById('grafico-dia-semana').innerHTML = `
        <div class="text-center py-8 text-gray-400">
            <i class="fas fa-chart-bar text-3xl mb-2"></i>
            <p>Biblioteca Chart.js não encontrada.</p>
        </div>
    `;
    
    document.getElementById('grafico-tendencia').innerHTML = `
        <div class="text-center py-8 text-gray-400">
            <i class="fas fa-chart-line text-3xl mb-2"></i>
            <p>Biblioteca Chart.js não encontrada.</p>
        </div>
    `;
    
    document.getElementById('grafico-horarios').innerHTML = `
        <div class="text-center py-8 text-gray-400">
            <i class="fas fa-clock text-3xl mb-2"></i>
            <p>Biblioteca Chart.js não encontrada.</p>
        </div>
    `;
}

function atualizarTabelaFornecedores() {
    const tbody = document.getElementById('tabela-fornecedores');
    
    if (!tbody) {
        console.warn('Elemento tabela-fornecedores não encontrado');
        return;
    }
    
    if (kpiData.topFornecedores.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-4 py-4 text-center text-gray-500">
                    Nenhum dado de fornecedor encontrado para o período selecionado.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = kpiData.topFornecedores.map(fornecedor => `
        <tr class="border-b border-gray-200 hover:bg-orange-50/50">
            <td class="px-4 py-3 whitespace-nowrap">
                <div class="font-medium text-gray-800">${fornecedor.nome}</div>
            </td>
            <td class="px-4 py-3 text-center whitespace-nowrap">
                <span class="font-semibold text-gray-700">${fornecedor.total}</span>
            </td>
            <td class="px-4 py-3 text-center whitespace-nowrap">
                <span class="font-semibold text-green-600">${fornecedor.entregues}</span>
            </td>
            <td class="px-4 py-3 text-center whitespace-nowrap">
                <span class="font-semibold text-red-600">${fornecedor.ausencias}</span>
            </td>
            <td class="px-4 py-3 text-center whitespace-nowrap">
                <div class="flex items-center justify-center">
                    <div class="w-full max-w-[80px] bg-gray-200 rounded-full h-2.5 mr-2">
                        <div class="h-2.5 rounded-full ${getBarColorClass(fornecedor.taxaEntrega)}" style="width: ${Math.min(100, fornecedor.taxaEntrega)}%"></div>
                    </div>
                    <span class="font-semibold ${fornecedor.taxaEntrega >= 80 ? 'text-green-600' : fornecedor.taxaEntrega >= 50 ? 'text-yellow-600' : 'text-red-600'}">
                        ${fornecedor.taxaEntrega.toFixed(1)}%
                    </span>
                </div>
            </td>
        </tr>
    `).join('');
}

function getBarColorClass(value) {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-lime-500';
    if (value >= 40) return 'bg-yellow-500';
    if (value >= 20) return 'bg-orange-500';
    return 'bg-red-500';
}

function atualizarInsights() {
    const container = document.getElementById('insight-panel');
    if (!container) {
        console.warn('Elemento insight-panel não encontrado');
        return;
    }
    
    // Calcular insights
    const insights = calcularInsights();
    
    // Renderizar insights
    container.innerHTML = `
        <div class="space-y-4">
            ${insights.map(insight => `
                <div class="bg-orange-50 border border-orange-100 rounded-lg p-4 flex items-start">
                    <div class="text-${insight.cor}-600 mr-3 mt-1">
                        <i class="${insight.icone} text-lg"></i>
                    </div>
                    <div>
                        <h4 class="font-semibold text-gray-800 mb-1">${insight.titulo}</h4>
                        <p class="text-sm text-gray-600">${insight.descricao}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function calcularInsights() {
    const insights = [];
    const atual = kpiData.periodoAtual.metricas;
    const anterior = kpiData.periodoAnterior.metricas;
    
    // Insight 1: Melhores dias
    if (kpiData.periodoAtual.agendamentos.length > 0) {
        // Agrupamento por dia da semana
        const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const entregas = {0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0};
        const agendamentos = {0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0};
        
        kpiData.periodoAtual.agendamentos.forEach(agendamento => {
            const dataEntrega = new Date(agendamento.dataEntrega);
            const diaSemana = dataEntrega.getDay();
            agendamentos[diaSemana]++;
            if (agendamento.status === 'entregue') {
                entregas[diaSemana]++;
            }
        });
        
        // Encontrar dia com maior taxa de entrega (com pelo menos 3 agendamentos)
        let melhorDia = -1;
        let melhorTaxa = 0;
        
        for (let i = 0; i < 7; i++) {
            if (agendamentos[i] >= 3) {
                const taxa = (entregas[i] / agendamentos[i]) * 100;
                if (taxa > melhorTaxa) {
                    melhorTaxa = taxa;
                    melhorDia = i;
                }
            }
        }
        
        if (melhorDia >= 0) {
            insights.push({
                titulo: 'Melhor dia para entregas',
                descricao: `${diasSemana[melhorDia]} é o dia com maior taxa de entrega (${melhorTaxa.toFixed(1)}%) no período analisado.`,
                icone: 'fas fa-calendar-check',
                cor: 'green'
            });
        }
    }
    
    // Insight 2: Tendência de volume
    if (kpiData.tendencias.entregasSemanais.length >= 2) {
        const ultimasSemanas = kpiData.tendencias.entregasSemanais.slice(-3);
        const primeiraSemana = ultimasSemanas[0].total;
        const ultimaSemana = ultimasSemanas[ultimasSemanas.length - 1].total;
        
        const variacao = calcularVariacaoPercentual(ultimaSemana, primeiraSemana);
        
        if (Math.abs(variacao) >= 10) {
            insights.push({
                titulo: 'Tendência de volume',
                descricao: `O volume de agendamentos ${variacao > 0 ? 'aumentou' : 'diminuiu'} ${Math.abs(variacao).toFixed(1)}% nas últimas semanas.`,
                icone: variacao > 0 ? 'fas fa-chart-line' : 'fas fa-chart-line-down',
                cor: variacao > 0 ? 'blue' : 'yellow'
            });
        }
    }
    
    // Insight 3: Horário de pico
    if (Object.keys(kpiData.tendencias.distribuicaoHorarios).length > 0) {
        let horarioPico = '';
        let volumePico = 0;
        
        for (const [horario, dados] of Object.entries(kpiData.tendencias.distribuicaoHorarios)) {
            if (dados.total > volumePico) {
                volumePico = dados.total;
                horarioPico = horario;
            }
        }
        
        if (horarioPico) {
            insights.push({
                titulo: 'Horário de maior movimento',
                descricao: `O horário ${horarioPico} concentra o maior volume de agendamentos (${volumePico}).`,
                icone: 'fas fa-clock',
                cor: 'orange'
            });
        }
    }
    
    // Insight 4: Fornecedor destaque
    if (kpiData.topFornecedores.length > 0) {
        // Encontrar fornecedor com melhor desempenho (mais entregas e alta taxa)
        const fornecedoresAtivos = kpiData.topFornecedores.filter(f => f.total >= 5);
        
        if (fornecedoresAtivos.length > 0) {
            const melhorFornecedor = fornecedoresAtivos.sort((a, b) => {
                // Pontuação: taxa de entrega * 0.7 + volume normalizado * 0.3
                const maxVolume = Math.max(...fornecedoresAtivos.map(f => f.total));
                const pontuacaoA = (a.taxaEntrega * 0.7) + ((a.total / maxVolume) * 100 * 0.3);
                const pontuacaoB = (b.taxaEntrega * 0.7) + ((b.total / maxVolume) * 100 * 0.3);
                return pontuacaoB - pontuacaoA;
            })[0];
            
            insights.push({
                titulo: 'Fornecedor destaque',
                descricao: `${melhorFornecedor.nome} tem a melhor performance com ${melhorFornecedor.taxaEntrega.toFixed(1)}% de taxa de entrega em ${melhorFornecedor.total} agendamentos.`,
                icone: 'fas fa-award',
                cor: 'yellow'
            });
        }
    }
    
    // Insight 5: Comparação com período anterior
    if (atual.total > 0 && anterior.total > 0) {
        const variacaoTaxa = calcularVariacaoPercentual(atual.taxaEntrega, anterior.taxaEntrega);
        
        if (Math.abs(variacaoTaxa) >= 5) {
            insights.push({
                titulo: 'Comparação de desempenho',
                descricao: `A taxa de entrega ${variacaoTaxa >= 0 ? 'melhorou' : 'piorou'} ${Math.abs(variacaoTaxa).toFixed(1)}% em relação ao período anterior.`,
                icone: variacaoTaxa >= 0 ? 'fas fa-thumbs-up' : 'fas fa-thumbs-down',
                cor: variacaoTaxa >= 0 ? 'green' : 'red'
            });
        }
    }
    
    // Se não houver insights, adicionar um genérico
    if (insights.length === 0) {
        insights.push({
            titulo: 'Dados insuficientes',
            descricao: 'Não há dados suficientes para gerar insights relevantes. Tente ampliar o período de análise.',
            icone: 'fas fa-info-circle',
            cor: 'blue'
        });
    }
    
    return insights;
}

function atualizarIndicadoresNegocio() {
    const container = document.getElementById('indicadores-negocio');
    if (!container) {
        console.warn('Elemento indicadores-negocio não encontrado');
        return;
    }
    
    // Calcular indicadores específicos para o negócio
    // 1. Tempo médio entre confirmação e entrega
    // 2. Volume por tipo de carga
    // 3. Taxa de conversão (pendente -> entregue)
    
    // Tempo médio entre confirmação e entrega
    let tempoMedioConfirmacaoEntrega = calcularTempoMedioConfirmacaoEntrega();
    
    // Volume por tipo de carga
    const volumePorTipoCarga = calcularVolumePorTipoCarga();
    
    // Taxa de conversão
    const taxaConversao = calcularTaxaConversao();
    
    // Renderizar indicadores
    container.innerHTML = `
        <div class="bg-white border border-orange-100 rounded-lg p-4 shadow-md">
            <h3 class="text-lg font-bold text-gray-800 border-b border-orange-100 pb-2 mb-3">
                <i class="fas fa-business-time mr-2 text-orange-500"></i>
                Indicadores de Negócio
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Tempo médio entre confirmação e entrega -->
                <div class="p-3 bg-orange-50 rounded-lg">
                    <div class="text-sm text-gray-600 mb-1">Tempo de processamento</div>
                    <div class="flex items-end justify-between">
                        <div class="text-xl font-bold text-gray-800">${tempoMedioConfirmacaoEntrega.toFixed(1)}h</div>
                        <div class="text-xs text-gray-500">Entre confirmação e entrega</div>
                    </div>
                </div>
                
                <!-- Taxa de conversão -->
                <div class="p-3 bg-orange-50 rounded-lg">
                    <div class="text-sm text-gray-600 mb-1">Taxa de conversão</div>
                    <div class="flex items-end justify-between">
                        <div class="text-xl font-bold text-gray-800">${taxaConversao.toFixed(1)}%</div>
                        <div class="text-xs text-gray-500">Pendente → Entregue</div>
                    </div>
                </div>
                
                <!-- Tipo de carga mais comum -->
                <div class="p-3 bg-orange-50 rounded-lg">
                    <div class="text-sm text-gray-600 mb-1">Tipo de carga predominante</div>
                    <div class="flex items-end justify-between">
                        <div class="text-xl font-bold text-gray-800">${volumePorTipoCarga.predominante}</div>
                        <div class="text-xs text-gray-500">${volumePorTipoCarga.percentual.toFixed(1)}% do volume</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function calcularTempoMedioConfirmacaoEntrega() {
    let tempoTotal = 0;
    let contagem = 0;
    
    kpiData.periodoAtual.agendamentos.forEach(agendamento => {
        if (agendamento.status === 'entregue' && agendamento.historicoAcoes && agendamento.historicoAcoes.length > 0) {
            const confirmacao = agendamento.historicoAcoes.find(h => 
                h.acao === 'confirmado' || h.acao === 'agendamento_confirmado');
            
            const entrega = agendamento.historicoAcoes.find(h => 
                h.acao === 'entregue' || h.acao === 'agendamento_entregue');
            
            if (confirmacao && entrega) {
                const dataConfirmacao = new Date(confirmacao.createdAt);
                const dataEntrega = new Date(entrega.createdAt);
                
                // Calcular diferença em horas
                const diffHoras = (dataEntrega - dataConfirmacao) / (1000 * 60 * 60);
                
                if (diffHoras > 0 && diffHoras < 720) { // Filtrar valores extremos (máximo 30 dias)
                    tempoTotal += diffHoras;
                    contagem++;
                }
            }
        }
    });
    
    return contagem > 0 ? tempoTotal / contagem : 0;
}

function calcularVolumePorTipoCarga() {
    const tipos = {};
    let total = 0;
    
    kpiData.periodoAtual.agendamentos.forEach(agendamento => {
        if (agendamento.tipoCarga) {
            const tipoCarga = agendamento.tipoCarga.trim();
            if (!tipos[tipoCarga]) {
                tipos[tipoCarga] = 0;
            }
            tipos[tipoCarga]++;
            total++;
        }
    });
    
    let predominante = 'Não informado';
    let maiorVolume = 0;
    
    for (const [tipo, volume] of Object.entries(tipos)) {
        if (volume > maiorVolume) {
            maiorVolume = volume;
            predominante = tipo;
        }
    }
    
    return {
        predominante: predominante,
        volume: maiorVolume,
        percentual: total > 0 ? (maiorVolume / total) * 100 : 0
    };
}

function calcularTaxaConversao() {
    const pendentes = kpiData.periodoAtual.agendamentos.filter(a => 
        a.status === 'pendente' || a.historicoAcoes?.some(h => h.acao === 'pendente' || h.acao === 'agendamento_criado')
    ).length;
    
    const entregues = kpiData.periodoAtual.agendamentos.filter(a => a.status === 'entregue').length;
    
    return pendentes > 0 ? (entregues / pendentes) * 100 : 0;
}

function aplicarFiltroPeriodoKPI() {
    try {
        // Obter valores do formulário
        const periodoSelect = document.getElementById('kpi-periodo-predefinido');
        const valorPeriodo = periodoSelect.value;
        
        const dataHoje = new Date();
        let dataInicio = new Date();
        let dataFim = new Date();
        
        if (valorPeriodo === 'custom') {
            // Usar datas personalizadas informadas pelo usuário
            const inputDataInicio = document.getElementById('kpi-data-inicio');
            const inputDataFim = document.getElementById('kpi-data-fim');
            
            if (inputDataInicio.value && inputDataFim.value) {
                dataInicio = new Date(inputDataInicio.value);
                dataFim = new Date(inputDataFim.value);
                
                // Validar se as datas são válidas
                if (isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime())) {
                    showNotification('Por favor, selecione datas válidas.', 'error');
                    return;
                }
                
                // Validar se a data inicial é anterior à data final
                if (dataInicio > dataFim) {
                    showNotification('A data inicial deve ser anterior à data final.', 'error');
                    return;
                }
            } else {
                showNotification('Por favor, selecione datas de início e fim para o período personalizado.', 'error');
                return;
            }
        } else {
            // Usar período predefinido
            const dias = parseInt(valorPeriodo);
            if (isNaN(dias)) {
                showNotification('Período inválido selecionado.', 'error');
                return;
            }
            
            dataInicio.setDate(dataHoje.getDate() - dias);
            dataFim = new Date(dataHoje);
        }
        
        // Formatar datas para o formato ISO (YYYY-MM-DD)
        const dataInicioStr = dataInicio.toISOString().split('T')[0];
        const dataFimStr = dataFim.toISOString().split('T')[0];
        
        // Exibir mensagem de carregamento
        showNotification(`Carregando dados KPI para o período de ${dataInicioStr} a ${dataFimStr}...`, 'info');
        
        // Recarregar dados com o novo período
        carregarDadosKPI(dataInicioStr, dataFimStr);
    } catch (error) {
        console.error("Erro ao aplicar filtro de período:", error);
        showNotification("Erro ao aplicar filtro. Verifique o console para detalhes.", "error");
    }
}

// Função para exportar dados KPI para Excel
function exportarDadosKPI() {
    try {
        // Implementar lógica de exportação para Excel
        showNotification("Exportando dados para Excel...", "info");
        
        // Simular exportação bem-sucedida após 2 segundos
        setTimeout(() => {
            const link = document.createElement('a');
            link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent('Dados KPI');
            link.download = 'BrisaLOG_KPI_Report.csv';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification("Exportação concluída!", "success");
        }, 2000);
    } catch (error) {
        console.error("Erro ao exportar dados:", error);
        showNotification("Erro ao exportar dados. Verifique o console para detalhes.", "error");
    }
}

// Função para imprimir relatório KPI em PDF
function imprimirRelatorioKPI() {
    try {
        showNotification("Preparando relatório para impressão...", "info");
        
        // Implementar lógica de geração de PDF
        window.print();
    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        showNotification("Erro ao gerar PDF. Verifique o console para detalhes.", "error");
    }
}

// Função para detectar período predefinido
function detectarPeriodoPredefinido(inicio, fim) {
    let periodoMatchPredefinido = false;
    const periodoSelect = document.getElementById('kpi-periodo-predefinido');
    
    // Calcular diferença em dias
    const diferenca = Math.round((fim - inicio) / (1000 * 60 * 60 * 24));
    
    if (diferenca === 7) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const inicioSete = new Date(hoje);
        inicioSete.setDate(hoje.getDate() - 7);
        
        if (inicio.getTime() === inicioSete.getTime() && fim.getTime() === hoje.getTime()) {
            periodoSelect.value = 'ultimos-7';
            periodoMatchPredefinido = true;
        }
    } else if (diferenca === 30) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const inicioTrinta = new Date(hoje);
        inicioTrinta.setDate(hoje.getDate() - 30);
        
        if (inicio.getTime() === inicioTrinta.getTime() && fim.getTime() === hoje.getTime()) {
            periodoSelect.value = 'ultimos-30';
            periodoMatchPredefinido = true;
        }
    } else if (diferenca === 90) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const inicioNoventa = new Date(hoje);
        inicioNoventa.setDate(hoje.getDate() - 90);
        
        if (inicio.getTime() === inicioNoventa.getTime() && fim.getTime() === hoje.getTime()) {
            periodoSelect.value = 'ultimos-90';
            periodoMatchPredefinido = true;
        }
    } else {
        const hoje = new Date();
        const inicioAno = new Date(hoje.getFullYear(), 0, 1);
        
        if (inicio.getTime() === inicioAno.getTime() && fim.getTime() === hoje.getTime()) {
            periodoSelect.value = 'ano-atual';
            periodoMatchPredefinido = true;
        }
    }
    
    if (!periodoMatchPredefinido) {
        periodoSelect.value = 'custom';
    }
    
    return periodoMatchPredefinido;
}

function exportarDadosKPI(formato = 'csv') {
    try {
        // Obter informações do período
        const dataInicio = document.getElementById('kpi-data-inicio').value;
        const dataFim = document.getElementById('kpi-data-fim').value;
        
        // Formatar datas para exibição
        const dataInicioFormatada = new Date(dataInicio).toLocaleDateString('pt-BR');
        const dataFimFormatada = new Date(dataFim).toLocaleDateString('pt-BR');
        
        // Preparar título do relatório
        const titulo = `Dashboard KPIs - BrisaLOG - Período: ${dataInicioFormatada} até ${dataFimFormatada}`;
        
        if (formato === 'pdf') {
            exportarPDF(titulo, dataInicioFormatada, dataFimFormatada);
        } else {
            exportarCSV(titulo, dataInicioFormatada, dataFimFormatada);
        }
    } catch (error) {
        console.error('Erro ao exportar dados:', error);
        dashboard.showNotification('Erro ao exportar dados', 'error');
    }
}

function exportarCSV(titulo, dataInicioFormatada, dataFimFormatada) {
    // Criar objeto com todos os dados
    const dadosExport = [
        { 'Relatório': titulo },
        { 'Relatório': '' }, // Linha em branco
        { 'Métricas Principais': '' },
        { 
            'Total de Agendamentos': kpiData.periodoAtual.metricas.total,
            'Taxa de Entrega (%)': kpiData.periodoAtual.metricas.taxaEntrega.toFixed(2),
            'Taxa de Ausência (%)': kpiData.periodoAtual.metricas.taxaAusencia.toFixed(2),
            'Tempo Médio Resposta (horas)': kpiData.periodoAtual.metricas.tempoMedioResposta.toFixed(2)
        },
        { 'Relatório': '' }, // Linha em branco
        { 'Indicadores de Negócio': '' },
        {
            'Tempo médio entre confirmação e entrega (horas)': calcularTempoMedioConfirmacaoEntrega().toFixed(2),
            'Taxa de conversão Pendente → Entregue (%)': calcularTaxaConversao().toFixed(2),
            'Tipo de carga predominante': calcularVolumePorTipoCarga().predominante,
            'Percentual do tipo predominante (%)': calcularVolumePorTipoCarga().percentual.toFixed(2)
        },
        { 'Relatório': '' }, // Linha em branco
        { 'Top Fornecedores': '' }
    ];
    
    // Adicionar dados dos fornecedores
    kpiData.topFornecedores.forEach(fornecedor => {
        dadosExport.push({
            'Fornecedor': fornecedor.nome,
            'Total Agendamentos': fornecedor.total,
            'Entregas': fornecedor.entregues,
            'Ausências': fornecedor.ausencias,
            'Taxa de Entrega (%)': fornecedor.taxaEntrega.toFixed(2)
        });
    });
    
    // Adicionar dados de status
    dadosExport.push({ 'Relatório': '' });
    dadosExport.push({ 'Agendamentos por Status': '' });
    
    const statusCounts = {
        'Pendente': 0,
        'Confirmado': 0,
        'Entregue': 0,
        'Não Veio': 0,
        'Reagendamento': 0
    };
    
    kpiData.periodoAtual.agendamentos.forEach(agendamento => {
        switch (agendamento.status) {
            case 'pendente':
                statusCounts['Pendente']++;
                break;
            case 'confirmado':
                statusCounts['Confirmado']++;
                break;
            case 'entregue':
                statusCounts['Entregue']++;
                break;
            case 'nao-veio':
                statusCounts['Não Veio']++;
                break;
            case 'reagendamento':
            case 'aguardando_resposta_fornecedor':
                statusCounts['Reagendamento']++;
                break;
        }
    });
    
    dadosExport.push(statusCounts);
    
    // Adicionar dados por dia da semana
    dadosExport.push({ 'Relatório': '' });
    dadosExport.push({ 'Agendamentos por Dia da Semana': '' });
    
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const diasSemanaCounts = {};
    
    diasSemana.forEach(dia => {
        diasSemanaCounts[dia] = 0;
    });
    
    kpiData.periodoAtual.agendamentos.forEach(agendamento => {
        const dataEntrega = new Date(agendamento.dataEntrega);
        const diaSemana = dataEntrega.getDay();
        diasSemanaCounts[diasSemana[diaSemana]]++;
    });
    
    dadosExport.push(diasSemanaCounts);
    
    // Adicionar tendência semanal
    if (kpiData.tendencias.entregasSemanais.length > 0) {
        dadosExport.push({ 'Relatório': '' });
        dadosExport.push({ 'Tendência Semanal': '' });
        
        kpiData.tendencias.entregasSemanais.forEach(semana => {
            dadosExport.push({
                'Semana': semana.dataFormatada,
                'Total': semana.total,
                'Entregues': semana.entregues,
                'Ausências': semana.ausencias,
                'Taxa de Entrega (%)': semana.taxaEntrega.toFixed(2)
            });
        });
    }
    
    // Converter para CSV e baixar
    dashboard.downloadCSV(dadosExport, `Dashboard_KPIs_${dataInicioFormatada}_ate_${dataFimFormatada}.csv`);
    dashboard.showNotification('Relatório CSV exportado com sucesso!', 'success');
}

function exportarPDF(titulo, dataInicioFormatada, dataFimFormatada) {
    // Verificar se jsPDF está disponível
    if (typeof jspdf === 'undefined' || typeof jspdf.jsPDF === 'undefined') {
        dashboard.showNotification('Biblioteca jsPDF não encontrada. Usando CSV como alternativa.', 'warning');
        exportarCSV(titulo, dataInicioFormatada, dataFimFormatada);
        return;
    }
    
    try {
        const { jsPDF } = jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        // Cores e estilos
        const corLaranja = [255, 140, 0];
        const corCinza = [80, 80, 80];
        const corPreto = [0, 0, 0];
        
        // Configurações de página
        const margemEsquerda = 20;
        const margemDireita = 20;
        const margemTopo = 20;
        let posicaoY = margemTopo;
        const larguraPagina = 210 - margemEsquerda - margemDireita;
        
        // Função para adicionar texto
        function adicionarTexto(texto, tamanho, estilo, cor, x, y, alinhamento = 'left') {
            doc.setFontSize(tamanho);
            doc.setFont('helvetica', estilo);
            doc.setTextColor(...cor);
            doc.text(texto, x, y, { align: alinhamento });
            return doc.getTextDimensions(texto).h + 2;
        }
        
        // Função para verificar se precisa de nova página
        function verificarNovaPagina(alturaConteudo, margemSeguranca = 40) {
            if (posicaoY + alturaConteudo > 297 - margemSeguranca) {
                doc.addPage();
                posicaoY = margemTopo;
                return true;
            }
            return false;
        }
        
        // Função para adicionar linha divisória
        function adicionarLinha(y) {
            doc.setDrawColor(...corLaranja);
            doc.setLineWidth(0.5);
            doc.line(margemEsquerda, y, 210 - margemDireita, y);
            return 3;
        }
        
        // Cabeçalho
        posicaoY += adicionarTexto(titulo, 16, 'bold', corLaranja, margemEsquerda, posicaoY);
        posicaoY += 2;
        posicaoY += adicionarLinha(posicaoY);
        posicaoY += 5;
        
        // Métricas principais
        posicaoY += adicionarTexto('Métricas Principais', 14, 'bold', corPreto, margemEsquerda, posicaoY);
        posicaoY += 6;
        
        // Tabela de métricas
        const metricasKeys = [
            'Total de Agendamentos', 
            'Taxa de Entrega', 
            'Taxa de Ausência', 
            'Tempo Médio Resposta'
        ];
        
        const metricasValues = [
            kpiData.periodoAtual.metricas.total.toString(),
            `${kpiData.periodoAtual.metricas.taxaEntrega.toFixed(1)}%`,
            `${kpiData.periodoAtual.metricas.taxaAusencia.toFixed(1)}%`,
            `${kpiData.periodoAtual.metricas.tempoMedioResposta.toFixed(1)}h`
        ];
        
        // Criar tabela de métricas
        const larguraMetricas = larguraPagina / 2;
        for (let i = 0; i < metricasKeys.length; i++) {
            const y = posicaoY + (i * 7);
            doc.setFillColor(245, 245, 245);
            doc.rect(margemEsquerda, y - 4, larguraMetricas, 6, 'F');
            adicionarTexto(metricasKeys[i], 10, 'normal', corCinza, margemEsquerda + 2, y);
            adicionarTexto(metricasValues[i], 10, 'bold', corPreto, margemEsquerda + larguraMetricas - 5, y, 'right');
        }
        
        posicaoY += (metricasKeys.length * 7) + 5;
        
        // Indicadores de negócio
        verificarNovaPagina(50);
        
        posicaoY += adicionarTexto('Indicadores de Negócio', 14, 'bold', corPreto, margemEsquerda, posicaoY);
        posicaoY += 6;
        
        const indicadoresNegocio = [
            { 
                titulo: 'Tempo de processamento', 
                valor: `${calcularTempoMedioConfirmacaoEntrega().toFixed(1)}h`,
                descricao: 'Entre confirmação e entrega'
            },
            { 
                titulo: 'Taxa de conversão', 
                valor: `${calcularTaxaConversao().toFixed(1)}%`,
                descricao: 'Pendente → Entregue'
            },
            { 
                titulo: 'Tipo de carga predominante', 
                valor: `${calcularVolumePorTipoCarga().predominante}`,
                descricao: `${calcularVolumePorTipoCarga().percentual.toFixed(1)}% do volume`
            }
        ];
        
        // Criar tabela de indicadores
        for (let i = 0; i < indicadoresNegocio.length; i++) {
            const y = posicaoY + (i * 10);
            doc.setFillColor(240, 240, 240);
            doc.rect(margemEsquerda, y - 4, larguraPagina, 9, 'F');
            adicionarTexto(indicadoresNegocio[i].titulo, 10, 'normal', corCinza, margemEsquerda + 2, y - 1);
            adicionarTexto(indicadoresNegocio[i].valor, 12, 'bold', corPreto, margemEsquerda + 2, y + 4);
            adicionarTexto(indicadoresNegocio[i].descricao, 8, 'italic', corCinza, margemEsquerda + larguraPagina - 5, y + 3, 'right');
        }
        
        posicaoY += (indicadoresNegocio.length * 10) + 8;
        
        // Top Fornecedores
        verificarNovaPagina(60);
        
        posicaoY += adicionarTexto('Top Fornecedores', 14, 'bold', corPreto, margemEsquerda, posicaoY);
        posicaoY += 6;
        
        if (kpiData.topFornecedores.length === 0) {
            posicaoY += adicionarTexto('Nenhum dado de fornecedor encontrado para o período selecionado.', 10, 'italic', corCinza, margemEsquerda, posicaoY);
            posicaoY += 5;
        } else {
            // Cabeçalho da tabela
            const colunas = ['Fornecedor', 'Total', 'Entregas', 'Ausências', 'Taxa (%)'];
            const larguras = [0.45, 0.12, 0.15, 0.15, 0.13];
            let xAtual = margemEsquerda;
            
            doc.setFillColor(50, 50, 50);
            doc.rect(margemEsquerda, posicaoY - 4, larguraPagina, 6, 'F');
            
            for (let i = 0; i < colunas.length; i++) {
                const largura = larguraPagina * larguras[i];
                adicionarTexto(colunas[i], 9, 'bold', [255, 255, 255], xAtual + 2, posicaoY);
                xAtual += largura;
            }
            
            posicaoY += 6;
            
            // Limitar a 10 fornecedores
            const fornecedoresExibir = kpiData.topFornecedores.slice(0, 10);
            
            // Linhas da tabela
            for (let i = 0; i < fornecedoresExibir.length; i++) {
                const f = fornecedoresExibir[i];
                xAtual = margemEsquerda;
                
                if (i % 2 === 0) {
                    doc.setFillColor(245, 245, 245);
                    doc.rect(margemEsquerda, posicaoY - 4, larguraPagina, 6, 'F');
                }
                
                // Fornecedor (truncar se muito longo)
                let nomeFornecedor = f.nome;
                if (nomeFornecedor.length > 30) {
                    nomeFornecedor = nomeFornecedor.substring(0, 27) + '...';
                }
                adicionarTexto(nomeFornecedor, 8, 'normal', corPreto, xAtual + 2, posicaoY);
                xAtual += larguraPagina * larguras[0];
                
                // Total
                adicionarTexto(f.total.toString(), 8, 'normal', corPreto, xAtual + 2, posicaoY);
                xAtual += larguraPagina * larguras[1];
                
                // Entregas
                adicionarTexto(f.entregues.toString(), 8, 'normal', [0, 150, 0], xAtual + 2, posicaoY);
                xAtual += larguraPagina * larguras[2];
                
                // Ausências
                adicionarTexto(f.ausencias.toString(), 8, 'normal', [200, 0, 0], xAtual + 2, posicaoY);
                xAtual += larguraPagina * larguras[3];
                
                // Taxa
                const corTaxa = f.taxaEntrega >= 80 ? [0, 150, 0] : (f.taxaEntrega >= 50 ? [200, 150, 0] : [200, 0, 0]);
                adicionarTexto(`${f.taxaEntrega.toFixed(1)}%`, 8, 'normal', corTaxa, xAtual + 2, posicaoY);
                
                posicaoY += 6;
                
                // Verificar se precisa de nova página antes da próxima linha
                if (i < fornecedoresExibir.length - 1) {
                    verificarNovaPagina(10);
                }
            }
        }
        
        // Verificar se cabe o gráfico de status
        verificarNovaPagina(80);
        
        // Distribuição por Status
        posicaoY += adicionarTexto('Distribuição por Status', 14, 'bold', corPreto, margemEsquerda, posicaoY);
        posicaoY += 6;
        
        // Tabela de status em formato de barras
        const statusLabels = ['Pendente', 'Confirmado', 'Entregue', 'Não Veio', 'Reagendamento'];
        const statusCounts = [0, 0, 0, 0, 0];
        
        kpiData.periodoAtual.agendamentos.forEach(agendamento => {
            switch (agendamento.status) {
                case 'pendente': statusCounts[0]++; break;
                case 'confirmado': statusCounts[1]++; break;
                case 'entregue': statusCounts[2]++; break;
                case 'nao-veio': statusCounts[3]++; break;
                case 'reagendamento':
                case 'aguardando_resposta_fornecedor': 
                    statusCounts[4]++; 
                    break;
            }
        });
        
        const totalStatus = statusCounts.reduce((acc, val) => acc + val, 0);
        const statusColors = [
            [255, 140, 0],  // Laranja
            [76, 175, 80],  // Verde
            [33, 150, 243], // Azul
            [244, 67, 54],  // Vermelho
            [156, 39, 176]  // Roxo
        ];
        
        for (let i = 0; i < statusLabels.length; i++) {
            const percentual = totalStatus > 0 ? (statusCounts[i] / totalStatus) * 100 : 0;
            const larguraBarra = (larguraPagina - 50) * (percentual / 100);
            
            doc.setFillColor(...statusColors[i]);
            doc.rect(margemEsquerda + 40, posicaoY - 3, larguraBarra, 5, 'F');
            
            adicionarTexto(statusLabels[i], 8, 'normal', corPreto, margemEsquerda, posicaoY);
            adicionarTexto(`${statusCounts[i]} (${percentual.toFixed(1)}%)`, 8, 'bold', corPreto, margemEsquerda + 50 + larguraBarra, posicaoY);
            
            posicaoY += 8;
        }
        
        // Adicionar rodapé
        doc.setPage(doc.getNumberOfPages());
        const dataGeracao = new Date().toLocaleString('pt-BR');
        adicionarTexto(`Relatório gerado em: ${dataGeracao}`, 8, 'italic', corCinza, margemEsquerda, 287);
        adicionarTexto('BrisaLOG - Sistema de Gestão Logística', 8, 'italic', corCinza, 210 - margemDireita, 287, 'right');
        
        // Salvar o PDF
        doc.save(`Dashboard_KPIs_${dataInicioFormatada}_ate_${dataFimFormatada}.pdf`);
        dashboard.showNotification('Relatório PDF exportado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        dashboard.showNotification('Erro ao gerar PDF. Usando CSV como alternativa.', 'warning');
        exportarCSV(titulo, dataInicioFormatada, dataFimFormatada);
    }
}

// Função para atualizar dados do dashboard
function refreshData() {
    console.log('Atualizando dados do dashboard...');
    dashboard.loadAgendamentos()
        .then(() => {
            console.log('Dados atualizados com sucesso');
        })
        .catch(error => {
            console.error('Erro ao atualizar dados:', error);
        });
}