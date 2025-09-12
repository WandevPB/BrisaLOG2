/**
 * Solução para o erro "Failed to create chart: can't acquire context from the given item"
 * Este script ajuda a garantir que os gráficos sejam criados corretamente
 */
(function() {
    // Função que será executada quando o documento estiver carregado
    document.addEventListener('DOMContentLoaded', function() {
        // Verificar se Chart.js está carregado
        if (typeof Chart === 'undefined') {
            console.error('Chart.js não está carregado. Os gráficos não serão renderizados.');
            return;
        }

        // Função de monkeypatch para a criação de gráficos
        const originalChart = Chart;
        window.Chart = function(canvas, config) {
            // Verificar se o canvas existe e está no DOM
            if (!canvas || !canvas.parentNode) {
                console.error('Falha ao criar gráfico: canvas não está no DOM');
                throw new Error('Canvas não está no DOM');
            }
            
            // Verificar se o canvas tem um contexto 2d
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.error('Falha ao criar gráfico: não foi possível obter contexto 2d do canvas');
                throw new Error('Não foi possível obter contexto 2d do canvas');
            }
            
            try {
                // Chamar o construtor original com contexto validado
                return new originalChart(canvas, config);
            } catch (error) {
                console.error('Erro ao criar gráfico:', error);
                throw error;
            }
        };
        
        // Manter referência ao original
        Chart.prototype = originalChart.prototype;
        Chart.defaults = originalChart.defaults;
        Chart.helpers = originalChart.helpers;

        console.log('Chart.js patch aplicado para prevenir erros de contexto.');
    });
})();
