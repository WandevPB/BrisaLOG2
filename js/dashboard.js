// Função para obter a URL base da API
function getApiBaseUrl() {
    // URL da API no Render (produção)
    return 'https://brisalog-back.onrender.com';
}


// Função utilitária para converter datas do backend para timezone local
function parseLocalDate(dateInput) {
    if (!dateInput) return null;
    
    if (typeof dateInput === 'string') {
        if (dateInput.includes('T')) {
            // Formato ISO (ex: '2025-10-06T00:00:00.000Z') - extrair apenas YYYY-MM-DD
            const dateOnly = dateInput.split('T')[0];
            const [ano, mes, dia] = dateOnly.split('-').map(Number);
            return new Date(ano, mes - 1, dia); // mes - 1 porque Date usa 0-11 para meses
        } else if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Formato YYYY-MM-DD simples
            const [ano, mes, dia] = dateInput.split('-').map(Number);
            return new Date(ano, mes - 1, dia);
        }
    }
    
    // Fallback para outros casos
    return new Date(dateInput);
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

// Assegure que as funções globais estejam no escopo global, fora de qualquer bloco/class

// --- Funções globais para compatibilidade com HTML (onclick) ---
// --- Funções globais para compatibilidade com HTML (onclick) ---
// (Deve estar no final do arquivo, após todas as funções e classes)
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
        // Exibe notificações na dashboard
    showNotification(message, type = 'info') {
        let notificationEl = document.getElementById('notification-container');
        if (!notificationEl) {
            notificationEl = document.createElement('div');
            notificationEl.id = 'notification-container';
            notificationEl.style.position = 'fixed';
            notificationEl.style.top = '20px';
            notificationEl.style.right = '20px';
            notificationEl.style.zIndex = '9999';
            document.body.appendChild(notificationEl);
        }
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.padding = '15px 20px';
        notification.style.marginBottom = '10px';
        notification.style.borderRadius = '8px';
        notification.style.background = type === 'error' ? '#F87171' : (type === 'success' ? '#34D399' : '#FFFBEB');
        notification.style.color = type === 'error' ? '#fff' : '#222';
        notification.style.fontWeight = 'bold';
        notification.textContent = message;
        notificationEl.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
    }

    // Exibe o estado vazio na dashboard
    showEmptyState() {
        let emptyEl = document.getElementById('dashboard-empty-state');
        if (!emptyEl) {
            emptyEl = document.createElement('div');
            emptyEl.id = 'dashboard-empty-state';
            emptyEl.innerHTML = '<div style="text-align:center;padding:40px;color:#FF6B35;font-size:1.2rem;">Nenhum agendamento encontrado.</div>';
            document.getElementById('dashboard-main').appendChild(emptyEl);
        }
        emptyEl.style.display = 'block';
    }

    // Oculta o estado vazio na dashboard
    hideEmptyState() {
        const emptyEl = document.getElementById('dashboard-empty-state');
        if (emptyEl) emptyEl.style.display = 'none';
    }
    // Exibe ou oculta o loading spinner na dashboard
    showLoading(isLoading) {
        let loadingEl = document.getElementById('dashboard-loading');
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.id = 'dashboard-loading';
            loadingEl.style.position = 'fixed';
            loadingEl.style.top = '0';
            loadingEl.style.left = '0';
            loadingEl.style.width = '100vw';
            loadingEl.style.height = '100vh';
            loadingEl.style.background = 'rgba(255,255,255,0.7)';
            loadingEl.style.zIndex = '9999';
            loadingEl.style.display = 'flex';
            loadingEl.style.alignItems = 'center';
            loadingEl.style.justifyContent = 'center';
            loadingEl.innerHTML = '<div style="font-size:2rem;color:#FF6B35;"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>';
            document.body.appendChild(loadingEl);
        }
        loadingEl.style.display = isLoading ? 'flex' : 'none';
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
            const res = await fetch('/api/kpis', {
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
                <div class="font-bold text-orange-primary text-lg mb-2 flex items-center"><i class="fas fa-users mr-2"></i>Top 5 Fornecedores Não Veio</div>
                <canvas id="kpi-top-fornecedores" height="180"></canvas>
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
        // Top fornecedores não veio
        if (window.kpiTopForn) window.kpiTopForn.destroy();
        window.kpiTopForn = new Chart(document.getElementById('kpi-top-fornecedores').getContext('2d'), {
            type: 'bar',
            data: {
                labels: kpis.topFornecedoresLabels,
                datasets: [{
                    label: 'Não Veio',
                    data: kpis.topFornecedoresValores,
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
    // Extrai 'YYYY-MM-DD' de ISO ou já recebe 'YYYY-MM-DD', retorna 'DD/MM/YYYY'
    if (!dateString) return '';
    const [isoDate] = dateString.split('T');
    if (!isoDate || isoDate.length < 10) return '';
    const [ano, mes, dia] = isoDate.split('-');
    return `${dia}/${mes}/${ano}`;
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
        console.log('🔄 Recarregando agendamentos...');
        this.showLoading(true);
        
        try {
            const token = sessionStorage.getItem('token');
            console.log('🔑 Token encontrado:', !!token);
            
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

            console.log('📡 Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Erro na resposta:', errorText);
                
                // Verificar se é token expirado
                if (handleTokenExpired(response)) {
                    return;
                }
                
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log('📊 Dados recebidos:', data);
            this.agendamentos = data.data || [];
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
            `<div class="bg-yellow-100 text-yellow-800 font-bold text-sm p-2 rounded mb-2 flex items-center">
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
            `<div class="bg-yellow-100 text-yellow-800 font-bold text-sm p-2 rounded mb-2 border border-yellow-400 flex items-center">
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
                    <i class="fas fa-hourglass-half text-yellow-600 text-lg mb-1"></i>
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

    async updateAgendamentoStatus(id, newStatus) {
        try {
            console.log('Atualizando status:', { id, newStatus });
            const result = await apiRequest(`/api/agendamentos/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            console.log('Status atualizado com sucesso:', result);
            await this.loadAgendamentos();
            this.closeDetailModal();
            this.showNotification(`Status atualizado para: ${this.getStatusText(newStatus)}`, 'success');
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            this.showNotification(`Erro ao atualizar status: ${error.message}`, 'error');
        }
    }
}

// Instanciar dashboard global
window.dashboard = new CDDashboard();