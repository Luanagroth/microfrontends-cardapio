import { API_BASE } from '../../../shared/apiBase';

async function handleResponse(response) {
  if (!response.ok) {
    const message = await response.text().catch(() => `HTTP ${response.status}`);
    throw new Error(message || `HTTP ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function fetchReservations() {
  const response = await fetch(`${API_BASE}/reservations`);
  return handleResponse(response);
}

export async function fetchOrders() {
  const response = await fetch(`${API_BASE}/orders`);
  return handleResponse(response);
}

export async function fetchCurriculums() {
  const response = await fetch(`${API_BASE}/curriculums`);
  return handleResponse(response);
}

export async function updateCurriculumStatus(id, status) {
  const response = await fetch(`${API_BASE}/curriculums/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return handleResponse(response);
}

export async function updateReservationStatus(id, status) {
  const response = await fetch(`${API_BASE}/reservations/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return handleResponse(response);
}
