// Função para obter a URL base da API
function getApiBaseUrl() {
    return typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'https://brisalog-agenda.online';
}

// Funções globais para navegação dos steps
function nextStep() {
    if (window.agendamentoForm) {
        window.agendamentoForm.nextStep();
    }
}

function previousStep() {
    if (window.agendamentoForm) {
        window.agendamentoForm.previousStep();
    }
}
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

        // Adicionar Pedido
        document.getElementById('add-pedido-btn')?.addEventListener('click', () => this.addPedido());
    }

    validateStep(step) {
        let isValid = true;
        let formId = `form-step-${step}`;
        const inputs = document.querySelectorAll(`#${formId} [required]`);
        const stepContainer = document.getElementById(formId);

        inputs.forEach(input => {
            if (input.type === 'file') {
                const fileInput = input;
                const fileSelected = fileInput.closest('.file-drop-zone')?.querySelector('.file-selected');
                if (!fileSelected || fileSelected.classList.contains('hidden')) {
                    this.showInvalidFeedback(input, 'Este campo é obrigatório.');
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
            const pedidoInputs = stepContainer?.querySelectorAll('.pedido-content [name="numeroPedido"]');
            if (pedidoInputs?.length === 0) {
                this.showNotification('É necessário adicionar pelo menos um pedido.', 'error');
                isValid = false;
            } else {
                pedidoInputs?.forEach(input => {
                    if (!input.value.trim()) {
                        this.showInvalidFeedback(input, 'Este campo é obrigatório.');
                        isValid = false;
                    } else {
                        this.hideInvalidFeedback(input);
                    }
                });

                const nfInputs = stepContainer?.querySelectorAll('.nota-fiscal-item [name="numeroNF"], .nota-fiscal-item [name="valorNF"]');
                nfInputs?.forEach(input => {
                    if (!input.value.trim()) {
                        this.showInvalidFeedback(input, 'Este campo é obrigatório.');
                        isValid = false;
                    } else {
                        this.hideInvalidFeedback(input);
                    }
                });
            }
        }
        
        return isValid;
    }

    showInvalidFeedback(input, message) {
        const feedback = input.parentElement.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.textContent = message;
            feedback.classList.remove('hidden');
        }
    }

    hideInvalidFeedback(input) {
        const feedback = input.parentElement.querySelector('.invalid-feedback');
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
        document.getElementById(`form-step-${this.currentStep}`).classList.remove('hidden');

        // Atualizar indicadores de progresso
        this.updateProgressIndicators();

        // Atualizar descrição da etapa
        const descriptions = {
            1: 'Dados do Fornecedor',
            2: 'Dados da Entrega',
            3: 'Pedidos e Notas Fiscais',
            4: 'Resumo e Confirmação'
        };

        document.getElementById('current-step').textContent = this.currentStep;
        document.getElementById('step-description').textContent = descriptions[this.currentStep];

        // Ao entrar no step 3, garantir que pelo menos um pedido seja criado
        if (this.currentStep === 3) {
            const pedidosContainer = document.getElementById('pedidos-container');
            // Se não houver nenhum pedido, adicionar automaticamente
            if (pedidosContainer && pedidosContainer.children.length === 0) {
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
            if (i < this.currentStep) {
                progressBar.style.width = '100%';
            } else {
                progressBar.style.width = '0%';
            }
        }
    }

    saveStepData() {
        switch (this.currentStep) {
            case 1:
                this.formData.fornecedor = {
                    nomeEmpresa: document.getElementById('nome-empresa').value,
                    nomeResponsavel: document.getElementById('nome-responsavel').value,
                    email: document.getElementById('email').value,
                    telefone: document.getElementById('telefone').value,
                    documento: document.getElementById('documento').value
                };
                break;
            case 2:
                // Garante que dataEntrega é string pura 'YYYY-MM-DD'
                this.formData.entrega = {
                    cdDestino: document.getElementById('cd-destino').value,
                    tipoCarga: document.getElementById('tipo-carga').value,
                    dataEntrega: document.getElementById('data-entrega').value, // string pura
                    horarioEntrega: document.getElementById('horario-entrega').value,
                    observacoes: document.getElementById('observacoes').value
                };
                break;
            case 3:
                this.savePedidosData();
                break;
        }
    }

    addPedido() {
        this.pedidoCounter++;
        const pedidoId = `pedido-${this.pedidoCounter}`;
        
        // Adicionar aba do pedido
        this.addPedidoTab(pedidoId, this.pedidoCounter);
        
        const pedidoHTML = `
            <div id="${pedidoId}" class="pedido-content bg-gray-50 rounded-xl p-6 border-l-4 border-orange-primary" style="display: none;">
                <div class="grid md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label class="block text-gray-dark font-semibold mb-2">
                            <i class="fas fa-shopping-cart mr-2 text-orange-primary"></i>
                            Número do Pedido *
                        </label>
                        <input type="text" name="numeroPedido" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-orange-primary focus:ring-2 focus:ring-orange-primary focus:ring-opacity-20 transition-all"
                            placeholder="Ex: PED12345">
                        <div class="invalid-feedback hidden text-red-500 text-sm mt-1"></div>
                    </div>
                    <div class="flex items-end">
                        <div class="w-full">
                            <label class="block text-gray-dark font-semibold mb-2">
                                <i class="fas fa-receipt mr-2 text-orange-primary"></i>
                                Notas Fiscais do Pedido *
                            </label>
                            <div class="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                                <span class="text-blue-800 font-medium">
                                    <i class="fas fa-file-invoice mr-2"></i>
                                    Adicione as notas fiscais abaixo
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="space-y-4">
                    <div class="notas-fiscais-container" data-pedido="${pedidoId}">
                        </div>
                    
                    <div class="text-left">
                        <button type="button" onclick="addNotaFiscal('${pedidoId}')" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all">
                            <i class="fas fa-plus mr-2"></i>Adicionar Nota Fiscal
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('pedidos-container').insertAdjacentHTML('beforeend', pedidoHTML);
        
        // Mostrar o pedido recém-criado
        this.showPedido(pedidoId);
        
        // Adicionar primeira nota fiscal automaticamente
        this.addNotaFiscal(pedidoId);
    }

    addPedidoTab(pedidoId, numeroTab) {
        const tabsContainer = document.getElementById('pedidos-tabs');
        
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
        if (existingAddBtn) {
            existingAddBtn.remove();
        }
        
        tabsContainer.insertAdjacentHTML('beforeend', tabHTML);
    }

    showPedido(pedidoId) {
        // Ocultar todos os pedidos
        document.querySelectorAll('.pedido-content').forEach(pedido => {
            pedido.style.display = 'none';
        });
        
        // Remover classe ativa de todas as abas
        document.querySelectorAll('.pedido-tab').forEach(tab => {
            tab.classList.remove('bg-orange-primary', 'text-white');
            tab.classList.add('bg-gray-200', 'text-gray-700');
        });
        
        // Mostrar pedido selecionado
        const pedidoElement = document.getElementById(pedidoId);
        if (pedidoElement) {
            pedidoElement.style.display = 'block';
        }
        
        // Ativar aba correspondente
        const tabElement = document.getElementById(`tab-${pedidoId}`);
        if (tabElement) {
            tabElement.classList.remove('bg-gray-200', 'text-gray-700');
            tabElement.classList.add('bg-orange-primary', 'text-white');
        }
    }

    addNotaFiscal(pedidoId) {
        const container = document.querySelector(`.notas-fiscais-container[data-pedido="${pedidoId}"]`);
        if (!container) {
            console.error(`Container não encontrado para pedido: ${pedidoId}`);
            return;
        }
        
        // Minimizar todas as notas fiscais existentes neste pedido
        container.querySelectorAll('.nota-fiscal-item').forEach(nf => {
            this.minimizeNotaFiscal(nf);
        });
        
        const nfCount = container.children.length + 1;
        const nfId = `${pedidoId}-nf-${nfCount}`;
        
        const nfHTML = `
            <div id="${nfId}" class="nota-fiscal-item bg-white rounded-lg border mb-4">
                <div class="nota-fiscal-header flex justify-between items-center p-4 cursor-pointer" onclick="toggleNotaFiscal('${nfId}')">
                    <h6 class="font-medium text-gray-dark">
                        <i class="fas fa-file-invoice mr-2 text-orange-primary"></i>
                        Nota Fiscal ${nfCount}
                    </h6>
                    <div class="flex items-center space-x-2">
                        ${nfCount > 1 ? `
                            <button type="button" onclick="event.stopPropagation(); removeNotaFiscal('${nfId}', '${pedidoId}')" 
                                class="w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xs transition-all">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                        <i class="fas fa-chevron-up toggle-icon text-gray-500"></i>
                    </div>
                </div>
                
                <div class="nota-fiscal-content p-4 border-t">
                    <div class="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-dark mb-2">
                                <i class="fas fa-hashtag mr-1 text-orange-primary"></i>
                                Número da NF-e *
                            </label>
                            <input type="text" name="numeroNF" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-primary focus:ring-1 focus:ring-orange-primary"
                                placeholder="Número">
                            <div class="invalid-feedback hidden text-red-500 text-xs mt-1"></div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-dark mb-2">
                                <i class="fas fa-dollar-sign mr-1 text-orange-primary"></i>
                                Valor *
                            </label>
                            <input type="text" name="valorNF" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-primary focus:ring-1 focus:ring-orange-primary"
                                placeholder="R$ 0,00" onchange="formatCurrency(this); calcularTotalPedido('${pedidoId}')" 
                                oninput="calcularTotalPedido('${pedidoId}')">
                            <div class="invalid-feedback hidden text-red-500 text-xs mt-1"></div>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-dark mb-2">
                            <i class="fas fa-file-pdf mr-1 text-orange-primary"></i>
                            Arquivo XML/PDF da NF-e *
                        </label>
                        <div class="file-drop-zone rounded-lg p-4 text-center border-2 border-dashed border-orange-300">
                            <input type="file" name="arquivoNF" accept=".pdf,.xml" class="hidden" required onchange="handleFileSelect(this)">
                            <div class="file-drop-content">
                                <button type="button" class="bg-orange-primary text-white px-4 py-2 rounded-lg hover:bg-orange-secondary transition-all" onclick="this.parentElement.parentElement.querySelector('input[type=file]').click()">
                                    Escolher ficheiro
                                </button>
                                <p class="text-gray-500 text-sm mt-2">Nenhum ficheiro selecionado</p>
                            </div>
                            <div class="file-selected hidden">
                                <i class="fas fa-file-pdf text-red-500 text-2xl mb-2"></i>
                                <p class="file-name text-gray-700 font-medium"></p>
                                <button type="button" class="text-red-500 hover:text-red-700 mt-1" onclick="removeFile(this)">
                                    <i class="fas fa-times"></i> Remover
                                </button>
                            </div>
                        </div>
                        <div class="invalid-feedback hidden text-red-500 text-xs mt-1"></div>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', nfHTML);
        this.setupFileDropZone(nfId);
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

    calcularTotalPedido(pedidoId) {
        const pedidoDiv = document.getElementById(pedidoId);
        if (!pedidoDiv) return 0;
        
        const nfInputs = pedidoDiv.querySelectorAll('[name="valorNF"]');
        
        let total = 0;
        
        nfInputs.forEach(input => {
            const valor = input.value;
            if (valor) {
                // Remove formatação e converte para número
                const numeroLimpo = valor.replace(/[^\d,]/g, '').replace(',', '.');
                const valorNumerico = parseFloat(numeroLimpo);
                if (!isNaN(valorNumerico)) {
                    total += valorNumerico;
                }
            }
        });
        
        return total;
    }

    calcularTotalGeral() {
        let totalGeral = 0;
        document.querySelectorAll('.pedido-content').forEach(pedidoDiv => {
            const pedidoId = pedidoDiv.id;
            const totalPedido = this.calcularTotalPedido(pedidoId);
            totalGeral += totalPedido;
        });
        return totalGeral;
    }

    savePedidosData() {
        this.formData.pedidos = [];
        this.formData.arquivos = [];
        
        document.querySelectorAll('.pedido-content').forEach(pedidoDiv => {
            const pedidoId = pedidoDiv.id;
            const numeroPedidoInput = pedidoDiv.querySelector('[name="numeroPedido"]');
            if (!numeroPedidoInput) return;
            
            const numeroPedido = numeroPedidoInput.value;
            const valorCalculado = this.calcularTotalPedido(pedidoId);
            
            const pedido = {
                numero: numeroPedido,
                valor: valorCalculado.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }),
                notasFiscais: []
            };
            
            pedidoDiv.querySelectorAll('.nota-fiscal-item').forEach(nfDiv => {
                const numeroNF = nfDiv.querySelector('[name="numeroNF"]')?.value;
                const valorNF = nfDiv.querySelector('[name="valorNF"]')?.value;
                const arquivoNF = nfDiv.querySelector('[name="arquivoNF"]')?.files[0];
                
                if (numeroNF && valorNF) {
                    const notaFiscal = {
                        numero: numeroNF,
                        valor: valorNF
                    };
                    
                    if (arquivoNF) {
                        notaFiscal.arquivo = arquivoNF;
                        this.formData.arquivos.push({
                            file: arquivoNF,
                            pedido: numeroPedido,
                            nf: numeroNF
                        });
                    }
                    
                    pedido.notasFiscais.push(notaFiscal);
                }
            });
            
            if (pedido.notasFiscais.length > 0) {
                this.formData.pedidos.push(pedido);
            }
        });
    }

    generateResumo() {
        const resumoContainer = document.getElementById('resumo-agendamento');
        
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

        const totalGeral = this.calcularTotalGeral();
        const totalFormatado = totalGeral.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
        
        const resumoHTML = `
            <div class="grid md:grid-cols-2 gap-6">
                <div class="bg-gradient-to-r from-orange-primary to-orange-secondary rounded-xl p-6 text-white">
                    <h4 class="text-xl font-bold mb-4"><i class="fas fa-building mr-2"></i>Dados do Fornecedor</h4>
                    <div class="space-y-2">
                        <p><strong>Empresa:</strong> ${this.formData.fornecedor.nomeEmpresa}</p>
                        <p><strong>Responsável:</strong> ${this.formData.fornecedor.nomeResponsavel}</p>
                        <p><strong>E-mail:</strong> ${this.formData.fornecedor.email}</p>
                        <p><strong>Telefone:</strong> ${this.formData.fornecedor.telefone}</p>
                        <p><strong>Documento:</strong> ${this.formData.fornecedor.documento}</p>
                    </div>
                </div>
                
                <div class="bg-gradient-to-r from-orange-secondary to-orange-accent rounded-xl p-6 text-white">
                    <h4 class="text-xl font-bold mb-4"><i class="fas fa-truck mr-2"></i>Dados da Entrega</h4>
                    <div class="space-y-2">
                        <p><strong>Destino:</strong> ${cdNames[this.formData.entrega.cdDestino]}</p>
                        <p><strong>Tipo de Carga:</strong> ${tipoCargas[this.formData.entrega.tipoCarga]}</p>
                        <p><strong>Data:</strong> ${(() => { const [a,m,d]=this.formData.entrega.dataEntrega.split('-'); return `${d}/${m}/${a}`; })()}</p>
                        <p><strong>Horário:</strong> ${this.formData.entrega.horarioEntrega}</p>
                        ${this.formData.entrega.observacoes ? `<p><strong>Observações:</strong> ${this.formData.entrega.observacoes}</p>` : ''}
                    </div>
                </div>
            </div>
            
            <div class="mt-6">
                <div class="bg-gradient-to-r from-orange-accent to-orange-light rounded-xl p-6 text-white">
                    <div class="flex justify-between items-center mb-4">
                        <h4 class="text-xl font-bold"><i class="fas fa-file-invoice mr-2"></i>Pedidos e Notas Fiscais</h4>
                        <div class="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                            <span class="text-lg font-bold">Total Geral: ${totalFormatado}</span>
                        </div>
                    </div>
                    <div class="space-y-4">
                        ${this.formData.pedidos.map(pedido => `
                            <div class="bg-white bg-opacity-20 rounded-lg p-4">
                                <div class="flex justify-between items-center mb-2">
                                    <h5 class="font-semibold">Pedido: ${pedido.numero}</h5>
                                    <span class="bg-white bg-opacity-30 px-3 py-1 rounded-lg font-bold">Valor: ${pedido.valor}</span>
                                </div>
                                <div class="text-sm space-y-1">
                                    ${pedido.notasFiscais.map(nf => `
                                        <div class="flex justify-between items-center">
                                            <span>NF: ${nf.numero}</span>
                                            <div class="flex items-center space-x-2">
                                                ${nf.valor ? `<span class="bg-white bg-opacity-20 px-2 py-1 rounded">R$ ${nf.valor}</span>` : ''}
                                                ${nf.arquivo ? '<i class="fas fa-file-pdf text-green-200" title="PDF anexado"></i>' : '<i class="fas fa-exclamation-triangle text-yellow-200" title="PDF não anexado"></i>'}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
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
                fornecedor: this.formData.fornecedor,
                entrega: this.formData.entrega,
                pedidos: this.formData.pedidos.map(p => ({
                    numero: p.numero,
                    valor: p.valor,
                    notasFiscais: p.notasFiscais.map(nf => ({
                        numero: nf.numero,
                        valor: nf.valor
                    }))
                }))
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
                throw new Error('Erro ao processar agendamento');
            }
            
        } catch (error) {
            console.error('Erro:', error);
            this.showNotification('Erro ao processar agendamento. Tente novamente.', 'error');
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
        
        document.querySelector('main .max-w-4xl').innerHTML = successHTML;
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
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
        
        document.getElementById('notification-container').appendChild(notification);
        
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
let agendamentoForm;

function nextStep() {
    agendamentoForm.nextStep();
}

function previousStep() {
    agendamentoForm.previousStep();
}

function addPedido() {
    agendamentoForm.addPedido();
}

function showPedido(pedidoId) {
    agendamentoForm.showPedido(pedidoId);
}

function removePedido(pedidoId) {
    if (confirm('Tem certeza que deseja remover este pedido?')) {
        document.getElementById(pedidoId).remove();
        document.getElementById(`tab-${pedidoId}`).remove();
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
        document.getElementById(nfId).remove();
        // Recalcular total do pedido após remoção
        agendamentoForm.calcularTotalPedido(pedidoId);
    }
}

function calcularTotalPedido(pedidoId) {
    agendamentoForm.calcularTotalPedido(pedidoId);
}

function handleFileSelect(input) {
    const file = input.files[0];
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
    let value = input.value.replace(/\D/g, '');
    value = (value / 100).toFixed(2);
    value = value.replace('.', ',');
    value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    input.value = value;
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    agendamentoForm = new AgendamentoForm();

    // Intercepta submit do formulário principal
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            agendamentoForm.submitForm();
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
        const cdNome = cdInput.value;
        const cdId = cdMap[cdNome];
        const date = dateInput.value;
        if (cdId && date) {
            if (horarioSelect) horarioSelect.disabled = false;
            agendamentoForm.loadAvailableHours(date, cdId);
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
});