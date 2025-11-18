// Usa API_BASE_URL do config.js
// Certifique-se que config.js está incluído antes deste arquivo
function getApiBaseUrl() {
    return typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : window.location.origin;
}

// Função global para verificar token expirado
function handleTokenExpired(response) {
    if (response.status === 403) {
        console.log('🔒 Token expirado, redirecionando para login...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
        return true;
    }
    return false;
}

// Wrapper para usar DateFormatter se disponível, senão fallback para funções locais
const DateUtils = typeof DateFormatter !== 'undefined' ? DateFormatter : {
    formatDate: function(dateString) {
        if (!dateString) return '';
        const [isoDate] = dateString.split('T');
        if (!isoDate || isoDate.length < 10) return '';
        const [ano, mes, dia] = isoDate.split('-');
        return `${dia}/${mes}/${ano}`;
    },
    formatDateTime: function(dateString) {
        if (!dateString) return 'Data/Hora não informada';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Data/Hora inválida';
            return date.toLocaleString('pt-BR');
        } catch (error) {
            return 'Data/Hora inválida';
        }
    },
    createSafeDate: function(dateString) {
        if (!dateString) return new Date();
        try {
            let date;
            if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                date = new Date(dateString + 'T00:00:00');
            } else {
                date = new Date(dateString);
            }
            return isNaN(date.getTime()) ? new Date() : date;
        } catch (error) {
            return new Date();
        }
    },
    parseLocalDate: function(dateInput) {
        if (!dateInput) return null;
        if (typeof dateInput === 'string') {
            if (dateInput.includes('T')) {
                const dateOnly = dateInput.split('T')[0];
                const [ano, mes, dia] = dateOnly.split('-').map(Number);
                return new Date(ano, mes - 1, dia);
            } else if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const [ano, mes, dia] = dateInput.split('-').map(Number);
                return new Date(ano, mes - 1, dia);
            }
        }
        return new Date(dateInput);
    }
};

// Manter funções originais como alias para compatibilidade total
function parseLocalDate(dateInput) {
    return DateUtils.parseLocalDate(dateInput);
}

// Funções globais de máscara para formatação automática
function maskPhone(value) {
    // Remove tudo que não é dígito
    value = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos máximo
    value = value.substring(0, 11);
    
    // Aplica a máscara (83) 00000-0000
    if (value.length <= 10) {
        value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else {
        value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    }
    
    return value;
}

function maskCPF(value) {
    // Remove tudo que não é dígito
    value = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos máximo
    value = value.substring(0, 11);
    
    // Aplica a máscara 000.000.000-00
    value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    
    return value;
}

function maskCNPJ(value) {
    // Remove tudo que não é dígito
    value = value.replace(/\D/g, '');
    
    // Limita a 14 dígitos máximo
    value = value.substring(0, 14);
    
    // Aplica a máscara 00.000.000/0000-00
    value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
    
    return value;
}

function maskDocument(input) {
    let value = input.value.replace(/\D/g, '');
    
    // Limita a 14 dígitos máximo (CNPJ)
    value = value.substring(0, 14);
    
    if (value.length <= 11) {
        // CPF
        input.value = maskCPF(input.value);
    } else {
        // CNPJ
        input.value = maskCNPJ(input.value);
    }
}

// Função para aplicar máscaras em um elemento pai
function applyMasksToContainer(container) {
    // Telefone
    const phoneInputs = container.querySelectorAll('input[type="tel"], input[name*="telefone"], input[id*="telefone"]');
    phoneInputs.forEach(input => {
        // Definir maxlength se não estiver definido
        if (!input.getAttribute('maxlength')) {
            input.setAttribute('maxlength', '15');
        }
        
        input.addEventListener('input', function(e) {
            e.target.value = maskPhone(e.target.value);
        });
    });

    // Documento (CPF/CNPJ)
    const documentInputs = container.querySelectorAll('input[name*="cnpj"], input[id*="cnpj"], input[name*="documento"], input[id*="documento"]');
    documentInputs.forEach(input => {
        // Definir maxlength se não estiver definido
        if (!input.getAttribute('maxlength')) {
            input.setAttribute('maxlength', '18');
        }
        
        input.addEventListener('input', function(e) {
            maskDocument(e.target);
        });
    });
}

// Função global para visualizar PDF
function viewPDF(filename) {
    if (!filename) {
        console.log('Nenhum arquivo para visualizar');
        return;
    }
    
    // Construir URL do arquivo usando a rota da API
    const fileUrl = `/api/files/${filename}`;
    console.log('Abrindo PDF:', fileUrl);
    
    // Abrir em nova aba
    window.open(fileUrl, '_blank');
}
// Garantir função global para o botão do bloqueio
window.submitBloqueioButton = function() {
    try {
        const form = document.getElementById('bloqueio-form');
        if (!form) {
            console.error('[Frontend] submitBloqueioButton: formulário não encontrado');
            return;
        }
        const fakeEvent = {
            preventDefault: () => {},
            target: form
        };
        console.log('[Frontend] submitBloqueioButton chamado — executando handleBloqueioSubmit');
        handleBloqueioSubmit(fakeEvent);
    } catch (err) {
        console.error('[Frontend] Erro em submitBloqueioButton:', err);
    }
};

// Modal DASHBOARD KPIs removido - será refeito do zero conforme solicitado
// Funções globais para compatibilidade com HTML (onclick)
window.openConsultaModal = function() { dashboard.openConsultaModal(); };
window.closeConsultaModal = function() { dashboard.closeConsultaModal(); };
window.openRegistrarEntregaModal = function() { dashboard.openRegistrarEntregaModal(); };
window.closeRegistrarEntregaModal = function() { dashboard.closeRegistrarEntregaModal(); };
window.openBloqueioModal = function() { dashboard.openBloqueioModal(); };
window.closeBloqueioModal = function() { dashboard.closeBloqueioModal(); };
window.openGerenciarBloqueiosModal = function() { dashboard.openGerenciarBloqueiosModal(); };
window.closeGerenciarBloqueiosModal = function() { dashboard.closeGerenciarBloqueiosModal(); };
window.openEntregasModal = function() { dashboard.openEntregasModal(); };
window.closeEntregasModal = function() { dashboard.closeEntregasModal(); };
window.closeDetailModal = function() { dashboard.closeDetailModal(); };
window.closeSuggestDateModal = function() { dashboard.closeSuggestDateModal(); };
window.closeAllStatusModal = function() { dashboard.closeAllStatusModal(); };
window.closeTodayDeliveriesModal = function() { dashboard.closeTodayDeliveriesModal(); };
window.closeStatusModal = function() { dashboard.closeStatusModal(); };
window.closeEditarBloqueioModal = function() { dashboard.closeEditarBloqueioModal(); };
window.fecharModalEntregas = function() { dashboard.fecharModalEntregas(); };

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
        this.cdId = null; // CORREÇÃO: Inicializar cdId
        
        // Propriedades de paginação
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalPages = 1;
        
        this.init();
    }

    toggleUserMenu() {
        const userMenu = document.getElementById('user-menu');
        if (userMenu) {
            userMenu.classList.toggle('hidden');
        }
    }

    // Configura todos os campos de data para aceitar apenas dias úteis
    setMinDate() {
        const today = new Date();
        
        // Função para verificar se é dia útil
        const isWeekday = (date) => {
            const day = date.getDay();
            return day !== 0 && day !== 6; // 0 = domingo, 6 = sábado
        };
        
        // Função para encontrar próximo dia útil
        const getNextWeekday = (date) => {
            const nextDay = new Date(date);
            while (!isWeekday(nextDay)) {
                nextDay.setDate(nextDay.getDate() + 1);
            }
            return nextDay;
        };
        
        // Se hoje não for dia útil, usar próximo dia útil
        const minDate = isWeekday(today) ? today : getNextWeekday(today);
        const minDateString = minDate.toISOString().split('T')[0];
        
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            input.min = minDateString;
            
            // Adicionar validação para impedir seleção de fins de semana
            if (!input.hasAttribute('data-weekday-validator')) {
                input.addEventListener('change', function() {
                    const selectedDate = new Date(this.value + 'T00:00:00');
                    if (!isWeekday(selectedDate)) {
                        alert('Por favor, selecione apenas dias úteis (segunda a sexta-feira).');
                        const nextWeekday = getNextWeekday(selectedDate);
                        this.value = nextWeekday.toISOString().split('T')[0];
                    }
                });
                input.setAttribute('data-weekday-validator', 'true');
            }
            
            // Definir valor padrão como próximo dia útil se estiver vazio
            if (!input.value) {
                const defaultDate = getNextWeekday(new Date());
                input.value = defaultDate.toISOString().split('T')[0];
            }
        });
    }

    // Modal KPIs
    openKpisModal() {
        document.getElementById('dashboard-kpis-modal')?.classList.remove('hidden');
        this.loadKpis();
    }

    closeKpisModal() {
        document.getElementById('dashboard-kpis-modal')?.classList.add('hidden');
    }

    async loadKpis() {
        const loading = document.getElementById('kpis-loading');
        const content = document.getElementById('kpis-content');
        loading.classList.remove('hidden');
        content.innerHTML = '';
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`${getApiBaseUrl()}/api/kpis`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao buscar KPIs');
            const kpis = await res.json();
            loading.classList.add('hidden');
            content.innerHTML = this.renderKpisContent(kpis);
            this.renderKpisCharts(kpis);
        } catch (e) {
            loading.classList.add('hidden');
            content.innerHTML = `<div class='text-center text-red-600 font-bold'>Erro ao carregar KPIs</div>`;
        }
    }

    renderKpisContent(kpis) {
        // KPIs principais
        return `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div class="bg-gradient-to-br from-orange-primary to-orange-accent text-white rounded-2xl p-8 shadow-lg flex flex-col items-center">
                <div class="text-4xl font-bold mb-2">${kpis.totalAgendamentos ?? '-'}</div>
                <div class="text-lg font-semibold">Total de Agendamentos</div>
            </div>
            <div class="bg-gradient-to-br from-green-500 to-green-400 text-white rounded-2xl p-8 shadow-lg flex flex-col items-center">
                <div class="text-4xl font-bold mb-2">${kpis.percentEntregues ?? '-'}</div>
                <div class="text-lg font-semibold">% Entregues</div>
            </div>
            <div class="bg-gradient-to-br from-red-500 to-orange-primary text-white rounded-2xl p-8 shadow-lg flex flex-col items-center">
                <div class="text-4xl font-bold mb-2">${kpis.percentNaoVeio ?? '-'}</div>
                <div class="text-lg font-semibold">% Não Veio</div>
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div class="bg-white rounded-2xl p-6 shadow flex flex-col">
                <div class="flex justify-between items-center mb-2">
                    <div class="font-bold text-orange-primary text-lg flex items-center"><i class="fas fa-chart-pie mr-2"></i>Status dos Agendamentos</div>
                    <button onclick="dashboard.loadKpis()" class="bg-orange-primary text-white px-3 py-1 rounded hover:bg-orange-secondary"><i class="fas fa-sync-alt"></i></button>
                </div>
                <canvas id="kpi-status-pizza" height="180"></canvas>
            </div>
            <div class="bg-white rounded-2xl p-6 shadow flex flex-col">
                <div class="font-bold text-orange-primary text-lg mb-2 flex items-center"><i class="fas fa-chart-line mr-2"></i>Agendamentos por Dia</div>
                <canvas id="kpi-agendamentos-linha" height="180"></canvas>
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div class="bg-white rounded-2xl p-6 shadow flex flex-col">
                <div class="font-bold text-orange-primary text-lg mb-2 flex items-center"><i class="fas fa-stopwatch mr-2"></i>Tempo Médio de Permanência</div>
                <div class="text-3xl font-bold text-gray-700">${kpis.tempoMedioPermanencia ?? '-'}</div>
            </div>
            <div class="bg-white rounded-2xl p-6 shadow flex flex-col">
                <div class="font-bold text-orange-primary text-lg mb-2 flex items-center"><i class="fas fa-users mr-2"></i>Top 5 Transportadores Não Veio</div>
                <canvas id="kpi-top-Transportadores" height="180"></canvas>
            </div>
        </div>
        <div class="bg-white rounded-2xl p-6 shadow flex flex-col mb-8">
            <div class="font-bold text-orange-primary text-lg mb-2 flex items-center"><i class="fas fa-chart-bar mr-2"></i>Não Veio por Dia</div>
            <canvas id="kpi-nao-veio-linha" height="180"></canvas>
        </div>
        `;
    }

    renderKpisCharts(kpis) {
        // Pizza status
        if (window.kpiStatusPizza) window.kpiStatusPizza.destroy();
        window.kpiStatusPizza = new Chart(document.getElementById('kpi-status-pizza').getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: kpis.statusLabels,
                datasets: [{
                    data: kpis.statusValores,
                    backgroundColor: [
                        '#FF6B35','#10B981','#3B82F6','#EF4444','#8B5CF6'
                    ],
                }]
            },
            options: {
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#FF6B35', font: { weight: 'bold' } } }
                }
            }
        });
        // Linha agendamentos por dia
        if (window.kpiAgendLinha) window.kpiAgendLinha.destroy();
        window.kpiAgendLinha = new Chart(document.getElementById('kpi-agendamentos-linha').getContext('2d'), {
            type: 'line',
            data: {
                labels: kpis.agendamentosLabels,
                datasets: [{
                    label: 'Agendamentos',
                    data: kpis.agendamentosValores,
                    borderColor: '#FF6B35',
                    backgroundColor: 'rgba(255,107,53,0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: { x: { ticks: { color: '#FF6B35' } }, y: { ticks: { color: '#FF6B35' } } }
            }
        });
        // Top Transportadores não veio
        if (window.kpiTopForn) window.kpiTopForn.destroy();
        window.kpiTopForn = new Chart(document.getElementById('kpi-top-Transportadores').getContext('2d'), {
            type: 'bar',
            data: {
                labels: kpis.topTransportadoresLabels,
                datasets: [{
                    label: 'Não Veio',
                    data: kpis.topTransportadoresValores,
                    backgroundColor: '#EF4444',
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: { x: { ticks: { color: '#FF6B35' } }, y: { ticks: { color: '#FF6B35' } } }
            }
        });
        // Linha não veio por dia
        if (window.kpiNaoVeioLinha) window.kpiNaoVeioLinha.destroy();
        window.kpiNaoVeioLinha = new Chart(document.getElementById('kpi-nao-veio-linha').getContext('2d'), {
            type: 'line',
            data: {
                labels: kpis.agendamentosLabels,
                datasets: [{
                    label: 'Não Veio',
                    data: kpis.naoVeioPorDia,
                    borderColor: '#EF4444',
                    backgroundColor: 'rgba(239,68,68,0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: { x: { ticks: { color: '#FF6B35' } }, y: { ticks: { color: '#EF4444' } } }
            }
        });
    }

    // Funções globais para abrir/fechar modais do dashboard
    openConsultaModal() {
        document.getElementById('consulta-modal')?.classList.remove('hidden');
    }

    closeConsultaModal() {
        document.getElementById('consulta-modal')?.classList.add('hidden');
    }

    openRegistrarEntregaModal() {
        const modal = document.getElementById('registrar-entrega-modal');
        modal.classList.remove('hidden');
        
        // Reset do formulário
        entregaCurrentStep = 1;
        entregaPedidos = [];
        entregaCurrentPedido = 0;
        
        // Mostrar apenas o primeiro step
        mostrarStepEntrega(1);
        
        // Configurar data atual
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('entrega-data').value = hoje;
        
        // Configurar horário atual
        const agora = new Date();
        const horaAtual = agora.getHours().toString().padStart(2, '0') + ':00';
        const selectHorario = document.getElementById('entrega-horario');
        if (selectHorario) {
            selectHorario.value = horaAtual;
        }
        
        // Configurar o submit do formulário
        document.getElementById('registrar-entrega-form').onsubmit = handleRegistrarEntrega;
    }

    closeRegistrarEntregaModal() {
        document.getElementById('registrar-entrega-modal')?.classList.add('hidden');
    }

    openBloqueioModal() {
        document.getElementById('bloqueio-modal')?.classList.remove('hidden');
    }

    closeBloqueioModal() {
        document.getElementById('bloqueio-modal')?.classList.add('hidden');
    }

    openGerenciarBloqueiosModal() {
        document.getElementById('gerenciar-bloqueios-modal')?.classList.remove('hidden');
    }

    closeGerenciarBloqueiosModal() {
        document.getElementById('gerenciar-bloqueios-modal')?.classList.add('hidden');
    }

    openEntregasModal() {
        document.getElementById('modal-entregas')?.classList.remove('hidden');
    }

    closeEntregasModal() {
        document.getElementById('modal-entregas')?.classList.add('hidden');
    }

    closeDetailModal() {
        document.getElementById('detail-modal')?.classList.add('hidden');
    }

    closeSuggestDateModal() {
        document.getElementById('suggest-date-modal')?.classList.add('hidden');
    }

    closeAllStatusModal() {
        document.getElementById('all-status-modal')?.classList.add('hidden');
    }

    closeTodayDeliveriesModal() {
        document.getElementById('today-deliveries-modal')?.classList.add('hidden');
    }

    closeStatusModal() {
        document.getElementById('status-modal')?.classList.add('hidden');
    }

    closeEditarBloqueioModal() {
        document.getElementById('editar-bloqueio-modal')?.classList.add('hidden');
    }

    fecharModalEntregas() {
        document.getElementById('modal-entregas-entregues')?.classList.add('hidden');
    }

    // CORREÇÃO: Método getCDFromToken adicionado
    getCDFromToken() {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) return null;
            
            if (token.includes('.')) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return payload.cdId || payload.id || null;
            }
            return null;
        } catch (error) {
            console.error('Erro ao decodificar token:', error);
            return null;
        }
    }

    // Função para formatar datas de forma segura
    formatDate(dateString) {
        return DateUtils.formatDate(dateString);
    }

    // Função para formatar data e hora de forma segura
    formatDateTime(dateString) {
        return DateUtils.formatDateTime(dateString);
    }

    // Função para criar objeto Date de forma segura
    createSafeDate(dateString) {
        return DateUtils.createSafeDate(dateString);
    }

    init() {
        this.checkAuthentication();
        this.setupEventListeners();
        // Botão KPIs
        const kpisBtn = document.getElementById('dashboard-kpis-button');
        if (kpisBtn) {
            kpisBtn.onclick = () => this.openKpisModal();
        }
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

    // CORREÇÃO: Método loadUserInfo completo e correto
    loadUserInfo() {
        const usuario = sessionStorage.getItem('usuario');
        // Preencher nome do usuário no menu
        const usuarioNomeEl = document.getElementById('usuario-nome');
        if (usuarioNomeEl && usuario) {
            usuarioNomeEl.textContent = usuario;
        }
        const cd = sessionStorage.getItem('cd');
        const cdInfo = sessionStorage.getItem('cdInfo');
        // Preencher o nome do CD no header
        const cdNomeEl = document.getElementById('cd-nome');
        if (cdNomeEl) {
            let nome = 'Não identificado';
            if (cdInfo) {
                try {
                    const cdObj = JSON.parse(cdInfo);
                    if (cdObj && cdObj.nome) {
                        nome = cdObj.nome;
                    }
                } catch (e) {
                    // Se der erro, mantém o padrão
                }
            }
            cdNomeEl.textContent = nome;
        }
    }

    async loadAgendamentos() {
        this.showLoading(true);
        
        try {
            const token = sessionStorage.getItem('token');
            
            // Adicionar timestamp para evitar cache
            const url = `${getApiBaseUrl()}/api/agendamentos?t=${Date.now()}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Erro ao carregar agendamentos:', errorText);
                
                // Verificar se é token expirado
                if (handleTokenExpired(response)) {
                    return;
                }
                
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log('📊 Dados recebidos:', data);
            
            // Mapear fornecedor para transportador (compatibilidade backend)
            this.agendamentos = (data.data || []).map(agendamento => {
                if (agendamento.fornecedor && !agendamento.transportador) {
                    agendamento.transportador = agendamento.fornecedor;
                }
                return agendamento;
            });
            
            this.filteredAgendamentos = [...this.agendamentos];
            this.showLoading(false);
            this.renderAgendamentos();
        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
            this.showNotification('Erro ao carregar agendamentos.', 'error');
            this.showLoading(false);
            return;
        }

        // Calcula as estatísticas para todos os cards
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
            if (status === 'aguardando_resposta_Transportador') {
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
        const hojeStr = new Date().toISOString().split('T')[0];
        const dataEntregaStr = (agendamento.dataEntrega || '').split('T')[0];
        const isToday = hojeStr === dataEntregaStr;
        // Calcula diferença de dias apenas por string (YYYY-MM-DD)
        const hojeDate = new Date(hojeStr);
        const entregaDate = new Date(dataEntregaStr);
        const daysDiff = Math.floor((entregaDate - hojeDate) / (1000 * 60 * 60 * 24));
        let priorityClass = '';
        let urgentClass = '';
        if (agendamento.status === 'confirmado') {
            if (isToday) {
                urgentClass = '';
            } else if (daysDiff <= 1) {
                priorityClass = 'priority-high';
            } else if (daysDiff <= 3) {
                priorityClass = 'priority-medium';
            } else {
                priorityClass = 'priority-low';
            }
        } else if (agendamento.status === 'pendente') {
            const dataCriacaoStr = (agendamento.dataCriacao || '').split('T')[0];
            const dataCriacaoDate = new Date(dataCriacaoStr);
            const daysSinceCreated = Math.floor((hojeDate - dataCriacaoDate) / (1000 * 60 * 60 * 24));
            if (daysSinceCreated >= 3) {
                priorityClass = 'priority-high';
            } else if (daysSinceCreated >= 1) {
                priorityClass = 'priority-medium';
            }
        }

        // Verificar se a entrega foi incluída pelo CD
        const incluidoPeloCD = agendamento.incluidoPeloCD;
        const cdIndicator = incluidoPeloCD ? 
            `<div class="bg-blue-100 border-l-4 border-blue-500 text-blue-800 font-bold text-xs p-2 rounded mb-2 flex items-center">
                <i class="fas fa-info-circle mr-2"></i>
                INCLUÍDO PELO CD
            </div>` : '';

        return `
            <div class="column-card bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-all ${priorityClass} ${urgentClass}"
                 onclick="dashboard.showAgendamentoDetails(${agendamento.id})">
                
                <!-- Alerta de entrega para hoje removido conforme solicitado -->
                
                <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                        <h4 class="font-bold text-gray-dark text-sm">${agendamento.codigo}</h4>
                        <p class="text-gray-600 text-xs truncate">${agendamento.transportador.nome}</p>
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
        const hojeStr = new Date().toISOString().split('T')[0];
        const amanhaStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const dataEntregaStr = (agendamento.dataEntrega || '').split('T')[0];
        const dataCriacaoStr = (agendamento.dataCriacao || '').split('T')[0];
        const hojeDate = new Date(hojeStr);
        const dataCriacaoDate = new Date(dataCriacaoStr);
        const daysSinceCreated = Math.floor((hojeDate - dataCriacaoDate) / (1000 * 60 * 60 * 24));
        if (agendamento.status === 'pendente' && daysSinceCreated >= 3) {
            return `
                <div class="mt-2 text-xs text-red-600 font-semibold flex items-center">
                    <i class="fas fa-exclamation-triangle mr-1"></i>
                    Há ${daysSinceCreated} dias
                </div>
            `;
        } else if (agendamento.status === 'confirmado') {
            if (dataEntregaStr === hojeStr) {
                return `
                    <div class="mt-2 text-xs text-yellow-600 font-semibold flex items-center">
                        <i class="fas fa-clock mr-1"></i>
                        Hoje
                    </div>
                `;
            } else if (dataEntregaStr === amanhaStr) {
                return `
                    <div class="mt-2 text-xs text-yellow-600 font-semibold flex items-center">
                        <i class="fas fa-clock mr-1"></i>
                        Amanhã
                    </div>
                `;
            }
        }
        return '';
    }

    checkTodayDeliveries() {
        const hojeStr = new Date().toISOString().split('T')[0];
        this.todayDeliveries = this.agendamentos.filter(a => ((a.dataEntrega || '').split('T')[0] === hojeStr));
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
                        <p class="text-gray-medium">${agendamento.transportador.nome}</p>
                        <p class="text-sm text-gray-500">${agendamento.transportador.email}</p>
                        <!-- Tipo de Veículo removido do card Transportadora -->
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
                        <p class="text-gray-dark font-semibold">${agendamento.transportador.nome}</p>
                        <p class="text-sm text-gray-600">${agendamento.transportador.telefone}</p>
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
                                <div class="text-sm font-medium text-gray-900 truncate">${agendamento.transportador?.nome || 'N/A'}</div>
                                <div class="text-xs text-gray-500 truncate">${agendamento.transportador?.email || 'N/A'}</div>
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
                case 'Transportador':
                    valueA = a.transportador?.nome || '';
                    valueB = b.transportador?.nome || '';
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
            'aguardando_resposta_Transportador': 'fas fa-hourglass-half'
        };
        return icons[status] || 'fas fa-question-circle';
    }

    getStatusText(status) {
        // Permite exibir 'Pendente (reagendamento)' se observações contiverem 'reagend'
        if (typeof this === 'object' && this.currentAgendamento && this.currentAgendamento.status === 'pendente' && this.currentAgendamento.observacoes && this.currentAgendamento.observacoes.toLowerCase().includes('reagend')) {
            return 'Pendente (reagendamento)';
        }
        const texts = {
            'pendente': 'Pendente',
            'confirmado': 'Confirmado',
            'entregue': 'Entregue',
            'nao-veio': 'Não Veio',
            'reagendamento': 'Reagendamento',
            'aguardando_resposta_Transportador': 'Aguardando Transportador'
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
            'aguardando_resposta_Transportador': 'bg-yellow-500 text-white',
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

        // ...existing code...

        const transportadorHtml = (agendamento.transportadorNome || agendamento.transportadorDocumento || agendamento.transportadorTelefone || agendamento.transportadorEmail) ? `
            <div class="bg-white border border-green-200 rounded-lg p-4 shadow-sm">
                <div class="flex items-center mb-3">
                    <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-2">
                        <i class="fas fa-truck-moving text-green-600 text-sm"></i>
                    </div>
                    <h3 class="text-md font-semibold text-gray-800">Transportador</h3>
                </div>
                <div class="space-y-2 text-sm">
                    ${agendamento.transportadorNome ? `<div><span class="text-gray-600 text-xs">Nome</span><p class="font-semibold">${agendamento.transportadorNome}</p></div>` : ''}
                    ${agendamento.transportadorDocumento ? `<div><span class="text-gray-600 text-xs">CNPJ</span><p class="font-semibold">${agendamento.transportadorDocumento}</p></div>` : ''}
                    ${agendamento.transportadorTelefone ? `<div><span class="text-gray-600 text-xs">Telefone</span><p class="font-semibold">${agendamento.transportadorTelefone}</p></div>` : ''}
                    ${agendamento.transportadorEmail ? `<div><span class="text-gray-600 text-xs">E-mail</span><p class="font-semibold">${agendamento.transportadorEmail}</p></div>` : ''}
                </div>
            </div>
        ` : '';

        const volumesHtml = (agendamento.quantidadeVolumes || agendamento.tipoVolume) ? `
            <div class="bg-white border border-orange-200 rounded-lg p-4 shadow-sm">
                <div class="flex items-center mb-3">
                    <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-2">
                        <i class="fas fa-boxes text-orange-600 text-sm"></i>
                    </div>
                    <h3 class="text-md font-semibold text-gray-800">Volumes</h3>
                </div>
                <div class="space-y-2 text-sm">
                    <div><span class="text-gray-600 text-xs">Quantidade</span><p class="font-semibold">${agendamento.quantidadeVolumes || 'Não informado'}</p></div>
                    <div><span class="text-gray-600 text-xs">Tipo</span><p class="font-semibold">${agendamento.tipoVolume || 'Não informado'}</p></div>
                </div>
            </div>
        ` : '';

        const detailContent = document.getElementById('detail-content');
        // Calcular valor total das NFs
        let valorTotal = 0;
        if (agendamento.notasFiscais && agendamento.notasFiscais.length > 0) {
            agendamento.notasFiscais.forEach(nf => {
                // Valor vem como "2.000.00" onde o último .00 são centavos
                // Troca o último ponto por vírgula, remove os outros pontos
                let valorStr = String(nf.valor || '0');
                // Encontra o último ponto e troca por vírgula
                const lastDotIndex = valorStr.lastIndexOf('.');
                if (lastDotIndex !== -1) {
                    valorStr = valorStr.substring(0, lastDotIndex).replace(/\./g, '') + ',' + valorStr.substring(lastDotIndex + 1);
                }
                // Agora converte: "2000,00" -> "2000.00"
                valorStr = valorStr.replace(',', '.');
                const v = parseFloat(valorStr) || 0;
                valorTotal += v;
            });
        }
        // Corrigir data de criação
        const dataCriacao = agendamento.createdAt ? this.formatDate(agendamento.createdAt) : 'Não informado';
        detailContent.innerHTML = `
            <div class="space-y-4">
                ${cdIndicatorHtml}
                <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
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
                    <!-- Transportador -->
                    ${transportadorHtml}
                    <!-- Volumes -->
                    ${volumesHtml}
                    <!-- Dados do Transportador -->
                    <div class="bg-white border border-green-200 rounded-lg p-4 shadow-sm">
                        <div class="flex items-center mb-3">
                            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-2">
                                <i class="fas fa-truck-moving text-green-600 text-sm"></i>
                            </div>
                            <h3 class="text-md font-semibold text-gray-800">Transportadora</h3>
                        </div>
                        <div class="space-y-2 text-sm">
                            <div>
                                <span class="text-gray-600 text-xs">Empresa</span>
                                <p class="font-semibold truncate" title="${agendamento.transportador.nome}">${agendamento.transportador.nome}</p>
                            </div>
                            <div>
                                <span class="text-gray-600 text-xs">E-mail</span>
                                <p class="font-semibold truncate" title="${agendamento.transportador.email}">${agendamento.transportador.email}</p>
                            </div>
                            <div>
                                <span class="text-gray-600 text-xs">Telefone</span>
                                <p class="font-semibold">${agendamento.transportador.telefone}</p>
                            </div>
                            ${agendamento.transportador.documento ? `
                                <div>
                                    <span class="text-gray-600 text-xs">CNPJ</span>
                                    <p class="font-semibold text-xs">${agendamento.transportador.documento}</p>
                                </div>
                            ` : ''}
                               <div>
                                   <!-- Tipo de Veículo removido do card Transportadora -->
                               </div>
                        </div>
                    </div>
                    <!-- Motorista -->
                        <div class="bg-white border border-blue-200 rounded-lg p-4 shadow-sm">
                            <div class="flex items-center mb-3">
                                <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                                    <i class="fas fa-user-tie text-blue-600 text-sm"></i>
                                </div>
                                <h3 class="text-md font-semibold text-gray-800">Motorista</h3>
                            </div>
                            <div class="space-y-2 text-sm">
                                <div>
                                    <span class="text-gray-600 text-xs">Nome</span>
                                    <p class="font-semibold">${agendamento.motoristaNome || agendamento.transportador?.nomeResponsavel || 'Não informado'}</p>
                                </div>
                                <div>
                                    <span class="text-gray-600 text-xs">CPF</span>
                                    <p class="font-semibold">${agendamento.motoristaCpf || agendamento.transportador?.cpfMotorista || 'Não informado'}</p>
                                </div>
                                <div>
                                    <span class="text-gray-600 text-xs">Telefone</span>
                                    <p class="font-semibold">${agendamento.motoristaTelefone || agendamento.transportador?.telefoneMotorista || 'Não informado'}</p>
                                </div>
                                <div>
                                    <span class="text-gray-600 text-xs">Placa</span>
                                    <p class="font-semibold">${agendamento.placaVeiculo || agendamento.transportador?.placaVeiculo || 'Não informado'}</p>
                                </div>
                                <div>
                                    <span class="text-gray-600 text-xs">Tipo de Veículo</span>
                                    <p class="font-semibold text-xs">${agendamento.tipoVeiculo || agendamento.transportador?.tipoVeiculo || 'Não informado'}</p>
                                </div>
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
                                    R$ ${valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Criado em:</span>
                                <span class="font-semibold text-xs">${dataCriacao}</span>
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
                                ${agendamento.notasFiscais.map(nf => {
                                    // SIMPLIFICADO: Exibe o valor exatamente como vem do banco, sem formatação
                                    let valorFormatado = nf.valor ? `R$ ${nf.valor}` : 'Valor não informado';
                                    return `
                                    <div class="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                                        <div class="flex justify-between items-center">
                                            <div class="flex-1">
                                                <div class="flex items-center space-x-3 mb-1">
                                                    <span class="font-semibold text-gray-900">NF: ${nf.numeroNF}</span>
                                                    <span class="text-xs text-gray-500">Pedido: ${nf.numeroPedido}</span>
                                                    ${nf.serie ? `<span class="text-xs text-gray-500">Série: ${nf.serie}</span>` : ''}
                                                </div>
                                                <div class="text-lg font-bold text-green-600">
                                                    ${valorFormatado}
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
                                    `;
                                }).join('')}
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
                    <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div class="flex items-center mb-3">
                            <div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-2">
                                <i class="fas fa-comment-alt text-gray-600 text-sm"></i>
                            </div>
                            <h3 class="text-md font-semibold text-gray-800">Observações da Carga</h3>
                        </div>
                        <div class="space-y-2 text-sm">
                            <p class="font-semibold text-gray-700">${agendamento.observacoes}</p>
                        </div>
                    </div>
                    ` : ''}
                <!-- Bloco de botões de ação -->
                <div class="flex flex-wrap gap-3 justify-end mt-6">
                    ${this.getActionButtons(agendamento)}
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

        // Detect if supplier has responded
        const hasSupplierResponse = historico.some(e => e.acao === 'Transportador_respondeu' || e.acao === 'reagendamento_aceito' || e.acao === 'data_aceita' || e.acao === 'data_rejeitada');

        return `
            <div class="space-y-4">
                ${historico.map((evento, index) => {
                    // Detecta reagendamento do Transportador por nome da ação
                    let acao = evento.acao;
                    let iconClass = this.getHistoryIconClass(acao);
                    let icon = this.getHistoryIcon(acao);
                    let title = this.getHistoryTitle(acao, evento.autor, evento);
                    // Ícones coloridos e padronizados
                    if (acao && acao.toLowerCase().includes('Transportador') && acao.toLowerCase().includes('sugeriu')) {
                        iconClass = 'bg-purple-500';
                        icon = 'fas fa-calendar text-purple-400';
                        title = 'Nova Data Sugerida';
                    } else if (acao && acao.toLowerCase().includes('criado')) {
                        iconClass = 'bg-blue-500';
                        icon = 'fas fa-plus-circle text-blue-400';
                        title = 'Agendamento Criado';
                    } else if (acao && acao.toLowerCase().includes('aceitou')) {
                        iconClass = 'bg-green-500';
                        icon = 'fas fa-thumbs-up text-green-400';
                        title = 'Transportador Aceitou Nova Data';
                    } else if (acao && acao.toLowerCase().includes('rejeitou')) {
                        iconClass = 'bg-red-500';
                        icon = 'fas fa-thumbs-down text-red-400';
                        title = 'Transportador Rejeitou Nova Data';
                    }
                    return `
                        <div class="flex items-start space-x-4 ${index < historico.length - 1 ? 'border-b border-gray-100 pb-4' : ''}">
                            <div class="flex-shrink-0">
                                <div class="w-12 h-12 rounded-full ${iconClass} flex items-center justify-center shadow-sm">
                                    <i class="${icon} text-lg"></i>
                                </div>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between mb-2">
                                    <p class="text-base font-semibold text-gray-900">
                                        ${title}
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
                    `;
                }).join('')}
            </div>
            
            ${(agendamento.status === 'reagendamento' && !hasSupplierResponse) ? `
                <div class="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg">
                    <div class="flex items-center mb-3">
                        <div class="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                            <i class="fas fa-hourglass-half text-white text-sm"></i>
                        </div>
                        <span class="font-semibold text-yellow-800">Aguardando resposta do Transportador</span>
                    </div>
                    <p class="text-sm text-yellow-700 leading-relaxed">
                        O Transportador foi notificado sobre a solicitação de reagendamento e deve responder em breve.
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
            'reagendamento_Transportador': 'bg-orange-500',
            'reagendamento_sugerido': 'bg-purple-500',
            'reagendamento_aceito': 'bg-green-600',
            'nao-veio': 'bg-red-500',
            'cd_sugeriu_reagendamento': 'bg-orange-600',
            'Transportador_respondeu': 'bg-purple-600',
            'status_alterado': 'bg-indigo-600',
            'agendamento_confirmado': 'bg-green-500',
            'agendamento_entregue': 'bg-emerald-600',
            'agendamento_nao_veio': 'bg-red-500',
            'data_aceita': 'bg-green-600',
            'data_rejeitada': 'bg-red-600',
            'Transportador_nao_compareceu': 'bg-red-500',
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
            'reagendamento_Transportador': 'fas fa-calendar-times',
            'reagendamento_sugerido': 'fas fa-calendar-plus',
            'reagendamento_aceito': 'fas fa-handshake',
            'nao-veio': 'fas fa-user-times',
            'cd_sugeriu_reagendamento': 'fas fa-calendar-alt',
            'Transportador_respondeu': 'fas fa-reply-all',
            'status_alterado': 'fas fa-edit',
            'agendamento_confirmado': 'fas fa-check-double',
            'agendamento_entregue': 'fas fa-truck',
            'agendamento_nao_veio': 'fas fa-user-slash',
            'data_aceita': 'fas fa-thumbs-up',
            'data_rejeitada': 'fas fa-thumbs-down',
            'Transportador_nao_compareceu': 'fas fa-exclamation-triangle',
            'agendamento_cancelado': 'fas fa-ban'
        };
        return icons[acao] || 'fas fa-info-circle';
    }

    getHistoryTitle(acao, autor) {
        // Accepts evento as third param for more context
        const titles = {
            'agendamento_criado': 'Agendamento Criado',
            'pendente': 'Status: Pendente',
            'confirmado': 'Status: Confirmado',
            'agendado': 'Status: Agendado',
            'em-transito': 'Em Trânsito',
            'entregue': 'Entrega Realizada',
            'reagendamento_Transportador': 'Transportador Solicitou Reagendamento',
            'reagendamento_sugerido': 'Nova Data Sugerida',
            'reagendamento_aceito': 'Transportador Aceitou Nova Data',
            'nao-veio': 'Transportador Não Compareceu',
            'cd_sugeriu_reagendamento': 'CD Solicitou Reagendamento',
            'Transportador_respondeu': '', // handled below
            'status_alterado': 'Status Alterado',
            'agendamento_confirmado': 'Agendamento Confirmado',
            'agendamento_entregue': 'Entrega Realizada',
            'agendamento_nao_veio': 'Ausência Registrada',
            'data_aceita': 'Transportador Aceitou Nova Data',
            'data_rejeitada': 'Transportador Rejeitou Nova Data',
            'Transportador_nao_compareceu': 'Ausência Registrada',
            'agendamento_cancelado': 'Agendamento Cancelado'
        };
        // Custom logic for Transportador_respondeu
        if (acao === 'Transportador_respondeu' && arguments.length > 2) {
            const evento = arguments[2];
            if (evento && evento.resposta === 'aceita') {
                return 'Transportador Aceitou Nova Data';
            } else if (evento && evento.resposta === 'rejeitada') {
                return 'Transportador Rejeitou Nova Data';
            } else {
                return 'Transportador Respondeu';
            }
        }
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
                    <p class="text-yellow-800 font-medium text-sm">Aguardando resposta do Transportador</p>
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

    async updateAgendamentoStatus(id, newStatus) {
        try {
            const token = sessionStorage.getItem('token');
            
            console.log('Atualizando status:', { id, newStatus, token: token ? 'presente' : 'ausente' });
            
            const response = await fetch(`${getApiBaseUrl()}/api/agendamentos/${id}/status`, {
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
                // Verificar se é token expirado
                if (handleTokenExpired(response)) {
                    return;
                }
                
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
            
            const response = await fetch(`${getApiBaseUrl()}/api/agendamentos/${id}/cancelar`, {
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
                
                // Tentar obter do token usando o novo método
                if (!cdId) {
                    cdId = this.getCDFromToken();
                    if (cdId) {
                        this.cdId = cdId; // Salvar na instância
                        console.log('CD ID recuperado do token:', cdId);
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
            const response = await fetch(`${getApiBaseUrl()}/api/horarios-disponiveis?date=${novaData}&cd=${cdId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                // Verificar se é token expirado
                if (handleTokenExpired(response)) {
                    return;
                }
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
            // Envia a string 'YYYY-MM-DD' pura, sem manipulação
            const response = await fetch(`${getApiBaseUrl()}/api/agendamentos/${this.currentAgendamentoId}/reagendar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    novaData,
                    novoHorario,
                    motivo
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
                
                this.showNotification('Sugestão de nova data enviada ao transportador.', 'success');
            } else {
                // Verificar se é token expirado
                if (handleTokenExpired(response)) {
                    return;
                }
                
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
        if (!filename) {
            console.log('Nenhum arquivo para visualizar');
            return;
        }
        
        // Construir URL do arquivo usando a rota da API
    const fileUrl = `${getApiBaseUrl()}/api/files/${filename}`;
        console.log('Abrindo PDF:', fileUrl);
        
        // Abrir em nova aba
        window.open(fileUrl, '_blank');
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
                agendamento.transportador.nome.toLowerCase().includes(searchText) ||
                agendamento.transportador.email.toLowerCase().includes(searchText);
                
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
                'Transportador': a.transportador.nome,
                'Email': a.transportador.email,
                'Telefone': a.transportador.telefone,
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
            // Buscar agendamento diretamente da API para garantir dados atualizados
            const response = await fetch(`${getApiBaseUrl()}/api/agendamentos/consultar/${codigo}`);
            const result = await response.json();
            if (result.success && result.data) {
                this.closeConsultaModal();
                this.showStatusModal(result.data);
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
                    <p><strong>Transportador:</strong> ${agendamento.transportador.nome}</p>
                    <p><strong>Data Programada:</strong> ${this.formatDate(agendamento.dataEntrega)}</p>
                    <p><strong>Horário:</strong> ${agendamento.horarioEntrega}</p>
                </div>
            </div>
        `;
        
        document.getElementById('status-modal').classList.remove('hidden');
    }
}

// --- FIM DA CLASSE ---

// --- INICIALIZAÇÃO E FUNÇÕES GLOBAIS ---

let dashboard;
// Função que aplica máscaras a inputs dentro de um container
function applyMasksToContainer(container) {
    if (!container) return;

    // Inputs telefone: data-mask="phone" ou class .mask-phone
    const phoneEls = container.querySelectorAll('input[data-mask="phone"], input.mask-phone');
    phoneEls.forEach(el => {
        // Formatar valor atual
        el.value = maskPhone(el.value || '');
        el.addEventListener('input', (e) => {
            e.target.value = maskPhone(e.target.value || '');
        });
    });

    // Inputs CPF
    const cpfEls = container.querySelectorAll('input[data-mask="cpf"], input.mask-cpf');
    cpfEls.forEach(el => {
        el.value = maskCPF(el.value || '');
        el.addEventListener('input', (e) => {
            e.target.value = maskCPF(e.target.value || '');
        });
    });

    // Inputs CNPJ
    const cnpjEls = container.querySelectorAll('input[data-mask="cnpj"], input.mask-cnpj');
    cnpjEls.forEach(el => {
        el.value = maskCNPJ(el.value || '');
        el.addEventListener('input', (e) => {
            e.target.value = maskCNPJ(e.target.value || '');
        });
    });

    // Inputs genéricos de documento (usa maskDocument que aceita o elemento)
    const docEls = container.querySelectorAll('input[data-mask="document"], input.mask-document');
    docEls.forEach(el => {
        try {
            maskDocument(el);
        } catch (err) {
            // maskDocument pode lançar se o formato não estiver esperado; ignorar
        }
        el.addEventListener('input', (e) => {
            try {
                maskDocument(e.target);
            } catch (err) { /* ignore */ }
        });
    });

    // Expor globalmente se necessário
    window.applyMasksToContainer = applyMasksToContainer;
}

document.addEventListener('DOMContentLoaded', () => {
    dashboard = new CDDashboard();
    applyMasksToContainer(document);
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

// CORREÇÃO: Removida a função duplicada submitBloqueioButton da linha ~700
// A função já está definida no início do arquivo (linha ~28)

// Registrar funções globais no objeto window para acesso a partir do HTML
function openDashboardKPIModal() {
    if (window.dashboard && typeof window.dashboard.openKpisModal === 'function') {
        window.dashboard.openKpisModal();
    }
}

// CORREÇÃO: Adicionadas declarações de funções faltantes
function closeDashboardKPIModal() {
    if (window.dashboard && typeof window.dashboard.closeKpisModal === 'function') {
        window.dashboard.closeKpisModal();
    }
}

function aplicarFiltroPeriodoKPI() {
    // Implementação básica - pode ser expandida conforme necessário
    console.log('Aplicar filtro período KPI');
}

function exportarDadosKPI() {
    // Implementação básica - pode ser expandida conforme necessário
    console.log('Exportar dados KPI');
}

function imprimirRelatorioKPI() {
    // Implementação básica - pode ser expandida conforme necessário
    console.log('Imprimir relatório KPI');
}

function carregarDadosKPI() {
    if (window.dashboard && typeof window.dashboard.loadKpis === 'function') {
        window.dashboard.loadKpis();
    }
}

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
    // Usar onsubmit para evitar múltiplos listeners caso o modal seja reaberto várias vezes
    form.onsubmit = function(e) {
        console.log('[Frontend] bloqueio-form submit triggered (onsubmit bind)');
        return handleBloqueioSubmit(e);
    };

    // Prevenir que a tecla Enter dispare um submit nativo (exceto em textarea)
    form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
            if (tag !== 'textarea') {
                e.preventDefault();
                console.log('[Frontend] Enter pressed in bloqueio-form - prevented native submit');
            }
        }
    });
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
    console.debug('[Frontend] handleBloqueioSubmit invoked');
    
    const formData = new FormData(e.target);
    const dataBloqueio = formData.get('dataBloqueio');
    const horaInicio = formData.get('horaInicio');
    const horaFim = formData.get('horaFim');
    const motivo = formData.get('motivoBloqueio') === 'outros' ? formData.get('motivoCustom') : formData.get('motivoBloqueio');
    // Validações
    if (!dataBloqueio || !horaInicio || !horaFim || !motivo) {
        dashboard.showNotification('Todos os campos são obrigatórios', 'error');
        return;
    }
    // Validação de data futura (pode usar Date para comparar, mas envia string)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Zerar horas para comparação apenas de data
    
    // Criar data no fuso horário local para evitar problemas de UTC
    const [ano, mes, dia] = dataBloqueio.split('-').map(Number);
    const dataBloqueioDate = new Date(ano, mes - 1, dia); // mes - 1 porque Date usa 0-11 para meses
    
    console.log('📅 [Bloqueio] Data selecionada:', dataBloqueio);
    console.log('📅 [Bloqueio] Data criada:', dataBloqueioDate);
    console.log('📅 [Bloqueio] Dia da semana:', dataBloqueioDate.getDay(), '(0=Domingo, 1=Segunda, etc.)');
    
    if (dataBloqueioDate <= hoje) {
        dashboard.showNotification('A data do bloqueio deve ser futura', 'error');
        return;
    }
    // Verificar se é dia útil (1=Segunda a 5=Sexta)
    const diaSemana = dataBloqueioDate.getDay();
    if (diaSemana === 0 || diaSemana === 6) {
        dashboard.showNotification('Bloqueios só podem ser feitos em dias úteis', 'error');
        return;
    }
    try {
        dashboard.showLoading(true);
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${getApiBaseUrl()}/api/bloqueios-horario`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                dataBloqueio,
                horaInicio,
                horaFim,
                motivo
            })
        });
        const result = await response.json();
        if (response.ok) {
            dashboard.showNotification('Bloqueio de horário criado com sucesso!', 'success');
            closeBloqueioModal();
            if (typeof carregarBloqueios === 'function') {
                carregarBloqueios();
            }
            dashboard.loadAgendamentos();
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
        const response = await fetch(`${getApiBaseUrl()}/api/bloqueios-horario`, {
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
    hoje.setHours(0, 0, 0, 0); // Zerar horas para comparação apenas de data
    
    listaEl.innerHTML = bloqueios.map(bloqueio => {
        // Criar data no fuso horário local para evitar problemas de UTC
        let dataInicio;
        if (bloqueio.dataInicio) {
            dataInicio = parseLocalDate(bloqueio.dataInicio);
        }
        
        const isValidDate = dataInicio && !isNaN(dataInicio.getTime());
        
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
        const response = await fetch(`${getApiBaseUrl()}/api/bloqueios-horario/${id}`, {
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
        const response = await fetch(`${getApiBaseUrl()}/api/bloqueios-horario/${id}`, {
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

var entregaCurrentStep = 1;
var entregaPedidos = [];
var entregaCurrentPedido = 0;
var entregaNotasFiscais = []; // Array simples para notas fiscais do modal

function openRegistrarEntregaModal() {
    const modal = document.getElementById('registrar-entrega-modal');
    modal.classList.remove('hidden');
    
    // Reset do formulário
    entregaCurrentStep = 1;
    entregaPedidos = [];
    entregaCurrentPedido = 0;
    entregaNotasFiscais = []; // Reset notas fiscais
    
    // Mostrar apenas o primeiro step
    mostrarStepEntrega(1);
    
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
    const cnpjInput = document.getElementById('entrega-cnpj-Transportador');
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
    const telefoneInput = document.getElementById('entrega-telefone-Transportador');
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
    } else if (step === 4) {
        btnAnterior.classList.remove('hidden');
        btnProximo.classList.add('hidden');
        btnFinalizar.classList.remove('hidden');
    } else {
        btnAnterior.classList.remove('hidden');
        btnProximo.classList.remove('hidden');
        btnFinalizar.classList.add('hidden');
    }
    
    entregaCurrentStep = step;
    
    // Se for step 4, gerar resumo
    if (step === 4) {
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
        if (entregaCurrentStep < 4) {
            mostrarStepEntrega(entregaCurrentStep + 1);
        }
    }
}

function validarStepEntrega(step) {
    if (step === 1) {
        const campos = [
            'entrega-nome-Transportador',
            'entrega-cnpj-Transportador',
            'entrega-email-Transportador',
            'entrega-telefone-Transportador'
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
        const cnpj = document.getElementById('entrega-cnpj-Transportador').value.replace(/\D/g, '');
        if (cnpj.length !== 14) {
            dashboard.showNotification('CNPJ deve ter 14 dígitos', 'error');
            return false;
        }
        
        // Validar telefone
        const telefone = document.getElementById('entrega-telefone-Transportador').value.replace(/\D/g, '');
        if (telefone.length < 10) {
            dashboard.showNotification('Telefone deve ter pelo menos 10 dígitos', 'error');
            return false;
        }
        
        return true;
    } else if (step === 2) {
        const camposObrigatorios = [
            'entrega-horario-preferencial',
            'entrega-quantidade-volumes',
            'entrega-tipo-volume'
        ];
        
        for (const campo of camposObrigatorios) {
            const elemento = document.getElementById(campo);
            if (!elemento.value.trim()) {
                dashboard.showNotification(`Por favor, preencha o campo: ${elemento.previousElementSibling?.textContent || campo}`, 'error');
                elemento.focus();
                return false;
            }
        }
        
        // Validar quantidade de volumes
        const quantidade = parseInt(document.getElementById('entrega-quantidade-volumes').value);
        if (isNaN(quantidade) || quantidade <= 0) {
            dashboard.showNotification('Quantidade de volumes deve ser maior que zero', 'error');
            return false;
        }
        
        return true;
    } else if (step === 3) {
        if (entregaNotasFiscais.length === 0) {
            dashboard.showNotification('Adicione pelo menos uma nota fiscal', 'error');
            return false;
        }
        
        // Validar cada nota fiscal
        for (let i = 0; i < entregaNotasFiscais.length; i++) {
            const nf = entregaNotasFiscais[i];
            if (!nf.numeroPedido || !nf.numeroPedido.trim()) {
                dashboard.showNotification(`Nota Fiscal ${i + 1}: Informe o número do pedido`, 'error');
                return false;
            }
            if (!nf.numero || !nf.numero.trim()) {
                dashboard.showNotification(`Nota Fiscal ${i + 1}: Informe o número da NF`, 'error');
                return false;
            }
            if (!nf.valor || parseFloat(nf.valor) <= 0) {
                dashboard.showNotification(`Nota Fiscal ${i + 1}: Informe um valor válido`, 'error');
                return false;
            }
        }
        
        return true;
    }
    
    return true;
}

// Funções para gerenciar notas fiscais no modal de Registrar Entrega
function adicionarNotaFiscalEntregaModal() {
    const notaFiscal = {
        numeroPedido: '',
        numero: '',
        valor: 0,
        arquivo: null
    };
    
    entregaNotasFiscais.push(notaFiscal);
    renderizarNotasFiscaisEntregaModal();
}

function removerNotaFiscalEntregaModal(index) {
    entregaNotasFiscais.splice(index, 1);
    renderizarNotasFiscaisEntregaModal();
}

function renderizarNotasFiscaisEntregaModal() {
    const container = document.getElementById('entrega-notas-fiscais-list');
    
    if (entregaNotasFiscais.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhuma nota fiscal adicionada</p>';
        return;
    }
    
    container.innerHTML = entregaNotasFiscais.map((nf, index) => `
        <div class="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <div class="flex justify-between items-center mb-4">
                <h4 class="font-semibold text-gray-700">Nota Fiscal ${index + 1}</h4>
                <button type="button" onclick="removerNotaFiscalEntregaModal(${index})" 
                        class="text-red-600 hover:bg-red-50 px-3 py-1 rounded transition-colors">
                    <i class="fas fa-trash"></i> Remover
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Número do Pedido *</label>
                    <input type="text" 
                           value="${nf.numeroPedido}" 
                           placeholder="Ex: 4501234567"
                           maxlength="10"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-primary focus:ring-1 focus:ring-orange-primary"
                           onchange="entregaNotasFiscais[${index}].numeroPedido = this.value">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Número da NF *</label>
                    <input type="text" 
                           value="${nf.numero}" 
                           placeholder="Ex: 123456"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-primary focus:ring-1 focus:ring-orange-primary"
                           onchange="entregaNotasFiscais[${index}].numero = this.value">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Valor (R$) *</label>
                    <input type="number" 
                           value="${nf.valor}" 
                           step="0.01" 
                           placeholder="0,00"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-primary focus:ring-1 focus:ring-orange-primary"
                           onchange="entregaNotasFiscais[${index}].valor = parseFloat(this.value) || 0; atualizarTotalEntrega()">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">PDF da Nota</label>
                    <input type="file" 
                           accept=".pdf"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-primary text-sm file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                           onchange="entregaNotasFiscais[${index}].arquivo = this.files[0]; console.log('Arquivo anexado:', this.files[0]?.name)">
                    ${nf.arquivo ? `<p class="text-xs text-green-600 mt-1"><i class="fas fa-check-circle"></i> ${nf.arquivo.name}</p>` : ''}
                </div>
            </div>
        </div>
    `).join('');
    
    atualizarTotalEntrega();
}

function atualizarTotalEntrega() {
    const total = entregaNotasFiscais.reduce((sum, nf) => sum + (parseFloat(nf.valor) || 0), 0);
    const totalElement = document.getElementById('entrega-total-notas');
    if (totalElement) {
        totalElement.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }
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

// CORREÇÃO: Melhor validação de upload de arquivos
function atualizarArquivoNotaFiscalEntrega(pedidoIndex, nfIndex, input) {
    const file = input.files[0];
    if (!file) return;
    
    // Validar tipo
    if (file.type !== 'application/pdf') {
        dashboard.showNotification('Apenas arquivos PDF são permitidos', 'error');
        input.value = '';
        return;
    }
    
    // Validar tamanho (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        dashboard.showNotification('Arquivo muito grande (máx. 5MB)', 'error');
        input.value = '';
        return;
    }
    
    entregaPedidos[pedidoIndex].notasFiscais[nfIndex].arquivo = file;
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
    
    // Coletar dados do step 1 - Dados do Transportador
    const dadosTransportador = {
        nome: document.getElementById('entrega-nome-Transportador').value,
        cnpj: document.getElementById('entrega-cnpj-Transportador').value,
        email: document.getElementById('entrega-email-Transportador').value,
        telefone: document.getElementById('entrega-telefone-Transportador').value
    };
    
    // Coletar dados do step 2 - Dados da Entrega
    const dadosEntrega = {
        horarioEntrega: document.getElementById('entrega-horario-preferencial').value,
        quantidadeVolumes: document.getElementById('entrega-quantidade-volumes').value,
        tipoVolume: document.getElementById('entrega-tipo-volume').value,
        observacoes: document.getElementById('entrega-observacoes-step2')?.value || ''
    };
    
    // Calcular total das notas fiscais
    const totalNotas = entregaNotasFiscais.reduce((sum, nf) => sum + (parseFloat(nf.valor) || 0), 0);
    
    let resumoHtml = `
        <div class="space-y-6">
            <!-- Dados do Transportador -->
            <div>
                <h4 class="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">
                    <i class="fas fa-truck mr-2 text-orange-primary"></i>
                    Dados do Transportador
                </h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Nome:</strong> ${dadosTransportador.nome}</div>
                    <div><strong>CNPJ:</strong> ${dadosTransportador.cnpj}</div>
                    <div><strong>Email:</strong> ${dadosTransportador.email}</div>
                    <div><strong>Telefone:</strong> ${dadosTransportador.telefone}</div>
                </div>
            </div>
            
            <!-- Dados da Entrega -->
            <div>
                <h4 class="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">
                    <i class="fas fa-box mr-2 text-orange-primary"></i>
                    Dados da Entrega Realizada
                </h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Horário da Entrega:</strong> ${dadosEntrega.horarioEntrega}</div>
                    <div><strong>Quantidade de Volumes:</strong> ${dadosEntrega.quantidadeVolumes}</div>
                    <div><strong>Tipo de Volume:</strong> ${dadosEntrega.tipoVolume}</div>
                    ${dadosEntrega.observacoes ? `<div class="col-span-2"><strong>Observações:</strong> ${dadosEntrega.observacoes}</div>` : ''}
                </div>
            </div>
            
            <!-- Notas Fiscais e Pedidos -->
            <div>
                <h4 class="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">
                    <i class="fas fa-file-invoice mr-2 text-orange-primary"></i>
                    Notas Fiscais e Pedidos (${entregaNotasFiscais.length})
                </h4>
                <div class="space-y-2">
    `;
    
    if (entregaNotasFiscais.length === 0) {
        resumoHtml += '<p class="text-gray-500 text-sm">Nenhuma nota fiscal adicionada</p>';
    } else {
        entregaNotasFiscais.forEach((nf, index) => {
            resumoHtml += `
                <div class="bg-gray-50 p-3 rounded border border-gray-200">
                    <div class="flex justify-between items-center text-sm mb-1">
                        <div>
                            <span class="font-medium">NF ${index + 1}:</span> ${nf.numero}
                            ${nf.arquivo ? '<i class="fas fa-paperclip text-green-600 ml-2" title="PDF anexado"></i>' : ''}
                        </div>
                        <div class="text-green-600 font-semibold">
                            R$ ${parseFloat(nf.valor || 0).toFixed(2).replace('.', ',')}
                        </div>
                    </div>
                    <div class="text-xs text-gray-600">
                        <i class="fas fa-box mr-1"></i>Pedido: ${nf.numeroPedido}
                    </div>
                </div>
            `;
        });
        
        resumoHtml += `
            <div class="flex justify-between items-center text-base font-bold bg-orange-50 p-3 rounded border-2 border-orange-200 mt-4">
                <span>Total Geral:</span>
                <span class="text-orange-primary">R$ ${totalNotas.toFixed(2).replace('.', ',')}</span>
            </div>
        `;
    }
    
    resumoHtml += `
                </div>
            </div>
        </div>
    `;
    
    resumoContainer.innerHTML = resumoHtml;
}

async function handleRegistrarEntrega(e) {
    e.preventDefault();
    
    // Verificar dados básicos primeiro (step 1)
    if (!validarStepEntrega(1)) {
        return;
    }
    
    // Verificar se há token de autenticação
    const token = sessionStorage.getItem('token');
    if (!token) {
        dashboard.showNotification('Token de autenticação não encontrado. Faça login novamente.', 'error');
        return;
    }
    
    // Coletar dados do step 1 - Transportador
    const transportadorData = {
        nomeEmpresa: document.getElementById('entrega-nome-Transportador').value,
        email: document.getElementById('entrega-email-Transportador').value,
        telefone: document.getElementById('entrega-telefone-Transportador').value,
        documento: document.getElementById('entrega-cnpj-Transportador').value
    };
    
    // Coletar dados do step 2 - Dados da Entrega
    const horarioEntrega = document.getElementById('entrega-horario-preferencial').value;
    const quantidadeVolumes = parseInt(document.getElementById('entrega-quantidade-volumes').value);
    const tipoVolume = document.getElementById('entrega-tipo-volume').value;
    const observacoesStep2 = document.getElementById('entrega-observacoes-step2')?.value || '';
    
    // Obter CD do usuário logado
    const cdId = dashboard.getCDFromToken();
    
    // Agrupar notas fiscais por número de pedido
    const pedidosMap = {};
    entregaNotasFiscais.forEach(nf => {
        if (!pedidosMap[nf.numeroPedido]) {
            pedidosMap[nf.numeroPedido] = {
                numero: nf.numeroPedido,
                notasFiscais: []
            };
        }
        pedidosMap[nf.numeroPedido].notasFiscais.push({
            numero: nf.numero,
            valor: parseFloat(nf.valor || 0),
            arquivo: nf.arquivo || null
        });
    });
    
    // Converter map para array
    const pedidos = Object.values(pedidosMap);
    
    // Criar data atual para a entrega
    const dataAtual = new Date().toISOString().split('T')[0];
    
    const dadosEntrega = {
        fornecedor: transportadorData, // Backend espera "fornecedor"
        transportador: transportadorData, // Mantém compatibilidade
        entrega: {
            cdDestino: cdId, // Usa o CD do usuário logado
            dataEntrega: dataAtual,
            horarioEntrega: horarioEntrega,
            quantidadeVolumes: quantidadeVolumes,
            tipoVolume: tipoVolume,
            observacoes: observacoesStep2
        },
        pedidos: pedidos,
        tipoRegistro: 'fora_agendamento',
        // Definindo o status como 'entregue' automaticamente
        status: 'entregue',
        // Adicionando flag para indicar que foi incluído pelo CD
        incluidoPeloCD: true,
        // Adicionando observação sobre inclusão pelo CD
        observacaoInterna: 'ENTREGA INCLUÍDA PELO CD'
    };
    
    console.log('📦 [Frontend] Dados da entrega a serem enviados:', dadosEntrega);
    
    try {
        dashboard.showLoading(true);
        
        console.log('🚀 [Frontend] Enviando requisição para /api/agendamentos');
        
    const response = await fetch(`${getApiBaseUrl()}/api/agendamentos`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosEntrega)
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
        dashboard.showNotification('Erro de conexão. Tente novamente.', 'error');
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
window.paginaAtual = 1;
window.itensPorPagina = 12;

function openEntregasModal() {
    const modal = document.getElementById('modal-entregas-entregues');
    if (!modal) {
        console.error('❌ Modal não encontrado!');
        return;
    }
    
    modal.classList.remove('hidden');
    // Limpar filtros de busca e período ao abrir o modal
    const buscaEl = document.getElementById('busca-entregas');
    if (buscaEl) buscaEl.value = '';
    const periodoEl = document.getElementById('filtro-periodo');
    if (periodoEl) periodoEl.value = 'todos';
    const dataInicioEl = document.getElementById('data-inicio');
    const dataFimEl = document.getElementById('data-fim');
    if (dataInicioEl) dataInicioEl.value = '';
    if (dataFimEl) dataFimEl.value = '';
    configurarFiltrosEntregas();
    carregarTodasEntregas();
    // Garantir que o container de entregas fique visível
    const container = document.getElementById('entregas-container');
    if (container) container.classList.remove('hidden');
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
        const response = await fetch(`${getApiBaseUrl()}/api/agendamentos`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();

        if (response.ok) {
            // CORREÇÃO: Melhor filtro com validação
            const agendamentos = Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : (result.agendamentos || []));
            
            window.entregasData = agendamentos.filter(agendamento => {
                if (!agendamento || typeof agendamento !== 'object') return false;
                
                const rawStatus = agendamento.status;
                if (!rawStatus) {
                    console.log('[Filtro Entregas] Ignorado (status vazio):', agendamento.codigo, '| status:', rawStatus);
                    return false;
                }
                
                const status = String(rawStatus).trim().toLowerCase();
                const match = status === 'entregue';
                console.log('[Filtro Entregas] codigo:', agendamento.codigo, '| status original:', rawStatus, '| status filtrado:', status, '| match:', match);
                return match;
            });
            
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
    
    let entregasFiltradas = Array.isArray(window.entregasData) ? [...window.entregasData] : [];
    
    // Filtro por texto
    if (textoPesquisa) {
        entregasFiltradas = entregasFiltradas.filter(entrega => {
            return (
                entrega.transportador?.nome?.toLowerCase().includes(textoPesquisa) ||
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
    entregasFiltradas.sort((a, b) => parseLocalDate(b.dataEntrega) - parseLocalDate(a.dataEntrega));
    
    window.entregasFiltradas = entregasFiltradas;
    window.paginaAtual = 1;
    
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
    const dataFormatada = parseLocalDate(entrega.dataEntrega).toLocaleDateString('pt-BR');
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
                ${entrega.transportador?.nome || 'Transportador não informado'}
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
    const totalPaginas = Math.ceil(totalItens / window.itensPorPagina);

    const inicioInfo = totalItens > 0 ? ((window.paginaAtual - 1) * window.itensPorPagina) + 1 : 0;
    const fimInfo = Math.min(window.paginaAtual * window.itensPorPagina, totalItens);
    
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