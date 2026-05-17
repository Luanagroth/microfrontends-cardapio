import React, { useState } from 'react';
import { createReservation } from '../services/api';

const SUCCESS_MESSAGE =
  'Reserva enviada com sucesso! Confira seu e-mail, spam ou lixo eletronico para confirmar sua reserva.';

const INITIAL_FORM_DATA = {
  nome: '',
  telefone: '',
  email: '',
  data: '',
  horario: '',
  pessoas: '2',
  observacao: ''
};

const ReservationForm = ({ onAddReservation }) => {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
    setSuccessMessage('');
    setErrorMessage('');
  };

  const validate = (data) => {
    const e = {};
    if (!data.nome || !data.nome.trim()) e.nome = 'Nome e obrigatorio';
    if (!data.telefone || !data.telefone.trim()) e.telefone = 'Telefone e obrigatorio';
    if (!data.email || !data.email.trim()) e.email = 'E-mail e obrigatorio';
    else if (!/^\S+@\S+\.\S+$/.test(data.email.trim())) e.email = 'Informe um e-mail valido';
    if (!data.data) e.data = 'Data e obrigatoria';
    if (!data.horario) e.horario = 'Horario e obrigatorio';
    if (!data.pessoas || Number(data.pessoas) <= 0) e.pessoas = 'Quantidade deve ser maior que zero';
    return e;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const e = validate(formData);
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const dateISO = new Date(`${formData.data}T${formData.horario}`).toISOString();
      const payload = {
        nome: formData.nome.trim(),
        telefone: formData.telefone.trim(),
        email: formData.email.trim(),
        date: dateISO,
        pessoas: Number(formData.pessoas),
        observacao: formData.observacao.trim()
      };

      const created = await createReservation(payload);
      if (typeof onAddReservation === 'function') onAddReservation(created);
      setSuccessMessage(SUCCESS_MESSAGE);
      setShowSuccessDialog(true);
      setFormData(INITIAL_FORM_DATA);
      setErrors({});
    } catch (err) {
      console.error(err);
      setErrorMessage('Erro ao realizar reserva');
    } finally {
      setLoading(false);
    }
  };

  const closeSuccessDialog = () => {
    setShowSuccessDialog(false);
  };

  return (
    <form className="reservation-form" onSubmit={handleSubmit} noValidate>
      {errorMessage && <div className="form-error">{errorMessage}</div>}

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
          placeholder="seuemail@exemplo.com"
          className={errors.email ? 'invalid' : ''}
          aria-invalid={!!errors.email}
        />
        {errors.email && <small className="error-text">{errors.email}</small>}
      </label>

      <div className="reservation-row">
        <label>
          Data
          <input name="data" type="date" value={formData.data} onChange={handleChange} className={errors.data ? 'invalid' : ''} aria-invalid={!!errors.data} />
          {errors.data && <small className="error-text">{errors.data}</small>}
        </label>
        <label>
          Horario
          <input name="horario" type="time" value={formData.horario} onChange={handleChange} className={errors.horario ? 'invalid' : ''} aria-invalid={!!errors.horario} />
          {errors.horario && <small className="error-text">{errors.horario}</small>}
        </label>
      </div>

      <label>
        Quantidade de pessoas
        <select name="pessoas" value={formData.pessoas} onChange={handleChange} className={errors.pessoas ? 'invalid' : ''} aria-invalid={!!errors.pessoas}>
          <option value="1">1 pessoa</option>
          <option value="2">2 pessoas</option>
          <option value="3">3 pessoas</option>
          <option value="4">4 pessoas</option>
          <option value="5">5 pessoas</option>
          <option value="6">6 pessoas</option>
        </select>
        {errors.pessoas && <small className="error-text">{errors.pessoas}</small>}
      </label>

      <label>
        Observacao opcional
        <textarea
          name="observacao"
          value={formData.observacao}
          onChange={handleChange}
          placeholder="Ex.: mesa perto da janela"
          rows="4"
        />
      </label>

      <button type="submit" className="button button-primary" disabled={loading}>
        {loading ? 'Enviando...' : 'Confirmar reserva'}
      </button>

      {showSuccessDialog && (
        <div className="reservation-success-backdrop" role="presentation" onClick={closeSuccessDialog}>
          <section className="reservation-success-dialog" role="dialog" aria-modal="true" aria-labelledby="reservation-success-title" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="reservation-success-close" aria-label="Fechar aviso" onClick={closeSuccessDialog}>
              X
            </button>
            <h3 id="reservation-success-title">Reserva enviada com sucesso!</h3>
            <p>{successMessage}</p>
            <button type="button" className="button button-primary" onClick={closeSuccessDialog}>
              Fechar
            </button>
          </section>
        </div>
      )}
    </form>
  );
};

export default ReservationForm;
