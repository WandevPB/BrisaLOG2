/**
 * graph-render-override.js - Substituição direta das funções de renderização de gráficos
 */
(function() {
    console.log('Graph Render Override - Inicializando...');
    
    // Aguardar DOM e Chart.js estarem carregados
    function iniciar() {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js ainda não carregado. Aguardando...');
            setTimeout(iniciar, 100);
            return;
        }
        
        console.log('Substituindo funções de renderização de gráficos...');
        
        // Substituir renderizarGraficoStatus
        window.renderizarGraficoStatus = function(data) {
            console.log('Renderizando gráfico de status com dados:', data);
            
            try {
                // Obter elemento
                const container = document.getElementById('grafico-status');
                if (!container) {
                    console.error('Elemento grafico-status não encontrado');
                    return null;
                }
                
                // Limpar container
                container.innerHTML = '';
                
                // Criar canvas
                const canvas = document.createElement('canvas');
                canvas.width = container.clientWidth || 300;
                canvas.height = container.clientHeight || 200;
                container.appendChild(canvas);
                
                // Verificar contexto
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    console.error('Não foi possível obter contexto para grafico-status');
                    return null;
                }
                
                // Dados de exemplo se não houver dados reais
                const dadosReais = data && data.labels && data.datasets;
                if (!dadosReais) {
                    console.warn('Dados não disponíveis para grafico-status, usando dados de exemplo');
                    data = {
                        labels: ['Concluído', 'Em Andamento', 'Agendado', 'Cancelado'],
                        datasets: [{
                            data: [0, 0, 0, 0],
                            backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444']
                        }]
                    };
                }
                
                // Criar gráfico
                return new Chart(ctx, {
                    type: 'doughnut',
                    data: data,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: {
                                    color: '#4B5563'
                                }
                            }
                        }
                    }
                });
            } catch (error) {
                console.error('Erro ao renderizar gráfico de status:', error);
                return null;
            }
        };
        
        // Substituir renderizarGraficoDiaSemana
        window.renderizarGraficoDiaSemana = function(data) {
            console.log('Renderizando gráfico de dia da semana com dados:', data);
            
            try {
                // Obter elemento
                const container = document.getElementById('grafico-dia-semana');
                if (!container) {
                    console.error('Elemento grafico-dia-semana não encontrado');
                    return null;
                }
                
                // Limpar container
                container.innerHTML = '';
                
                // Criar canvas
                const canvas = document.createElement('canvas');
                canvas.width = container.clientWidth || 300;
                canvas.height = container.clientHeight || 200;
                container.appendChild(canvas);
                
                // Verificar contexto
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    console.error('Não foi possível obter contexto para grafico-dia-semana');
                    return null;
                }
                
                // Dados de exemplo se não houver dados reais
                const dadosReais = data && data.labels && data.datasets;
                if (!dadosReais) {
                    console.warn('Dados não disponíveis para grafico-dia-semana, usando dados de exemplo');
                    data = {
                        labels: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'],
                        datasets: [{
                            label: 'Agendamentos',
                            data: [0, 0, 0, 0, 0, 0, 0],
                            backgroundColor: '#3B82F6'
                        }]
                    };
                }
                
                // Criar gráfico
                return new Chart(ctx, {
                    type: 'bar',
                    data: data,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    precision: 0
                                }
                            }
                        }
                    }
                });
            } catch (error) {
                console.error('Erro ao renderizar gráfico de dia da semana:', error);
                return null;
            }
        };
        
        // Substituir renderizarGraficoTendencia
        window.renderizarGraficoTendencia = function(data) {
            console.log('Renderizando gráfico de tendência com dados:', data);
            
            try {
                // Obter elemento
                const container = document.getElementById('grafico-tendencia');
                if (!container) {
                    console.error('Elemento grafico-tendencia não encontrado');
                    return null;
                }
                
                // Limpar container
                container.innerHTML = '';
                
                // Criar canvas
                const canvas = document.createElement('canvas');
                canvas.width = container.clientWidth || 300;
                canvas.height = container.clientHeight || 200;
                container.appendChild(canvas);
                
                // Verificar contexto
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    console.error('Não foi possível obter contexto para grafico-tendencia');
                    return null;
                }
                
                // Dados de exemplo se não houver dados reais
                const dadosReais = data && data.labels && data.datasets;
                if (!dadosReais) {
                    console.warn('Dados não disponíveis para grafico-tendencia, usando dados de exemplo');
                    data = {
                        labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
                        datasets: [{
                            label: 'Atual',
                            data: [0, 0, 0, 0],
                            borderColor: '#3B82F6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            fill: true
                        }, {
                            label: 'Anterior',
                            data: [0, 0, 0, 0],
                            borderColor: '#9CA3AF',
                            backgroundColor: 'rgba(156, 163, 175, 0.1)',
                            fill: true
                        }]
                    };
                }
                
                // Criar gráfico
                return new Chart(ctx, {
                    type: 'line',
                    data: data,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top',
                                labels: {
                                    color: '#4B5563'
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    precision: 0
                                }
                            }
                        }
                    }
                });
            } catch (error) {
                console.error('Erro ao renderizar gráfico de tendência:', error);
                return null;
            }
        };
        
        // Substituir renderizarGraficoHorarios
        window.renderizarGraficoHorarios = function(data) {
            console.log('Renderizando gráfico de horários com dados:', data);
            
            try {
                // Obter elemento
                const container = document.getElementById('grafico-horarios');
                if (!container) {
                    console.error('Elemento grafico-horarios não encontrado');
                    return null;
                }
                
                // Limpar container
                container.innerHTML = '';
                
                // Criar canvas
                const canvas = document.createElement('canvas');
                canvas.width = container.clientWidth || 300;
                canvas.height = container.clientHeight || 200;
                container.appendChild(canvas);
                
                // Verificar contexto
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    console.error('Não foi possível obter contexto para grafico-horarios');
                    return null;
                }
                
                // Dados de exemplo se não houver dados reais
                const dadosReais = data && data.labels && data.datasets;
                if (!dadosReais) {
                    console.warn('Dados não disponíveis para grafico-horarios, usando dados de exemplo');
                    data = {
                        labels: ['00h-06h', '06h-12h', '12h-18h', '18h-00h'],
                        datasets: [{
                            label: 'Agendamentos',
                            data: [0, 0, 0, 0],
                            backgroundColor: '#F59E0B'
                        }]
                    };
                }
                
                // Criar gráfico
                return new Chart(ctx, {
                    type: 'bar',
                    data: data,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    precision: 0
                                }
                            }
                        }
                    }
                });
            } catch (error) {
                console.error('Erro ao renderizar gráfico de horários:', error);
                return null;
            }
        };
        
        console.log('Funções de renderização substituídas com sucesso');
    }
    
    // Iniciar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }
    
    console.log('Graph Render Override - Inicialização concluída');
})();
