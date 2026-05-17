import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchOrderProducts,
  fetchOrders,
  createOrder,
  updateOrder
} from '../src/services/orderService.ts';

describe('order service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchOrderProducts retorna lista de produtos', async () => {
    const mockData = [{ id: 1, name: 'Lasanha' }];
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData
    });

    const result = await fetchOrderProducts();
    expect(result).toEqual(mockData);
  });

  it('fetchOrders retorna lista de comandas', async () => {
    const mockData = [{ id: 10, tableNumber: '01', status: 'aberta' }];
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData
    });

    const result = await fetchOrders();
    expect(result).toEqual(mockData);
  });

  it('createOrder envia payload e retorna comanda criada', async () => {
    const payload = {
      tableNumber: '02',
      items: [{ productId: 1, name: 'Risoto', price: 48, quantity: 1 }]
    };
    const created = { id: 77, ...payload, status: 'aberta' };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => created
    });

    const result = await createOrder(payload);
    expect(result).toEqual(created);
  });

  it('updateOrder envia payload e retorna comanda atualizada', async () => {
    const payload = { status: 'fechada' };
    const updated = { id: 77, status: 'fechada' };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => updated
    });

    const result = await updateOrder(77, payload);
    expect(result).toEqual(updated);
  });

  it('retorna null quando resposta for 204', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 204
    });

    const result = await fetchOrders();
    expect(result).toBeNull();
  });

  it('lanca erro quando backend responde com falha', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'A comanda precisa ter pelo menos um item'
    });

    await expect(createOrder({ tableNumber: '03', items: [] })).rejects.toThrow(
      'A comanda precisa ter pelo menos um item'
    );
  });
});
