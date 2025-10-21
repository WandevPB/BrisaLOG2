// apiRequest.js
const API_BASE_URL = typeof getApiBaseUrl === 'function' ? getApiBaseUrl() : 'https://brisalog-back.onrender.com';

window.apiRequest = async function(endpoint, options = {}) {
  const token = sessionStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro na requisição [${response.status}]: ${text}`);
  }

  return response.json();
}
