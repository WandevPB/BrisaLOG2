/**
 * kpi-modal-fix.js - Solução específica para problemas no modal de Dashboard KPIs
 */
(function() {
    console.log('KPI Modal Fix - Inicializando...');
    
    // Aguardar DOM pronto
    document.addEventListener('DOMContentLoaded', function() {
        console.log('KPI Modal Fix - DOM carregado, aplicando correções...');
        
        // Sobrescrever a função de abertura do modal
        const originalOpenDashboardKPIModal = window.openDashboardKPIModal;
        
        if (typeof originalOpenDashboardKPIModal === 'function') {
            console.log('Substituindo função openDashboardKPIModal...');
            
            window.openDashboardKPIModal = function() {
                console.log('Abrindo modal Dashboard KPI com tratamento de erros...');
                
                try {
                    // Abrir o modal normalmente
                    const modal = document.getElementById('dashboard-kpi-modal');
                    if (modal) {
                        modal.classList.remove('hidden');
                        
                        // Exibir loading
                        const loading = document.getElementById('dashboard-kpi-loading');
                        if (loading) loading.classList.remove('hidden');
                        
                        // Ocultar conteúdo principal
                        const mainContent = document.getElementById('dashboard-kpi-main');
                        if (mainContent) mainContent.classList.add('hidden');
                        
                        // Preparar os elementos dos gráficos
                        prepararElementosGraficos();
                        
                        // Carregar dados após um pequeno delay
                        setTimeout(function() {
                            try {
                                const hoje = new Date();
                                const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                                const dataInicio = inicioMes.toISOString().split('T')[0];
                                const dataFim = hoje.toISOString().split('T')[0];
                                
                                // Atualizar inputs de data
                                const inputInicio = document.getElementById('kpi-data-inicio');
                                const inputFim = document.getElementById('kpi-data-fim');
                                
                                if (inputInicio) inputInicio.value = dataInicio;
                                if (inputFim) inputFim.value = dataFim;
                                
                                // Chamar função original de carregamento
                                if (typeof carregarDadosKPI === 'function') {
                                    console.log('Carregando dados KPI com datas:', dataInicio, dataFim);
                                    carregarDadosKPI(dataInicio, dataFim);
                                } else {
                                    console.error('Função carregarDadosKPI não encontrada');
                                    
                                    // Ocultar loading
                                    if (loading) loading.classList.add('hidden');
                                    
                                    // Exibir conteúdo principal
                                    if (mainContent) mainContent.classList.remove('hidden');
                                }
                            } catch (error) {
                                console.error('Erro ao carregar dados KPI:', error);
                                
                                // Ocultar loading
                                const loading = document.getElementById('dashboard-kpi-loading');
                                if (loading) loading.classList.add('hidden');
                                
                                // Exibir conteúdo principal
                                const mainContent = document.getElementById('dashboard-kpi-main');
                                if (mainContent) mainContent.classList.remove('hidden');
                            }
                        }, 300);
                    } else {
                        console.error('Modal Dashboard KPI não encontrado');
                    }
                } catch (error) {
                    console.error('Erro ao abrir modal Dashboard KPI:', error);
                    
                    // Tentar chamar a função original
                    if (originalOpenDashboardKPIModal) {
                        console.log('Tentando chamar função original...');
                        originalOpenDashboardKPIModal();
                    }
                }
            };
            
            console.log('Função openDashboardKPIModal substituída com sucesso');
        } else {
            console.warn('Função openDashboardKPIModal não encontrada');
        }
        
        // Sobrescrever a função de fechamento do modal
        const originalCloseDashboardKPIModal = window.closeDashboardKPIModal;
        
        if (typeof originalCloseDashboardKPIModal === 'function') {
            console.log('Substituindo função closeDashboardKPIModal...');
            
            window.closeDashboardKPIModal = function() {
                console.log('Fechando modal Dashboard KPI...');
                
                try {
                    // Fechar o modal normalmente
                    const modal = document.getElementById('dashboard-kpi-modal');
                    if (modal) {
                        modal.classList.add('hidden');
                    } else {
                        console.error('Modal Dashboard KPI não encontrado');
                    }
                } catch (error) {
                    console.error('Erro ao fechar modal Dashboard KPI:', error);
                    
                    // Tentar chamar a função original
                    if (originalCloseDashboardKPIModal) {
                        console.log('Tentando chamar função original...');
                        originalCloseDashboardKPIModal();
                    }
                }
            };
            
            console.log('Função closeDashboardKPIModal substituída com sucesso');
        } else {
            console.warn('Função closeDashboardKPIModal não encontrada');
        }
        
        // Sobrescrever a função de carregamento de dados
        const originalCarregarDadosKPI = window.carregarDadosKPI;
        
        if (typeof originalCarregarDadosKPI === 'function') {
            console.log('Substituindo função carregarDadosKPI...');
            
            window.carregarDadosKPI = function(dataInicio, dataFim) {
                console.log('Carregando dados KPI com tratamento de erros:', dataInicio, dataFim);
                
                try {
                    // Mostrar loading
                    const loading = document.getElementById('dashboard-kpi-loading');
                    if (loading) loading.classList.remove('hidden');
                    
                    // Ocultar conteúdo principal
                    const mainContent = document.getElementById('dashboard-kpi-main');
                    if (mainContent) mainContent.classList.add('hidden');
                    
                    // Preparar elementos dos gráficos
                    prepararElementosGraficos();
                    
                    // Chamar função original
                    originalCarregarDadosKPI(dataInicio, dataFim);
                } catch (error) {
                    console.error('Erro ao carregar dados KPI:', error);
                    
                    // Ocultar loading
                    const loading = document.getElementById('dashboard-kpi-loading');
                    if (loading) loading.classList.add('hidden');
                    
                    // Exibir conteúdo principal
                    const mainContent = document.getElementById('dashboard-kpi-main');
                    if (mainContent) mainContent.classList.remove('hidden');
                }
            };
            
            console.log('Função carregarDadosKPI substituída com sucesso');
        } else {
            console.warn('Função carregarDadosKPI não encontrada');
        }
    });
    
    // Função auxiliar para preparar elementos dos gráficos
    function prepararElementosGraficos() {
        console.log('Preparando elementos dos gráficos...');
        
        const graficoIds = [
            'grafico-status',
            'grafico-dia-semana',
            'grafico-tendencia',
            'grafico-horarios',
            'grafico-fornecedores'
        ];
        
        graficoIds.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                console.log(`Preparando gráfico: ${id}`);
                
                // Limpar o container
                container.innerHTML = '';
                
                // Criar um novo canvas
                const canvas = document.createElement('canvas');
                container.appendChild(canvas);
                
                // Garantir dimensões
                if (container.clientWidth > 0 && container.clientHeight > 0) {
                    canvas.width = container.clientWidth;
                    canvas.height = container.clientHeight;
                } else {
                    // Valores padrão seguros
                    canvas.width = 300;
                    canvas.height = 200;
                }
                
                console.log(`Canvas criado para ${id} com dimensões ${canvas.width}x${canvas.height}`);
            } else {
                console.warn(`Container ${id} não encontrado`);
            }
        });
    }
    
    console.log('KPI Modal Fix - Inicialização concluída');
})();
