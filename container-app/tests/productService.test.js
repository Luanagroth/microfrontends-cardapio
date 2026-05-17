import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchProducts,
  fetchCategories,
  createProduct,
  updateProduct,
  uploadProductImage,
  deleteProduct
} from '../src/services/productService.ts';

describe('product service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchProducts retorna produtos', async () => {
    const mockData = [{ id: 1, name: 'Prato A' }];
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData
    });

    const result = await fetchProducts();
    expect(result).toEqual(mockData);
  });

  it('fetchCategories retorna categorias', async () => {
    const mockData = [{ id: 1, key: 'entradas', label: 'Entradas' }];
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData
    });

    const result = await fetchCategories();
    expect(result).toEqual(mockData);
  });

  it('createProduct envia payload', async () => {
    const payload = { name: 'Novo', price: 45 };
    const created = { id: 11, ...payload };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => created
    });

    const result = await createProduct(payload);
    expect(result).toEqual(created);
  });

  it('updateProduct envia payload', async () => {
    const payload = { name: 'Atualizado', price: 50 };
    const updated = { id: 11, ...payload };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => updated
    });

    const result = await updateProduct(11, payload);
    expect(result).toEqual(updated);
  });

  it('uploadProductImage envia FormData', async () => {
    const uploaded = { imageUrl: 'http://localhost:4000/uploads/products/a.png' };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => uploaded
    });

    const result = await uploadProductImage(new Blob(['x'], { type: 'image/png' }));
    expect(result).toEqual(uploaded);
  });

  it('deleteProduct trata resposta 204', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 204
    });

    const result = await deleteProduct(11);
    expect(result).toBeNull();
  });
});
