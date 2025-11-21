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

        // Form de usuário
        document.getElementById('form-usuario')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarUsuario();
        });

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
            this.cds.forEach(cd => {
                const option = document.createElement('option');
                option.value = cd.id;
                option.textContent = cd.nome;
                selectUsuarioCD.appendChild(option);
            });
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
            
            const matchCD = !cdId || usuario.cdId === parseInt(cdId);
            
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
                    <span class="badge-cd">${usuario.cd?.nome || 'N/A'}</span>
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
                        ? `<button onclick="dashboardAdmin.toggleStatusUsuario(${usuario.id}, false)" class="text-red-600 hover:text-red-800 mx-1" title="Desativar">
                            <i class="fas fa-ban"></i>
                           </button>`
                        : `<button onclick="dashboardAdmin.toggleStatusUsuario(${usuario.id}, true)" class="text-green-600 hover:text-green-800 mx-1" title="Ativar">
                            <i class="fas fa-check-circle"></i>
                           </button>`
                    }
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
            const response = await fetch(`${API_BASE_URL}/api/usuarios/gerar-codigo/${cdId}`);
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
                    cdId: parseInt(cdId),
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

    showNotification(message, type = 'info') {
        if (typeof dashboardConsultivo !== 'undefined') {
            dashboardConsultivo.showNotification(message, type);
        } else {
            alert(message);
        }
    }
}

// Instância global
let dashboardAdmin;

// Inicializar quando DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    dashboardAdmin = new DashboardAdmin();
});
