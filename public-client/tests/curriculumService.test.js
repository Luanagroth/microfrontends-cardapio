import { describe, it, expect, vi, afterEach } from 'vitest';
import { submitCurriculum } from '../src/services/curriculumService';

describe('submitCurriculum', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('envia formulario com PDF e retorna curriculo criado', async () => {
    const created = {
      id: 55,
      nome: 'Candidato',
      email: 'candidato@exemplo.com',
      status: 'NOVO',
      fileUrl: 'http://localhost:4000/uploads/curriculums/file.pdf'
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => created
    });

    const result = await submitCurriculum({
      nome: 'Candidato',
      telefone: '(11) 98888-0000',
      email: 'candidato@exemplo.com',
      mensagem: 'Segue curriculo',
      arquivo: new Blob(['%PDF-1.4 test'], { type: 'application/pdf' })
    });

    expect(result).toEqual(created);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/curriculums',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('lanca erro quando upload falha no backend', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      text: async () => 'Curriculo em PDF e obrigatorio'
    });

    await expect(
      submitCurriculum({
        nome: 'Candidato',
        telefone: '(11) 98888-0000',
        email: 'candidato@exemplo.com',
        arquivo: new Blob(['x'], { type: 'application/pdf' })
      })
    ).rejects.toThrow('Curriculo em PDF e obrigatorio');
  });
});
