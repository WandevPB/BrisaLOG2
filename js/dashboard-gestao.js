class DashboardGestao {
    constructor() {
        this.agendamentos = [];
        this.cds = [];
        this.filtros = {
            periodo: 'todos',
            dataInicio: null,
            dataFim: null,
            cds: ['todos'],
            status: ['todos']
        };
        this.charts = {};
        this.linkGerado = null;
        
        this.init();
    }

    async init() {
        // Verificar autenticação
        const token = sessionStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        // Verificar se é wanderson (EXCLUSIVO)
        const cdData = sessionStorage.getItem('cdData');
        let usuarioLogado = null;
        
        if (cdData) {
            try {
                const cdObj = JSON.parse(cdData);
                usuarioLogado = cdObj.usuario;
            } catch (e) {
                console.error('Erro ao parsear cdData:', e);
            }
        }
        
        if (usuarioLogado !== 'wanderson') {
            alert('❌ Acesso negado. Esta página é exclusiva para o usuário wanderson.');
            window.location.href = 'dashboard-admin.html';
            return;
        }

        // Configurar event listeners
        this.setupEventListeners();
        
        // Carregar dados
        await this.carregarDados();
        
        // Aplicar filtros iniciais
        await this.aplicarFiltros();
    }

    setupEventListeners() {
        // Filtro de período
        document.getElementById('filtro-periodo').addEventListener('change', (e) => {
            const personalizado = e.target.value === 'personalizado';
            document.getElementById('data-inicio-container').style.display = personalizado ? 'block' : 'none';
            document.getElementById('data-fim-container').style.display = personalizado ? 'block' : 'none';
        });

        // Multi-select CDs
        document.getElementById('filtro-cd').addEventListener('change', (e) => {
            const options = Array.from(e.target.selectedOptions);
            const values = options.map(opt => opt.value);
            
            // Se selecionar "todos", desmarcar outros
            if (values.includes('todos') && values.length > 1) {
                Array.from(e.target.options).forEach(opt => {
                    opt.selected = opt.value === 'todos';
                });
            } else if (values.length === 0) {
                // Se desmarcar tudo, marcar "todos"
                e.target.options[0].selected = true;
            }
        });

        // Multi-select Status
        document.getElementById('filtro-status').addEventListener('change', (e) => {
            const options = Array.from(e.target.selectedOptions);
            const values = options.map(opt => opt.value);
            
            if (values.includes('todos') && values.length > 1) {
                Array.from(e.target.options).forEach(opt => {
                    opt.selected = opt.value === 'todos';
                });
            } else if (values.length === 0) {
                e.target.options[0].selected = true;
            }
        });
    }

    async carregarDados() {
        this.mostrarLoading(true);
        
        try {
            // Carregar CDs
            const responseCds = await apiRequest('/api/perfis');
            this.cds = responseCds.filter(cd => cd.tipoPerfil === 'cd');
            
            // Preencher select de CDs
            const selectCd = document.getElementById('filtro-cd');
            selectCd.innerHTML = '<option value="todos" selected>Todos os CDs</option>';
            this.cds.forEach(cd => {
                selectCd.innerHTML += `<option value="${cd.id}">${cd.nome}</option>`;
            });
            
            // Carregar agendamentos
            const responseAgendamentos = await apiRequest('/api/agendamentos/todos');
            this.agendamentos = responseAgendamentos.data || responseAgendamentos;
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            alert('Erro ao carregar dados. Tente novamente.');
        } finally {
            this.mostrarLoading(false);
        }
    }

    async aplicarFiltros() {
        this.mostrarLoading(true);
        
        try {
            // Obter valores dos filtros
            const periodo = document.getElementById('filtro-periodo').value;
            const dataInicio = document.getElementById('filtro-data-inicio').value;
            const dataFim = document.getElementById('filtro-data-fim').value;
            const cds = Array.from(document.getElementById('filtro-cd').selectedOptions).map(opt => opt.value);
            const status = Array.from(document.getElementById('filtro-status').selectedOptions).map(opt => opt.value);
            
            this.filtros = { periodo, dataInicio, dataFim, cds, status };
            
            // Calcular datas do período
            const { inicio, fim } = this.calcularPeriodo(periodo, dataInicio, dataFim);
            
            // Filtrar agendamentos
            let agendamentosFiltrados = this.agendamentos.filter(ag => {
                const dataAg = new Date(ag.createdAt);
                
                // Filtro de data (por data de criação)
                if (dataAg < inicio || dataAg > fim) return false;
                
                // Filtro de CD
                if (!cds.includes('todos') && !cds.includes(ag.cdId.toString())) return false;
                
                // Filtro de status
                if (!status.includes('todos') && !status.includes(ag.status)) return false;
                
                return true;
            });
            
            // Atualizar visualizações
            this.atualizarKPIs(agendamentosFiltrados, inicio, fim);
            this.atualizarGraficos(agendamentosFiltrados);
            this.atualizarTabelaFornecedores(agendamentosFiltrados);
            this.atualizarFiltrosAtivos();
            
        } catch (error) {
            console.error('Erro ao aplicar filtros:', error);
            alert('Erro ao aplicar filtros.');
        } finally {
            this.mostrarLoading(false);
        }
    }

    calcularPeriodo(periodo, dataInicio, dataFim) {
        const hoje = new Date();
        hoje.setHours(23, 59, 59, 999);
        let inicio, fim = new Date(hoje);
        
        switch (periodo) {
            case 'todos':
                // Período amplo: de 2020 até hoje
                inicio = new Date('2020-01-01T00:00:00');
                fim = new Date(hoje);
                break;
            case 'hoje':
                inicio = new Date(hoje);
                inicio.setHours(0, 0, 0, 0);
                break;
            case '7dias':
                inicio = new Date(hoje);
                inicio.setDate(inicio.getDate() - 7);
                inicio.setHours(0, 0, 0, 0);
                break;
            case '30dias':
                inicio = new Date(hoje);
                inicio.setDate(inicio.getDate() - 30);
                inicio.setHours(0, 0, 0, 0);
                break;
            case 'mes':
                inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                break;
            case 'mesAnterior':
                inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
                fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
                break;
            case 'personalizado':
                inicio = dataInicio ? new Date(dataInicio + 'T00:00:00') : new Date(hoje);
                fim = dataFim ? new Date(dataFim + 'T23:59:59') : new Date(hoje);
                break;
            default:
                // Padrão: todos os períodos
                inicio = new Date('2020-01-01T00:00:00');
                fim = new Date(hoje);
        }
        
        return { inicio, fim };
    }

    atualizarKPIs(agendamentos, inicio, fim) {
        const total = agendamentos.length;
        const confirmados = agendamentos.filter(ag => ag.status === 'confirmado' || ag.status === 'entregue').length;
        const entregues = agendamentos.filter(ag => ag.status === 'entregue').length;
        const naoVeio = agendamentos.filter(ag => ag.status === 'nao-veio').length;
        const pendentes = agendamentos.filter(ag => ag.status === 'pendente').length;
        const cancelados = agendamentos.filter(ag => ag.status === 'cancelado').length;
        
        // Total com animação
        document.getElementById('kpi-total').textContent = total.toLocaleString('pt-BR');
        
        // Taxa de confirmação (SLA)
        const taxaConfirmacao = total > 0 ? (confirmados / total * 100).toFixed(1) : 0;
        document.getElementById('kpi-confirmacao').textContent = `${taxaConfirmacao}%`;
        document.getElementById('kpi-confirmacao-qtd').textContent = `${confirmados} confirmados de ${total}`;
        
        // Taxa de entrega (efetividade)
        const taxaEntrega = total > 0 ? (entregues / total * 100).toFixed(1) : 0;
        document.getElementById('kpi-entrega').textContent = `${taxaEntrega}%`;
        document.getElementById('kpi-entrega-qtd').textContent = `${entregues} entregues de ${total}`;
        
        // Taxa de não comparecimento (problema crítico)
        const taxaNaoVeio = total > 0 ? (naoVeio / total * 100).toFixed(1) : 0;
        document.getElementById('kpi-nao-veio').textContent = `${taxaNaoVeio}%`;
        document.getElementById('kpi-nao-veio-qtd').textContent = `${naoVeio} não vieram`;
        
        // Tempo médio de confirmação (SLA operacional)
        const temposConfirmacao = agendamentos
            .filter(ag => ag.status === 'confirmado' || ag.status === 'entregue')
            .filter(ag => ag.historicoAcoes && ag.historicoAcoes.length > 0 && ag.createdAt)
            .map(ag => {
                const criado = new Date(ag.createdAt);
                // Buscar data da ação de confirmação no histórico
                const confirmacaoAcao = ag.historicoAcoes.find(h => h.acao === 'confirmado');
                if (!confirmacaoAcao) return null;
                const confirmado = new Date(confirmacaoAcao.createdAt);
                return (confirmado - criado) / (1000 * 60 * 60); // horas
            })
            .filter(tempo => tempo !== null); // Remove valores nulos
        
        const tempoMedio = temposConfirmacao.length > 0 
            ? (temposConfirmacao.reduce((a, b) => a + b, 0) / temposConfirmacao.length).toFixed(1)
            : 0;
        document.getElementById('kpi-tempo-confirmacao').textContent = `${tempoMedio}h`;
        
        // Volume total de NFs (throughput real)
        const volumeNFs = agendamentos.reduce((sum, ag) => {
            return sum + (ag.notasFiscais?.length || 0);
        }, 0);
        document.getElementById('kpi-volume-nfs').textContent = volumeNFs.toLocaleString('pt-BR');

        // Total de Volumes
        const totalVolumes = agendamentos.reduce((sum, ag) => {
            const qtd = parseInt(ag.quantidadeVolumes) || 0;
            return sum + qtd;
        }, 0);
        document.getElementById('kpi-volumes').textContent = totalVolumes.toLocaleString('pt-BR');
        
        // Tipos de volumes mais comuns
        const tiposVolumes = {};
        agendamentos.forEach(ag => {
            if (ag.tipoVolume) {
                tiposVolumes[ag.tipoVolume] = (tiposVolumes[ag.tipoVolume] || 0) + (parseInt(ag.quantidadeVolumes) || 0);
            }
        });
        const tipoMaisComum = Object.entries(tiposVolumes).sort((a, b) => b[1] - a[1])[0];
        const tipoTexto = tipoMaisComum ? `${tipoMaisComum[0]} (${tipoMaisComum[1]})` : 'N/A';
        document.getElementById('kpi-volumes-sub').textContent = tipoTexto;
        
        // CD mais ativo (hotspot operacional)
        const cdCounts = {};
        agendamentos.forEach(ag => {
            const cdNome = this.cds.find(cd => cd.id === ag.cdId)?.nome || 'Desconhecido';
            cdCounts[cdNome] = (cdCounts[cdNome] || 0) + 1;
        });
        
        const cdTop = Object.entries(cdCounts).sort((a, b) => b[1] - a[1])[0];
        if (cdTop) {
            document.getElementById('kpi-cd-top').textContent = cdTop[0];
            document.getElementById('kpi-cd-top-qtd').textContent = `${cdTop[1]} agendamentos (${((cdTop[1]/total)*100).toFixed(0)}%)`;
        } else {
            document.getElementById('kpi-cd-top').textContent = '-';
            document.getElementById('kpi-cd-top-qtd').textContent = '0 agendamentos';
        }
        
        // NOVOS KPIs EXECUTIVOS
        // Taxa de assertividade (confirmados que foram entregues)
        const taxaAssertividade = confirmados > 0 ? (entregues / confirmados * 100).toFixed(1) : 0;
        if (document.getElementById('kpi-assertividade')) {
            document.getElementById('kpi-assertividade').textContent = `${taxaAssertividade}%`;
            document.getElementById('kpi-assertividade-qtd').textContent = `${entregues} de ${confirmados} confirmados`;
        }
        
        // Índice de cancelamento
        const taxaCancelamento = total > 0 ? (cancelados / total * 100).toFixed(1) : 0;
        if (document.getElementById('kpi-cancelamento')) {
            document.getElementById('kpi-cancelamento').textContent = `${taxaCancelamento}%`;
            document.getElementById('kpi-cancelamento-qtd').textContent = `${cancelados} cancelados`;
        }
        
        // Agendamentos pendentes (urgência)
        if (document.getElementById('kpi-pendentes')) {
            document.getElementById('kpi-pendentes').textContent = pendentes;
            document.getElementById('kpi-pendentes-qtd').textContent = `Aguardando confirmação`;
        }
        
        // Volume total de NFs
        const totalNFs = agendamentos.reduce((sum, ag) => {
            return sum + (ag.notasFiscais?.length || 0);
        }, 0);
        if (document.getElementById('kpi-total-nfs')) {
            document.getElementById('kpi-total-nfs').textContent = totalNFs.toLocaleString('pt-BR');
            document.getElementById('kpi-total-nfs-qtd').textContent = `Notas fiscais processadas`;
        }
    }

    atualizarGraficos(agendamentos) {
        // Destruir gráficos antigos
        Object.values(this.charts).forEach(chart => chart.destroy());
        this.charts = {};
        
        // Gráfico de Status (Pizza)
        const statusCounts = {
            'pendente': 0,
            'confirmado': 0,
            'entregue': 0,
            'cancelado': 0,
            'nao-veio': 0
        };
        agendamentos.forEach(ag => {
            statusCounts[ag.status] = (statusCounts[ag.status] || 0) + 1;
        });
        
        const ctxStatus = document.getElementById('chart-status').getContext('2d');
        this.charts.status = new Chart(ctxStatus, {
            type: 'doughnut',
            data: {
                labels: ['Pendente', 'Confirmado', 'Entregue', 'Cancelado', 'Não Veio'],
                datasets: [{
                    data: [
                        statusCounts.pendente,
                        statusCounts.confirmado,
                        statusCounts.entregue,
                        statusCounts.cancelado,
                        statusCounts['nao-veio']
                    ],
                    backgroundColor: [
                        '#FCD34D',
                        '#60A5FA',
                        '#34D399',
                        '#F87171',
                        '#FB923C'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
        
        // Gráfico de CDs (Barras)
        const cdCounts = {};
        agendamentos.forEach(ag => {
            const cdNome = this.cds.find(cd => cd.id === ag.cdId)?.nome || 'Desconhecido';
            cdCounts[cdNome] = (cdCounts[cdNome] || 0) + 1;
        });
        
        const cdEntries = Object.entries(cdCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
        
        const ctxCd = document.getElementById('chart-cd').getContext('2d');
        this.charts.cd = new Chart(ctxCd, {
            type: 'bar',
            data: {
                labels: cdEntries.map(e => e[0]),
                datasets: [{
                    label: 'Agendamentos',
                    data: cdEntries.map(e => e[1]),
                    backgroundColor: '#FF6B35'
                }]
            },
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
                            stepSize: 1
                        }
                    }
                }
            }
        });
        
        // Gráfico de Timeline (Linha)
        const timelineCounts = {};
        agendamentos.forEach(ag => {
            const data = new Date(ag.dataEntrega).toLocaleDateString('pt-BR');
            timelineCounts[data] = (timelineCounts[data] || 0) + 1;
        });
        
        const timelineEntries = Object.entries(timelineCounts).sort((a, b) => {
            const [diaA, mesA, anoA] = a[0].split('/');
            const [diaB, mesB, anoB] = b[0].split('/');
            return new Date(anoA, mesA - 1, diaA) - new Date(anoB, mesB - 1, diaB);
        });
        
        const ctxTimeline = document.getElementById('chart-timeline').getContext('2d');
        this.charts.timeline = new Chart(ctxTimeline, {
            type: 'line',
            data: {
                labels: timelineEntries.map(e => e[0]),
                datasets: [{
                    label: 'Agendamentos',
                    data: timelineEntries.map(e => e[1]),
                    borderColor: '#FF6B35',
                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
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
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    atualizarTabelaFornecedores(agendamentos) {
        const fornecedorStats = {};
        
        agendamentos.forEach(ag => {
            // Busca fornecedor no campo correto (fornecedor é objeto ou string)
            const fornNome = ag.fornecedor?.nome || ag.fornecedor || ag.nomeFornecedor || 'Não informado';
            if (!fornecedorStats[fornNome]) {
                fornecedorStats[fornNome] = {
                    total: 0,
                    confirmados: 0,
                    entregues: 0
                };
            }
            fornecedorStats[fornNome].total++;
            if (ag.status === 'confirmado' || ag.status === 'entregue') {
                fornecedorStats[fornNome].confirmados++;
            }
            if (ag.status === 'entregue') {
                fornecedorStats[fornNome].entregues++;
            }
        });
        
        const topFornecedores = Object.entries(fornecedorStats)
            .map(([nome, stats]) => ({
                nome,
                ...stats,
                taxaSucesso: stats.total > 0 ? (stats.entregues / stats.total * 100).toFixed(1) : 0
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);
        
        const tbody = document.getElementById('table-fornecedores');
        
        if (topFornecedores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Nenhum fornecedor encontrado</td></tr>';
            return;
        }
        
        tbody.innerHTML = topFornecedores.map((forn, index) => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${index + 1}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${forn.nome}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${forn.total}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${forn.confirmados}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${forn.entregues}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        forn.taxaSucesso >= 80 ? 'bg-green-100 text-green-800' :
                        forn.taxaSucesso >= 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }">
                        ${forn.taxaSucesso}%
                    </span>
                </td>
            </tr>
        `).join('');
    }

    atualizarFiltrosAtivos() {
        const container = document.getElementById('filtros-ativos');
        const badges = [];
        
        // Período
        const periodoText = {
            'hoje': 'Hoje',
            '7dias': 'Últimos 7 dias',
            '30dias': 'Últimos 30 dias',
            'mes': 'Este mês',
            'mesAnterior': 'Mês anterior',
            'personalizado': `${this.filtros.dataInicio || '?'} até ${this.filtros.dataFim || '?'}`
        };
        badges.push(`<span class="filter-badge"><i class="fas fa-calendar"></i> ${periodoText[this.filtros.periodo]}</span>`);
        
        // CDs
        if (!this.filtros.cds.includes('todos')) {
            const cdNomes = this.filtros.cds.map(id => 
                this.cds.find(cd => cd.id === parseInt(id))?.nome || id
            ).join(', ');
            badges.push(`<span class="filter-badge"><i class="fas fa-warehouse"></i> ${cdNomes}</span>`);
        }
        
        // Status
        if (!this.filtros.status.includes('todos')) {
            const statusText = this.filtros.status.join(', ');
            badges.push(`<span class="filter-badge"><i class="fas fa-tag"></i> ${statusText}</span>`);
        }
        
        container.innerHTML = badges.join('');
    }

    gerarLinkPublico() {
        // Resetar estado
        document.getElementById('link-gerado-container').classList.add('hidden');
        document.getElementById('link-nome').value = '';
        document.getElementById('link-descricao').value = '';
        document.getElementById('link-validade').value = '720';
        this.linkGerado = null;
        
        // Resumo dos filtros
        const periodoText = {
            'hoje': 'Hoje',
            '7dias': 'Últimos 7 dias',
            '30dias': 'Últimos 30 dias',
            'mes': 'Este mês',
            'mesAnterior': 'Mês anterior',
            'personalizado': `${this.filtros.dataInicio || '?'} até ${this.filtros.dataFim || '?'}`
        };
        
        let resumo = `📅 Período: ${periodoText[this.filtros.periodo]}<br>`;
        
        if (!this.filtros.cds.includes('todos')) {
            const cdNomes = this.filtros.cds.map(id => 
                this.cds.find(cd => cd.id === parseInt(id))?.nome || id
            ).join(', ');
            resumo += `🏭 CDs: ${cdNomes}<br>`;
        } else {
            resumo += `🏭 CDs: Todos<br>`;
        }
        
        if (!this.filtros.status.includes('todos')) {
            resumo += `📊 Status: ${this.filtros.status.join(', ')}`;
        } else {
            resumo += `📊 Status: Todos`;
        }
        
        document.getElementById('link-filtros-resumo').innerHTML = resumo;
        
        // Abrir modal
        document.getElementById('modal-link-publico').classList.remove('hidden');
    }

    async confirmarGerarLink() {
        const nome = document.getElementById('link-nome').value.trim();
        const descricao = document.getElementById('link-descricao').value.trim();
        const validadeHoras = parseInt(document.getElementById('link-validade').value);
        
        if (!nome) {
            alert('Por favor, informe um nome para o relatório.');
            return;
        }
        
        this.mostrarLoading(true);
        
        try {
            const payload = {
                nome,
                descricao,
                filtros: this.filtros,
                validadeHoras
            };
            
            console.log('🔍 [Debug] Gerando link com payload:', payload);
            
            const response = await apiRequest('/api/relatorios-publicos', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            
            console.log('✅ [Debug] Link gerado com sucesso:', response);
            
            this.linkGerado = `${window.location.origin}/relatorio-publico.html?token=${response.token}`;
            document.getElementById('link-gerado-url').textContent = this.linkGerado;
            document.getElementById('link-gerado-container').classList.remove('hidden');
            
        } catch (error) {
            console.error('Erro ao gerar link:', error);
            alert('Erro ao gerar link público. Tente novamente.');
        } finally {
            this.mostrarLoading(false);
        }
    }

    copiarLink() {
        if (!this.linkGerado) return;
        
        navigator.clipboard.writeText(this.linkGerado).then(() => {
            alert('✅ Link copiado para a área de transferência!');
        }).catch(err => {
            console.error('Erro ao copiar:', err);
            alert('Erro ao copiar link. Copie manualmente.');
        });
    }

    abrirLinkNovo() {
        if (!this.linkGerado) return;
        window.open(this.linkGerado, '_blank');
    }

    fecharModalLink() {
        document.getElementById('modal-link-publico').classList.add('hidden');
    }

    abrirModalLinks() {
        document.getElementById('modal-links-gerados').classList.remove('hidden');
        this.carregarLinksGerados();
    }

    fecharModalLinks() {
        document.getElementById('modal-links-gerados').classList.add('hidden');
    }

    async carregarLinksGerados() {
        const container = document.getElementById('links-gerados-lista');
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-spinner fa-spin text-3xl mb-2"></i>
                <p>Carregando links...</p>
            </div>
        `;

        try {
            const links = await apiRequest('/api/relatorios-publicos');
            
            if (links.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-inbox text-5xl mb-3"></i>
                        <p class="text-lg">Nenhum link público gerado ainda</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = links.map(link => {
                const urlCompleta = `${window.location.origin}/relatorio-publico.html?token=${link.token}`;
                const criadoEm = new Date(link.createdAt).toLocaleString('pt-BR');
                const atualizadoEm = new Date(link.updatedAt).toLocaleString('pt-BR');
                
                let expiraTexto = 'Sem expiração';
                let expiraCor = 'text-green-600';
                
                if (link.expiraEm) {
                    const expiraEm = new Date(link.expiraEm);
                    const agora = new Date();
                    const diasRestantes = Math.ceil((expiraEm - agora) / (1000 * 60 * 60 * 24));
                    
                    expiraTexto = expiraEm.toLocaleString('pt-BR');
                    
                    if (diasRestantes <= 0) {
                        expiraCor = 'text-red-600 font-bold';
                        expiraTexto += ' (EXPIRADO)';
                    } else if (diasRestantes <= 7) {
                        expiraCor = 'text-orange-600 font-semibold';
                        expiraTexto += ` (${diasRestantes} dias)`;
                    } else {
                        expiraCor = 'text-green-600';
                        expiraTexto += ` (${diasRestantes} dias)`;
                    }
                }

                const statusBadge = link.ativo 
                    ? '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Ativo</span>'
                    : '<span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Inativo</span>';

                return `
                    <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <h3 class="font-bold text-lg text-gray-900">${link.nome}</h3>
                                ${link.descricao ? `<p class="text-sm text-gray-600 mt-1">${link.descricao}</p>` : ''}
                            </div>
                            ${statusBadge}
                        </div>
                        
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                            <div>
                                <p class="text-gray-500">Criado em</p>
                                <p class="font-semibold">${criadoEm}</p>
                            </div>
                            <div>
                                <p class="text-gray-500">Atualizado em</p>
                                <p class="font-semibold">${atualizadoEm}</p>
                            </div>
                            <div>
                                <p class="text-gray-500">Expira em</p>
                                <p class="font-semibold ${expiraCor}">${expiraTexto}</p>
                            </div>
                            <div>
                                <p class="text-gray-500">Acessos</p>
                                <p class="font-semibold">${link.acessos}</p>
                            </div>
                        </div>

                        <div class="bg-gray-50 rounded p-2 mb-3">
                            <p class="text-xs text-gray-600 break-all">${urlCompleta}</p>
                        </div>

                        <div class="flex gap-2">
                            <button onclick="dashboardGestao.copiarLinkEspecifico('${urlCompleta}')" 
                                    class="flex-1 bg-orange-primary hover:bg-orange-secondary text-white px-3 py-2 rounded text-sm transition">
                                <i class="fas fa-copy mr-1"></i>Copiar
                            </button>
                            <button onclick="window.open('${urlCompleta}', '_blank')" 
                                    class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition">
                                <i class="fas fa-external-link-alt mr-1"></i>Abrir
                            </button>
                            <button onclick="dashboardGestao.confirmarExcluirLink(${link.id}, '${link.nome}')" 
                                    class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm transition">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Erro ao carregar links:', error);
            container.innerHTML = `
                <div class="text-center py-8 text-red-600">
                    <i class="fas fa-exclamation-triangle text-5xl mb-3"></i>
                    <p class="text-lg">Erro ao carregar links</p>
                </div>
            `;
        }
    }

    copiarLinkEspecifico(url) {
        navigator.clipboard.writeText(url).then(() => {
            alert('✅ Link copiado para a área de transferência!');
        }).catch(err => {
            console.error('Erro ao copiar:', err);
            alert('Erro ao copiar link. Copie manualmente.');
        });
    }

    async confirmarExcluirLink(id, nome) {
        if (!confirm(`Tem certeza que deseja excluir o link "${nome}"?\n\nEsta ação não pode ser desfeita.`)) {
            return;
        }

        try {
            await apiRequest(`/api/relatorios-publicos/${id}`, {
                method: 'DELETE'
            });
            
            alert('✅ Link excluído com sucesso!');
            await this.carregarLinksGerados();
            
        } catch (error) {
            console.error('Erro ao excluir link:', error);
            alert('❌ Erro ao excluir link. Tente novamente.');
        }
    }

    async atualizarDados() {
        await this.carregarDados();
        await this.aplicarFiltros();
    }

    mostrarLoading(mostrar) {
        const overlay = document.getElementById('loading-overlay');
        if (mostrar) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

// Inicializar quando a página carregar
let dashboardGestao;
document.addEventListener('DOMContentLoaded', () => {
    dashboardGestao = new DashboardGestao();
});
