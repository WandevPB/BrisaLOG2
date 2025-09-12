/**
 * canvas-fix.js - Correção específica para o problema do canvas.getContext no Dashboard KPI
 */
(function() {
    console.log('Canvas Fix - Inicializando correção específica para o problema do getContext...');
    
    // Função para criar canvas válido com contexto garantido
    function criarCanvasValido(containerId) {
        console.log(`Criando canvas válido para ${containerId}...`);
        const container = document.getElementById(containerId);
        
        if (!container) {
            console.warn(`Container ${containerId} não encontrado`);
            return null;
        }
        
        // Limpar o container
        container.innerHTML = '';
        
        // Criar elemento canvas NATIVO do HTML5
        const canvas = document.createElement('canvas');
        
        // Garantir que seja um HTMLCanvasElement
        if (!(canvas instanceof HTMLCanvasElement)) {
            console.error(`Falha ao criar um HTMLCanvasElement válido para ${containerId}`);
            return null;
        }
        
        // Verificar se getContext está disponível
        if (typeof canvas.getContext !== 'function') {
            console.error(`Canvas criado para ${containerId} não tem método getContext`);
            return null;
        }
        
        // Definir dimensões
        canvas.width = container.clientWidth || 300;
        canvas.height = container.clientHeight || 200;
        
        // Adicionar ao DOM
        container.appendChild(canvas);
        
        console.log(`Canvas válido criado para ${containerId} com dimensões ${canvas.width}x${canvas.height}`);
        
        // Testar se o contexto pode ser obtido
        try {
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.error(`Não foi possível obter contexto 2d para ${containerId}`);
                return null;
            }
            console.log(`Contexto 2d obtido com sucesso para ${containerId}`);
        } catch (error) {
            console.error(`Erro ao obter contexto para ${containerId}:`, error);
            return null;
        }
        
        return canvas;
    }
    
    // Substituir as funções de renderização para usar canvas válidos
    function substituirFuncoesRenderizacao() {
        // Lista de métodos a serem corrigidos
        const metodosGrafico = {
            'renderizarGraficoStatus': 'grafico-status',
            'renderizarGraficoDiaSemana': 'grafico-dia-semana',
            'renderizarGraficoTendencia': 'grafico-tendencia',
            'renderizarGraficoHorarios': 'grafico-horarios',
            'renderizarGraficoDesempenho': 'grafico-desempenho'
        };
        
        // Para cada método
        Object.entries(metodosGrafico).forEach(([metodo, elementId]) => {
            if (typeof window[metodo] === 'function') {
                console.log(`Substituindo função ${metodo} para usar canvas válido...`);
                
                // Guardar função original
                const funcaoOriginal = window[metodo];
                
                // Criar nova função
                window[metodo] = function() {
                    console.log(`Executando ${metodo} com canvas válido...`);
                    
                    // Criar canvas válido antes de chamar a função
                    const canvas = criarCanvasValido(elementId);
                    
                    if (!canvas) {
                        console.error(`Não foi possível criar canvas válido para ${metodo}`);
                        return null;
                    }
                    
                    try {
                        // Chamar função original
                        return funcaoOriginal.apply(this, arguments);
                    } catch (error) {
                        console.error(`Erro ao executar ${metodo}:`, error);
                        return null;
                    }
                };
                
                console.log(`Função ${metodo} substituída com sucesso`);
            }
        });
    }
    
    // Sobrescrever a função atualizarGraficos para garantir que os canvas sejam criados
    function sobrescreverAtualizarGraficos() {
        if (typeof window.atualizarGraficos === 'function') {
            console.log('Substituindo função atualizarGraficos...');
            
            const funcaoOriginal = window.atualizarGraficos;
            
            window.atualizarGraficos = function() {
                console.log('Executando atualizarGraficos com correção de canvas...');
                
                // Criar canvas válidos para todos os gráficos
                const idsGraficos = [
                    'grafico-status',
                    'grafico-dia-semana', 
                    'grafico-tendencia',
                    'grafico-horarios',
                    'grafico-desempenho'
                ];
                
                idsGraficos.forEach(id => {
                    criarCanvasValido(id);
                });
                
                // Executar função original
                try {
                    return funcaoOriginal.apply(this, arguments);
                } catch (error) {
                    console.error('Erro ao executar atualizarGraficos:', error);
                    return null;
                }
            };
            
            console.log('Função atualizarGraficos substituída com sucesso');
        }
    }
    
    // Função auxiliar para adicionar biblioteca externa Chart.js
    function garantirChartJS() {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js não encontrado, tentando carregar dinamicamente...');
            
            // Criar elemento script
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
            script.integrity = 'sha256-+8RZJua0aEWg+QVVKg4LEzEEm/8RFez5Tb4JBNiV5xA=';
            script.crossOrigin = 'anonymous';
            
            // Adicionar ao head
            document.head.appendChild(script);
            
            // Aguardar carregamento
            script.onload = function() {
                console.log('Chart.js carregado com sucesso');
                setTimeout(aplicarCorrecoes, 100);
            };
            
            script.onerror = function() {
                console.error('Falha ao carregar Chart.js dinamicamente');
            };
            
            return false;
        }
        
        return true;
    }
    
    // Função principal para aplicar todas as correções
    function aplicarCorrecoes() {
        console.log('Aplicando correções de canvas...');
        
        // Verificar Chart.js
        if (!garantirChartJS()) {
            return;
        }
        
        // Aplicar correções
        substituirFuncoesRenderizacao();
        sobrescreverAtualizarGraficos();
        
        // Adicionar correção ao carregar dados KPI
        if (typeof window.carregarDadosKPI === 'function') {
            const funcaoOriginal = window.carregarDadosKPI;
            
            window.carregarDadosKPI = function() {
                console.log('Executando carregarDadosKPI com correção de canvas...');
                
                // Criar canvas válidos antes de carregar dados
                const idsGraficos = [
                    'grafico-status',
                    'grafico-dia-semana', 
                    'grafico-tendencia',
                    'grafico-horarios',
                    'grafico-desempenho'
                ];
                
                idsGraficos.forEach(id => {
                    criarCanvasValido(id);
                });
                
                // Executar função original
                return funcaoOriginal.apply(this, arguments);
            };
            
            console.log('Função carregarDadosKPI substituída com sucesso');
        }
    }
    
    // Executar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', aplicarCorrecoes);
    } else {
        setTimeout(aplicarCorrecoes, 0);
    }
    
    // Injetar método de utilidade global para criar gráficos de forma segura
    window.criarGraficoSeguro = function(elementId, callback) {
        console.log(`Criando gráfico seguro para ${elementId}...`);
        
        // Obter ou criar canvas válido
        const canvas = criarCanvasValido(elementId);
        
        if (!canvas) {
            console.error(`Não foi possível criar canvas para ${elementId}`);
            return null;
        }
        
        try {
            // Executar callback com canvas
            const resultado = callback(canvas);
            
            if (resultado instanceof Chart) {
                console.log(`Gráfico criado com sucesso para ${elementId}`);
            } else {
                console.warn(`Callback não retornou uma instância de Chart para ${elementId}`);
            }
            
            return resultado;
        } catch (error) {
            console.error(`Erro ao criar gráfico para ${elementId}:`, error);
            return null;
        }
    };
    
    console.log('Canvas Fix - Inicialização concluída');
})();
