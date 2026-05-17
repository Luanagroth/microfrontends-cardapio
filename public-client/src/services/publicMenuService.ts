import { API_BASE } from '../../../shared/apiBase';

async function handleResponse(response) {
  if (!response.ok) {
    const message = await response.text().catch(() => `HTTP ${response.status}`);
    throw new Error(message || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function getPublicMenuProducts() {
  const response = await fetch(`${API_BASE}/products`);
  return handleResponse(response);
}
