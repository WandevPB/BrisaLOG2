/**
 * chart-render-fix.js - Correção para métodos de renderização de gráficos
 */
(function() {
    console.log('Chart Render Fix - Inicializando...');
    
    // Lista de métodos de renderização que precisam ser verificados e corrigidos
    const metodosRenderizacao = [
        'renderizarGraficoStatus',
        'renderizarGraficoDiaSemana',
        'renderizarGraficoTendencia',
        'renderizarGraficoHorarios',
        'renderizarGraficoFornecedores',
        'renderizarGraficoEvolucao',
        'renderizarGraficoTipoCarga'
    ];
    
    // Mapeamento de métodos para elementos
    const elementosPorMetodo = {
        'renderizarGraficoStatus': 'grafico-status',
        'renderizarGraficoDiaSemana': 'grafico-dia-semana',
        'renderizarGraficoTendencia': 'grafico-tendencia',
        'renderizarGraficoHorarios': 'grafico-horarios',
        'renderizarGraficoFornecedores': 'grafico-fornecedores',
        'renderizarGraficoEvolucao': 'grafico-evolucao',
        'renderizarGraficoTipoCarga': 'grafico-tipo-carga'
    };
    
    // Verificar a presença do Chart.js antes de continuar
    function verificarChartJS() {
        if (typeof Chart === 'undefined') {
            console.error('Chart.js não encontrado! As correções não serão aplicadas.');
            return false;
        }
        return true;
    }
    
    // Aplicar correções nos métodos de renderização
    function aplicarCorrecoes() {
        console.log('Aplicando correções nos métodos de renderização...');
        
        if (!verificarChartJS()) return;
        
        // Corrigir os métodos de renderização
        metodosRenderizacao.forEach(metodo => {
            if (typeof window[metodo] === 'function') {
                console.log(`Corrigindo método ${metodo}...`);
                
                // Armazenar método original
                const metodoOriginal = window[metodo];
                
                // Substituir por versão protegida
                window[metodo] = function() {
                    console.log(`Executando versão protegida de ${metodo}...`);
                    
                    try {
                        // Obter ID do elemento correspondente
                        const elementoId = elementosPorMetodo[metodo];
                        if (!elementoId) {
                            console.warn(`Elemento não mapeado para o método ${metodo}`);
                            return metodoOriginal.apply(this, arguments);
                        }
                        
                        // Obter elemento
                        const elemento = document.getElementById(elementoId);
                        if (!elemento) {
                            console.warn(`Elemento ${elementoId} não encontrado para ${metodo}`);
                            return metodoOriginal.apply(this, arguments);
                        }
                        
                        // Verificar e preparar canvas
                        verificarEPrepararCanvas(elemento);
                        
                        // Executar método original
                        const resultado = metodoOriginal.apply(this, arguments);
                        
                        // Verificar resultado
                        if (resultado instanceof Chart) {
                            console.log(`${metodo} executado com sucesso, gráfico criado`);
                        } else {
                            console.warn(`${metodo} executado, mas não retornou um gráfico válido`);
                        }
                        
                        return resultado;
                    } catch (error) {
                        console.error(`Erro ao executar ${metodo}:`, error);
                        return null;
                    }
                };
                
                console.log(`Método ${metodo} corrigido com sucesso`);
            } else {
                console.warn(`Método ${metodo} não encontrado`);
            }
        });
        
        // Também corrigir o método Chart.helpers.acquireContext se existir
        if (Chart && Chart.helpers && typeof Chart.helpers.acquireContext === 'function') {
            console.log('Corrigindo Chart.helpers.acquireContext...');
            
            const acquireContextOriginal = Chart.helpers.acquireContext;
            
            Chart.helpers.acquireContext = function(item, config) {
                try {
                    if (item instanceof HTMLCanvasElement) {
                        // Verificar se o canvas está no DOM
                        if (!document.body.contains(item)) {
                            console.warn('Canvas não está no DOM, verificando parent...');
                            const parent = item.parentNode;
                            
                            if (parent) {
                                console.log('Recriando canvas...');
                                parent.innerHTML = '';
                                const newCanvas = document.createElement('canvas');
                                
                                // Manter dimensões
                                if (item.width && item.height) {
                                    newCanvas.width = item.width;
                                    newCanvas.height = item.height;
                                } else {
                                    newCanvas.width = parent.clientWidth || 300;
                                    newCanvas.height = parent.clientHeight || 200;
                                }
                                
                                parent.appendChild(newCanvas);
                                return acquireContextOriginal(newCanvas, config);
                            }
                        }
                        
                        // Verificar dimensões do canvas
                        if (item.width === 0 || item.height === 0) {
                            console.warn('Canvas com dimensões zeradas, ajustando...');
                            
                            // Obter dimensões do parent
                            const parent = item.parentNode;
                            if (parent) {
                                item.width = parent.clientWidth || 300;
                                item.height = parent.clientHeight || 200;
                            } else {
                                item.width = 300;
                                item.height = 200;
                            }
                            
                            console.log(`Canvas redimensionado para ${item.width}x${item.height}`);
                        }
                    }
                    
                    return acquireContextOriginal(item, config);
                } catch (error) {
                    console.error('Erro ao adquirir contexto:', error);
                    return null;
                }
            };
            
            console.log('Chart.helpers.acquireContext corrigido com sucesso');
        } else {
            console.warn('Chart.helpers.acquireContext não encontrado');
        }
    }
    
    // Função auxiliar para verificar e preparar o canvas
    function verificarEPrepararCanvas(elemento) {
        console.log(`Verificando canvas para elemento ${elemento.id}...`);
        
        // Verificar se já existe um canvas
        let canvas = elemento.querySelector('canvas');
        
        if (!canvas) {
            console.log(`Canvas não encontrado para ${elemento.id}, criando novo...`);
            
            // Limpar elemento
            elemento.innerHTML = '';
            
            // Criar novo canvas
            canvas = document.createElement('canvas');
            elemento.appendChild(canvas);
        }
        
        // Verificar dimensões
        if (canvas.width === 0 || canvas.height === 0) {
            console.log(`Canvas com dimensões zeradas para ${elemento.id}, ajustando...`);
            
            if (elemento.clientWidth > 0 && elemento.clientHeight > 0) {
                canvas.width = elemento.clientWidth;
                canvas.height = elemento.clientHeight;
            } else {
                canvas.width = 300;
                canvas.height = 200;
            }
            
            console.log(`Canvas redimensionado para ${canvas.width}x${canvas.height}`);
        }
        
        return canvas;
    }
    
    // Aplicar correções quando a página estiver carregada
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', aplicarCorrecoes);
    } else {
        setTimeout(aplicarCorrecoes, 0);
    }
    
    console.log('Chart Render Fix - Inicialização concluída');
})();
