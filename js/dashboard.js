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
    return value;
}

// --- FIM DA CLASSE ---

// --- INICIALIZAÇÃO E FUNÇÕES GLOBAIS ---

let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new CDDashboard();
    
    // Aplicar máscaras aos inputs da página
    document.addEventListener('DOMContentLoaded', () => {
        applyMasksToContainer(document);
    });
    
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
                    <div><strong>Data:</strong> ${parseLocalDate(dadosBasicos.data).toLocaleDateString('pt-BR')}</div>
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
    
    // Verificar dados básicos primeiro (step 1)
    if (!validarStepEntrega(1)) {
        return;
    }
    
    // Se não há pedidos, criar um pedido básico para registro de entrega
    if (entregaPedidos.length === 0) {
        entregaPedidos = [
            {
                numero: 'ENTREGA-' + Date.now(),
                notasFiscais: [
                    {
                        numero: 'NF-' + Date.now(),
                        valor: 0
                    }
                ]
            }
        ];
        console.log('📦 [Frontend] Criado pedido básico para entrega:', entregaPedidos);
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
        
    const response = await fetch(`${getApiBaseUrl()}/api/agendamentos`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
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

// Esqueleto mínimo da classe CDDashboard para evitar erro de referência
class CDDashboard {
    constructor() {
        // Inicialização básica
    }
    loadAgendamentos() {}
    changeView(view) {}
    applyFilters() {}
    exportData(format) {}
    showAllStatus(status) {}
    showTodayDeliveries() {}
    closeTodayDeliveriesModal() {}
    openConsultaModal() {}
    closeConsultaModal() {}
    closeStatusModal() {}
    closeDetailModal() {}
    closeSuggestDateModal() {}
    openKpisModal() {}
    closeKpisModal() {}
    loadKpis() {}
    showNotification(msg, type) {}
}

// Função global para fechar todos os modais de status
function closeAllStatusModal() {
    document.querySelectorAll('.status-modal').forEach(modal => {
        modal.classList.add('hidden');
    });
}