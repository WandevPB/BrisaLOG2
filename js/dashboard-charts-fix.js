/**
 * dashboard-charts-fix.js - Solução específica para o problema de renderização de gráficos no Dashboard KPIs
 */
(function() {
    console.log('Dashboard Charts Fix - Inicializando correção para gráficos do Dashboard...');

    // Função para verificar elementos antes de renderizar gráficos
    function verificarElementosGraficos() {
        const elementosGrafico = [
            'grafico-status',
            'grafico-dia-semana',
            'grafico-evolucao',
            'grafico-horarios',
            'grafico-tipo-carga'
        ];

        console.log('Verificando elementos dos gráficos...');
        
        elementosGrafico.forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) {
                console.log(`Elemento ${id} encontrado`);
                
                // Verificar se já tem canvas
                const canvasExistente = elemento.querySelector('canvas');
                if (canvasExistente) {
                    console.log(`Canvas já existe para ${id}, removendo...`);
                    elemento.removeChild(canvasExistente);
                }
                
                // Criar novo canvas
                console.log(`Criando novo canvas para ${id}`);
                const canvas = document.createElement('canvas');
                canvas.id = `${id}-canvas`;
                canvas.width = elemento.clientWidth;
                canvas.height = elemento.clientHeight;
                elemento.appendChild(canvas);
                
                console.log(`Canvas criado para ${id} com dimensões ${canvas.width}x${canvas.height}`);
            } else {
                console.warn(`Elemento ${id} não encontrado`);
            }
        });
    }

    // Função para monitorar quando o modal é aberto
    function monitorarAberturaDashboard() {
        console.log('Monitorando abertura do dashboard...');
        
        // Criar uma função que será chamada quando o dashboard for aberto
        window.prepararGraficosKPI = function() {
            console.log('Preparando gráficos KPI...');
            setTimeout(verificarElementosGraficos, 100);
        };
        
        // Substituir a função original para chamar nossa versão
        const originalOpenDashboardKPIModal = window.openDashboardKPIModal;
        if (originalOpenDashboardKPIModal) {
            window.openDashboardKPIModal = function() {
                console.log('Dashboard KPI Modal sendo aberto...');
                originalOpenDashboardKPIModal.apply(this, arguments);
                window.prepararGraficosKPI();
            };
            console.log('Função openDashboardKPIModal substituída com sucesso');
        } else {
            console.warn('Função openDashboardKPIModal não encontrada');
        }
    }

    // Função para corrigir a renderização de gráficos
    function corrigirRenderizacaoGraficos() {
        console.log('Aplicando correções para renderização de gráficos...');
        
        // Verificar se as funções de renderização existem
        const funcoesGrafico = [
            'renderizarGraficoStatus',
            'renderizarGraficoDiaSemana',
            'renderizarGraficoTendencia',
            'renderizarGraficoHorarios'
        ];
        
        funcoesGrafico.forEach(nomeFuncao => {
            if (typeof window[nomeFuncao] === 'function') {
                console.log(`Função ${nomeFuncao} encontrada, aplicando correção...`);
                
                // Armazenar função original
                const funcaoOriginal = window[nomeFuncao];
                
                // Substituir por versão segura
                window[nomeFuncao] = function() {
                    console.log(`Executando versão segura de ${nomeFuncao}`);
                    try {
                        // Verificar se o Chart.js está disponível
                        if (typeof Chart === 'undefined') {
                            console.error(`Chart.js não está disponível para ${nomeFuncao}`);
                            return;
                        }
                        
                        // Identificar o ID do elemento com base no nome da função
                        let elementoId = null;
                        if (nomeFuncao.includes('Status')) elementoId = 'grafico-status';
                        else if (nomeFuncao.includes('DiaSemana')) elementoId = 'grafico-dia-semana';
                        else if (nomeFuncao.includes('Tendencia')) elementoId = 'grafico-evolucao';
                        else if (nomeFuncao.includes('Horarios')) elementoId = 'grafico-horarios';
                        
                        if (!elementoId) {
                            console.warn(`Não foi possível identificar o elemento para ${nomeFuncao}`);
                            return funcaoOriginal.apply(this, arguments);
                        }
                        
                        // Verificar se o elemento existe
                        const elemento = document.getElementById(elementoId);
                        if (!elemento) {
                            console.warn(`Elemento ${elementoId} não encontrado para ${nomeFuncao}`);
                            return;
                        }
                        
                        // Verificar se já tem canvas ou criar um novo
                        let canvas = elemento.querySelector('canvas');
                        if (!canvas) {
                            console.log(`Criando canvas para ${elementoId}`);
                            canvas = document.createElement('canvas');
                            elemento.innerHTML = '';
                            elemento.appendChild(canvas);
                        }
                        
                        // Garantir que o canvas tenha dimensões
                        if (canvas.width === 0 || canvas.height === 0) {
                            canvas.width = elemento.clientWidth || 300;
                            canvas.height = elemento.clientHeight || 200;
                            console.log(`Ajustando dimensões do canvas para ${canvas.width}x${canvas.height}`);
                        }
                        
                        // Chamar função original com contexto seguro
                        return funcaoOriginal.apply(this, arguments);
                    } catch (error) {
                        console.error(`Erro ao executar ${nomeFuncao}:`, error);
                    }
                };
                
                console.log(`Função ${nomeFuncao} substituída com sucesso`);
            } else {
                console.warn(`Função ${nomeFuncao} não encontrada`);
            }
        });
    }

    // Aplicar todas as correções quando o DOM estiver pronto
    function aplicarCorrecoes() {
        console.log('Aplicando todas as correções...');
        verificarElementosGraficos();
        monitorarAberturaDashboard();
        corrigirRenderizacaoGraficos();
    }

    // Aguardar DOM pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', aplicarCorrecoes);
    } else {
        setTimeout(aplicarCorrecoes, 0);
    }

    console.log('Dashboard Charts Fix - Inicialização concluída');
})();
