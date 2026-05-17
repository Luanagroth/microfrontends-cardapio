import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchCurriculums, updateCurriculumStatus } from '../services/api';
import { INTERNAL_MESSAGES } from '../constants/messages';

const STATUS_OPTIONS = ['NOVO', 'EM_ANALISE', 'APROVADO', 'RECUSADO'];

const STATUS_LABELS = {
  NOVO: 'Novo',
  EM_ANALISE: 'Em analise',
  APROVADO: 'Aprovado',
  RECUSADO: 'Recusado'
};

const formatDateTime = (dateLike) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateLike));

const formatFileSize = (size = 0) => {
  if (!size) return '0 KB';
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const CurriculumManager = () => {
  const [curriculums, setCurriculums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [error, setError] = useState('');
  const [lastSyncAt, setLastSyncAt] = useState(null);

  const loadCurriculums = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const items = await fetchCurriculums();
      setCurriculums(items);
      setLastSyncAt(new Date());
    } catch (err) {
      console.error(err);
      setError(INTERNAL_MESSAGES.LOAD_CURRICULUMS_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurriculums();
  }, [loadCurriculums]);

  const filteredCurriculums = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return curriculums.filter((item) => {
      const matchesStatus = statusFilter === 'TODOS' || item.status === statusFilter;
      const matchesQuery =
        !normalizedQuery ||
        item.nome.toLowerCase().includes(normalizedQuery) ||
        item.email.toLowerCase().includes(normalizedQuery) ||
        item.telefone.toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [curriculums, query, statusFilter]);

  const counters = useMemo(() => ({
    total: curriculums.length,
    novos: curriculums.filter((item) => item.status === 'NOVO').length,
    analise: curriculums.filter((item) => item.status === 'EM_ANALISE').length,
    aprovados: curriculums.filter((item) => item.status === 'APROVADO').length
  }), [curriculums]);

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id);
    setError('');
    try {
      const updated = await updateCurriculumStatus(id, status);
      setCurriculums((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (err) {
      console.error(err);
      setError(INTERNAL_MESSAGES.UPDATE_CURRICULUM_STATUS_ERROR);
    } finally {
      setUpdatingId(null);
    }
  };

  const syncText = lastSyncAt
    ? `Atualizado ${lastSyncAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Sincronizando dados';

  return (
    <section className="curriculum-dashboard" aria-label="Curriculos enviados">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Diretoria</p>
          <h2>Curriculos recebidos</h2>
          <span>Candidaturas enviadas pelo site publico com arquivo PDF original.</span>
          <span className="sync-status">{syncText}</span>
        </div>
        <button type="button" className="ghost-button" onClick={loadCurriculums}>
          {loading ? 'Carregando...' : 'Atualizar'}
        </button>
      </div>

      {error ? <div className="form-error">{error}</div> : null}

      <div className="counter-grid curriculum-counters">
        <article className="counter-card"><span>Total</span><strong>{counters.total}</strong></article>
        <article className="counter-card active"><span>Novos</span><strong>{counters.novos}</strong></article>
        <article className="counter-card finished"><span>Em analise</span><strong>{counters.analise}</strong></article>
        <article className="counter-card"><span>Aprovados</span><strong>{counters.aprovados}</strong></article>
      </div>

      <div className="filter-bar curriculum-filter">
        <label>
          Buscar
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome, email ou telefone" />
        </label>
        <label>
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="TODOS">Todos</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>{STATUS_LABELS[status]}</option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="empty compact-empty">Carregando curriculos...</div>
      ) : filteredCurriculums.length === 0 ? (
        <div className="empty compact-empty">Nenhum curriculo encontrado.</div>
      ) : (
        <div className="curriculum-list">
          {filteredCurriculums.map((item) => (
            <article key={item.id} className="curriculum-card">
              <div className="curriculum-main">
                <div>
                  <h3>{item.nome}</h3>
                  <span>{item.email}</span>
                  <span>{item.telefone}</span>
                </div>
                <em className={`curriculum-status ${item.status.toLowerCase()}`}>{STATUS_LABELS[item.status] || item.status}</em>
              </div>

              <div className="curriculum-meta">
                <div><span>Enviado em</span><strong>{formatDateTime(item.createdAt)}</strong></div>
                <div><span>Arquivo</span><strong>{item.originalName}</strong></div>
                <div><span>Tamanho</span><strong>{formatFileSize(item.size)}</strong></div>
              </div>

              {item.mensagem ? <p className="curriculum-message">{item.mensagem}</p> : null}

              <div className="curriculum-actions">
                <label>
                  Status
                  <select
                    value={item.status}
                    onChange={(event) => handleStatusChange(item.id, event.target.value)}
                    disabled={updatingId === item.id}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                    ))}
                  </select>
                </label>
                <a className="primary-button curriculum-open" href={item.fileUrl} target="_blank" rel="noreferrer">
                  Abrir PDF
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default CurriculumManager;
