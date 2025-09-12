/**
 * dashboard-kpi-render.js - Implementação simplificada da atualização de gráficos KPI
 */
(function() {
    console.log('Dashboard KPI Render - Inicializando...');
    
    // Substituir a função atualizarGraficos no Dashboard KPI
    document.addEventListener('DOMContentLoaded', function() {
        if (typeof window.atualizarGraficos === 'function') {
            console.log('Substituindo função atualizarGraficos...');
            
            // Armazenar função original
            const atualizarGraficosOriginal = window.atualizarGraficos;
            
            // Nova implementação
            window.atualizarGraficos = function() {
                console.log('Executando atualizarGraficos (versão robusta)...');
                
                try {
                    // Verificar disponibilidade do Chart.js
                    if (typeof Chart === 'undefined') {
                        console.error('Chart.js não está disponível');
                        return;
                    }
                    
                    // Acessar dados
                    const dados = window.dadosKPI;
                    if (!dados) {
                        console.warn('Dados KPI não estão disponíveis');
                        // Continuar com dados vazios
                    }
                    
                    // Renderizar gráfico de status
                    try {
                        const dadosStatus = prepararDadosStatus(dados);
                        if (window.renderizarGraficoStatus) {
                            window.renderizarGraficoStatus(dadosStatus);
                        } else {
                            console.error('Função renderizarGraficoStatus não encontrada');
                        }
                    } catch (error) {
                        console.error('Erro ao renderizar gráfico de status:', error);
                    }
                    
                    // Renderizar gráfico de dia da semana
                    try {
                        const dadosDiaSemana = prepararDadosDiaSemana(dados);
                        if (window.renderizarGraficoDiaSemana) {
                            window.renderizarGraficoDiaSemana(dadosDiaSemana);
                        } else {
                            console.error('Função renderizarGraficoDiaSemana não encontrada');
                        }
                    } catch (error) {
                        console.error('Erro ao renderizar gráfico de dia da semana:', error);
                    }
                    
                    // Renderizar gráfico de tendência
                    try {
                        const dadosTendencia = prepararDadosTendencia(dados);
                        if (window.renderizarGraficoTendencia) {
                            window.renderizarGraficoTendencia(dadosTendencia);
                        } else {
                            console.error('Função renderizarGraficoTendencia não encontrada');
                        }
                    } catch (error) {
                        console.error('Erro ao renderizar gráfico de tendência:', error);
                    }
                    
                    // Renderizar gráfico de horários
                    try {
                        const dadosHorarios = prepararDadosHorarios(dados);
                        if (window.renderizarGraficoHorarios) {
                            window.renderizarGraficoHorarios(dadosHorarios);
                        } else {
                            console.error('Função renderizarGraficoHorarios não encontrada');
                        }
                    } catch (error) {
                        console.error('Erro ao renderizar gráfico de horários:', error);
                    }
                    
                    console.log('Todos os gráficos foram atualizados com sucesso');
                } catch (error) {
                    console.error('Erro ao atualizar gráficos:', error);
                    
                    // Tentar executar a função original como fallback
                    try {
                        atualizarGraficosOriginal();
                    } catch (fallbackError) {
                        console.error('Também falhou ao executar função original:', fallbackError);
                    }
                }
            };
            
            console.log('Função atualizarGraficos substituída com sucesso');
        } else {
            console.warn('Função atualizarGraficos não encontrada');
        }
    });
    
    // Funções auxiliares para preparar dados
    function prepararDadosStatus(dados) {
        // Dados padrão
        const dadosPadrao = {
            labels: ['Concluído', 'Em Andamento', 'Agendado', 'Cancelado'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444']
            }]
        };
        
        // Retornar dados reais se disponíveis, ou dados padrão
        if (dados && dados.statusCount) {
            dadosPadrao.datasets[0].data = [
                dados.statusCount.concluido || 0,
                dados.statusCount.andamento || 0,
                dados.statusCount.agendado || 0,
                dados.statusCount.cancelado || 0
            ];
        } else {
            console.warn('Dados de status não disponíveis, usando valores padrão');
        }
        
        return dadosPadrao;
    }
    
    function prepararDadosDiaSemana(dados) {
        // Dados padrão
        const dadosPadrao = {
            labels: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'],
            datasets: [{
                label: 'Agendamentos',
                data: [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: '#3B82F6'
            }]
        };
        
        // Retornar dados reais se disponíveis, ou dados padrão
        if (dados && dados.diaSemanaCount) {
            dadosPadrao.datasets[0].data = [
                dados.diaSemanaCount[1] || 0, // Segunda
                dados.diaSemanaCount[2] || 0, // Terça
                dados.diaSemanaCount[3] || 0, // Quarta
                dados.diaSemanaCount[4] || 0, // Quinta
                dados.diaSemanaCount[5] || 0, // Sexta
                dados.diaSemanaCount[6] || 0, // Sábado
                dados.diaSemanaCount[0] || 0  // Domingo
            ];
        } else {
            console.warn('Dados de dia da semana não disponíveis, usando valores padrão');
        }
        
        return dadosPadrao;
    }
    
    function prepararDadosTendencia(dados) {
        // Dados padrão
        const dadosPadrao = {
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
        
        // Retornar dados reais se disponíveis, ou dados padrão
        if (dados && dados.tendencia && dados.tendenciaAnterior) {
            dadosPadrao.datasets[0].data = dados.tendencia;
            dadosPadrao.datasets[1].data = dados.tendenciaAnterior;
        } else {
            console.warn('Dados de tendência não disponíveis, usando valores padrão');
        }
        
        return dadosPadrao;
    }
    
    function prepararDadosHorarios(dados) {
        // Dados padrão
        const dadosPadrao = {
            labels: ['00h-06h', '06h-12h', '12h-18h', '18h-00h'],
            datasets: [{
                label: 'Agendamentos',
                data: [0, 0, 0, 0],
                backgroundColor: '#F59E0B'
            }]
        };
        
        // Retornar dados reais se disponíveis, ou dados padrão
        if (dados && dados.horarioCount) {
            dadosPadrao.datasets[0].data = [
                dados.horarioCount.madrugada || 0,
                dados.horarioCount.manha || 0,
                dados.horarioCount.tarde || 0,
                dados.horarioCount.noite || 0
            ];
        } else {
            console.warn('Dados de horários não disponíveis, usando valores padrão');
        }
        
        return dadosPadrao;
    }
    
    console.log('Dashboard KPI Render - Inicialização concluída');
})();
