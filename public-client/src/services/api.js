import { API_BASE } from '../../../shared/apiBase';

export async function createReservation(payload) {
  const res = await fetch(`${API_BASE}/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json();
}
