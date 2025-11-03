// Função para obter a URL base da API
function getApiBaseUrl() {
    return typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'https://brisalog-agenda.online';
}

// REMOVIDO as funções nextStep/previousStep seguras do topo
// para evitar duplicidade. Vamos usar apenas as do final.

// Agendamento.js - Sistema de Agendamento de Entregas
// Todos os métodos da classe AgendamentoForm devem estar dentro do bloco da classe

class AgendamentoForm {
    constructor() {
        this.currentStep = 1;
        this.maxSteps = 4;
        this.formData = {};
        this.pedidoCounter = 0;
        this.attachEventListeners();
        this.showStep(this.currentStep);
    }

    attachEventListeners() {
        // Navegação
        document.getElementById('next-btn')?.addEventListener('click', () => this.nextStep());
        document.getElementById('prev-btn')?.addEventListener('click', () => this.previousStep());

    // Botão Adicionar Pedido removido
    }

    validateStep(step) {
        let isValid = true;
        let formId = `form-step-${step}`;
        const inputs = document.querySelectorAll(`#${formId} [required]`);
        const stepContainer = document.getElementById(formId);

        inputs.forEach(input => {
            if (input.type === 'file') {
                // Para o template novo, arquivoNF pode estar fora do file-drop-zone
                const fileInput = input;
                let fileSelected = null;
                // Tenta encontrar o label customizado ou file-drop-zone
                if (fileInput.closest('.file-drop-zone')) {
                    fileSelected = fileInput.closest('.file-drop-zone')?.querySelector('.file-selected');
                    if (!fileSelected || fileSelected.classList.contains('hidden')) {
                        this.showInvalidFeedback(input, 'Este campo é obrigatório.');
                        isValid = false;
                    } else {
                        this.hideInvalidFeedback(input);
                    }
                } else if (fileInput.closest('.file-input-wrapper')) {
                    // Lógica para o novo input de file do agendamento.html
                    if (!fileInput.files || fileInput.files.length === 0) {
                         // Acha o elemento de feedback mais próximo
                        const wrapper = fileInput.closest('.file-input-wrapper');
                        let feedback = wrapper.nextElementSibling;
                        if (!feedback || !feedback.classList.contains('invalid-feedback')) {
                             feedback = wrapper.parentElement.querySelector('.invalid-feedback');
                        }
                        
                        if (feedback) {
                            feedback.textContent = 'Este campo é obrigatório.';
                            feedback.classList.remove('hidden');
                        }
                        isValid = false;
                    } else {
                        const wrapper = fileInput.closest('.file-input-wrapper');
                        let feedback = wrapper.nextElementSibling;
                        if (!feedback || !feedback.classList.contains('invalid-feedback')) {
                             feedback = wrapper.parentElement.querySelector('.invalid-feedback');
                        }
                         if (feedback) {
                            feedback.classList.add('hidden');
                        }
                    }
                } else {
                    // Se não tem file-drop-zone, verifica se o arquivo está selecionado
                    if (!fileInput.files || fileInput.files.length === 0) {
                        this.showInvalidFeedback(input, 'Este campo é obrigatório.');
                        isValid = false;
                    } else {
                        this.hideInvalidFeedback(input);
                    }
                }
            } else if (input.name === 'numeroPedido') {
                const value = input.value.trim();
                // Deve ser numérico, 10 dígitos, começar com 450
                if (!/^450\d{7}$/.test(value)) {
                    this.showInvalidFeedback(input, 'O número do pedido deve começar com 450 e ter 10 dígitos numéricos.');
                    isValid = false;
                } else {
                    this.hideInvalidFeedback(input);
                }
            } else if (input.name === 'numeroPedidoLinha') {
                const value = input.value.trim();
                if (!/^450\d{7}$/.test(value)) {
                    this.showInvalidFeedback(input, 'O número do pedido deve começar com 450 e ter 10 dígitos numéricos.');
                    isValid = false;
                } else {
                    this.hideInvalidFeedback(input);
                }
            } else if (!input.value.trim()) {
                this.showInvalidFeedback(input, 'Este campo é obrigatório.');
                isValid = false;
            } else {
                this.hideInvalidFeedback(input);
            }
        });

        if (step === 3) {
            // Validação para o template de pedido-unico (agendamento.html)
            const pedidoUnico = stepContainer?.querySelector('#pedido-unico');
            if (pedidoUnico) {
                const nfItems = pedidoUnico.querySelectorAll('.nota-fiscal-item');
                if (nfItems.length === 0) {
                     this.showNotification('É necessário adicionar pelo menos uma nota fiscal.', 'error');
                     isValid = false;
                }
                
                nfItems.forEach(nfDiv => {
                    const numeroNF = nfDiv.querySelector('[name="numeroNF"]');
                    const numeroPedidoLinha = nfDiv.querySelector('[name="numeroPedidoLinha"]');
                    const valorNF = nfDiv.querySelector('[name="valorNF"]');
                    const arquivoNF = nfDiv.querySelector('[name="arquivoNF"]');

                    if (!numeroNF || !numeroNF.value.trim()) {
                        this.showInvalidFeedback(numeroNF, 'Este campo é obrigatório.');
                        isValid = false;
                    } else {
                        this.hideInvalidFeedback(numeroNF);
                    }
                    
                    if (!numeroPedidoLinha || !numeroPedidoLinha.value.trim()) {
                        this.showInvalidFeedback(numeroPedidoLinha, 'Este campo é obrigatório.');
                        isValid = false;
                    } else {
                        this.hideInvalidFeedback(numeroPedidoLinha);
                    }

                    if (!valorNF || !valorNF.value.trim() || valorNF.value === 'R$ 0,00') {
                        this.showInvalidFeedback(valorNF, 'Este campo é obrigatório.');
                        isValid = false;
                    } else {
                        this.hideInvalidFeedback(valorNF);
                    }
                    
                    if (!arquivoNF || !arquivoNF.files || !arquivoNF.files.length) {
                        // Acha o feedback do input de arquivo
                        const wrapper = arquivoNF.closest('.file-input-wrapper');
                        let feedback = wrapper.nextElementSibling;
                         if (!feedback || !feedback.classList.contains('invalid-feedback')) {
                             feedback = wrapper.parentElement.querySelector('.invalid-feedback');
                        }

                        if (feedback) {
                            feedback.textContent = 'Este campo é obrigatório.';
                            feedback.classList.remove('hidden');
                        }
                        isValid = false;
                    } else {
                         const wrapper = arquivoNF.closest('.file-input-wrapper');
                        let feedback = wrapper.nextElementSibling;
                         if (!feedback || !feedback.classList.contains('invalid-feedback')) {
                             feedback = wrapper.parentElement.querySelector('.invalid-feedback');
                        }
                         if (feedback) {
                            feedback.classList.add('hidden');
                        }
                    }
                });
            } else {
                // Fallback para múltiplos pedidos (sistema de abas antigo)
                const pedidoInputs = stepContainer?.querySelectorAll('.pedido-content [name="numeroPedido"]');
                if (pedidoInputs?.length === 0) {
                    this.showNotification('É necessário adicionar pelo menos um pedido.', 'error');
                    isValid = false;
                } else {
                    // ... (lógica de validação do sistema de abas)
                }
            }
        }
        return isValid;
    }

    showInvalidFeedback(input, message) {
        // Tenta encontrar o feedback no parentElement, ou no parentElement do parentElement (para inputs customizados)
        let feedback = input.parentElement.querySelector('.invalid-feedback');
        if (!feedback && input.parentElement.parentElement) {
             feedback = input.parentElement.parentElement.querySelector('.invalid-feedback');
        }
        // Fallback para input de arquivo
        if (input.type === 'file' && input.closest('.file-input-wrapper')) {
            const wrapper = input.closest('.file-input-wrapper');
            feedback = wrapper.nextElementSibling; // Tenta pegar o próximo
            if (!feedback || !feedback.classList.contains('invalid-feedback')) {
                feedback = wrapper.parentElement.querySelector('.invalid-feedback'); // Tenta pegar no pai
            }
        }
        
        if (feedback) {
            feedback.textContent = message;
            feedback.classList.remove('hidden');
        }
    }

    hideInvalidFeedback(input) {
        let feedback = input.parentElement.querySelector('.invalid-feedback');
         if (!feedback && input.parentElement.parentElement) {
             feedback = input.parentElement.parentElement.querySelector('.invalid-feedback');
        }
        // Fallback para input de arquivo
        if (input.type === 'file' && input.closest('.file-input-wrapper')) {
            const wrapper = input.closest('.file-input-wrapper');
            feedback = wrapper.nextElementSibling;
            if (!feedback || !feedback.classList.contains('invalid-feedback')) {
                feedback = wrapper.parentElement.querySelector('.invalid-feedback');
            }
        }
        
        if (feedback) {
            feedback.textContent = '';
            feedback.classList.add('hidden');
        }
    }

    nextStep() {
        if (!this.validateStep(this.currentStep)) {
            this.showNotification('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }

        this.saveStepData();
        this.currentStep++;

        if (this.currentStep > this.maxSteps) {
            this.currentStep = this.maxSteps;
        }

        if (this.currentStep === 4) {
            this.generateResumo();
        }

        this.showStep(this.currentStep);
    }

    previousStep() {
        this.currentStep--;
        if (this.currentStep < 1) {
            this.currentStep = 1;
        }
        this.showStep(this.currentStep);
    }

    showStep(step) {
        // Ocultar todas as etapas
        document.querySelectorAll('.form-step').forEach(stepElement => {
            stepElement.classList.add('hidden');
        });

        // Mostrar etapa atual
        const currentStepEl = document.getElementById(`form-step-${this.currentStep}`);
        if (currentStepEl) {
             currentStepEl.classList.remove('hidden');
        }

        // Atualizar indicadores de progresso
        this.updateProgressIndicators();

        // Atualizar descrição da etapa
        const descriptions = {
            1: 'Dados do Fornecedor',
            2: 'Dados da Entrega',
            3: 'Pedidos e Notas Fiscais',
            4: 'Resumo e Confirmação'
        };

        const currentStepSpan = document.getElementById('current-step');
        const stepDescSpan = document.getElementById('step-description');
        
        if(currentStepSpan) currentStepSpan.textContent = this.currentStep;
        if(stepDescSpan) stepDescSpan.textContent = descriptions[this.currentStep];

        // Ao entrar no step 3, garantir que pelo menos um pedido/NF exista
        if (this.currentStep === 3) {
             // Lógica para o template de NF única (agendamento.html)
            const notasContainer = document.getElementById('notas-container');
            if (notasContainer && notasContainer.children.length === 0) {
                // Se não houver nenhuma NF, simula o clique no botão de adicionar
                document.getElementById('btn-add-nf')?.click(); 
            }
            // Lógica legada para o template de múltiplos pedidos (abas)
            const pedidosContainer = document.getElementById('pedidos-container');
            if (pedidosContainer && !document.getElementById('pedido-unico') && pedidosContainer.children.length === 0) {
                this.addPedido();
            }
        }
        // Scroll para o topo
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    updateProgressIndicators() {
        // Atualizar círculos dos passos
        for (let i = 1; i <= this.maxSteps; i++) {
            const stepElement = document.getElementById(`step-${i}`);
            if (!stepElement) continue; // Pula se o elemento não existir
            
            if (i < this.currentStep) {
                stepElement.className = 'step flex items-center justify-center w-10 h-10 rounded-full step-completed text-white font-bold';
                stepElement.innerHTML = '<i class="fas fa-check"></i>';
            } else if (i === this.currentStep) {
                stepElement.className = 'step flex items-center justify-center w-10 h-10 rounded-full bg-orange-primary text-white font-bold';
                stepElement.textContent = i;
            } else {
                stepElement.className = 'step flex items-center justify-center w-10 h-10 rounded-full bg-gray-300 text-gray-500 font-bold';
                stepElement.textContent = i;
            }
        }

        // Atualizar barras de progresso
        for (let i = 1; i < this.maxSteps; i++) {
            const progressBar = document.getElementById(`progress-${i}-${i + 1}`);
            if (!progressBar) continue; // Pula se o elemento não existir

            if (i < this.currentStep) {
                progressBar.style.width = '100%';
            } else {
                progressBar.style.width = '0%';
            }
        }
    }

    saveStepData() {
        const getElValue = (id) => document.getElementById(id)?.value || '';

        switch (this.currentStep) {
            case 1:
                this.formData.fornecedor = {
                    nomeEmpresa: getElValue('nome-empresa'),
                    nomeResponsavel: getElValue('nome-responsavel'),
                    email: getElValue('email'),
                    telefone: getElValue('telefone'),
                    documento: getElValue('documento'),
                    telefoneMotorista: getElValue('telefone-motorista'),
                    cpfMotorista: getElValue('cpf-motorista'),
                    placaVeiculo: getElValue('placa-veiculo'),
                    tipoVeiculo: document.getElementById('tipo-veiculo')?.value || ''
                };
                break;
            case 2:
                // Garante que dataEntrega é string pura 'YYYY-MM-DD'
                // Adapta dataEntrega para formato ISO completo (YYYY-MM-DDT00:00:00)
                let dataEntregaRaw = getElValue('data-entrega');
                let dataEntregaISO = '';
                if (dataEntregaRaw && /^\d{4}-\d{2}-\d{2}$/.test(dataEntregaRaw)) {
                    dataEntregaISO = dataEntregaRaw + 'T00:00:00';
                } else {
                    dataEntregaISO = dataEntregaRaw;
                }
                this.formData.entrega = {
                    cdDestino: getElValue('cd-destino'),
                    tipoCarga: getElValue('tipo-carga'),
                    dataEntrega: dataEntregaISO, // formato ISO
                    horarioEntrega: getElValue('horario-entrega'),
                    quantidadeVolumes: getElValue('quantidade-volumes'),
                    tipoVolume: getElValue('tipo-volume'),
                    observacoes: getElValue('observacoes')
                };
                break;
            case 3:
                this.savePedidosData();
                break;
        }
    }

    // *** ESTA É UMA FUNÇÃO LEGADA (do sistema de abas) ***
    // Não é mais usada pelo agendamento.html, mas mantida por segurança.
    // Função addPedido removida

    // *** FUNÇÃO LEGADA (do sistema de abas) ***
    addPedidoTab(pedidoId, numeroTab) {
        const tabsContainer = document.getElementById('pedidos-tabs');
        if (!tabsContainer) return;

        const tabHTML = `
            <button type="button" id="tab-${pedidoId}" onclick="showPedido('${pedidoId}')" 
                class="pedido-tab px-4 py-2 rounded-lg font-medium transition-all bg-orange-primary text-white flex items-center space-x-2">
                <span>Pedido ${numeroTab}</span>
                ${numeroTab > 1 ? `
                    <button type="button" onclick="event.stopPropagation(); removePedido('${pedidoId}')" 
                        class="ml-2 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xs transition-all">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </button>
            <button type="button" onclick="addPedido()" class="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-all">
                <i class="fas fa-plus mr-1"></i> Adicionar Pedido
            </button>
        `;
        
        // Remover o botão "Adicionar Pedido" anterior se existir
        const existingAddBtn = tabsContainer.querySelector('.bg-green-500');
        // Nova lógica: agrupar NFs por número de pedido e somar valores
    }

    minimizeNotaFiscal(nfElement) {
        const content = nfElement.querySelector('.nota-fiscal-content');
        const toggleIcon = nfElement.querySelector('.toggle-icon');
        
        if (content && toggleIcon) {
            content.style.display = 'none';
            toggleIcon.classList.remove('fa-chevron-up');
            toggleIcon.classList.add('fa-chevron-down');
        }
    }

    toggleNotaFiscal(nfId) {
        const nfElement = document.getElementById(nfId);
        if (!nfElement) return;
        const content = nfElement.querySelector('.nota-fiscal-content');
        const toggleIcon = nfElement.querySelector('.toggle-icon');
        
        if (content.style.display === 'none') {
            // Expandir esta NF
            content.style.display = 'block';
            toggleIcon.classList.remove('fa-chevron-down');
            toggleIcon.classList.add('fa-chevron-up');
            
            // Minimizar todas as outras NFs do mesmo pedido
            const container = nfElement.closest('.notas-fiscais-container');
            container.querySelectorAll('.nota-fiscal-item').forEach(otherNf => {
                if (otherNf.id !== nfId) {
                    this.minimizeNotaFiscal(otherNf);
                }
            });
        } else {
            // Minimizar esta NF
            this.minimizeNotaFiscal(nfElement);
        }
    }

    setupFileDropZone(nfId) {
        const dropZone = document.querySelector(`#${nfId} .file-drop-zone`);
        if (!dropZone) return;
        const fileInput = dropZone.querySelector('input[type="file"]');
        
        dropZone.addEventListener('click', () => fileInput.click());
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                this.handleFileSelect(fileInput);
            }
        });
    }

    // Helper para converter string 'R$ 1.234,56' para número 1234.56
    parseCurrency(valor) {
        if (!valor) return 0;
        // Remove prefixo 'R$ ', pontos e espaços
        valor = valor.replace('R$','').replace(/\./g,'').replace(/\s/g,'');
        // Troca vírgula por ponto
        valor = valor.replace(',','.');
        // Se não for número válido, ignora
        const valorNumerico = parseFloat(valor);
        if (!isNaN(valorNumerico)) {
            return valorNumerico;
        }
        return 0;
    }


    calcularTotalPedido(pedidoId) {
        // Esta função é para o sistema de abas.
        // A lógica de cálculo de total para o novo template está em calcularTotalGeral()
        const pedidoDiv = document.getElementById(pedidoId);
        if (!pedidoDiv) return 0;
        const nfInputs = pedidoDiv.querySelectorAll('[name="valorNF"]');
        let total = 0;
        nfInputs.forEach(input => {
            total += this.parseCurrency(input.value);
        });
        return Number.isNaN(total) ? 0 : total;
    }

    calcularTotalGeral() {
        let totalGeral = 0;
        
        // Lógica para o novo template (agendamento.html)
        const notasContainer = document.getElementById('notas-container');
        if (notasContainer) {
             notasContainer.querySelectorAll('[name="valorNF"]').forEach(input => {
                totalGeral += this.parseCurrency(input.value);
            });
        } else {
            // Lógica legada (sistema de abas)
            document.querySelectorAll('.pedido-content').forEach(pedidoDiv => {
                const pedidoId = pedidoDiv.id;
                const totalPedido = this.calcularTotalPedido(pedidoId);
                totalGeral += totalPedido;
            });
        }
        
        return totalGeral;
    }

    // *** FUNÇÃO ATUALIZADA PARA AGRUPAR PEDIDOS CORRETAMENTE (CORREÇÃO "UNICO") ***
    savePedidosData() {
        this.formData.pedidos = [];
        this.formData.arquivos = [];
        const pedidosMap = {};

        // Função helper para analisar o valor monetário
        const parseCurrency = (valStr) => {
            if (!valStr) return 0;
            let num = valStr.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
            return parseFloat(num) || 0;
        };

        // Lógica para o novo template (agendamento.html)
        const notasContainer = document.getElementById('notas-container');
        if (notasContainer) {
            notasContainer.querySelectorAll('.nota-fiscal-item').forEach(nfDiv => {
                // *** MUDANÇA: Pega o número do pedido de CADA LINHA ***
                const numeroPedidoInput = nfDiv.querySelector('[name="numeroPedidoLinha"]');
                const numeroPedido = numeroPedidoInput ? numeroPedidoInput.value.trim() : 'PEDIDO_INVALIDO';
                
                const numeroNF = nfDiv.querySelector('[name="numeroNF"]')?.value;
                const valorNF = nfDiv.querySelector('[name="valorNF"]')?.value; // "R$ 1.234,56"
                const arquivoNF = nfDiv.querySelector('[name="arquivoNF"]')?.files[0];

                if (numeroPedido && numeroNF && valorNF) {
                    if (!pedidosMap[numeroPedido]) {
                        pedidosMap[numeroPedido] = {
                            numero: numeroPedido, // Salva o número correto do pedido
                            valor: 0,
                            notasFiscais: []
                        };
                    }

                    const valorNum = parseCurrency(valorNF);
                    const notaFiscal = {
                        numero: numeroNF,
                        valor: valorNF // Salva o valor formatado para exibição
                    };
                    
                    pedidosMap[numeroPedido].valor += valorNum;

                    if (arquivoNF) {
                        notaFiscal.arquivo = arquivoNF;
                        this.formData.arquivos.push({
                            file: arquivoNF,
                            pedido: numeroPedido,
                            nf: numeroNF
                        });
                    }
                    pedidosMap[numeroPedido].notasFiscais.push(notaFiscal);
                }
            });
        } else {
            // Lógica legada (sistema de abas)
            document.querySelectorAll('.pedido-content').forEach(pedidoDiv => {
                const numeroPedidoInput = pedidoDiv.querySelector('[name="numeroPedido"]');
                if (!numeroPedidoInput) return;
                const numeroPedido = numeroPedidoInput.value; // "PED001" etc.

                pedidoDiv.querySelectorAll('.nota-fiscal-item').forEach(nfDiv => {
                     // ... (lógica legada)
                });
            });
        }

        // Montar array final de pedidos agrupados
        this.formData.pedidos = Object.values(pedidosMap).map(pedido => ({
            numero: pedido.numero,
            valor: pedido.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            notasFiscais: pedido.notasFiscais
        }));
    }

    // *** FUNÇÃO ATUALIZADA (CORREÇÃO "VOLUME") ***
    generateResumo() {
        const resumoContainer = document.getElementById('resumo-agendamento');
        if (!resumoContainer) return;
        
        // Mapeamentos para exibir nomes amigáveis
        const cdNames = {
            'Bahia': 'CD Bahia',
            'Pernambuco': 'CD Pernambuco',
            'Lagoa Nova': 'CD Lagoa Nova'
        };
        const tipoCargas = {
            'equipamentos': 'Equipamentos de Rede',
            'materiais': 'Materiais de Instalação',
            'componentes': 'Componentes Eletrônicos',
            'outros': 'Outros'
        };
        const tipoVolumes = {
            'palet': 'Palet',
            'caixa': 'Caixa',
            'bloco': 'Bloco',
            'bobina': 'Bobina',
            'pacote': 'Pacote',
            'saco': 'Saco',
            'caixote': 'Caixote',
            'tambor': 'Tambor'
        };

        const totalGeral = this.calcularTotalGeral();
        const totalFormatado = isNaN(totalGeral) ? 'R$ 0,00' : totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const notasFiscaisCount = this.formData.pedidos.reduce((acc, pedido) => acc + (pedido.notasFiscais?.length || 0), 0);
        
        // *** CORREÇÃO AQUI: Usa os valores salvos e aplica o fallback "Não informado" ***
        const quantidadeVolumes = (this.formData.entrega.quantidadeVolumes && this.formData.entrega.quantidadeVolumes !== '') 
            ? this.formData.entrega.quantidadeVolumes 
            : 'Não informado';
        const tipoVolume = (this.formData.entrega.tipoVolume && this.formData.entrega.tipoVolume !== '') 
            ? tipoVolumes[this.formData.entrega.tipoVolume] // Mapeia o valor para o nome amigável
            : 'Não informado';

        // Card ainda mais largo
        const resumoHTML = `
            <div class="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl p-12 card-3d border-4 border-orange-100">
                <div class="flex items-center gap-3 mb-8">
                    <div class="bg-green-100 rounded-full p-3"><i class="fas fa-check text-green-600 text-xl"></i></div>
                    <div>
                        <h2 class="text-3xl font-bold text-gray-dark">Revisão e Confirmação</h2>
                        <p class="text-gray-medium">Confira os dados antes de enviar a solicitação</p>
                    </div>
                </div>
                <div class="mb-8">
                    <div class="flex items-center gap-2 mb-2 text-orange-600 font-semibold text-xl"><i class="fas fa-truck"></i> Dados do Transportador</div>
                    <div class="grid md:grid-cols-2 gap-6 bg-gray-50 rounded-xl p-6 shadow">
                        <div>
                            <div class="text-xs text-gray-medium">CNPJ</div>
                            <div class="font-semibold">${this.formData.fornecedor.documento || 'Não informado'}</div>
                            <div class="text-xs text-gray-medium mt-2">Telefone</div>
                            <div class="font-semibold">${this.formData.fornecedor.telefone || 'Não informado'}</div>
                        </div>
                        <div>
                            <div class="text-xs text-gray-medium">Nome do Transportador</div>
                            <div class="font-semibold">${this.formData.fornecedor.nomeEmpresa || 'Não informado'}</div>
                            <div class="text-xs text-gray-medium mt-2">E-mail</div>
                            <div class="font-semibold">${this.formData.fornecedor.email || 'Não informado'}</div>
                        </div>
                    </div>
                </div>
                <div class="mb-8">
                    <div class="flex items-center gap-2 mb-2 text-orange-600 font-semibold text-xl"><i class="fas fa-id-card"></i> Dados do Motorista</div>
                    <div class="grid md:grid-cols-2 gap-6 bg-gray-50 rounded-xl p-6 shadow">
                        <div>
                            <div class="text-xs text-gray-medium">Nome</div>
                            <div class="font-semibold">${this.formData.fornecedor.nomeResponsavel || 'Não informado'}</div>
                            <div class="text-xs text-gray-medium mt-2">CPF</div>
                            <div class="font-semibold">${this.formData.fornecedor.cpfMotorista || 'Não informado'}</div>
                        </div>
                        <div>
                            <div class="text-xs text-gray-medium">Telefone</div>
                            <div class="font-semibold">${this.formData.fornecedor.telefoneMotorista || 'Não informado'}</div>
                            <div class="text-xs text-gray-medium mt-2">Placa do Veículo</div>
                            <div class="font-semibold">${this.formData.fornecedor.placaVeiculo || 'Não informado'}</div>
                        </div>
                    </div>
                </div>
                <div class="mb-8">
                    <div class="flex items-center gap-2 mb-2 text-orange-600 font-semibold text-xl"><i class="fas fa-map-marker-alt"></i> Detalhes da Entrega</div>
                    <div class="grid md:grid-cols-2 gap-6 bg-gray-50 rounded-xl p-6 shadow">
                        <div>
                            <div class="text-xs text-gray-medium">Quantidade de Volumes</div>
                            <div class="font-semibold">${quantidadeVolumes}</div>
                            <div class="text-xs text-gray-medium mt-2">Tipo de Volume</div>
                            <div class="font-semibold">${tipoVolume}</div>
                        </div>
                        <div>
                            <div class="text-xs text-gray-medium">Tipo de Carga</div>
                            <div class="font-semibold">${tipoCargas[this.formData.entrega.tipoCarga] || 'Não informado'}</div>
                            <div class="text-xs text-gray-medium mt-2">Destino</div>
                            <div class="font-semibold">${cdNames[this.formData.entrega.cdDestino] || 'Não informado'}</div>
                            <div class="text-xs text-gray-medium mt-2">Horário</div>
                            <div class="font-semibold">${this.formData.entrega.horarioEntrega || 'Não informado'}</div>
                        </div>
                    </div>
                    <div class="mt-2 text-xs text-gray-medium">Data de Entrega: <span class="font-semibold">${this.formData.entrega.dataEntrega ? (() => { const [a,m,d]=this.formData.entrega.dataEntrega.split('-'); return `${d}/${m}/${a}`; })() : 'Não informada'}</span></div>
                    ${this.formData.entrega.observacoes ? `<div class="mt-2 text-xs text-gray-medium">Observações: <span class="font-semibold">${this.formData.entrega.observacoes}</span></div>` : ''}
                </div>
                <div>
                    <div class="flex items-center gap-2 mb-2 text-orange-600 font-semibold text-xl"><i class="fas fa-file-invoice"></i> Pedidos e Notas Fiscais (${notasFiscaisCount})</div>
                    <div class="bg-gray-50 rounded-xl p-6 shadow">
                        ${this.formData.pedidos.map((pedido, idx) => {
                            // *** CORREÇÃO AQUI: 'pedido.numero' agora contém o número correto ***
                            return `
                                <div class="mb-8 border-b pb-6 last:border-b-0 last:pb-0">
                                    <div class="flex items-center gap-2 mb-2 text-lg font-bold text-gray-dark"><i class="fas fa-shopping-cart text-orange-500"></i> Pedido: ${pedido.numero}</div>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                        <div class="text-xs text-gray-medium">Total do Pedido</div>
                                        <div class="font-semibold text-green-700">${pedido.valor}</div>
                                    </div>
                                    <div class="mb-2">
                                        <div class="text-xs text-gray-medium mb-1">Notas Fiscais:</div>
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            ${pedido.notasFiscais.map(nf => `
                                                <div class="bg-white rounded-lg border p-4 mb-2 shadow-sm">
                                                    <div class="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <div class="text-xs text-gray-medium">Nº NF</div>
                                                            <div class="font-semibold">${nf.numero}</div>
                                                        </div>
                                                        <div>
                                                            <div class="text-xs text-gray-medium">Valor</div>
                                                            <div class="font-semibold">${nf.valor}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                        <div class="flex justify-end mt-4">
                            <span class="font-bold text-green-600 text-2xl">Valor Total Geral: ${totalFormatado}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        resumoContainer.innerHTML = resumoHTML;
    }

    async submitForm() {
        this.showLoading(true);
        
        try {
            const formData = new FormData();
            
            // Adicionar dados do agendamento
            formData.append('agendamento', JSON.stringify({
                fornecedor: {
                    nomeEmpresa: this.formData.fornecedor?.nomeEmpresa || '',
                    nomeResponsavel: this.formData.fornecedor?.nomeResponsavel || '',
                    email: this.formData.fornecedor?.email || '',
                    telefone: this.formData.fornecedor?.telefone || '',
                    documento: this.formData.fornecedor?.documento || '',
                    telefoneMotorista: this.formData.fornecedor?.telefoneMotorista || '',
                    cpfMotorista: this.formData.fornecedor?.cpfMotorista || '',
                    placaVeiculo: this.formData.fornecedor?.placaVeiculo || '',
                    tipoVeiculo: this.formData.fornecedor?.tipoVeiculo || ''
                },
                entrega: this.formData.entrega,
                pedidos: this.formData.pedidos.map(p => ({
                    numero: p.numero,
                    valor: p.valor,
                    notasFiscais: p.notasFiscais.map(nf => ({
                        numero: nf.numero,
                        valor: nf.valor
                    }))
                })),
                tipoVeiculo: this.formData.fornecedor?.tipoVeiculo || ''
            }));
            
            // Adicionar arquivos
            this.formData.arquivos.forEach((arquivo, index) => {
                formData.append(`arquivo_${index}`, arquivo.file);
                formData.append(`arquivo_${index}_info`, JSON.stringify({
                    pedido: arquivo.pedido,
                    nf: arquivo.nf
                }));
            });
            
            // Tentar enviar para API
            let response;
            try {
                // Fazer a requisição para criar o agendamento sem necessidade de token
                response = await fetch(`${getApiBaseUrl()}/api/agendamentos`, {
                    method: 'POST',
                    body: formData
                });
            } catch (error) {
                // Fallback para dados mock se API não estiver disponível
                console.warn('API não disponível, usando dados mock');
                response = await this.mockApiResponse();
            }
            
            if (response.ok) {
                const result = await response.json();
                this.showSuccess(result);
            } else {
                const contentType = response.headers.get('content-type');
                let errorData;
                if (contentType && contentType.includes('application/json')) {
                    errorData = await response.json();
                    console.error('Erro da API:', errorData);
                    throw new Error(errorData.message || 'Erro ao processar agendamento');
                } else {
                    const errorText = await response.text();
                    console.error('Resposta não JSON:', errorText);
                    throw new Error('Erro inesperado do servidor. Tente novamente ou contate o suporte.');
                }
            }
            
        } catch (error) {
            console.error('Erro:', error);
            this.showNotification(error.message || 'Erro ao processar agendamento. Tente novamente.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async mockApiResponse() {
        // Simular delay da API
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
            ok: true,
            json: async () => ({
                success: true,
                codigo: 'AGD' + Date.now().toString().slice(-6),
                message: 'Agendamento criado com sucesso!'
            })
        };
    }

    showSuccess(result) {
        const successHTML = `
            <div class="text-center">
                <div class="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-2xl inline-block mb-6">
                    <i class="fas fa-check-circle text-white text-4xl"></i>
                </div>
                <h2 class="text-3xl font-bold text-gray-dark mb-4">Agendamento Realizado!</h2>
                <div class="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                    <p class="text-lg text-green-800 mb-2">
                        <strong>Código do Agendamento: ${result.codigo}</strong>
                    </p>
                    <p class="text-green-700">
                        Seu agendamento foi registrado com sucesso. Você receberá um e-mail de confirmação em breve.
                    </p>
                </div>
                <div class="space-y-4">
                    <a href="/" class="btn-3d bg-orange-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-secondary transition-all inline-block">
                        <i class="fas fa-home mr-2"></i>
                        Voltar ao Início
                    </a>
                    <button onclick="window.print()" class="bg-gray-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all ml-4">
                        <i class="fas fa-print mr-2"></i>
                        Imprimir Comprovante
                    </button>
                </div>
            </div>
        `;
        
        // Tenta encontrar o container principal
        const mainContainer = document.querySelector('main .max-w-4xl');
        if (mainContainer) {
             mainContainer.innerHTML = successHTML;
        } else {
            // Fallback se a estrutura do HTML mudar
            document.querySelector('main').innerHTML = successHTML;
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            if (show) {
                overlay.classList.remove('hidden');
            } else {
                overlay.classList.add('hidden');
            }
        }
    }

    showNotification(message, type = 'info') {
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        const notification = document.createElement('div');
        notification.className = `notification ${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3`;
        notification.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" class="ml-4 hover:bg-white hover:bg-opacity-20 rounded p-1">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        const container = document.getElementById('notification-container');
        if(container) {
            container.appendChild(notification);
        }
        
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    async loadAvailableHours(date, cdDestino) {
        try {
            console.log('Carregando horários disponíveis para:', { date, cdDestino });
            
            // Fazer requisição para a API de horários disponíveis sem necessidade de autenticação
            const response = await fetch(`${getApiBaseUrl()}/api/horarios-disponiveis?date=${date}&cd=${cdDestino}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Erro ao buscar horários: ${response.status}`);
            }

            const data = await response.json();
            console.log('Horários disponíveis recebidos:', data);

            // Atualizar select de horários
            const horarioSelect = document.getElementById('horario-entrega');
            if (horarioSelect) {
                // Limpar opções existentes
                horarioSelect.innerHTML = '<option value="">Selecione um horário</option>';
                
                // Adicionar horários disponíveis
                if (data.horarios && Array.isArray(data.horarios)) {
                    data.horarios.forEach(horario => {
                        const option = document.createElement('option');
                        option.value = horario.valor;
                        option.textContent = horario.label;
                        if (horario.disponivel === false) {
                            option.disabled = true;
                            option.textContent += ` (${horario.motivo || 'Indisponível'})`;
                        }
                        horarioSelect.appendChild(option);
                    });
                } else {
                    // Horários padrão caso a API não retorne dados
                    const horariosDefault = [
                        { valor: '08:00', label: '08:00 - 09:00', disponivel: true },
                        { valor: '09:00', label: '09:00 - 10:00', disponivel: true },
                        { valor: '10:00', label: '10:00 - 11:00', disponivel: true },
                        { valor: '11:00', label: '11:00 - 12:00', disponivel: true },
                        { valor: '14:00', label: '14:00 - 15:00', disponivel: true },
                        { valor: '15:00', label: '15:00 - 16:00', disponivel: true },
                        { valor: '16:00', label: '16:00 - 17:00', disponivel: true },
                        { valor: '17:00', label: '17:00 - 18:00', disponivel: true }
                    ];
                    
                    horariosDefault.forEach(horario => {
                        const option = document.createElement('option');
                        option.value = horario.valor;
                        option.textContent = horario.label;
                        horarioSelect.appendChild(option);
                    });
                }
                
                this.showNotification('Horários carregados com sucesso!', 'success');
            }

        } catch (error) {
            console.error('Erro ao carregar horários:', error);
            this.showNotification('Erro ao carregar horários disponíveis', 'error');
            
            // Carregar horários padrão em caso de erro
            const horarioSelect = document.getElementById('horario-entrega');
            if (horarioSelect) {
                horarioSelect.innerHTML = '<option value="">Selecione um horário</option>';
                const horariosDefault = [
                    { valor: '08:00', label: '08:00 - 09:00' },
                    { valor: '09:00', label: '09:00 - 10:00' },
                    { valor: '10:00', label: '10:00 - 11:00' },
                    { valor: '11:00', label: '11:00 - 12:00' },
                    { valor: '14:00', label: '14:00 - 15:00' },
                    { valor: '15:00', label: '15:00 - 16:00' },
                    { valor: '16:00', label: '16:00 - 17:00' },
                    { valor: '17:00', label: '17:00 - 18:00' }
                ];
                
                horariosDefault.forEach(horario => {
                    const option = document.createElement('option');
                    option.value = horario.valor;
                    option.textContent = horario.label;
                    horarioSelect.appendChild(option);
                });
            }
        }
    }
}

// Funções globais
let agendamentoForm; // Apenas UMA declaração global

// Estas são as funções que o seu HTML (onclick="") chama.
// Elas funcionam pois o clique SÓ acontece DEPOIS que o DOMContentLoaded
// abaixo já rodou e definiu a variável 'agendamentoForm'.
function nextStep() {
    agendamentoForm.nextStep();
}

function previousStep() {
    agendamentoForm.previousStep();
}

// Função addPedido removida

function showPedido(pedidoId) {
    agendamentoForm.showPedido(pedidoId);
}

function removePedido(pedidoId) {
    if (confirm('Tem certeza que deseja remover este pedido?')) {
        document.getElementById(pedidoId)?.remove();
        document.getElementById(`tab-${pedidoId}`)?.remove();
        // Recalcular total geral após remoção
        agendamentoForm.calcularTotalGeral();
    }
}

function addNotaFiscal(pedidoId) {
    if (agendamentoForm) {
        agendamentoForm.addNotaFiscal(pedidoId);
    } else {
        console.error('AgendamentoForm não inicializado');
    }
}

function toggleNotaFiscal(nfId) {
    agendamentoForm.toggleNotaFiscal(nfId);
}

function removeNotaFiscal(nfId, pedidoId) {
    if (confirm('Tem certeza que deseja remover esta nota fiscal?')) {
        document.getElementById(nfId)?.remove();
        // Recalcular total do pedido após remoção
        agendamentoForm.calcularTotalPedido(pedidoId);
    }
}

function calcularTotalPedido(pedidoId) {
    agendamentoForm.calcularTotalPedido(pedidoId);
}
// Fim das funções legadas


// Funções globais para o novo template (agendamento.html)
function handleFileSelect(input) {
    const file = input.files[0];
    
    // Lógica para o novo template .file-input-wrapper
    const wrapper = input.closest('.file-input-wrapper');
    if (wrapper) {
        const fileLabel = wrapper.querySelector('.file-input-label');
        const fileNameSpan = wrapper.querySelector('span.file-name');
        const defaultFileName = "Clique para anexar PDF";

        if (file) {
             if (file.size > 10 * 1024 * 1024) { // 10MB
                if (agendamentoForm) {
                    agendamentoForm.showNotification('Arquivo muito grande. Máximo 10MB.', 'error');
                }
                input.value = '';
                if(fileNameSpan) fileNameSpan.textContent = defaultFileName;
                if(fileLabel) fileLabel.classList.remove('file-selected');
                return;
            }
            
            // Permite apenas PDF
            if (file.type !== 'application/pdf') { 
                if (agendamentoForm) {
                    agendamentoForm.showNotification('Apenas arquivos PDF são permitidos.', 'error');
                }
                input.value = '';
                if(fileNameSpan) fileNameSpan.textContent = defaultFileName;
                if(fileLabel) fileLabel.classList.remove('file-selected');
                return;
            }

            if(fileNameSpan) fileNameSpan.textContent = file.name;
            if(fileLabel) fileLabel.classList.add('file-selected');
        } else {
            if(fileNameSpan) fileNameSpan.textContent = defaultFileName;
            if(fileLabel) fileLabel.classList.remove('file-selected');
        }
        return; // Termina aqui para o novo template
    }

    // Lógica legada (file-drop-zone)
    const dropZone = input.closest('.file-drop-zone');
    if (!dropZone) {
        console.error('Zona de drop não encontrada');
        return;
    }
    
    const dropContent = dropZone.querySelector('.file-drop-content');
    const selectedContent = dropZone.querySelector('.file-selected');
    const fileName = selectedContent?.querySelector('.file-name');
    
    if (file) {
        if (file.size > 10 * 1024 * 1024) { // 10MB
            if (agendamentoForm) {
                agendamentoForm.showNotification('Arquivo muito grande. Máximo 10MB.', 'error');
            }
            input.value = '';
            return;
        }
        
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.xml')) {
            if (agendamentoForm) {
                agendamentoForm.showNotification('Apenas arquivos PDF ou XML são permitidos.', 'error');
            }
            input.value = '';
            return;
        }
        
        if (dropContent) dropContent.classList.add('hidden');
        if (selectedContent) selectedContent.classList.remove('hidden');
        if (fileName) fileName.textContent = file.name;
    }
}

function removeFile(button) {
    const dropZone = button.closest('.file-drop-zone');
    if (!dropZone) return;
    
    const input = dropZone.querySelector('input[type="file"]');
    const dropContent = dropZone.querySelector('.file-drop-content');
    const selectedContent = dropZone.querySelector('.file-selected');
    
    if (input) input.value = '';
    if (dropContent) dropContent.classList.remove('hidden');
    if (selectedContent) selectedContent.classList.add('hidden');
}

function formatCurrency(input) {
    // Esta função é chamada pelo HTML legado, a nova está no DOMContentLoaded
    let value = input.value.replace(/[^\d]/g, '');
    if (!value) {
        input.value = 'R$ 0,00';
        return;
    }
    let floatValue = Number(value) / 100;
    if (!isFinite(floatValue) || isNaN(floatValue)) {
        input.value = 'R$ 0,00';
        return;
    }
    let formatted = floatValue.toFixed(2).replace('.', ',');
    formatted = formatted.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    input.value = 'R$ ' + formatted;
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa a classe principal
    // E atribui à variável global que as funções acima usam
    agendamentoForm = new AgendamentoForm(); 

    // Intercepta submit do formulário principal
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            // Valida o passo 4 (resumo) antes de enviar
            if (agendamentoForm && agendamentoForm.currentStep === 4) { 
                agendamentoForm.submitForm();
            } else {
                console.warn("Submit tentado fora do passo 4.");
            }
        });
    }

    // Mapeamento de nome para ID dos CDs
    const cdMap = {
        'Bahia': 1,
        'Pernambuco': 2,
        'Lagoa Nova': 3
        // Adicione outros CDs conforme necessário
    };

    // Listeners para carregar horários disponíveis ao mudar CD ou data
    const cdInput = document.getElementById('cd-destino');
    const dateInput = document.getElementById('data-entrega');
    const horarioSelect = document.getElementById('horario-entrega');
    if (horarioSelect) {
        horarioSelect.disabled = true;
    }
    
    function atualizarHorarios() {
        const cdNome = cdInput?.value;
        const cdId = cdMap[cdNome];
        const date = dateInput?.value;
        
        if (cdId && date) {
            if (horarioSelect) horarioSelect.disabled = false;
            if (agendamentoForm) agendamentoForm.loadAvailableHours(date, cdId);
        } else {
            if (horarioSelect) {
                horarioSelect.disabled = true;
                horarioSelect.innerHTML = '<option value="">Selecione um horário</option>';
            }
        }
    }
    
    if (cdInput && dateInput) {
        cdInput.addEventListener('change', atualizarHorarios);
        dateInput.addEventListener('change', atualizarHorarios);
    }

    // Adiciona listeners de input de arquivo (que não são via 'onchange' no HTML)
    document.body.addEventListener('change', function(e) {
        if (e.target.matches('input[name="arquivoNF"]')) {
            handleFileSelect(e.target);
        }
    });

});