import { API_BASE } from '../../../shared/apiBase';

async function handleResponse(response) {
  if (!response.ok) {
    const message = await response.text().catch(() => `HTTP ${response.status}`);
    throw new Error(message || `HTTP ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function fetchOrderProducts() {
  const response = await fetch(`${API_BASE}/products`);
  return handleResponse(response);
}

export async function fetchOrders() {
  const response = await fetch(`${API_BASE}/orders`);
  return handleResponse(response);
}

export async function createOrder(payload) {
  const response = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function updateOrder(id, payload) {
  const response = await fetch(`${API_BASE}/orders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}
