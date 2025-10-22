// Configuração global da API para o BrisaLOG2
const API_BASE_URL = "http://54.94.40.122:10000";

// Função auxiliar para fazer requisições com tratamento de erro
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        return response;
    } catch (error) {
        console.error('Erro na requisição da API:', error);
        throw error;
    }
}