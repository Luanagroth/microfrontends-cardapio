import { API_BASE } from '../../../shared/apiBase';

export async function submitCurriculum(payload) {
  const formData = new FormData();
  formData.append('nome', payload.nome);
  formData.append('telefone', payload.telefone);
  formData.append('email', payload.email);
  formData.append('mensagem', payload.mensagem || '');
  formData.append('arquivo', payload.arquivo);

  const response = await fetch(`${API_BASE}/curriculums`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const message = await response.text().catch(() => 'Erro ao enviar curriculo');
    throw new Error(message || 'Erro ao enviar curriculo');
  }

  return response.json();
}
