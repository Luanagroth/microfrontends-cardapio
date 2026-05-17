import { API_BASE } from '../../../shared/apiBase';

async function handleResponse(response) {
  if (!response.ok) {
    const message = await response.text().catch(() => `HTTP ${response.status}`);
    throw new Error(message || `HTTP ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function fetchProducts() {
  const response = await fetch(`${API_BASE}/products`);
  return handleResponse(response);
}

export async function fetchCategories() {
  const response = await fetch(`${API_BASE}/categories`);
  return handleResponse(response);
}

export async function createProduct(payload) {
  const response = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function updateProduct(id, payload) {
  const response = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function uploadProductImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE}/uploads/products`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(response);
}

export async function deleteProduct(id) {
  const response = await fetch(`${API_BASE}/products/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}
