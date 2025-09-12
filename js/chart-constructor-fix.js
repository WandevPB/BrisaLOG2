/**
 * chart-constructor-fix.js - Modifica o construtor do Chart.js diretamente para resolver problemas de canvas
 */
(function() {
    console.log('Chart Constructor Fix - Inicializando...');
    
    // Aguardar pelo Chart.js
    function checkForChart() {
        if (typeof Chart === 'undefined') {
            console.log('Chart.js ainda não disponível, aguardando...');
            setTimeout(checkForChart, 100);
            return;
        }
        
        console.log('Chart.js encontrado, aplicando correção no construtor...');
        
        // Guardar o construtor original
        const OriginalChart = Chart;
        
        // Criar um novo construtor com proteção
        function SafeChart(item, config) {
            console.log('SafeChart construtor chamado');
            
            try {
                // Verificar se o item é válido
                if (!item) {
                    console.error('Item nulo ou indefinido fornecido para Chart');
                    throw new Error('Item inválido');
                }
                
                // Se item for uma string, buscar o elemento pelo ID
                if (typeof item === 'string') {
                    console.log(`Buscando elemento com ID: ${item}`);
                    const element = document.getElementById(item);
                    if (!element) {
                        console.error(`Elemento com ID ${item} não encontrado`);
                        throw new Error(`Elemento com ID ${item} não encontrado`);
                    }
                    item = element;
                }
                
                // Se o item é um elemento HTML, mas não um canvas, tentar encontrar ou criar um canvas dentro dele
                if (item instanceof HTMLElement && !(item instanceof HTMLCanvasElement)) {
                    console.log('Item é um elemento HTML, mas não um canvas. Buscando ou criando canvas...');
                    
                    let canvas = item.querySelector('canvas');
                    
                    if (!canvas) {
                        console.log('Canvas não encontrado, criando novo...');
                        canvas = document.createElement('canvas');
                        item.innerHTML = '';
                        item.appendChild(canvas);
                    }
                    
                    item = canvas;
                }
                
                // Verificar se agora temos um canvas
                if (!(item instanceof HTMLCanvasElement)) {
                    console.error('Item não é um canvas válido');
                    throw new Error('Item não é um canvas válido');
                }
                
                // Verificar se o canvas está no DOM
                if (!document.body.contains(item)) {
                    console.error('Canvas não está no DOM');
                    throw new Error('Canvas não está no DOM');
                }
                
                // Verificar dimensões
                if (item.width === 0 || item.height === 0) {
                    console.log('Canvas tem dimensões zeradas, ajustando...');
                    
                    const parent = item.parentElement;
                    if (parent) {
                        item.width = parent.clientWidth || 300;
                        item.height = parent.clientHeight || 200;
                    } else {
                        item.width = 300;
                        item.height = 200;
                    }
                    
                    console.log(`Canvas redimensionado para ${item.width}x${item.height}`);
                }
                
                // Verificar se getContext está disponível
                if (typeof item.getContext !== 'function') {
                    console.error('Canvas não tem método getContext');
                    throw new Error('Canvas não tem método getContext');
                }
                
                // Testar getContext
                const ctx = item.getContext('2d');
                if (!ctx) {
                    console.error('Não foi possível obter contexto 2d');
                    throw new Error('Não foi possível obter contexto 2d');
                }
                
                // Construir o chart
                return new OriginalChart(item, config);
            } catch (error) {
                console.error('Erro ao criar Chart:', error);
                
                // Tentar criar um canvas de fallback
                try {
                    console.log('Tentando criar canvas de fallback...');
                    
                    // Criar novo canvas
                    const fallbackCanvas = document.createElement('canvas');
                    fallbackCanvas.width = 300;
                    fallbackCanvas.height = 200;
                    
                    // Adicionar temporariamente ao body para garantir que está no DOM
                    document.body.appendChild(fallbackCanvas);
                    
                    // Testar contexto
                    const ctx = fallbackCanvas.getContext('2d');
                    if (!ctx) {
                        console.error('Não foi possível obter contexto no canvas de fallback');
                        document.body.removeChild(fallbackCanvas);
                        throw error; // Rethrow original error
                    }
                    
                    console.log('Canvas de fallback criado com sucesso');
                    
                    // Construir chart com o canvas de fallback
                    const chart = new OriginalChart(fallbackCanvas, config);
                    
                    // Armazenar referência para poder mover o canvas depois
                    chart._fallbackCanvas = fallbackCanvas;
                    
                    return chart;
                } catch (fallbackError) {
                    console.error('Erro ao criar canvas de fallback:', fallbackError);
                    throw error; // Rethrow original error
                }
            }
        }
        
        // Copiar propriedades estáticas
        Object.assign(SafeChart, OriginalChart);
        SafeChart.prototype = OriginalChart.prototype;
        
        // Substituir o construtor global
        window.Chart = SafeChart;
        
        console.log('Chart.js construtor substituído com sucesso');
    }
    
    // Iniciar verificação
    checkForChart();
    
    // Também sobrescrever a função de renderização de gráficos para torná-la mais segura
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM carregado, verificando funções de renderização...');
        
        // Lista de funções de renderização para sobrescrever
        const renderFunctions = [
            'renderizarGraficoStatus',
            'renderizarGraficoDiaSemana', 
            'renderizarGraficoTendencia',
            'renderizarGraficoHorarios'
        ];
        
        // Mapeamento de funções para elementos
        const elementMap = {
            'renderizarGraficoStatus': 'grafico-status',
            'renderizarGraficoDiaSemana': 'grafico-dia-semana',
            'renderizarGraficoTendencia': 'grafico-tendencia',
            'renderizarGraficoHorarios': 'grafico-horarios'
        };
        
        // Sobrescrever cada função
        renderFunctions.forEach(funcName => {
            if (typeof window[funcName] === 'function') {
                console.log(`Sobrescrevendo função ${funcName}...`);
                
                const originalFunc = window[funcName];
                
                window[funcName] = function(data) {
                    console.log(`Executando função ${funcName} segura...`);
                    
                    try {
                        // Identificar o elemento associado
                        const elementId = elementMap[funcName];
                        if (!elementId) {
                            console.error(`Não foi possível identificar o elemento para ${funcName}`);
                            return originalFunc.apply(this, arguments);
                        }
                        
                        // Verificar se o elemento existe
                        const element = document.getElementById(elementId);
                        if (!element) {
                            console.error(`Elemento ${elementId} não encontrado`);
                            return null;
                        }
                        
                        // Verificar se o elemento está visível na página
                        const rect = element.getBoundingClientRect();
                        if (rect.width === 0 || rect.height === 0) {
                            console.warn(`Elemento ${elementId} tem dimensões zero, provavelmente não está visível`);
                        }
                        
                        // Limpar o elemento e criar um novo canvas
                        element.innerHTML = '';
                        const canvas = document.createElement('canvas');
                        canvas.width = Math.max(rect.width, 300);
                        canvas.height = Math.max(rect.height, 200);
                        element.appendChild(canvas);
                        
                        console.log(`Canvas criado para ${elementId} com dimensões ${canvas.width}x${canvas.height}`);
                        
                        // Verificar se o canvas foi adicionado ao DOM
                        if (!document.body.contains(canvas)) {
                            console.error(`Canvas para ${elementId} não foi adicionado ao DOM`);
                            return null;
                        }
                        
                        // Chamar a função original
                        return originalFunc.apply(this, arguments);
                    } catch (error) {
                        console.error(`Erro ao executar ${funcName}:`, error);
                        return null;
                    }
                };
                
                console.log(`Função ${funcName} sobrescrita com sucesso`);
            }
        });
    });
    
    console.log('Chart Constructor Fix - Inicialização concluída');
})();
