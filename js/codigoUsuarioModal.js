// Modal de Validação de Código de Usuário
class CodigoUsuarioModal {
    constructor() {
        this.cdId = null;
        this.callback = null;
        this.createModal();
    }

    createModal() {
        const modalHTML = `
            <div id="codigo-usuario-modal" class="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 hidden">
                <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all">
                    <!-- Header -->
                    <div class="text-center mb-6">
                        <div class="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                            <i class="fas fa-user-shield text-orange-primary text-2xl"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-900">Autenticação Necessária</h3>
                        <p class="text-gray-600 mt-2">Informe seu código de usuário para continuar</p>
                    </div>

                    <!-- Form -->
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">
                                <i class="fas fa-id-badge mr-2 text-orange-primary"></i>
                                Código de Usuário
                            </label>
                            <input 
                                type="text" 
                                id="input-codigo-usuario"
                                class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-primary focus:ring-2 focus:ring-orange-primary focus:ring-opacity-20 transition-all uppercase text-center text-lg font-mono tracking-wider"
                                placeholder="Ex: BH001"
                                maxlength="10"
                                autocomplete="off"
                            >
                            <p class="text-xs text-gray-500 mt-2">
                                <i class="fas fa-info-circle mr-1"></i>
                                Digite o código fornecido pelo administrador
                            </p>
                        </div>

                        <!-- Mensagem de erro -->
                        <div id="codigo-error-message" class="hidden bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            <i class="fas fa-exclamation-circle mr-2"></i>
                            <span id="codigo-error-text"></span>
                        </div>

                        <!-- Botões -->
                        <div class="flex space-x-3 mt-6">
                            <button 
                                onclick="codigoUsuarioModal.cancelar()"
                                class="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-semibold">
                                <i class="fas fa-times mr-2"></i>
                                Cancelar
                            </button>
                            <button 
                                onclick="codigoUsuarioModal.validar()"
                                class="flex-1 px-6 py-3 bg-gradient-to-r from-orange-primary to-orange-secondary text-white rounded-lg hover:shadow-lg transition-all font-semibold">
                                <i class="fas fa-check mr-2"></i>
                                Confirmar
                            </button>
                        </div>
                    </div>

                    <!-- Loading -->
                    <div id="codigo-loading" class="hidden text-center py-4">
                        <i class="fas fa-spinner fa-spin text-orange-primary text-2xl"></i>
                        <p class="text-gray-600 mt-2">Validando código...</p>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('codigo-usuario-modal');
        this.input = document.getElementById('input-codigo-usuario');
        
        // Enter para confirmar
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.validar();
            }
        });

        // Auto uppercase
        this.input.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    abrir(cdId, callback) {
        this.cdId = cdId;
        this.callback = callback;
        this.modal.classList.remove('hidden');
        this.input.value = '';
        this.esconderErro();
        
        // Focus no input
        setTimeout(() => {
            this.input.focus();
        }, 100);
    }

    fechar() {
        this.modal.classList.add('hidden');
        this.input.value = '';
        this.esconderErro();
    }

    cancelar() {
        this.fechar();
        if (this.callback) {
            this.callback(null);
        }
    }

    mostrarErro(mensagem) {
        const errorDiv = document.getElementById('codigo-error-message');
        const errorText = document.getElementById('codigo-error-text');
        errorText.textContent = mensagem;
        errorDiv.classList.remove('hidden');
    }

    esconderErro() {
        const errorDiv = document.getElementById('codigo-error-message');
        errorDiv.classList.add('hidden');
    }

    mostrarLoading(show) {
        const loading = document.getElementById('codigo-loading');
        const form = this.input.closest('.space-y-4');
        
        if (show) {
            loading.classList.remove('hidden');
            form.classList.add('hidden');
        } else {
            loading.classList.add('hidden');
            form.classList.remove('hidden');
        }
    }

    async validar() {
        const codigo = this.input.value.trim();

        if (!codigo) {
            this.mostrarErro('Por favor, informe o código de usuário');
            this.input.focus();
            return;
        }

        try {
            this.mostrarLoading(true);
            this.esconderErro();

            const response = await fetch(`${API_BASE_URL}/api/usuarios/validar-codigo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    codigo: codigo,
                    cdId: this.cdId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao validar código');
            }

            // Código válido
            this.mostrarLoading(false);
            this.fechar();
            
            if (this.callback) {
                this.callback({
                    valido: true,
                    usuario: data.usuario
                });
            }

        } catch (error) {
            this.mostrarLoading(false);
            this.mostrarErro(error.message);
            this.input.focus();
            this.input.select();
        }
    }
}

// Instância global
let codigoUsuarioModal;

// Inicializar quando DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    codigoUsuarioModal = new CodigoUsuarioModal();
});

// Função helper para solicitar código antes de ação
function solicitarCodigoUsuario(cdId) {
    return new Promise((resolve) => {
        if (!codigoUsuarioModal) {
            codigoUsuarioModal = new CodigoUsuarioModal();
        }
        codigoUsuarioModal.abrir(cdId, resolve);
    });
}
