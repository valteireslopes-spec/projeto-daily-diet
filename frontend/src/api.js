const API_URL = 'http://localhost:3333/api';

export async function api(path, { token, ...options } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Ocorreu um erro na comunicação com o servidor.');
  return data;
}
// Essa função recebe o ID e faz o pedido GET para a rota que você já tem no backend
export async function getMealById(id) {
  const response = await api.get(`/meals/${id}`);
  return response.data.meal; // Pegamos apenas os dados da refeição
}
