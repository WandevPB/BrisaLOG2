// Dashboard Admin - Gestão de Usuários e Relatórios
class DashboardAdmin {
    constructor() {
        this.usuarios = [];
        this.cds = [];
        this.currentTab = 'visao-geral';
        this.usuarioEditando = null;
        this.init();
    }

    async init() {
        try {
            await this.loadCDs();
            await this.loadUsuarios();
            this.setupEventListeners();
            
            // Inicializar dashboard consultivo na aba Visão Geral
            if (typeof DashboardConsultivo !== 'undefined') {
                window.dashboardConsultivo = new DashboardConsultivo();
                await window.dashboardConsultivo.init();
            }
        } catch (error) {
            console.error('Erro ao inicializar dashboard admin:', error);
            this.showNotification('Erro ao carregar dados', 'error');
        }
    }

    setupEventListeners() {
        // Filtros de usuários
        document.getElementById('filtro-usuario-busca')?.addEventListener('input', () => this.filtrarUsuarios());
        document.getElementById('filtro-usuario-cd')?.addEventListener('change', () => this.filtrarUsuarios());
        document.getElementById('filtro-usuario-status')?.addEventListener('change', () => this.filtrarUsuarios());

        // Filtros de perfis
        document.getElementById('filtro-perfil-busca')?.addEventListener('input', () => this.filtrarPerfis());
        document.getElementById('filtro-perfil-tipo')?.addEventListener('change', () => this.filtrarPerfis());
        document.getElementById('filtro-perfil-status')?.addEventListener('change', () => this.filtrarPerfis());

        // Form de usuário
        document.getElementById('form-usuario')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarUsuario();
        });

        // Verificar se é wanderson para mostrar aba de perfis
        const userData = JSON.parse(sessionStorage.getItem('cdData') || '{}');
        if (userData.usuario === 'wanderson') {
            const tabPerfis = document.getElementById('tab-perfis');
            if (tabPerfis) {
                tabPerfis.style.display = 'block';
            }
        }

        // Definir datas padrão para produtividade (último mês)
        const hoje = new Date();
        const umMesAtras = new Date();
        umMesAtras.setMonth(umMesAtras.getMonth() - 1);
        
        const dataFim = document.getElementById('prod-data-fim');
        const dataInicio = document.getElementById('prod-data-inicio');
        
        if (dataFim) dataFim.valueAsDate = hoje;
        if (dataInicio) dataInicio.valueAsDate = umMesAtras;
    }

    switchTab(tabName) {
        // Atualizar botões
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.closest('.tab-button').classList.add('active');

        // Atualizar conteúdo
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`tab-${tabName}`).classList.add('active');

        this.currentTab = tabName;

        // Carregar dados específicos da tab
        if (tabName === 'usuarios') {
            this.renderUsuarios();
        } else if (tabName === 'perfis') {
            if (!this.perfis) {
                this.loadPerfis();
            } else {
                this.renderPerfis();
            }
        } else if (tabName === 'produtividade') {
            this.gerarRelatorioProdutividade();
        }
    }

    async loadCDs() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/cds`, {
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Erro ao carregar CDs');

            this.cds = await response.json();
            this.popularSelectCDs();
        } catch (error) {
            console.error('Erro ao carregar CDs:', error);
            throw error;
        }
    }

    popularSelectCDs() {
        const selectUsuarioCD = document.getElementById('usuario-cd');
        const selectFiltroCD = document.getElementById('filtro-usuario-cd');

        if (selectUsuarioCD) {
            selectUsuarioCD.innerHTML = '<option value="">Selecione um CD</option>';
            
            // Opção especial: Todos os CDs
            const optionTodos = document.createElement('option');
            optionTodos.value = 'TODOS';
            optionTodos.textContent = '🌐 Todos os CDs';
            optionTodos.style.fontWeight = 'bold';
            optionTodos.style.color = '#FF6B35';
            selectUsuarioCD.appendChild(optionTodos);
            
            // Adicionar CDs individuais (já filtrados pelo backend)
            this.cds.forEach(cd => {
                const option = document.createElement('option');
                option.value = cd.id;
                option.textContent = cd.nome;
                selectUsuarioCD.appendChild(option);
            });
            
            console.log('📋 CDs carregados no select:', this.cds.length, this.cds);
        }

        if (selectFiltroCD) {
            selectFiltroCD.innerHTML = '<option value="">Todos os CDs</option>';
            this.cds.forEach(cd => {
                const option = document.createElement('option');
                option.value = cd.id;
                option.textContent = cd.nome;
                selectFiltroCD.appendChild(option);
            });
        }
    }

    async loadUsuarios() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/usuarios`, {
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Erro ao carregar usuários');

            this.usuarios = await response.json();
            this.renderUsuarios();
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            this.showNotification('Erro ao carregar usuários', 'error');
        }
    }

    filtrarUsuarios() {
        const busca = document.getElementById('filtro-usuario-busca').value.toLowerCase();
        const cdId = document.getElementById('filtro-usuario-cd').value;
        const status = document.getElementById('filtro-usuario-status').value;

        const usuariosFiltrados = this.usuarios.filter(usuario => {
            const matchBusca = !busca || 
                usuario.nome.toLowerCase().includes(busca) || 
                usuario.codigo.toLowerCase().includes(busca);
            
            // Se o usuário tem acesso a TODOS os CDs, sempre corresponde ao filtro
            const matchCD = !cdId || usuario.cdId === 'TODOS' || usuario.cdIdNumerico === parseInt(cdId);
            
            const matchStatus = !status || usuario.ativo.toString() === status;

            return matchBusca && matchCD && matchStatus;
        });

        this.renderUsuarios(usuariosFiltrados);
    }

    renderUsuarios(usuarios = this.usuarios) {
        const tbody = document.getElementById('usuarios-table-body');
        if (!tbody) return;

        if (usuarios.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                        <i class="fas fa-users text-4xl mb-2"></i>
                        <p>Nenhum usuário encontrado</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = usuarios.map(usuario => `
            <tr class="border-b hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4">
                    <span class="font-mono font-semibold text-orange-primary">${usuario.codigo}</span>
                </td>
                <td class="px-6 py-4">
                    <div class="font-semibold text-gray-900">${usuario.nome}</div>
                </td>
                <td class="px-6 py-4">
                    <span class="text-gray-700">${usuario.cargo || '-'}</span>
                </td>
                <td class="px-6 py-4">
                    ${usuario.cdId === 'TODOS' 
                        ? '<span class="badge-cd" style="background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; font-weight: bold;">🌐 Todos os CDs</span>'
                        : `<span class="badge-cd">${usuario.cd?.nome || 'N/A'}</span>`
                    }
                </td>
                <td class="px-6 py-4">
                    <span class="text-gray-700">${usuario.email || '-'}</span>
                </td>
                <td class="px-6 py-4 text-center">
                    ${usuario.ativo 
                        ? '<span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Ativo</span>'
                        : '<span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Inativo</span>'
                    }
                </td>
                <td class="px-6 py-4 text-center">
                    <button onclick="dashboardAdmin.editarUsuario(${usuario.id})" class="text-blue-600 hover:text-blue-800 mx-1" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${usuario.ativo 
                        ? `<button onclick="dashboardAdmin.toggleStatusUsuario(${usuario.id}, false)" class="text-yellow-600 hover:text-yellow-800 mx-1" title="Desativar">
                            <i class="fas fa-ban"></i>
                           </button>`
                        : `<button onclick="dashboardAdmin.toggleStatusUsuario(${usuario.id}, true)" class="text-green-600 hover:text-green-800 mx-1" title="Ativar">
                            <i class="fas fa-check-circle"></i>
                           </button>`
                    }
                    <button onclick="dashboardAdmin.excluirUsuario(${usuario.id})" class="text-red-600 hover:text-red-800 mx-1" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    abrirModalNovoUsuario() {
        this.usuarioEditando = null;
        document.getElementById('modal-usuario-title').textContent = 'Novo Usuário';
        document.getElementById('form-usuario').reset();
        document.getElementById('usuario-id').value = '';
        document.getElementById('usuario-codigo').value = '';
        document.getElementById('usuario-ativo').checked = true;
        document.getElementById('modal-usuario').classList.remove('hidden');
    }

    async editarUsuario(id) {
        const usuario = this.usuarios.find(u => u.id === id);
        if (!usuario) return;

        this.usuarioEditando = usuario;
        document.getElementById('modal-usuario-title').textContent = 'Editar Usuário';
        document.getElementById('usuario-id').value = usuario.id;
        document.getElementById('usuario-nome').value = usuario.nome;
        document.getElementById('usuario-codigo').value = usuario.codigo;
        document.getElementById('usuario-email').value = usuario.email || '';
        document.getElementById('usuario-cargo').value = usuario.cargo || '';
        document.getElementById('usuario-cd').value = usuario.cdId || '';
        document.getElementById('usuario-ativo').checked = usuario.ativo;
        
        document.getElementById('modal-usuario').classList.remove('hidden');
    }

    fecharModalUsuario() {
        document.getElementById('modal-usuario').classList.add('hidden');
        this.usuarioEditando = null;
    }

    async cdSelecionado() {
        const cdId = document.getElementById('usuario-cd').value;
        const codigoInput = document.getElementById('usuario-codigo');
        
        if (cdId && !this.usuarioEditando) {
            await this.gerarCodigo();
        }
    }

    async gerarCodigo() {
        const cdId = document.getElementById('usuario-cd').value;
        if (!cdId) {
            this.showNotification('Selecione um CD primeiro', 'warning');
            return;
        }

        try {
            // Se for 'TODOS', usar ID 0 como referência para gerar código genérico
            const idParaGerar = cdId === 'TODOS' ? 0 : cdId;
            const response = await fetch(`${API_BASE_URL}/api/usuarios/gerar-codigo/${idParaGerar}`);
            if (!response.ok) throw new Error('Erro ao gerar código');

            const data = await response.json();
            document.getElementById('usuario-codigo').value = data.codigo;
        } catch (error) {
            console.error('Erro ao gerar código:', error);
            this.showNotification('Erro ao gerar código', 'error');
        }
    }

    async salvarUsuario() {
        const id = document.getElementById('usuario-id').value;
        const nome = document.getElementById('usuario-nome').value.trim();
        const codigo = document.getElementById('usuario-codigo').value.trim();
        const email = document.getElementById('usuario-email').value.trim();
        const cargo = document.getElementById('usuario-cargo').value.trim();
        const cdId = document.getElementById('usuario-cd').value;
        const ativo = document.getElementById('usuario-ativo').checked;

        if (!nome || !codigo || !cdId) {
            this.showNotification('Preencha todos os campos obrigatórios', 'warning');
            return;
        }

        try {
            const url = id 
                ? `${API_BASE_URL}/api/usuarios/${id}`
                : `${API_BASE_URL}/api/usuarios`;
            
            const method = id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    nome,
                    codigo,
                    email: email || null,
                    cargo: cargo || null,
                    cdId: cdId === 'TODOS' ? 'TODOS' : parseInt(cdId),
                    ativo
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao salvar usuário');
            }

            this.showNotification(`Usuário ${id ? 'atualizado' : 'criado'} com sucesso!`, 'success');
            this.fecharModalUsuario();
            await this.loadUsuarios();

        } catch (error) {
            console.error('Erro ao salvar usuário:', error);
            this.showNotification(error.message, 'error');
        }
    }

    async toggleStatusUsuario(id, novoStatus) {
        const acao = novoStatus ? 'ativar' : 'desativar';
        if (!confirm(`Deseja realmente ${acao} este usuário?`)) return;

        try {
            const usuario = this.usuarios.find(u => u.id === id);
            
            const response = await fetch(`${API_BASE_URL}/api/usuarios/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    nome: usuario.nome,
                    email: usuario.email,
                    cargo: usuario.cargo,
                    cdId: usuario.cdId,
                    ativo: novoStatus
                })
            });

            if (!response.ok) throw new Error(`Erro ao ${acao} usuário`);

            this.showNotification(`Usuário ${acao === 'ativar' ? 'ativado' : 'desativado'} com sucesso!`, 'success');
            await this.loadUsuarios();

        } catch (error) {
            console.error(`Erro ao ${acao} usuário:`, error);
            this.showNotification(error.message, 'error');
        }
    }

    async excluirUsuario(id) {
        const usuario = this.usuarios.find(u => u.id === id);
        if (!usuario) return;

        const confirmacao = confirm(
            `⚠️ ATENÇÃO!\n\nDeseja realmente EXCLUIR o usuário?\n\n` +
            `Nome: ${usuario.nome}\n` +
            `Código: ${usuario.codigo}\n` +
            `CD: ${usuario.cd?.nome || 'N/A'}\n\n` +
            `Esta ação NÃO pode ser desfeita!`
        );

        if (!confirmacao) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/usuarios/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao excluir usuário');
            }

            this.showNotification('Usuário excluído com sucesso!', 'success');
            
            // Remover usuário da lista local imediatamente
            this.usuarios = this.usuarios.filter(u => u.id !== id);
            this.renderUsuarios();
            
            // Recarregar lista do servidor
            await this.loadUsuarios();

        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            this.showNotification(error.message, 'error');
        }
    }

    async gerarRelatorioProdutividade() {
        const dataInicio = document.getElementById('prod-data-inicio').value;
        const dataFim = document.getElementById('prod-data-fim').value;

        if (!dataInicio || !dataFim) {
            this.showNotification('Selecione o período', 'warning');
            return;
        }

        try {
            // Buscar histórico de ações do período
            const response = await fetch(`${API_BASE_URL}/api/agendamentos/todos`, {
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Erro ao carregar dados');

            const result = await response.json();
            
            // Garantir que temos um array
            const agendamentos = Array.isArray(result) ? result : (result.data || []);
            
            console.log('Agendamentos recebidos:', agendamentos);
            
            // Filtrar ações do período e agrupar por usuário
            const produtividadePorUsuario = {};

            agendamentos.forEach(agendamento => {
                if (agendamento.historicoAcoes) {
                    agendamento.historicoAcoes.forEach(acao => {
                        const dataAcao = new Date(acao.createdAt);
                        if (dataAcao >= new Date(dataInicio) && dataAcao <= new Date(dataFim)) {
                            if (acao.codigoUsuario) {
                                if (!produtividadePorUsuario[acao.codigoUsuario]) {
                                    produtividadePorUsuario[acao.codigoUsuario] = {
                                        codigo: acao.codigoUsuario,
                                        nome: acao.autor || 'Não identificado',
                                        totalAcoes: 0,
                                        porTipo: {}
                                    };
                                }
                                produtividadePorUsuario[acao.codigoUsuario].totalAcoes++;
                                produtividadePorUsuario[acao.codigoUsuario].porTipo[acao.acao] = 
                                    (produtividadePorUsuario[acao.codigoUsuario].porTipo[acao.acao] || 0) + 1;
                            }
                        }
                    });
                }
            });

            this.renderProdutividade(Object.values(produtividadePorUsuario));

        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            this.showNotification('Erro ao gerar relatório', 'error');
        }
    }

    renderProdutividade(dados) {
        const container = document.getElementById('produtividade-container');
        if (!container) return;

        if (dados.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12 text-gray-500">
                    <i class="fas fa-chart-bar text-4xl mb-2"></i>
                    <p>Nenhuma ação registrada no período</p>
                </div>
            `;
            return;
        }

        // Ordenar por total de ações
        dados.sort((a, b) => b.totalAcoes - a.totalAcoes);

        container.innerHTML = dados.map((usuario, index) => `
            <div class="bg-white rounded-xl shadow-lg p-6 card-3d">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-3">
                        <div class="bg-orange-100 p-3 rounded-xl">
                            ${index === 0 ? '<i class="fas fa-trophy text-yellow-500 text-2xl"></i>' :
                              index === 1 ? '<i class="fas fa-medal text-gray-400 text-2xl"></i>' :
                              index === 2 ? '<i class="fas fa-medal text-orange-600 text-2xl"></i>' :
                              '<i class="fas fa-user text-orange-primary text-2xl"></i>'}
                        </div>
                        <div>
                            <h3 class="font-bold text-lg text-gray-900">${usuario.nome}</h3>
                            <p class="text-sm text-gray-600">${usuario.codigo}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-3xl font-bold text-orange-primary">${usuario.totalAcoes}</div>
                        <div class="text-xs text-gray-600">ações</div>
                    </div>
                </div>
                <div class="space-y-2">
                    ${Object.entries(usuario.porTipo).map(([tipo, qtd]) => `
                        <div class="flex justify-between items-center text-sm">
                            <span class="text-gray-700">${this.getAcaoLabel(tipo)}</span>
                            <span class="font-semibold text-gray-900">${qtd}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    getAcaoLabel(acao) {
        const labels = {
            'status_alterado': 'Status Alterado',
            'agendamento_criado': 'Criado',
            'confirmado': 'Confirmado',
            'entregue': 'Entregue',
            'nao-veio': 'Não Veio',
            'reagendamento': 'Reagendado',
            'cancelado': 'Cancelado'
        };
        return labels[acao] || acao;
    }

    async exportarRelatorioAgendamentos() {
        this.showNotification('Gerando relatório...', 'info');
        // Usar a função de exportar do dashboard consultivo
        if (typeof dashboardConsultivo !== 'undefined') {
            dashboardConsultivo.exportarDados();
        }
    }

    async exportarRelatorioUsuarios() {
        try {
            const dataInicio = document.getElementById('prod-data-inicio').value;
            const dataFim = document.getElementById('prod-data-fim').value;

            // CSV Header
            let csv = 'Código,Nome,CD,Total de Ações,Status Alterado,Confirmado,Entregue,Não Veio\n';

            // Gerar dados
            const response = await fetch(`${API_BASE_URL}/api/agendamentos/todos`, {
                headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
            });

            const agendamentos = await response.json();
            const produtividade = {};

            agendamentos.forEach(agendamento => {
                agendamento.historicoAcoes?.forEach(acao => {
                    if (acao.codigoUsuario) {
                        if (!produtividade[acao.codigoUsuario]) {
                            produtividade[acao.codigoUsuario] = {
                                codigo: acao.codigoUsuario,
                                nome: acao.autor || 'N/A',
                                cd: 'N/A',
                                total: 0,
                                status_alterado: 0,
                                confirmado: 0,
                                entregue: 0,
                                nao_veio: 0
                            };
                        }
                        produtividade[acao.codigoUsuario].total++;
                        if (produtividade[acao.codigoUsuario][acao.acao] !== undefined) {
                            produtividade[acao.codigoUsuario][acao.acao]++;
                        }
                    }
                });
            });

            Object.values(produtividade).forEach(user => {
                csv += `${user.codigo},${user.nome},${user.cd},${user.total},${user.status_alterado},${user.confirmado},${user.entregue},${user.nao_veio}\n`;
            });

            // Download
            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `relatorio_usuarios_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();

            this.showNotification('Relatório exportado com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao exportar:', error);
            this.showNotification('Erro ao exportar relatório', 'error');
        }
    }

    async excluirAgendamento(codigo) {
        try {
            // Buscar dados do agendamento primeiro pelo código
            const response = await fetch(`${API_BASE_URL}/api/agendamentos/consultar/${codigo}`, {
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Agendamento não encontrado');
            }

            const result = await response.json();
            const agendamento = result.data || result;

            const confirmacao1 = confirm(
                `⚠️ ATENÇÃO: Você está prestes a EXCLUIR PERMANENTEMENTE este agendamento do banco de dados!\n\n` +
                `Código: ${agendamento.codigo || 'N/A'}\n` +
                `Transportador: ${agendamento.fornecedor?.nome || agendamento.transportadorNome || 'N/A'}\n` +
                `Status: ${agendamento.status}\n\n` +
                `Esta ação é IRREVERSÍVEL e o registro será COMPLETAMENTE REMOVIDO.\n\n` +
                `Deseja continuar?`
            );
            
            if (!confirmacao1) {
                return;
            }

            const confirmacao2 = confirm(
                `🔴 ÚLTIMA CONFIRMAÇÃO!\n\n` +
                `Confirma a EXCLUSÃO PERMANENTE do agendamento ${agendamento.codigo}?\n\n` +
                `Não será possível recuperar este registro!`
            );
            
            if (!confirmacao2) {
                return;
            }

            // Solicitar código do usuário
            const codigoUsuario = prompt('Digite seu código de usuário para confirmar a exclusão:');
            
            if (!codigoUsuario || codigoUsuario.trim() === '') {
                this.showNotification('Código de usuário é obrigatório', 'warning');
                return;
            }

            // Verificar se é código GOD ou usuário cadastrado
            let nomeUsuario;
            const CODIGO_GOD = 'BrisaLOG2';
            
            if (codigoUsuario.trim() === CODIGO_GOD) {
                nomeUsuario = 'BrisaLOG2 (GOD)';
                console.log('🔐 Código GOD utilizado para exclusão');
            } else {
                // Buscar nome do usuário cadastrado
                const usuario = this.usuarios.find(u => u.codigo === codigoUsuario.trim());
                if (!usuario) {
                    this.showNotification('Usuário não encontrado. Verifique o código digitado.', 'error');
                    return;
                }
                nomeUsuario = usuario.nome;
            }

            const deleteResponse = await fetch(`${API_BASE_URL}/api/agendamentos/${codigo}/excluir`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    codigoUsuario: codigoUsuario.trim(),
                    nomeUsuario: nomeUsuario
                })
            });

            if (deleteResponse.ok) {
                this.showNotification(
                    `✅ Agendamento ${agendamento.codigo} excluído permanentemente por ${nomeUsuario}`, 
                    'success'
                );
                
                // Recarregar dados do dashboard consultivo
                if (typeof dashboardConsultivo !== 'undefined' && dashboardConsultivo.loadAgendamentos) {
                    await dashboardConsultivo.loadAgendamentos();
                } else {
                    // Se não tiver o método, forçar reload da página
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                }
            } else {
                const errorData = await deleteResponse.json().catch(() => ({}));
                throw new Error(errorData.error || 'Erro ao excluir agendamento');
            }
        } catch (error) {
            console.error('Erro ao excluir agendamento:', error);
            this.showNotification(`Erro ao excluir agendamento: ${error.message}`, 'error');
        }
    }

    showNotification(message, type = 'info') {
        if (typeof dashboardConsultivo !== 'undefined') {
            dashboardConsultivo.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    // ========== GERENCIAMENTO DE PERFIS ==========

    async loadPerfis() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/perfis`, {
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Erro ao carregar perfis');

            this.perfis = await response.json();
            this.renderPerfis();
        } catch (error) {
            console.error('Erro ao carregar perfis:', error);
            this.showNotification('Erro ao carregar perfis', 'error');
        }
    }

    renderPerfis(perfis = this.perfis) {
        const tbody = document.getElementById('perfis-table-body');
        if (!tbody) return;

        if (perfis.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                        <i class="fas fa-user-cog text-4xl mb-2"></i>
                        <p>Nenhum perfil encontrado</p>
                    </td>
                </tr>
            `;
            return;
        }

        const getTipoBadge = (tipo) => {
            const badges = {
                'cd': '<span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">CD</span>',
                'consultivo': '<span class="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">Consultivo</span>',
                'admin': '<span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Admin</span>'
            };
            return badges[tipo] || tipo;
        };

        tbody.innerHTML = perfis.map(perfil => `
            <tr class="border-b hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4">
                    <div class="font-semibold text-gray-900">${perfil.nome}</div>
                </td>
                <td class="px-6 py-4">
                    <span class="font-mono text-orange-primary">${perfil.usuario}</span>
                </td>
                <td class="px-6 py-4">
                    ${getTipoBadge(perfil.tipoPerfil)}
                </td>
                <td class="px-6 py-4">
                    <span class="text-gray-700">${perfil.emailRecuperacao || '-'}</span>
                </td>
                <td class="px-6 py-4 text-center">
                    ${perfil.ativo 
                        ? '<span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Ativo</span>'
                        : '<span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Inativo</span>'
                    }
                </td>
                <td class="px-6 py-4 text-center">
                    <button onclick="dashboardAdmin.editarPerfil(${perfil.id})" class="text-blue-600 hover:text-blue-800 mx-1" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${perfil.ativo 
                        ? `<button onclick="dashboardAdmin.toggleStatusPerfil(${perfil.id}, false)" class="text-yellow-600 hover:text-yellow-800 mx-1" title="Desativar">
                            <i class="fas fa-ban"></i>
                           </button>`
                        : `<button onclick="dashboardAdmin.toggleStatusPerfil(${perfil.id}, true)" class="text-green-600 hover:text-green-800 mx-1" title="Ativar">
                            <i class="fas fa-check-circle"></i>
                           </button>`
                    }
                    <button onclick="dashboardAdmin.resetarSenhaPerfil(${perfil.id})" class="text-purple-600 hover:text-purple-800 mx-1" title="Resetar Senha">
                        <i class="fas fa-key"></i>
                    </button>
                    ${perfil.usuario !== 'wanderson' 
                        ? `<button onclick="dashboardAdmin.excluirPerfil(${perfil.id})" class="text-red-600 hover:text-red-800 mx-1" title="Excluir">
                            <i class="fas fa-trash"></i>
                           </button>`
                        : '<span class="text-gray-400 mx-1" title="Perfil protegido"><i class="fas fa-shield-alt"></i></span>'
                    }
                </td>
            </tr>
        `).join('');
    }

    filtrarPerfis() {
        const busca = document.getElementById('filtro-perfil-busca')?.value.toLowerCase() || '';
        const tipo = document.getElementById('filtro-perfil-tipo')?.value || '';
        const status = document.getElementById('filtro-perfil-status')?.value || '';

        const perfisFiltrados = this.perfis.filter(perfil => {
            const matchBusca = !busca || 
                perfil.nome.toLowerCase().includes(busca) || 
                perfil.usuario.toLowerCase().includes(busca);
            
            const matchTipo = !tipo || perfil.tipoPerfil === tipo;
            const matchStatus = !status || perfil.ativo.toString() === status;

            return matchBusca && matchTipo && matchStatus;
        });

        this.renderPerfis(perfisFiltrados);
    }

    abrirModalNovoPerfil() {
        this.perfilEditando = null;
        document.getElementById('modal-perfil-title').textContent = 'Novo Perfil de Acesso';
        document.getElementById('form-perfil').reset();
        document.getElementById('perfil-id').value = '';
        document.getElementById('perfil-ativo').checked = true;
        this.perfilTipoAlterado(); // Resetar avisos
        document.getElementById('modal-perfil').classList.remove('hidden');
    }

    editarPerfil(id) {
        const perfil = this.perfis.find(p => p.id === id);
        if (!perfil) return;

        this.perfilEditando = perfil;
        document.getElementById('modal-perfil-title').textContent = 'Editar Perfil de Acesso';
        document.getElementById('perfil-id').value = perfil.id;
        document.getElementById('perfil-nome').value = perfil.nome;
        document.getElementById('perfil-usuario').value = perfil.usuario;
        document.getElementById('perfil-tipo').value = perfil.tipoPerfil;
        document.getElementById('perfil-email').value = perfil.emailRecuperacao || '';
        document.getElementById('perfil-ativo').checked = perfil.ativo;
        
        this.perfilTipoAlterado(); // Atualizar avisos
        document.getElementById('modal-perfil').classList.remove('hidden');
    }

    fecharModalPerfil() {
        document.getElementById('modal-perfil').classList.add('hidden');
        this.perfilEditando = null;
    }

    perfilTipoAlterado() {
        const tipo = document.getElementById('perfil-tipo').value;
        const emailInput = document.getElementById('perfil-email');
        const emailObrigatorio = document.getElementById('perfil-email-obrigatorio');
        const emailAviso = document.getElementById('perfil-email-aviso');
        const infoAdmin = document.getElementById('perfil-info-admin');
        const infoNormal = document.getElementById('perfil-info-normal');

        if (tipo === 'admin') {
            emailInput.required = true;
            emailObrigatorio.style.display = 'inline';
            emailAviso.textContent = 'Obrigatório - receberá email de boas-vindas';
            emailAviso.classList.add('text-orange-primary', 'font-semibold');
            infoAdmin.style.display = 'inline';
            infoNormal.style.display = 'none';
        } else {
            emailInput.required = false;
            emailObrigatorio.style.display = 'none';
            emailAviso.textContent = 'Opcional para CDs e Consultivos';
            emailAviso.classList.remove('text-orange-primary', 'font-semibold');
            infoAdmin.style.display = 'none';
            infoNormal.style.display = 'inline';
        }
    }

    async salvarPerfil(e) {
        e.preventDefault();

        const id = document.getElementById('perfil-id').value;
        const nome = document.getElementById('perfil-nome').value.trim();
        const usuario = document.getElementById('perfil-usuario').value.trim().toLowerCase();
        const tipoPerfil = document.getElementById('perfil-tipo').value;
        const email = document.getElementById('perfil-email').value.trim();
        const ativo = document.getElementById('perfil-ativo').checked;

        if (!nome || !usuario || !tipoPerfil) {
            this.showNotification('Preencha todos os campos obrigatórios', 'warning');
            return;
        }

        if (tipoPerfil === 'admin' && !email) {
            this.showNotification('Email é obrigatório para perfis de Admin', 'warning');
            return;
        }

        try {
            const url = id 
                ? `${API_BASE_URL}/api/perfis/${id}`
                : `${API_BASE_URL}/api/perfis`;
            
            const method = id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    nome,
                    usuario,
                    tipoPerfil,
                    email: email || null,
                    ativo
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao salvar perfil');
            }

            const mensagem = id 
                ? `Perfil "${nome}" atualizado com sucesso!`
                : `Perfil "${nome}" criado com sucesso! ${tipoPerfil === 'admin' && email ? 'Email de boas-vindas enviado.' : 'Senha padrão: Brisanet123'}`;

            this.showNotification(mensagem, 'success');
            this.fecharModalPerfil();
            await this.loadPerfis();

        } catch (error) {
            console.error('Erro ao salvar perfil:', error);
            this.showNotification(error.message, 'error');
        }
    }

    async toggleStatusPerfil(id, novoStatus) {
        const acao = novoStatus ? 'ativar' : 'desativar';
        if (!confirm(`Deseja realmente ${acao} este perfil?`)) return;

        try {
            const perfil = this.perfis.find(p => p.id === id);
            
            const response = await fetch(`${API_BASE_URL}/api/perfis/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    nome: perfil.nome,
                    usuario: perfil.usuario,
                    tipoPerfil: perfil.tipoPerfil,
                    email: perfil.emailRecuperacao,
                    ativo: novoStatus
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `Erro ao ${acao} perfil`);
            }

            this.showNotification(`Perfil ${acao} com sucesso!`, 'success');
            await this.loadPerfis();

        } catch (error) {
            console.error(`Erro ao ${acao} perfil:`, error);
            this.showNotification(error.message, 'error');
        }
    }

    async resetarSenhaPerfil(id) {
        if (!confirm('Deseja resetar a senha deste perfil para "Brisanet123"?\n\nO usuário precisará alterar no próximo login.')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/perfis/${id}/resetar-senha`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao resetar senha');
            }

            this.showNotification('Senha resetada para "Brisanet123" com sucesso!', 'success');
            await this.loadPerfis();

        } catch (error) {
            console.error('Erro ao resetar senha:', error);
            this.showNotification(error.message, 'error');
        }
    }

    async excluirPerfil(id) {
        const perfil = this.perfis.find(p => p.id === id);
        if (!perfil) return;

        if (!confirm(`Tem certeza que deseja EXCLUIR PERMANENTEMENTE o perfil "${perfil.nome}"?\n\nEsta ação não pode ser desfeita!`)) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/perfis/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao excluir perfil');
            }

            this.showNotification('Perfil excluído com sucesso!', 'success');
            await this.loadPerfis();

        } catch (error) {
            console.error('Erro ao excluir perfil:', error);
            this.showNotification(error.message, 'error');
        }
    }
}

// Instância global
let dashboardAdmin;

// Inicializar quando DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    dashboardAdmin = new DashboardAdmin();
});
