// Dashboard Consultivo - BrisaLOG Portal
// Visão consolidada de todos os CDs

class DashboardConsultivo {
    constructor() {
        this.agendamentos = [];
        this.agendamentosFiltrados = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.charts = {}; // Armazenar instâncias dos gráficos
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
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            const usuario = sessionStorage.getItem('usuario');
            const nome = sessionStorage.getItem('cd') || usuario;
            userNameElement.textContent = nome;
        }
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
                this.updateCharts();
                this.updateKPIs();
                this.loadTransportadorList();
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

    async atualizarDados(event) {
        try {
            // Mostrar feedback visual no botão
            const btnAtualizar = event?.target?.closest('button') || document.querySelector('button[onclick*="atualizarDados"]');
            const icon = btnAtualizar?.querySelector('i');
            if (icon) {
                icon.classList.add('fa-spin');
            }
            if (btnAtualizar) {
                btnAtualizar.disabled = true;
            }

            // Recarregar dados
            await this.loadAgendamentos();

            this.showNotification('Dados atualizados com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao atualizar dados:', error);
            this.showNotification('Erro ao atualizar dados', 'error');
        } finally {
            // Restaurar botão
            const btnAtualizar = event?.target?.closest('button') || document.querySelector('button[onclick*="atualizarDados"]');
            const icon = btnAtualizar?.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-spin');
            }
            if (btnAtualizar) {
                btnAtualizar.disabled = false;
            }
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

    loadTransportadorList() {
        // Extrair lista única de transportadores
        const transportadores = new Set();
        this.agendamentos.forEach(a => {
            const nome = a.transportadorNome || a.fornecedorNome;
            if (nome) transportadores.add(nome);
        });

        const select = document.getElementById('filter-transportador');
        select.innerHTML = '<option value="">Todos</option>';
        
        Array.from(transportadores).sort().forEach(nome => {
            const option = document.createElement('option');
            option.value = nome;
            option.textContent = nome;
            select.appendChild(option);
        });
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

    updateKPIs() {
        const total = this.agendamentos.length;
        if (total === 0) {
            document.getElementById('taxa-confirmacao').textContent = '0%';
            document.getElementById('taxa-nao-veio').textContent = '0%';
            document.getElementById('taxa-entrega').textContent = '0%';
            return;
        }

        const confirmados = this.agendamentos.filter(a => a.status === 'confirmado' || a.status === 'entregue').length;
        const naoVeio = this.agendamentos.filter(a => a.status === 'nao-veio').length;
        const entregues = this.agendamentos.filter(a => a.status === 'entregue').length;

        const taxaConfirmacao = ((confirmados / total) * 100).toFixed(1);
        const taxaNaoVeio = ((naoVeio / total) * 100).toFixed(1);
        const taxaEntrega = ((entregues / total) * 100).toFixed(1);

        document.getElementById('taxa-confirmacao').textContent = taxaConfirmacao + '%';
        document.getElementById('taxa-nao-veio').textContent = taxaNaoVeio + '%';
        document.getElementById('taxa-entrega').textContent = taxaEntrega + '%';
    }

    // Métodos para atualizar com dados filtrados
    updateStatisticsWithFiltered() {
        const total = this.agendamentosFiltrados.length;
        const pendentes = this.agendamentosFiltrados.filter(a => a.status === 'pendente').length;
        const confirmados = this.agendamentosFiltrados.filter(a => a.status === 'confirmado').length;
        const entregues = this.agendamentosFiltrados.filter(a => a.status === 'entregue').length;

        document.getElementById('total-agendamentos').textContent = total;
        document.getElementById('total-pendentes').textContent = pendentes;
        document.getElementById('total-confirmados').textContent = confirmados;
        document.getElementById('total-entregues').textContent = entregues;
    }

    updateKPIsWithFiltered() {
        const total = this.agendamentosFiltrados.length;
        if (total === 0) {
            document.getElementById('taxa-confirmacao').textContent = '0%';
            document.getElementById('taxa-nao-veio').textContent = '0%';
            document.getElementById('taxa-entrega').textContent = '0%';
            return;
        }

        const confirmados = this.agendamentosFiltrados.filter(a => a.status === 'confirmado' || a.status === 'entregue').length;
        const naoVeio = this.agendamentosFiltrados.filter(a => a.status === 'nao-veio').length;
        const entregues = this.agendamentosFiltrados.filter(a => a.status === 'entregue').length;

        const taxaConfirmacao = ((confirmados / total) * 100).toFixed(1);
        const taxaNaoVeio = ((naoVeio / total) * 100).toFixed(1);
        const taxaEntrega = ((entregues / total) * 100).toFixed(1);

        document.getElementById('taxa-confirmacao').textContent = taxaConfirmacao + '%';
        document.getElementById('taxa-nao-veio').textContent = taxaNaoVeio + '%';
        document.getElementById('taxa-entrega').textContent = taxaEntrega + '%';
    }

    updateChartsWithFiltered() {
        this.renderStatusChart(this.agendamentosFiltrados);
        this.renderCDChart(this.agendamentosFiltrados);
    }

    updateCharts() {
        this.renderStatusChart();
        this.renderCDChart();
    }

    renderStatusChart(dados = null) {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;

        // Destruir gráfico anterior se existir
        if (this.charts.statusChart) {
            this.charts.statusChart.destroy();
        }

        const dataSource = dados || this.agendamentos;

        const statusCount = {
            pendente: 0,
            confirmado: 0,
            entregue: 0,
            'nao-veio': 0,
            reagendado: 0,
            cancelado: 0
        };

        dataSource.forEach(a => {
            if (statusCount.hasOwnProperty(a.status)) {
                statusCount[a.status]++;
            }
        });

        this.charts.statusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Pendente', 'Aguardando Entrega', 'Entregue', 'Não Veio', 'Reagendado', 'Cancelado'],
                datasets: [{
                    data: [
                        statusCount.pendente,
                        statusCount.confirmado,
                        statusCount.entregue,
                        statusCount['nao-veio'],
                        statusCount.reagendado,
                        statusCount.cancelado
                    ],
                    backgroundColor: [
                        '#FF6B35',
                        '#10B981',
                        '#3B82F6',
                        '#EF4444',
                        '#8B5CF6',
                        '#6B7280'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 10,
                            font: {
                                size: 11
                            }
                        }
                    }
                }
            }
        });
    }

    renderCDChart(dados = null) {
        const ctx = document.getElementById('cdChart');
        if (!ctx) return;

        // Destruir gráfico anterior se existir
        if (this.charts.cdChart) {
            this.charts.cdChart.destroy();
        }

        const dataSource = dados || this.agendamentos;

        // Contar agendamentos por CD
        const cdCount = {};
        dataSource.forEach(a => {
            const cdNome = a.cd?.nome || 'Sem CD';
            cdCount[cdNome] = (cdCount[cdNome] || 0) + 1;
        });

        const labels = Object.keys(cdCount);
        const data = Object.values(cdCount);

        this.charts.cdChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Agendamentos',
                    data: data,
                    backgroundColor: '#FF6B35',
                    borderColor: '#FF8C42',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    exportarDados() {
        try {
            // Preparar dados para exportação
            const dados = this.agendamentosFiltrados.map(a => ({
                'CD': a.cd?.nome || 'N/A',
                'Código': a.codigo || 'N/A',
                'Transportador': a.transportadorNome || a.fornecedorNome || 'N/A',
                'CNPJ': a.transportadorDocumento || a.fornecedorDocumento || 'N/A',
                'Data Entrega': this.formatDate(a.dataEntrega),
                'Horário': a.horarioEntrega || 'N/A',
                'Status': a.status || 'N/A',
                'Tipo Carga': a.tipoCarga || 'N/A',
                'Tipo Veículo': a.tipoVeiculo || 'N/A',
                'Placa': a.placaVeiculo || 'N/A',
                'Motorista': a.motoristaNome || 'N/A',
                'Observações': a.observacoes || ''
            }));

            // Converter para CSV
            const headers = Object.keys(dados[0]);
            const csv = [
                headers.join(','),
                ...dados.map(row => headers.map(header => {
                    const value = row[header] || '';
                    // Escapar vírgulas e aspas
                    return `"${String(value).replace(/"/g, '""')}"`;
                }).join(','))
            ].join('\n');

            // Criar blob e download
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            const dataAtual = new Date().toISOString().split('T')[0];
            link.setAttribute('href', url);
            link.setAttribute('download', `agendamentos_${dataAtual}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showNotification('Dados exportados com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao exportar:', error);
            this.showNotification('Erro ao exportar dados', 'error');
        }
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

        // Verificar se é admin
        const cdDataString = sessionStorage.getItem('cdData');
        const isAdmin = cdDataString ? JSON.parse(cdDataString).tipoPerfil === 'admin' : false;

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
                <div class="flex items-center justify-center space-x-2">
                    <button onclick="dashboardConsultivo.verDetalhes(${agendamento.id})" 
                        class="text-orange-primary hover:text-orange-secondary transition-colors" 
                        title="Ver Detalhes">
                        <i class="fas fa-eye text-lg"></i>
                    </button>
                    ${isAdmin ? `
                    <button onclick="dashboardConsultivo.abrirModalAlterarStatus(${agendamento.id})" 
                        class="text-blue-600 hover:text-blue-800 transition-colors" 
                        title="Alterar Status">
                        <i class="fas fa-exchange-alt text-lg"></i>
                    </button>
                    ` : ''}
                    ${typeof dashboardAdmin !== 'undefined' ? `
                    <button onclick="dashboardAdmin.cancelarAgendamento('${agendamento.codigo}')" 
                        class="text-yellow-600 hover:text-yellow-800 transition-colors" 
                        title="Cancelar Agendamento">
                        <i class="fas fa-ban text-lg"></i>
                    </button>
                    <button onclick="dashboardAdmin.excluirAgendamento('${agendamento.codigo}')" 
                        class="text-red-600 hover:text-red-800 transition-colors" 
                        title="Excluir Permanentemente">
                        <i class="fas fa-trash-alt text-lg"></i>
                    </button>
                    ` : ''}
                </div>
            </td>
        `;

        return tr;
    }

    getStatusBadge(status) {
        const statusMap = {
            'pendente': { class: 'status-pendente', icon: 'clock', label: 'Pendente' },
            'confirmado': { class: 'status-confirmado', icon: 'shipping-fast', label: 'Aguardando Entrega' },
            'entregue': { class: 'status-entregue', icon: 'box-open', label: 'Entregue' },
            'nao-veio': { class: 'status-nao-veio', icon: 'times-circle', label: 'Não Veio' },
            'reagendado': { class: 'status-reagendamento', icon: 'calendar-alt', label: 'Reagendado' },
            'cancelado': { class: 'status-cancelado-fornecedor', icon: 'ban', label: 'Cancelado' }
        };

        const config = statusMap[status] || { class: 'status-pendente', icon: 'question', label: status || 'Pendente' };

        return `
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-gray-900 ${config.class}">
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
            modal.style.display = 'flex';

        } catch (error) {
            console.error('Erro ao carregar detalhes:', error);
            this.showNotification('Erro ao carregar detalhes', 'error');
        }
    }

    renderDetalhesContent(agendamento) {
        const dataEntrega = this.formatDate(agendamento.dataEntrega);
        const dataCriacao = this.formatDateTime(agendamento.createdAt);
        const dataAtualizacao = this.formatDateTime(agendamento.updatedAt);
        
        // Buscar notas fiscais
        const notasFiscais = agendamento.notasFiscais || [];
        const historicoAcoes = agendamento.historicoAcoes || [];

        return `
            <!-- Informações Gerais -->
            <div class="mb-6">
                <h4 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <i class="fas fa-info-circle text-orange-primary mr-2"></i>
                    Informações Gerais
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                        <label class="text-xs text-gray-600 font-semibold uppercase">Centro de Distribuição</label>
                        <p class="text-gray-900 font-semibold text-base">${agendamento.cd?.nome || 'N/A'}</p>
                    </div>
                    <div>
                        <label class="text-xs text-gray-600 font-semibold uppercase">Código</label>
                        <p class="text-gray-900 font-semibold text-base">${agendamento.codigo || 'N/A'}</p>
                    </div>
                    <div>
                        <label class="text-xs text-gray-600 font-semibold uppercase">Data de Entrega</label>
                        <p class="text-gray-900 text-base">${dataEntrega}</p>
                    </div>
                    <div>
                        <label class="text-xs text-gray-600 font-semibold uppercase">Horário</label>
                        <p class="text-gray-900 text-base">${agendamento.horarioEntrega || 'N/A'}</p>
                    </div>
                    <div>
                        <label class="text-xs text-gray-600 font-semibold uppercase">Status</label>
                        <div class="mt-1">${this.getStatusBadge(agendamento.status)}</div>
                    </div>
                    <div>
                        <label class="text-xs text-gray-600 font-semibold uppercase">Tipo de Carga</label>
                        <p class="text-gray-900 text-base">${agendamento.tipoCarga || 'N/A'}</p>
                    </div>
                    <div>
                        <label class="text-xs text-gray-600 font-semibold uppercase">Tipo de Veículo</label>
                        <p class="text-gray-900 text-base">${agendamento.tipoVeiculo || 'N/A'}</p>
                    </div>
                    <div>
                        <label class="text-xs text-gray-600 font-semibold uppercase">Placa do Veículo</label>
                        <p class="text-gray-900 font-mono text-base">${agendamento.placaVeiculo || 'N/A'}</p>
                    </div>
                    ${agendamento.quantidadeVolumes ? `
                    <div>
                        <label class="text-xs text-gray-600 font-semibold uppercase">Quantidade de Volumes</label>
                        <p class="text-gray-900 text-base font-semibold">${agendamento.quantidadeVolumes}</p>
                    </div>
                    ` : ''}
                    ${agendamento.tipoVolume ? `
                    <div>
                        <label class="text-xs text-gray-600 font-semibold uppercase">Tipo de Volume</label>
                        <p class="text-gray-900 text-base">${agendamento.tipoVolume}</p>
                    </div>
                    ` : ''}
                </div>
            </div>

            <!-- Informações do Fornecedor/Transportador -->
            <div class="mb-6">
                <h4 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <i class="fas fa-truck text-orange-primary mr-2"></i>
                    Dados do Transportador
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                        <label class="text-xs text-gray-600 font-semibold uppercase">Nome</label>
                        <p class="text-gray-900 text-base">${agendamento.transportadorNome || agendamento.fornecedorNome || 'N/A'}</p>
                    </div>
                    <div>
                        <label class="text-xs text-gray-600 font-semibold uppercase">CNPJ</label>
                        <p class="text-gray-900 text-base">${agendamento.transportadorDocumento || agendamento.fornecedorDocumento || 'N/A'}</p>
                    </div>
                    <div>
                        <label class="text-xs text-gray-600 font-semibold uppercase">E-mail</label>
                        <p class="text-gray-900 text-base">${agendamento.transportadorEmail || agendamento.fornecedorEmail || 'N/A'}</p>
                    </div>
                    <div>
                        <label class="text-xs text-gray-600 font-semibold uppercase">Telefone</label>
                        <p class="text-gray-900 text-base">${agendamento.transportadorTelefone || agendamento.fornecedorTelefone || 'N/A'}</p>
                    </div>
                </div>
            </div>

            <!-- Informações do Motorista (se tiver) -->
            ${agendamento.motoristaNome ? `
            <div class="mb-6">
                <h4 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <i class="fas fa-id-card text-orange-primary mr-2"></i>
                    Dados do Motorista
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                        <label class="text-xs text-gray-600 font-semibold uppercase">Nome</label>
                        <p class="text-gray-900 text-base">${agendamento.motoristaNome}</p>
                    </div>
                    <div>
                        <label class="text-xs text-gray-600 font-semibold uppercase">CPF</label>
                        <p class="text-gray-900 font-mono text-base">${agendamento.motoristaCpf || 'N/A'}</p>
                    </div>
                    <div>
                        <label class="text-xs text-gray-600 font-semibold uppercase">Telefone</label>
                        <p class="text-gray-900 text-base">${agendamento.motoristaTelefone || 'N/A'}</p>
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Informações de Volumes (se tiver) -->
            ${(agendamento.quantidadeVolumes || agendamento.tipoVolume) ? `
            <div class="mb-6">
                <h4 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <i class="fas fa-boxes text-orange-primary mr-2"></i>
                    Volumes
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                        <label class="text-xs text-gray-600 font-semibold uppercase">Quantidade</label>
                        <p class="text-gray-900 text-base">${agendamento.quantidadeVolumes || 'Não informado'}</p>
                    </div>
                    <div>
                        <label class="text-xs text-gray-600 font-semibold uppercase">Tipo de Volume</label>
                        <p class="text-gray-900 text-base">${agendamento.tipoVolume || 'Não informado'}</p>
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Notas Fiscais -->
            ${notasFiscais.length > 0 ? `
            <div class="mb-6">
                <h4 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <i class="fas fa-file-invoice text-orange-primary mr-2"></i>
                    Notas Fiscais
                </h4>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <div class="space-y-3">
                        ${notasFiscais.map(nf => {
                            let valorFormatado = nf.valor ? `R$ ${nf.valor}` : 'Valor não informado';
                            return `
                            <div class="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors bg-white">
                                <div class="flex justify-between items-center">
                                    <div class="flex-1">
                                        <div class="flex items-center space-x-3 mb-1">
                                            <span class="font-semibold text-gray-900">NF: ${nf.numeroNF}</span>
                                            <span class="text-xs text-gray-600">Pedido: ${nf.numeroPedido}</span>
                                            ${nf.serie ? `<span class="text-xs text-gray-600">Série: ${nf.serie}</span>` : ''}
                                        </div>
                                        <div class="text-lg font-bold text-green-600">
                                            ${valorFormatado}
                                        </div>
                                    </div>
                                    <div class="flex items-center space-x-2">
                                        ${nf.arquivoPath ? `
                                            <button onclick="dashboardConsultivo.viewPDF('${nf.arquivoPath}')" 
                                                class="bg-green-100 text-green-700 px-3 py-2 rounded text-sm font-medium hover:bg-green-200 transition-colors">
                                                <i class="fas fa-file-pdf mr-1"></i>Visualizar PDF
                                            </button>
                                        ` : `
                                            <span class="bg-yellow-100 text-yellow-700 px-3 py-2 rounded text-sm font-medium">
                                                <i class="fas fa-exclamation-triangle mr-1"></i>Sem PDF
                                            </span>
                                        `}
                                    </div>
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Observações -->
            ${agendamento.observacoes ? `
            <div class="mb-6">
                <h4 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <i class="fas fa-comment-alt text-orange-primary mr-2"></i>
                    Observações
                </h4>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <p class="text-gray-900 whitespace-pre-wrap text-base">${agendamento.observacoes}</p>
                </div>
            </div>
            ` : ''}

            <!-- Histórico de Movimentações -->
            ${historicoAcoes.length > 0 ? `
            <div class="mb-6">
                <h4 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <i class="fas fa-history text-orange-primary mr-2"></i>
                    Histórico de Movimentações
                </h4>
                <div class="bg-gray-50 p-4 rounded-lg space-y-3">
                    ${historicoAcoes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(acao => `
                        <div class="flex items-start space-x-3 p-3 bg-white rounded border border-gray-200">
                            <div class="flex-shrink-0 mt-1">
                                <div class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                                    <i class="fas fa-${this.getAcaoIcon(acao.acao)} text-orange-primary text-sm"></i>
                                </div>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-semibold text-gray-900">${this.getAcaoLabel(acao.acao)}</p>
                                ${acao.descricao ? `<p class="text-sm text-gray-700 mt-1">${acao.descricao}</p>` : ''}
                                <div class="flex items-center mt-2 text-xs text-gray-600">
                                    <i class="fas fa-clock mr-1"></i>
                                    <span>${this.formatDateTime(acao.createdAt)}</span>
                                    ${acao.autor ? ` <span class="mx-2">•</span> <i class="fas fa-user mr-1"></i> <span>${acao.autor}</span>` : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Dados de Criação/Atualização -->
            <div class="mb-6">
                <h4 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <i class="fas fa-clock text-orange-primary mr-2"></i>
                    Registro
                </h4>
                <div class="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-700">Criado em:</span>
                        <span class="text-sm font-semibold text-gray-900">${dataCriacao}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-700">Última atualização:</span>
                        <span class="text-sm font-semibold text-gray-900">${dataAtualizacao}</span>
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

    getAcaoIcon(acao) {
        const icons = {
            'agendamento_criado': 'plus-circle',
            'status_alterado': 'exchange-alt',
            'confirmado': 'check-circle',
            'entregue': 'box-open',
            'reagendamento': 'calendar-alt',
            'nao-veio': 'times-circle',
            'cancelado': 'ban'
        };
        return icons[acao] || 'circle';
    }

    getAcaoLabel(acao) {
        const labels = {
            'agendamento_criado': 'Agendamento Criado',
            'status_alterado': 'Status Alterado',
            'confirmado': 'Agendamento Confirmado',
            'entregue': 'Entrega Realizada',
            'reagendamento': 'Reagendamento Solicitado',
            'nao-veio': 'Transportador Não Compareceu',
            'cancelado': 'Agendamento Cancelado'
        };
        return labels[acao] || acao;
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
        document.getElementById('filter-transportador').addEventListener('change', () => this.aplicarFiltros());
        document.getElementById('filter-periodo').addEventListener('change', () => {
            // Limpar data específica quando selecionar período
            document.getElementById('filter-date').value = '';
            this.aplicarFiltros();
        });

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
        const transportadorFilter = document.getElementById('filter-transportador').value;
        const periodoFilter = document.getElementById('filter-periodo').value;

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

            // Filtro de transportador
            if (transportadorFilter) {
                const nomeTransp = agendamento.transportadorNome || agendamento.fornecedorNome || '';
                if (nomeTransp !== transportadorFilter) {
                    return false;
                }
            }

            // Filtro de período
            if (periodoFilter) {
                const dataEntrega = new Date(agendamento.dataEntrega);
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);

                switch (periodoFilter) {
                    case 'hoje':
                        const hojeFim = new Date(hoje);
                        hojeFim.setHours(23, 59, 59, 999);
                        if (dataEntrega < hoje || dataEntrega > hojeFim) {
                            return false;
                        }
                        break;
                    case '7dias':
                        const sete = new Date(hoje);
                        sete.setDate(sete.getDate() - 7);
                        if (dataEntrega < sete) {
                            return false;
                        }
                        break;
                    case '30dias':
                        const trinta = new Date(hoje);
                        trinta.setDate(trinta.getDate() - 30);
                        if (dataEntrega < trinta) {
                            return false;
                        }
                        break;
                    case 'mes-atual':
                        const mesAtual = hoje.getMonth();
                        const anoAtual = hoje.getFullYear();
                        if (dataEntrega.getMonth() !== mesAtual || dataEntrega.getFullYear() !== anoAtual) {
                            return false;
                        }
                        break;
                    case 'mes-anterior':
                        const mesAnterior = new Date(hoje);
                        mesAnterior.setMonth(mesAnterior.getMonth() - 1);
                        if (dataEntrega.getMonth() !== mesAnterior.getMonth() || dataEntrega.getFullYear() !== mesAnterior.getFullYear()) {
                            return false;
                        }
                        break;
                }
            }

            // Filtro de data específica
            if (dateFilter && !periodoFilter) {
                const agendamentoDate = agendamento.dataEntrega?.split('T')[0];
                if (agendamentoDate !== dateFilter) {
                    return false;
                }
            }

            return true;
        });

        // Atualizar todos os componentes do dashboard com dados filtrados
        this.updateStatisticsWithFiltered();
        this.updateKPIsWithFiltered();
        this.updateChartsWithFiltered();
        this.updatePeriodoIndicator(periodoFilter);
        
        this.currentPage = 1;
        this.renderAgendamentos();
    }

    limparFiltros() {
        document.getElementById('search-input').value = '';
        document.getElementById('filter-status').value = '';
        document.getElementById('filter-cd').value = '';
        document.getElementById('filter-date').value = '';
        document.getElementById('filter-transportador').value = '';
        document.getElementById('filter-periodo').value = '';

        this.agendamentosFiltrados = [...this.agendamentos];
        
        // Resetar todos os componentes do dashboard
        this.updateStatistics();
        this.updateKPIs();
        this.updateCharts();
        this.updatePeriodoIndicator('');
        
        this.currentPage = 1;
        this.renderAgendamentos();

        this.showNotification('Filtros limpos', 'info');
    }

    updatePeriodoIndicator(periodo) {
        const indicator = document.getElementById('periodo-indicator');
        const periodoText = document.getElementById('periodo-text');
        
        if (!periodo) {
            indicator.classList.add('hidden');
            return;
        }

        const periodoLabels = {
            'hoje': 'Hoje',
            '7dias': 'Últimos 7 dias',
            '30dias': 'Últimos 30 dias',
            'mes-atual': 'Mês Atual',
            'mes-anterior': 'Mês Anterior'
        };

        periodoText.textContent = periodoLabels[periodo] || periodo;
        indicator.classList.remove('hidden');
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
        prevButton.className = `px-3 py-1 rounded ${this.currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-orange-primary text-white hover:bg-orange-secondary'}`;
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
                pageButton.className = `px-3 py-1 rounded ${i === this.currentPage ? 'bg-orange-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`;
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
        nextButton.className = `px-3 py-1 rounded ${this.currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-orange-primary text-white hover:bg-orange-secondary'}`;
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
            // Extrair apenas a parte da data (YYYY-MM-DD) sem timezone
            const [isoDate] = dateString.split('T');
            if (!isoDate || isoDate.length < 10) return 'N/A';
            const [ano, mes, dia] = isoDate.split('-');
            return `${dia}/${mes}/${ano}`;
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

    viewPDF(filename) {
        if (!filename) {
            this.showNotification('Arquivo PDF não encontrado', 'error');
            return;
        }
        
        // Construir URL do arquivo usando a rota da API (mesma do dashboard CD)
        const fileUrl = `${API_BASE_URL}/api/files/${filename}`;
        console.log('Abrindo PDF:', fileUrl);
        
        // Abrir em nova aba
        window.open(fileUrl, '_blank');
    }

    toggleComparativo() {
        const section = document.getElementById('comparativo-section');
        if (section.classList.contains('hidden')) {
            section.classList.remove('hidden');
            this.renderComparativo();
        } else {
            section.classList.add('hidden');
        }
    }

    renderComparativo() {
        const container = document.getElementById('comparativo-content');
        if (!container) return;

        // Agrupar por CD
        const cdStats = {};
        this.agendamentos.forEach(a => {
            const cdNome = a.cd?.nome || 'Sem CD';
            if (!cdStats[cdNome]) {
                cdStats[cdNome] = {
                    total: 0,
                    pendente: 0,
                    confirmado: 0,
                    entregue: 0,
                    naoVeio: 0,
                    cancelado: 0
                };
            }
            cdStats[cdNome].total++;
            if (a.status === 'pendente') cdStats[cdNome].pendente++;
            if (a.status === 'confirmado') cdStats[cdNome].confirmado++;
            if (a.status === 'entregue') cdStats[cdNome].entregue++;
            if (a.status === 'nao-veio') cdStats[cdNome].naoVeio++;
            if (a.status === 'cancelado') cdStats[cdNome].cancelado++;
        });

        // Calcular métricas e ordenar
        const cdArray = Object.keys(cdStats).map(nome => {
            const stats = cdStats[nome];
            const taxaEntrega = stats.total > 0 ? ((stats.entregue / stats.total) * 100).toFixed(1) : 0;
            const taxaNaoVeio = stats.total > 0 ? ((stats.naoVeio / stats.total) * 100).toFixed(1) : 0;
            const taxaConfirmacao = stats.total > 0 ? (((stats.confirmado + stats.entregue) / stats.total) * 100).toFixed(1) : 0;
            
            return {
                nome,
                ...stats,
                taxaEntrega: parseFloat(taxaEntrega),
                taxaNaoVeio: parseFloat(taxaNaoVeio),
                taxaConfirmacao: parseFloat(taxaConfirmacao)
            };
        }).sort((a, b) => b.taxaEntrega - a.taxaEntrega);

        // Renderizar cards
        container.innerHTML = cdArray.map((cd, index) => {
            const medalha = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            const borderColor = index === 0 ? 'border-yellow-400' : index === 1 ? 'border-gray-400' : index === 2 ? 'border-orange-400' : 'border-gray-200';
            
            return `
                <div class="bg-white border-2 ${borderColor} rounded-xl p-4 hover:shadow-lg transition-all">
                    <div class="flex items-center justify-between mb-3">
                        <h4 class="font-bold text-gray-900 text-lg">${cd.nome}</h4>
                        ${medalha ? `<span class="text-3xl">${medalha}</span>` : ''}
                    </div>
                    <div class="space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-600">Total:</span>
                            <span class="font-bold text-gray-900">${cd.total}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-600">Taxa Entrega:</span>
                            <span class="font-bold ${cd.taxaEntrega >= 70 ? 'text-green-600' : cd.taxaEntrega >= 50 ? 'text-yellow-600' : 'text-red-600'}">${cd.taxaEntrega}%</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-600">Taxa Confirmação:</span>
                            <span class="font-bold text-blue-600">${cd.taxaConfirmacao}%</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-600">Não Veio:</span>
                            <span class="font-bold text-red-600">${cd.taxaNaoVeio}%</span>
                        </div>
                        <div class="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-2 text-xs">
                            <div class="text-center">
                                <p class="text-yellow-600 font-semibold">${cd.pendente}</p>
                                <p class="text-gray-500">Pendentes</p>
                            </div>
                            <div class="text-center">
                                <p class="text-blue-600 font-semibold">${cd.entregue}</p>
                                <p class="text-gray-500">Entregues</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
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

    // Função para abrir modal de alterar status
    abrirModalAlterarStatus(agendamentoId) {
        const agendamento = this.agendamentos.find(a => a.id === agendamentoId);
        if (!agendamento) {
            this.showNotification('Agendamento não encontrado', 'error');
            return;
        }

        // Criar modal dinamicamente
        const modalHTML = `
            <div id="modal-alterar-status" class="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
                <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
                    <div class="text-center mb-6">
                        <div class="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <i class="fas fa-exchange-alt text-blue-600 text-2xl"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-900">Alterar Status</h3>
                        <p class="text-gray-600 mt-2">Agendamento #${agendamento.codigo}</p>
                        <p class="text-sm text-gray-500 mt-1">Status atual: <strong>${this.getStatusLabel(agendamento.status)}</strong></p>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">
                                <i class="fas fa-list-ul mr-2 text-blue-600"></i>
                                Novo Status
                            </label>
                            <select id="novo-status-select" class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-20 transition-all">
                                <option value="">Selecione o status</option>
                                <option value="pendente">Pendente</option>
                                <option value="confirmado">Confirmado (Aguardando Entrega)</option>
                                <option value="entregue">Entregue</option>
                                <option value="nao-veio">Não Veio</option>
                                <option value="reagendamento">Reagendamento</option>
                                <option value="cancelado-fornecedor">Cancelado pelo Fornecedor</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">
                                <i class="fas fa-comment mr-2 text-blue-600"></i>
                                Motivo/Observação (opcional)
                            </label>
                            <textarea id="motivo-alteracao-status" 
                                rows="3"
                                class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-20 transition-all"
                                placeholder="Descreva o motivo da alteração..."></textarea>
                        </div>

                        <div class="flex space-x-3 mt-6">
                            <button onclick="dashboardConsultivo.fecharModalAlterarStatus()" 
                                class="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-semibold">
                                <i class="fas fa-times mr-2"></i>
                                Cancelar
                            </button>
                            <button onclick="dashboardConsultivo.confirmarAlteracaoStatus(${agendamentoId})" 
                                class="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition-all font-semibold">
                                <i class="fas fa-check mr-2"></i>
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal anterior se existir
        const modalExistente = document.getElementById('modal-alterar-status');
        if (modalExistente) {
            modalExistente.remove();
        }

        // Adicionar novo modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    fecharModalAlterarStatus() {
        const modal = document.getElementById('modal-alterar-status');
        if (modal) {
            modal.remove();
        }
    }

    async confirmarAlteracaoStatus(agendamentoId) {
        const novoStatus = document.getElementById('novo-status-select').value;
        const motivo = document.getElementById('motivo-alteracao-status').value;

        if (!novoStatus) {
            this.showNotification('Selecione um status', 'warning');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/agendamentos/${agendamentoId}/admin/alterar-status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    novoStatus,
                    motivo
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao alterar status');
            }

            const result = await response.json();
            
            this.showNotification('Status alterado com sucesso!', 'success');
            this.fecharModalAlterarStatus();
            
            // Recarregar agendamentos
            await this.loadAgendamentos();

        } catch (error) {
            console.error('Erro ao alterar status:', error);
            this.showNotification('Erro ao alterar status: ' + error.message, 'error');
        }
    }

    getStatusLabel(status) {
        const statusMap = {
            'pendente': 'Pendente',
            'confirmado': 'Confirmado',
            'entregue': 'Entregue',
            'nao-veio': 'Não Veio',
            'reagendamento': 'Reagendamento',
            'reagendado': 'Reagendado',
            'cancelado-fornecedor': 'Cancelado pelo Fornecedor',
            'cancelado': 'Cancelado'
        };
        return statusMap[status] || status;
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
    const modal = document.getElementById('detalhes-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

// Inicializar dashboard apenas se estiver na página consultivo
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se estamos no dashboard consultivo (não no admin)
    if (document.querySelector('body').innerHTML.includes('Dashboard Consultivo')) {
        window.dashboardConsultivo = new DashboardConsultivo();
        window.dashboardConsultivo.init();
    }
});
