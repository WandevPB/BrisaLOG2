/**
 * iframe-chart-solution.js - Solução usando iframes para isolar a renderização de gráficos
 */
(function() {
    console.log('Iframe Chart Solution - Inicializando...');
    
    // Verificar se o DOM está pronto
    function onDOMReady() {
        console.log('DOM carregado, aplicando solução de iframe...');
        
        // Substituir a abertura do modal para usar nossa abordagem
        if (typeof window.openDashboardKPIModal === 'function') {
            console.log('Substituindo openDashboardKPIModal...');
            
            const originalOpen = window.openDashboardKPIModal;
            
            window.openDashboardKPIModal = function() {
                console.log('Abrindo modal KPI com solução de iframe...');
                
                // Chamar função original
                originalOpen.apply(this, arguments);
                
                // Preparar iframes para os gráficos
                setTimeout(prepararIframes, 100);
            };
            
            console.log('Função openDashboardKPIModal substituída com sucesso');
        }
        
        // Substituir a função de carregamento de dados
        if (typeof window.carregarDadosKPI === 'function') {
            console.log('Substituindo carregarDadosKPI...');
            
            const originalLoad = window.carregarDadosKPI;
            
            window.carregarDadosKPI = function(dataInicio, dataFim) {
                console.log('Carregando dados KPI com solução de iframe...');
                
                // Chamar função original
                originalLoad.apply(this, arguments);
                
                // Após dados carregados, atualizar iframes
                setTimeout(atualizarIframes, 500);
            };
            
            console.log('Função carregarDadosKPI substituída com sucesso');
        }
    }
    
    // Preparar iframes para os gráficos
    function prepararIframes() {
        console.log('Preparando iframes para gráficos...');
        
        const graficoIds = [
            'grafico-status',
            'grafico-dia-semana',
            'grafico-tendencia',
            'grafico-horarios'
        ];
        
        graficoIds.forEach(id => {
            const container = document.getElementById(id);
            if (!container) {
                console.warn(`Container ${id} não encontrado`);
                return;
            }
            
            // Remover conteúdo anterior
            container.innerHTML = '';
            
            // Criar iframe
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.id = `${id}-iframe`;
            
            // Adicionar ao container
            container.appendChild(iframe);
            
            // Preparar conteúdo HTML básico
            const iframeContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Chart ${id}</title>
                    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                </head>
                <body style="margin:0;padding:0;overflow:hidden;">
                    <canvas id="chart-canvas" style="width:100%;height:100%;"></canvas>
                    <script>
                        window.addEventListener('message', function(event) {
                            if (event.data && event.data.chartData) {
                                renderChart(event.data.chartData, event.data.chartType);
                            }
                        });
                        
                        function renderChart(data, type) {
                            const canvas = document.getElementById('chart-canvas');
                            const ctx = canvas.getContext('2d');
                            
                            // Limpar canvas anterior
                            if (window.currentChart) {
                                window.currentChart.destroy();
                            }
                            
                            // Verificar dimensões
                            canvas.width = canvas.clientWidth;
                            canvas.height = canvas.clientHeight;
                            
                            // Criar gráfico
                            window.currentChart = new Chart(ctx, {
                                type: type || 'bar',
                                data: data,
                                options: {
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    animation: {
                                        duration: 500
                                    },
                                    plugins: {
                                        legend: {
                                            position: type === 'doughnut' ? 'right' : 'top'
                                        }
                                    },
                                    scales: type !== 'doughnut' ? {
                                        y: {
                                            beginAtZero: true,
                                            ticks: {
                                                precision: 0
                                            }
                                        }
                                    } : {}
                                }
                            });
                            
                            // Notificar parent que renderização foi concluída
                            window.parent.postMessage({ 
                                status: 'rendered', 
                                id: '${id}' 
                            }, '*');
                        }
                    </script>
                </body>
                </html>
            `;
            
            // Definir conteúdo do iframe
            iframe.onload = function() {
                console.log(`Iframe para ${id} carregado`);
            };
            
            // Definir conteúdo
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write(iframeContent);
            iframeDoc.close();
            
            console.log(`Iframe preparado para ${id}`);
        });
    }
    
    // Atualizar iframes com dados
    function atualizarIframes() {
        console.log('Atualizando iframes com dados dos gráficos...');
        
        // Verificar se temos dados
        if (!window.dadosKPI) {
            console.warn('Dados KPI não disponíveis');
            // Usar dados de exemplo
            window.dadosKPI = {
                statusCount: { concluido: 0, andamento: 0, agendado: 0, cancelado: 0 },
                diaSemanaCount: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
                horarioCount: { madrugada: 0, manha: 0, tarde: 0, noite: 0 },
                tendencia: [0, 0, 0, 0],
                tendenciaAnterior: [0, 0, 0, 0]
            };
        }
        
        // Preparar dados para o gráfico de status
        const dadosStatus = {
            labels: ['Concluído', 'Em Andamento', 'Agendado', 'Cancelado'],
            datasets: [{
                data: [
                    window.dadosKPI.statusCount.concluido || 0,
                    window.dadosKPI.statusCount.andamento || 0,
                    window.dadosKPI.statusCount.agendado || 0,
                    window.dadosKPI.statusCount.cancelado || 0
                ],
                backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444']
            }]
        };
        
        // Enviar dados para o iframe
        const iframeStatus = document.getElementById('grafico-status-iframe');
        if (iframeStatus && iframeStatus.contentWindow) {
            iframeStatus.contentWindow.postMessage({
                chartData: dadosStatus,
                chartType: 'doughnut'
            }, '*');
            console.log('Dados enviados para grafico-status-iframe');
        }
        
        // Preparar dados para o gráfico de dia da semana
        const dadosDiaSemana = {
            labels: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'],
            datasets: [{
                label: 'Agendamentos',
                data: [
                    window.dadosKPI.diaSemanaCount[1] || 0,
                    window.dadosKPI.diaSemanaCount[2] || 0,
                    window.dadosKPI.diaSemanaCount[3] || 0,
                    window.dadosKPI.diaSemanaCount[4] || 0,
                    window.dadosKPI.diaSemanaCount[5] || 0,
                    window.dadosKPI.diaSemanaCount[6] || 0,
                    window.dadosKPI.diaSemanaCount[0] || 0
                ],
                backgroundColor: '#3B82F6'
            }]
        };
        
        // Enviar dados para o iframe
        const iframeDiaSemana = document.getElementById('grafico-dia-semana-iframe');
        if (iframeDiaSemana && iframeDiaSemana.contentWindow) {
            iframeDiaSemana.contentWindow.postMessage({
                chartData: dadosDiaSemana,
                chartType: 'bar'
            }, '*');
            console.log('Dados enviados para grafico-dia-semana-iframe');
        }
        
        // Preparar dados para o gráfico de tendência
        const dadosTendencia = {
            labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
            datasets: [{
                label: 'Atual',
                data: window.dadosKPI.tendencia || [0, 0, 0, 0],
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true
            }, {
                label: 'Anterior',
                data: window.dadosKPI.tendenciaAnterior || [0, 0, 0, 0],
                borderColor: '#9CA3AF',
                backgroundColor: 'rgba(156, 163, 175, 0.1)',
                fill: true
            }]
        };
        
        // Enviar dados para o iframe
        const iframeTendencia = document.getElementById('grafico-tendencia-iframe');
        if (iframeTendencia && iframeTendencia.contentWindow) {
            iframeTendencia.contentWindow.postMessage({
                chartData: dadosTendencia,
                chartType: 'line'
            }, '*');
            console.log('Dados enviados para grafico-tendencia-iframe');
        }
        
        // Preparar dados para o gráfico de horários
        const dadosHorarios = {
            labels: ['00h-06h', '06h-12h', '12h-18h', '18h-00h'],
            datasets: [{
                label: 'Agendamentos',
                data: [
                    window.dadosKPI.horarioCount.madrugada || 0,
                    window.dadosKPI.horarioCount.manha || 0,
                    window.dadosKPI.horarioCount.tarde || 0,
                    window.dadosKPI.horarioCount.noite || 0
                ],
                backgroundColor: '#F59E0B'
            }]
        };
        
        // Enviar dados para o iframe
        const iframeHorarios = document.getElementById('grafico-horarios-iframe');
        if (iframeHorarios && iframeHorarios.contentWindow) {
            iframeHorarios.contentWindow.postMessage({
                chartData: dadosHorarios,
                chartType: 'bar'
            }, '*');
            console.log('Dados enviados para grafico-horarios-iframe');
        }
        
        // Garantir que o conteúdo principal esteja visível
        setTimeout(() => {
            const loading = document.getElementById('dashboard-kpi-loading');
            const mainContent = document.getElementById('dashboard-kpi-main');
            
            if (loading) loading.classList.add('hidden');
            if (mainContent) mainContent.classList.remove('hidden');
            
            console.log('Conteúdo principal exibido');
        }, 500);
    }
    
    // Iniciar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onDOMReady);
    } else {
        setTimeout(onDOMReady, 0);
    }
    
    // Adicionar manipulador de eventos global
    window.addEventListener('message', function(event) {
        if (event.data && event.data.status === 'rendered') {
            console.log(`Gráfico ${event.data.id} renderizado com sucesso`);
        }
    });
    
    console.log('Iframe Chart Solution - Inicialização concluída');
})();
