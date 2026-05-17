import React, { useState } from 'react';
import { submitCurriculum } from '../services/curriculumService';
import { PUBLIC_MESSAGES } from '../constants/messages';

const initialFormData = {
  nome: '',
  telefone: '',
  email: '',
  mensagem: '',
  arquivo: null
};

const WorkWithUsForm = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null, form: null }));
    setSuccessMessage('');
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0] || null;
    setFormData((prev) => ({ ...prev, arquivo: file }));
    setErrors((prev) => ({ ...prev, arquivo: null, form: null }));
    setSuccessMessage('');
  };

  const validate = () => {
    const nextErrors = {};
    const email = formData.email.trim();

    if (!formData.nome.trim()) nextErrors.nome = 'Nome e obrigatorio';
    if (!formData.telefone.trim()) nextErrors.telefone = 'Telefone e obrigatorio';
    if (!email) nextErrors.email = 'E-mail e obrigatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) nextErrors.email = 'E-mail invalido';
    if (!formData.arquivo) nextErrors.arquivo = 'Envie seu curriculo em PDF';
    if (formData.arquivo && formData.arquivo.type !== 'application/pdf') nextErrors.arquivo = 'O arquivo deve ser PDF';

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    setSuccessMessage('');
    try {
      await submitCurriculum({
        ...formData,
        nome: formData.nome.trim(),
        telefone: formData.telefone.trim(),
        email: formData.email.trim(),
        mensagem: formData.mensagem.trim()
      });
      setFormData(initialFormData);
      event.target.reset();
      setSuccessMessage('Candidatura recebida com sucesso. Obrigado pelo interesse!');
    } catch (err) {
      console.error(err);
      setErrors({ form: PUBLIC_MESSAGES.SEND_CURRICULUM_ERROR });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="career-form" onSubmit={handleSubmit} noValidate>
      {successMessage && <div className="form-success">{successMessage}</div>}
      {errors.form && <div className="form-error">{errors.form}</div>}

      <label>
        Nome
        <input
          name="nome"
          value={formData.nome}
          onChange={handleChange}
          placeholder="Nome completo"
          className={errors.nome ? 'invalid' : ''}
          aria-invalid={!!errors.nome}
        />
        {errors.nome && <small className="error-text">{errors.nome}</small>}
      </label>

      <label>
        Telefone
        <input
          name="telefone"
          value={formData.telefone}
          onChange={handleChange}
          placeholder="(00) 00000-0000"
          className={errors.telefone ? 'invalid' : ''}
          aria-invalid={!!errors.telefone}
        />
        {errors.telefone && <small className="error-text">{errors.telefone}</small>}
      </label>

      <label>
        E-mail
        <input
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="seu@email.com"
          className={errors.email ? 'invalid' : ''}
          aria-invalid={!!errors.email}
        />
        {errors.email && <small className="error-text">{errors.email}</small>}
      </label>

      <label>
        Curriculo em PDF
        <input
          name="arquivo"
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className={errors.arquivo ? 'invalid' : ''}
          aria-invalid={!!errors.arquivo}
        />
        {formData.arquivo && <small className="file-name">{formData.arquivo.name}</small>}
        {errors.arquivo && <small className="error-text">{errors.arquivo}</small>}
      </label>

      <label>
        Mensagem
        <textarea
          name="mensagem"
          value={formData.mensagem}
          onChange={handleChange}
          placeholder="Por que voce quer fazer parte do Essenza Bistro?"
          rows="4"
        />
      </label>

      <button type="submit" className="button button-primary" disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar candidatura'}
      </button>
    </form>
  );
};

export default WorkWithUsForm;
