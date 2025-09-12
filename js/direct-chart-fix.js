/**
 * direct-chart-fix.js - Solução direta para o problema do canvas no DOM
 */
(function() {
    console.log('Direct Chart Fix - Inicializando...');
    
    // Modificar o construtor do Chart para garantir que o canvas esteja no DOM
    if (typeof Chart !== 'undefined') {
        console.log('Modificando construtor do Chart...');
        
        // Guardar o construtor original
        const OriginalChart = Chart;
        
        // Substituir o construtor
        window.Chart = function(canvas, config) {
            console.log('Construtor do Chart chamado com:', canvas, config);
            
            // Verificar se o canvas é válido
            if (!canvas || typeof canvas.getContext !== 'function') {
                console.error('Canvas inválido fornecido ao Chart');
                throw new Error('Canvas inválido');
            }
            
            // Verificar se o canvas está no DOM
            if (!document.body.contains(canvas)) {
                console.warn('Canvas não está no DOM, recriando...');
                
                // Tentar encontrar o container por ID
                let containerId = '';
                if (canvas.id) {
                    containerId = canvas.id.replace('-canvas', '');
                } else if (canvas.parentElement && canvas.parentElement.id) {
                    containerId = canvas.parentElement.id;
                }
                
                const container = containerId ? document.getElementById(containerId) : null;
                
                if (container) {
                    console.log(`Recriando canvas no container ${containerId}...`);
                    
                    // Limpar o container
                    container.innerHTML = '';
                    
                    // Criar novo canvas
                    const newCanvas = document.createElement('canvas');
                    
                    // Copiar atributos importantes
                    if (canvas.width) newCanvas.width = canvas.width;
                    if (canvas.height) newCanvas.height = canvas.height;
                    if (canvas.id) newCanvas.id = canvas.id;
                    
                    // Garantir dimensões mínimas
                    if (!newCanvas.width || newCanvas.width < 1) newCanvas.width = container.clientWidth || 300;
                    if (!newCanvas.height || newCanvas.height < 1) newCanvas.height = container.clientHeight || 200;
                    
                    // Adicionar ao DOM
                    container.appendChild(newCanvas);
                    
                    console.log(`Canvas recriado com dimensões ${newCanvas.width}x${newCanvas.height}`);
                    
                    // Usar o novo canvas
                    canvas = newCanvas;
                } else {
                    console.error('Não foi possível encontrar um container para o canvas');
                    throw new Error('Canvas não está no DOM');
                }
            }
            
            // Verificar se o canvas tem dimensões
            if (canvas.width === 0 || canvas.height === 0) {
                console.warn('Canvas com dimensões zeradas, ajustando...');
                
                canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth || 300 : 300;
                canvas.height = canvas.parentElement ? canvas.parentElement.clientHeight || 200 : 200;
                
                console.log(`Canvas redimensionado para ${canvas.width}x${canvas.height}`);
            }
            
            // Chamar o construtor original
            try {
                return new OriginalChart(canvas, config);
            } catch (error) {
                console.error('Erro ao criar Chart:', error);
                throw error;
            }
        };
        
        // Copiar propriedades estáticas
        Object.assign(window.Chart, OriginalChart);
        window.Chart.prototype = OriginalChart.prototype;
        
        console.log('Construtor do Chart modificado com sucesso');
    } else {
        console.warn('Chart.js não está disponível');
    }
    
    // Função para fixar o dashboard KPI diretamente
    function fixarDashboardKPI() {
        console.log('Aplicando correção direta ao Dashboard KPI...');
        
        // Sobrescrever a função de renderização de gráficos
        function substituirRenderizacao(nomeMetodo, elementoId) {
            if (typeof window[nomeMetodo] === 'function') {
                console.log(`Substituindo método ${nomeMetodo}...`);
                
                const metodoOriginal = window[nomeMetodo];
                
                window[nomeMetodo] = function(dados) {
                    console.log(`Executando ${nomeMetodo} com proteção DOM...`);
                    
                    try {
                        // Verificar se o elemento existe
                        const elemento = document.getElementById(elementoId);
                        if (!elemento) {
                            console.error(`Elemento ${elementoId} não encontrado`);
                            return null;
                        }
                        
                        // Garantir que o elemento esteja visível
                        const modal = document.getElementById('dashboard-kpi-modal');
                        const mainContent = document.getElementById('dashboard-kpi-main');
                        
                        if (modal && modal.classList.contains('hidden')) {
                            console.warn(`Modal está oculto, não renderizando ${nomeMetodo}`);
                            return null;
                        }
                        
                        if (mainContent && mainContent.classList.contains('hidden')) {
                            console.warn(`Conteúdo principal está oculto, não renderizando ${nomeMetodo}`);
                            return null;
                        }
                        
                        // Limpar elemento
                        elemento.innerHTML = '';
                        
                        // Criar canvas
                        const canvas = document.createElement('canvas');
                        canvas.width = elemento.clientWidth || 300;
                        canvas.height = elemento.clientHeight || 200;
                        
                        // Adicionar ao DOM
                        elemento.appendChild(canvas);
                        
                        console.log(`Canvas criado para ${elementoId} com dimensões ${canvas.width}x${canvas.height}`);
                        
                        // Pequeno delay para garantir que o DOM foi atualizado
                        return new Promise(resolve => {
                            setTimeout(() => {
                                try {
                                    // Verificar novamente se o canvas está no DOM
                                    if (!document.body.contains(canvas)) {
                                        console.error(`Canvas para ${elementoId} não está mais no DOM`);
                                        resolve(null);
                                        return;
                                    }
                                    
                                    // Chamar método original
                                    const resultado = metodoOriginal.call(this, dados);
                                    resolve(resultado);
                                } catch (error) {
                                    console.error(`Erro ao executar ${nomeMetodo}:`, error);
                                    resolve(null);
                                }
                            }, 50);
                        });
                    } catch (error) {
                        console.error(`Erro ao executar ${nomeMetodo}:`, error);
                        return null;
                    }
                };
                
                console.log(`Método ${nomeMetodo} substituído com sucesso`);
            } else {
                console.warn(`Método ${nomeMetodo} não encontrado`);
            }
        }
        
        // Substituir métodos de renderização
        substituirRenderizacao('renderizarGraficoStatus', 'grafico-status');
        substituirRenderizacao('renderizarGraficoDiaSemana', 'grafico-dia-semana');
        substituirRenderizacao('renderizarGraficoTendencia', 'grafico-tendencia');
        substituirRenderizacao('renderizarGraficoHorarios', 'grafico-horarios');
        
        // Substituir atualizarGraficos para lidar com Promises
        if (typeof window.atualizarGraficos === 'function') {
            console.log('Substituindo atualizarGraficos para lidar com Promises...');
            
            const atualizarGraficosOriginal = window.atualizarGraficos;
            
            window.atualizarGraficos = async function() {
                console.log('Executando atualizarGraficos com suporte a Promises...');
                
                try {
                    // Garantir que o conteúdo principal esteja visível
                    const loading = document.getElementById('dashboard-kpi-loading');
                    const mainContent = document.getElementById('dashboard-kpi-main');
                    
                    if (loading) loading.classList.add('hidden');
                    if (mainContent) mainContent.classList.remove('hidden');
                    
                    // Aguardar pequeno delay para DOM ser atualizado
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    // Verificar se o Chart.js está disponível
                    if (typeof Chart === 'undefined') {
                        console.error('Chart.js não está disponível');
                        return;
                    }
                    
                    // Chamar função original ou executar nosso próprio código
                    try {
                        // Tentar chamar a função original
                        return await atualizarGraficosOriginal.apply(this);
                    } catch (error) {
                        console.error('Erro na função original, usando implementação alternativa:', error);
                        
                        // Implementação alternativa direta
                        try {
                            // Renderizar gráficos sequencialmente
                            await window.renderizarGraficoStatus();
                            await window.renderizarGraficoDiaSemana();
                            await window.renderizarGraficoTendencia();
                            await window.renderizarGraficoHorarios();
                            
                            console.log('Gráficos renderizados com sucesso');
                        } catch (renderError) {
                            console.error('Erro ao renderizar gráficos:', renderError);
                        }
                    }
                } catch (error) {
                    console.error('Erro em atualizarGraficos:', error);
                }
            };
            
            console.log('Função atualizarGraficos substituída com sucesso');
        } else {
            console.warn('Função atualizarGraficos não encontrada');
        }
        
        // Corrigir também a função carregarDadosKPI
        if (typeof window.carregarDadosKPI === 'function') {
            console.log('Substituindo carregarDadosKPI para garantir atualização assíncrona...');
            
            const carregarDadosKPIOriginal = window.carregarDadosKPI;
            
            window.carregarDadosKPI = async function(dataInicio, dataFim) {
                console.log('Executando carregarDadosKPI com suporte a async/await...');
                
                try {
                    // Mostrar loading
                    const loading = document.getElementById('dashboard-kpi-loading');
                    const mainContent = document.getElementById('dashboard-kpi-main');
                    
                    if (loading) loading.classList.remove('hidden');
                    if (mainContent) mainContent.classList.add('hidden');
                    
                    // Limpar todos os gráficos antes de carregar novos dados
                    const graficoIds = [
                        'grafico-status',
                        'grafico-dia-semana',
                        'grafico-tendencia',
                        'grafico-horarios'
                    ];
                    
                    graficoIds.forEach(id => {
                        const elemento = document.getElementById(id);
                        if (elemento) {
                            elemento.innerHTML = '';
                            console.log(`Elemento ${id} limpo`);
                        }
                    });
                    
                    // Chamar função original com promessa
                    const originalPromise = new Promise(resolve => {
                        try {
                            carregarDadosKPIOriginal.apply(this, [dataInicio, dataFim]);
                            resolve();
                        } catch (error) {
                            console.error('Erro ao carregar dados KPI:', error);
                            resolve();
                        }
                    });
                    
                    // Aguardar conclusão com timeout
                    await Promise.race([
                        originalPromise,
                        new Promise(resolve => setTimeout(resolve, 5000))
                    ]);
                    
                    console.log('Carregamento de dados concluído');
                    
                    // Verificar se o conteúdo principal já está visível
                    setTimeout(() => {
                        if (loading && !loading.classList.contains('hidden')) {
                            console.log('Ocultando loading manualmente...');
                            loading.classList.add('hidden');
                        }
                        
                        if (mainContent && mainContent.classList.contains('hidden')) {
                            console.log('Exibindo conteúdo principal manualmente...');
                            mainContent.classList.remove('hidden');
                        }
                    }, 1000);
                } catch (error) {
                    console.error('Erro ao carregar dados KPI:', error);
                    
                    // Garantir que o loading seja ocultado e o conteúdo principal seja exibido
                    const loading = document.getElementById('dashboard-kpi-loading');
                    const mainContent = document.getElementById('dashboard-kpi-main');
                    
                    if (loading) loading.classList.add('hidden');
                    if (mainContent) mainContent.classList.remove('hidden');
                }
            };
            
            console.log('Função carregarDadosKPI substituída com sucesso');
        } else {
            console.warn('Função carregarDadosKPI não encontrada');
        }
    }
    
    // Executar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixarDashboardKPI);
    } else {
        setTimeout(fixarDashboardKPI, 0);
    }
    
    console.log('Direct Chart Fix - Inicialização concluída');
})();
