// Configuração global da API para o BrisaLOG2
const API_BASE_URL = "https://brisalog-back.onrender.com";

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