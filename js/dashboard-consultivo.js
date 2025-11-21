// Dashboard Consultivo - BrisaLOG Portal
// Visão consolidada de todos os CDs

class DashboardConsultivo {
    constructor() {
        this.agendamentos = [];
        this.agendamentosFiltrados = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.init();
    }

    async init() {
        // Verificar autenticação
        if (!this.checkAuth()) {
            return;
        }

        // Carregar informações do usuário
        this.loadUserInfo();

        // Carregar lista de CDs para filtro
        await this.loadCDsList();

        // Carregar agendamentos
        await this.loadAgendamentos();

        // Setup event listeners
        this.setupEventListeners();
    }

    checkAuth() {
        const token = sessionStorage.getItem('token');
        const usuario = sessionStorage.getItem('usuario');

        if (!token || !usuario) {
            window.location.href = '/login';
            return false;
        }

        return true;
    }

    loadUserInfo() {
        const usuario = sessionStorage.getItem('usuario');
        const nome = sessionStorage.getItem('cd') || usuario;
        document.getElementById('user-name').textContent = nome;
    }

    async loadCDsList() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/cds`, {
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Erro ao carregar CDs');

            const data = await response.json();
            if (data.success) {
                const select = document.getElementById('filter-cd');
                
                // Filtrar apenas CDs (não consultivos ou admin)
                const cds = data.data.filter(cd => cd.tipoPerfil === 'cd' || !cd.tipoPerfil);
                
                cds.forEach(cd => {
                    const option = document.createElement('option');
                    option.value = cd.id;
                    option.textContent = cd.nome;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar lista de CDs:', error);
        }
    }

    async loadAgendamentos() {
        try {
            this.showLoading(true);

            const response = await fetch(`${API_BASE_URL}/api/agendamentos/todos`, {
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                }
            });

            if (response.status === 403) {
                this.showNotification('Acesso negado. Perfil consultivo necessário.', 'error');
                setTimeout(() => window.location.href = '/login', 2000);
                return;
            }

            if (!response.ok) throw new Error('Erro ao carregar agendamentos');

            const data = await response.json();
            
            if (data.success) {
                this.agendamentos = data.data || [];
                this.agendamentosFiltrados = [...this.agendamentos];
                this.updateStatistics();
                this.renderAgendamentos();
            } else {
                throw new Error(data.message || 'Erro ao carregar agendamentos');
            }

        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
            this.showNotification('Erro ao carregar agendamentos: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    updateStatistics() {
        const total = this.agendamentos.length;
        const pendentes = this.agendamentos.filter(a => a.status === 'pendente').length;
        const confirmados = this.agendamentos.filter(a => a.status === 'confirmado').length;
        const entregues = this.agendamentos.filter(a => a.status === 'entregue').length;

        document.getElementById('total-agendamentos').textContent = total;
        document.getElementById('total-pendentes').textContent = pendentes;
        document.getElementById('total-confirmados').textContent = confirmados;
        document.getElementById('total-entregues').textContent = entregues;
    }

    renderAgendamentos() {
        const tbody = document.getElementById('agendamentos-tbody');
        const loadingState = document.getElementById('loading-state');
        const emptyState = document.getElementById('empty-state');

        tbody.innerHTML = '';

        if (this.agendamentosFiltrados.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');

        // Paginação
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageItems = this.agendamentosFiltrados.slice(start, end);

        pageItems.forEach(agendamento => {
            const row = this.createAgendamentoRow(agendamento);
            tbody.appendChild(row);
        });

        this.updatePagination();
    }

    createAgendamentoRow(agendamento) {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 transition-colors';

        const cdNome = agendamento.cd?.nome || 'N/A';
        const codigo = agendamento.codigo || 'N/A';
        const transportador = agendamento.transportadorNome || agendamento.fornecedorNome || 'N/A';
        const dataEntrega = this.formatDate(agendamento.dataEntrega);
        const horario = agendamento.horarioEntrega || 'N/A';
        const status = agendamento.status || 'pendente';

        tr.innerHTML = `
            <td class="px-6 py-4">
                <span class="badge-cd">${cdNome}</span>
            </td>
            <td class="px-6 py-4">
                <span class="font-semibold text-gray-dark">${codigo}</span>
            </td>
            <td class="px-6 py-4">
                <div class="text-sm">
                    <div class="font-medium text-gray-900">${transportador}</div>
                    ${agendamento.transportadorDocumento ? `<div class="text-gray-500 text-xs">${agendamento.transportadorDocumento}</div>` : ''}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-900">${dataEntrega}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-900">${horario}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${this.getStatusBadge(status)}
            </td>
            <td class="px-6 py-4 text-center">
                <button onclick="dashboardConsultivo.verDetalhes(${agendamento.id})" 
                    class="text-orange-primary hover:text-orange-secondary transition-colors" 
                    title="Ver Detalhes">
                    <i class="fas fa-eye text-lg"></i>
                </button>
            </td>
        `;

        return tr;
    }

    getStatusBadge(status) {
        const statusMap = {
            'pendente': { class: 'status-pendente', icon: 'clock', label: 'Pendente' },
            'confirmado': { class: 'status-confirmado', icon: 'check-circle', label: 'Confirmado' },
            'entregue': { class: 'status-entregue', icon: 'box-open', label: 'Entregue' },
            'nao-veio': { class: 'status-nao-veio', icon: 'times-circle', label: 'Não Veio' },
            'reagendado': { class: 'status-reagendamento', icon: 'calendar-alt', label: 'Reagendado' },
            'cancelado': { class: 'status-cancelado-fornecedor', icon: 'ban', label: 'Cancelado' }
        };

        const config = statusMap[status] || { class: 'status-pendente', icon: 'question', label: status || 'Pendente' };

        return `
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white ${config.class}">
                <i class="fas fa-${config.icon} mr-1"></i>
                ${config.label}
            </span>
        `;
    }

    async verDetalhes(id) {
        try {
            const agendamento = this.agendamentos.find(a => a.id === id);
            if (!agendamento) {
                this.showNotification('Agendamento não encontrado', 'error');
                return;
            }

            const modal = document.getElementById('detalhes-modal');
            const content = document.getElementById('detalhes-content');

            content.innerHTML = this.renderDetalhesContent(agendamento);
            modal.classList.remove('hidden');

        } catch (error) {
            console.error('Erro ao carregar detalhes:', error);
            this.showNotification('Erro ao carregar detalhes', 'error');
        }
    }

    renderDetalhesContent(agendamento) {
        const dataAgendamento = this.formatDate(agendamento.dataAgendamento);
        const dataCriacao = this.formatDateTime(agendamento.createdAt);
        const dataAtualizacao = this.formatDateTime(agendamento.updatedAt);

        return `
            <!-- Informações Gerais -->
            <div class="mb-6">
                <h4 class="text-lg font-bold text-gray-dark mb-4 flex items-center">
                    <i class="fas fa-info-circle text-blue-primary mr-2"></i>
                    Informações Gerais
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                        <label class="text-xs text-gray-500 font-semibold uppercase">Centro de Distribuição</label>
                        <p class="text-gray-dark font-semibold">${agendamento.cd?.nome || 'N/A'}</p>
                    </div>
                    <div>
                        <label class="text-xs text-gray-500 font-semibold uppercase">Número NF</label>
                        <p class="text-gray-dark font-semibold">${agendamento.nf || 'N/A'}</p>
                    </div>
                    <div>
                        <label class="text-xs text-gray-500 font-semibold uppercase">Data Agendamento</label>
                        <p class="text-gray-dark">${dataAgendamento}</p>
                    </div>
                    <div>
                        <label class="text-xs text-gray-500 font-semibold uppercase">Turno</label>
                        <p class="text-gray-dark">${agendamento.turno || 'N/A'}</p>
                    </div>
                    <div>
                        <label class="text-xs text-gray-500 font-semibold uppercase">Status</label>
                        <div class="mt-1">${this.getStatusBadge(agendamento.statusAgendamento)}</div>
                    </div>
                    <div>
                        <label class="text-xs text-gray-500 font-semibold uppercase">Protocolo</label>
                        <p class="text-gray-dark font-mono">${agendamento.protocolo || 'N/A'}</p>
                    </div>
                </div>
            </div>

            <!-- Informações do Fornecedor -->
            <div class="mb-6">
                <h4 class="text-lg font-bold text-gray-dark mb-4 flex items-center">
                    <i class="fas fa-building text-blue-primary mr-2"></i>
                    Dados do Fornecedor
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                        <label class="text-xs text-gray-500 font-semibold uppercase">Nome</label>
                        <p class="text-gray-dark">${agendamento.fornecedorNome || 'N/A'}</p>
                    </div>
                    <div>
                        <label class="text-xs text-gray-500 font-semibold uppercase">CNPJ</label>
                        <p class="text-gray-dark">${agendamento.fornecedorDocumento || 'N/A'}</p>
                    </div>
                    <div>
                        <label class="text-xs text-gray-500 font-semibold uppercase">E-mail</label>
                        <p class="text-gray-dark">${agendamento.fornecedorEmail || 'N/A'}</p>
                    </div>
                    <div>
                        <label class="text-xs text-gray-500 font-semibold uppercase">Telefone</label>
                        <p class="text-gray-dark">${agendamento.fornecedorTelefone || 'N/A'}</p>
                    </div>
                </div>
            </div>

            <!-- Informações do Transportador -->
            <div class="mb-6">
                <h4 class="text-lg font-bold text-gray-dark mb-4 flex items-center">
                    <i class="fas fa-truck text-blue-primary mr-2"></i>
                    Dados do Transportador
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                        <label class="text-xs text-gray-500 font-semibold uppercase">Nome</label>
                        <p class="text-gray-dark">${agendamento.transportadorNome || 'N/A'}</p>
                    </div>
                    <div>
                        <label class="text-xs text-gray-500 font-semibold uppercase">CNPJ</label>
                        <p class="text-gray-dark">${agendamento.transportadorDocumento || 'N/A'}</p>
                    </div>
                    <div>
                        <label class="text-xs text-gray-500 font-semibold uppercase">E-mail</label>
                        <p class="text-gray-dark">${agendamento.transportadorEmail || 'N/A'}</p>
                    </div>
                    <div>
                        <label class="text-xs text-gray-500 font-semibold uppercase">Telefone</label>
                        <p class="text-gray-dark">${agendamento.transportadorTelefone || 'N/A'}</p>
                    </div>
                </div>
            </div>

            <!-- Informações de Entrega -->
            ${agendamento.statusAgendamento === 'Entregue' ? `
            <div class="mb-6">
                <h4 class="text-lg font-bold text-gray-dark mb-4 flex items-center">
                    <i class="fas fa-check-circle text-green-500 mr-2"></i>
                    Dados da Entrega
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                    <div>
                        <label class="text-xs text-gray-500 font-semibold uppercase">Data/Hora da Entrega</label>
                        <p class="text-gray-dark">${this.formatDateTime(agendamento.dataHoraEntrega)}</p>
                    </div>
                    <div>
                        <label class="text-xs text-gray-500 font-semibold uppercase">Motorista</label>
                        <p class="text-gray-dark">${agendamento.nomeMotorista || 'N/A'}</p>
                    </div>
                    <div>
                        <label class="text-xs text-gray-500 font-semibold uppercase">CPF Motorista</label>
                        <p class="text-gray-dark">${agendamento.cpfMotorista || 'N/A'}</p>
                    </div>
                    <div>
                        <label class="text-xs text-gray-500 font-semibold uppercase">Placa Veículo</label>
                        <p class="text-gray-dark font-mono">${agendamento.placaVeiculo || 'N/A'}</p>
                    </div>
                    ${agendamento.observacoes ? `
                    <div class="md:col-span-2">
                        <label class="text-xs text-gray-500 font-semibold uppercase">Observações</label>
                        <p class="text-gray-dark">${agendamento.observacoes}</p>
                    </div>
                    ` : ''}
                </div>
            </div>
            ` : ''}

            <!-- Histórico -->
            <div class="mb-6">
                <h4 class="text-lg font-bold text-gray-dark mb-4 flex items-center">
                    <i class="fas fa-history text-blue-primary mr-2"></i>
                    Histórico
                </h4>
                <div class="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600">Criado em:</span>
                        <span class="text-sm font-semibold text-gray-dark">${dataCriacao}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600">Última atualização:</span>
                        <span class="text-sm font-semibold text-gray-dark">${dataAtualizacao}</span>
                    </div>
                </div>
            </div>

            <!-- Botão Fechar -->
            <div class="flex justify-end">
                <button onclick="fecharDetalhes()" class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all">
                    <i class="fas fa-times mr-2"></i>
                    Fechar
                </button>
            </div>
        `;
    }

    setupEventListeners() {
        // Busca em tempo real
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.aplicarFiltros();
        });

        // Filtros
        document.getElementById('filter-status').addEventListener('change', () => this.aplicarFiltros());
        document.getElementById('filter-cd').addEventListener('change', () => this.aplicarFiltros());
        document.getElementById('filter-date').addEventListener('change', () => this.aplicarFiltros());

        // Enter para buscar
        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.aplicarFiltros();
            }
        });
    }

    aplicarFiltros() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const statusFilter = document.getElementById('filter-status').value;
        const cdFilter = document.getElementById('filter-cd').value;
        const dateFilter = document.getElementById('filter-date').value;

        this.agendamentosFiltrados = this.agendamentos.filter(agendamento => {
            // Filtro de busca
            if (searchTerm) {
                const searchFields = [
                    agendamento.codigo,
                    agendamento.transportadorNome,
                    agendamento.transportadorDocumento,
                    agendamento.fornecedorNome,
                    agendamento.fornecedorDocumento
                ].filter(Boolean).map(f => f.toLowerCase());

                if (!searchFields.some(field => field.includes(searchTerm))) {
                    return false;
                }
            }

            // Filtro de status
            if (statusFilter && agendamento.status !== statusFilter) {
                return false;
            }

            // Filtro de CD
            if (cdFilter && agendamento.cdId !== parseInt(cdFilter)) {
                return false;
            }

            // Filtro de data
            if (dateFilter) {
                const agendamentoDate = agendamento.dataEntrega?.split('T')[0];
                if (agendamentoDate !== dateFilter) {
                    return false;
                }
            }

            return true;
        });

        this.currentPage = 1;
        this.updateStatistics();
        this.renderAgendamentos();
    }

    limparFiltros() {
        document.getElementById('search-input').value = '';
        document.getElementById('filter-status').value = '';
        document.getElementById('filter-cd').value = '';
        document.getElementById('filter-date').value = '';

        this.agendamentosFiltrados = [...this.agendamentos];
        this.currentPage = 1;
        this.updateStatistics();
        this.renderAgendamentos();

        this.showNotification('Filtros limpos', 'info');
    }

    updatePagination() {
        const total = this.agendamentosFiltrados.length;
        const totalPages = Math.ceil(total / this.itemsPerPage);
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(start + this.itemsPerPage - 1, total);

        document.getElementById('showing-start').textContent = total > 0 ? start : 0;
        document.getElementById('showing-end').textContent = end;
        document.getElementById('total-records').textContent = total;

        const paginationButtons = document.getElementById('pagination-buttons');
        paginationButtons.innerHTML = '';

        if (totalPages <= 1) return;

        // Botão Anterior
        const prevButton = document.createElement('button');
        prevButton.className = `px-3 py-1 rounded ${this.currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-primary text-white hover:bg-blue-secondary'}`;
        prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevButton.disabled = this.currentPage === 1;
        prevButton.onclick = () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderAgendamentos();
            }
        };
        paginationButtons.appendChild(prevButton);

        // Números das páginas
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
                const pageButton = document.createElement('button');
                pageButton.className = `px-3 py-1 rounded ${i === this.currentPage ? 'bg-blue-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`;
                pageButton.textContent = i;
                pageButton.onclick = () => {
                    this.currentPage = i;
                    this.renderAgendamentos();
                };
                paginationButtons.appendChild(pageButton);
            } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
                const dots = document.createElement('span');
                dots.className = 'px-2 text-gray-500';
                dots.textContent = '...';
                paginationButtons.appendChild(dots);
            }
        }

        // Botão Próximo
        const nextButton = document.createElement('button');
        nextButton.className = `px-3 py-1 rounded ${this.currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-primary text-white hover:bg-blue-secondary'}`;
        nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextButton.disabled = this.currentPage === totalPages;
        nextButton.onclick = () => {
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.renderAgendamentos();
            }
        };
        paginationButtons.appendChild(nextButton);
    }

    showLoading(show) {
        const loadingState = document.getElementById('loading-state');
        const tbody = document.getElementById('agendamentos-tbody');

        if (show) {
            loadingState.classList.remove('hidden');
            tbody.innerHTML = '';
        } else {
            loadingState.classList.add('hidden');
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR');
        } catch (error) {
            return 'N/A';
        }
    }

    formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('pt-BR');
        } catch (error) {
            return 'N/A';
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'} mr-2"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

// Funções globais
function aplicarFiltros() {
    if (window.dashboardConsultivo) {
        window.dashboardConsultivo.aplicarFiltros();
    }
}

function limparFiltros() {
    if (window.dashboardConsultivo) {
        window.dashboardConsultivo.limparFiltros();
    }
}

function fecharDetalhes() {
    document.getElementById('detalhes-modal').classList.add('hidden');
}

// Inicializar dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardConsultivo = new DashboardConsultivo();
});
