import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchReservations,
  fetchOrders,
  fetchCurriculums,
  updateCurriculumStatus,
  updateReservationStatus
} from '../src/services/api';

describe('container api service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchReservations retorna lista de reservas', async () => {
    const mockData = [{ id: 1, nome: 'Reserva A' }];
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData
    });

    const result = await fetchReservations();
    expect(result).toEqual(mockData);
  });

  it('fetchOrders retorna lista de comandas', async () => {
    const mockData = [{ id: 10, tableNumber: '05' }];
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData
    });

    const result = await fetchOrders();
    expect(result).toEqual(mockData);
  });

  it('fetchCurriculums retorna lista de curriculos', async () => {
    const mockData = [{ id: 7, nome: 'Candidato' }];
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData
    });

    const result = await fetchCurriculums();
    expect(result).toEqual(mockData);
  });

  it('updateCurriculumStatus envia PATCH com status', async () => {
    const updated = { id: 7, status: 'EM_ANALISE' };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => updated
    });

    const result = await updateCurriculumStatus(7, 'EM_ANALISE');

    expect(result).toEqual(updated);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/curriculums/7/status',
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      })
    );
  });

  it('updateReservationStatus envia PATCH com status', async () => {
    const updated = { id: 3, status: 'CONFIRMADA' };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => updated
    });

    const result = await updateReservationStatus(3, 'CONFIRMADA');

    expect(result).toEqual(updated);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/reservations/3/status',
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      })
    );
  });

  it('retorna null quando resposta for 204', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 204
    });

    const result = await fetchReservations();
    expect(result).toBeNull();
  });

  it('lanca erro quando backend responde com falha', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Erro interno'
    });

    await expect(fetchOrders()).rejects.toThrow('Erro interno');
  });
});
