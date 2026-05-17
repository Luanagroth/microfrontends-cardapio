import { describe, it, expect, vi, afterEach } from 'vitest';
import { createReservation } from '../src/services/api';

describe('createReservation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('envia reserva e retorna payload quando resposta for 201', async () => {
    const payload = {
      nome: 'Teste',
      telefone: '(11) 90000-0000',
      email: 'teste@exemplo.com',
      date: '2026-05-20T18:00:00.000Z',
      pessoas: 2
    };
    const expected = { id: 123, status: 'PENDENTE', ...payload };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => expected
    });

    const result = await createReservation(payload);

    expect(result).toEqual(expected);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/reservations',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    );
  });

  it('lanca erro quando backend responde com falha', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Campos obrigatorios ausentes'
    });

    await expect(createReservation({ nome: 'Teste' })).rejects.toThrow(
      'Campos obrigatorios ausentes'
    );
  });
});
