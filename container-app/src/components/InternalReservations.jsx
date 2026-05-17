import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchReservations, updateReservationStatus } from '../services/api';
import { INTERNAL_MESSAGES } from '../constants/messages';

const STATUS_OPTIONS = ['PENDENTE', 'CONFIRMADA', 'CANCELADA', 'FINALIZADA'];
const ACTIVE_RESERVATION_STATUSES = ['PENDENTE', 'CONFIRMADA'];
const AUTO_REFRESH_MS = 15000;

const statusClass = (status = '') => status.toLowerCase();

const ReservationSkeleton = () => (
  <article className="reservation-card skeleton-card">
    <div className="skeleton-line title" />
    <div className="reservation-details">
      <div className="skeleton-box" />
      <div className="skeleton-box" />
      <div className="skeleton-box" />
      <div className="skeleton-box" />
    </div>
    <div className="skeleton-line" />
  </article>
);

const formatReservationDate = (date) => {
  const parsed = new Date(date);
  return {
    date: parsed.toLocaleDateString(),
    time: parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
};

const getReservationDate = (reservation) => new Date(reservation.date);

const isSameDay = (date, reference) =>
  date.getFullYear() === reference.getFullYear() &&
  date.getMonth() === reference.getMonth() &&
  date.getDate() === reference.getDate();

const isExpiredReservation = (reservation) =>
  getReservationDate(reservation).getTime() < Date.now();

const isActiveReservation = (reservation) =>
  ACTIVE_RESERVATION_STATUSES.includes(reservation.status) && !isExpiredReservation(reservation);

const matchesReservationDate = (reservation, dateValue) => {
  if (!dateValue) return true;
  const start = new Date(`${dateValue}T00:00:00`);
  const end = new Date(`${dateValue}T23:59:59`);
  const date = getReservationDate(reservation);
  return date >= start && date <= end;
};

const matchesSearchTerm = (reservation, query) => {
  if (!query) return true;
  return (
    reservation.nome.toLowerCase().includes(query) ||
    reservation.telefone.toLowerCase().includes(query) ||
    (reservation.email || '').toLowerCase().includes(query)
  );
};

const ReservationCard = ({ reservation, onStatusChange, updating }) => {
  const { date, time } = formatReservationDate(reservation.date);
  const createdAt = reservation.createdAt ? new Date(reservation.createdAt).toLocaleDateString() : null;
  const reservationDate = getReservationDate(reservation);
  const diffMinutes = Math.round((reservationDate.getTime() - Date.now()) / 60000);
  const isArrivingSoon = diffMinutes >= 0 && diffMinutes <= 30;

  return (
    <article className="reservation-card">
      <div className="reservation-card-header">
        <div>
          <h3>{reservation.nome}</h3>
          <span>{reservation.telefone}</span>
          {reservation.email ? <span>{reservation.email}</span> : null}
        </div>
        <span className={`reservation-status ${statusClass(reservation.status)}`}>{reservation.status}</span>
      </div>

      {isArrivingSoon ? <div className="reservation-alert-badge">Chega em ate 30 min</div> : null}

      <div className="reservation-details">
        <div>
          <span>Data</span>
          <strong>{date}</strong>
        </div>
        <div>
          <span>Horario</span>
          <strong>{time}</strong>
        </div>
        <div>
          <span>Pessoas</span>
          <strong>{reservation.pessoas}</strong>
        </div>
        <div>
          <span>Criada em</span>
          <strong>{createdAt || '-'}</strong>
        </div>
      </div>

      {reservation.observacao ? <p className="reservation-note">{reservation.observacao}</p> : null}

      <label className="status-select">
        Alterar status
        <select value={reservation.status} onChange={(event) => onStatusChange(reservation.id, event.target.value)} disabled={updating}>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </label>
    </article>
  );
};

const ReservationSection = ({ title, description, reservations, loading, emptyMessage, onStatusChange, updatingStatusId }) => (
  <section className="reservation-page-section">
    <div className="reservation-page-section-header">
      <div>
        <h3>{title}</h3>
        <span>{description}</span>
      </div>
      <strong>{reservations.length}</strong>
    </div>

    {loading ? (
      <div className="reservation-grid">
        <ReservationSkeleton />
        <ReservationSkeleton />
      </div>
    ) : reservations.length === 0 ? (
      <div className="empty">{emptyMessage}</div>
    ) : (
      <div className="reservation-grid">
        {reservations.map((reservation) => (
          <ReservationCard
            key={reservation.id}
            reservation={reservation}
            onStatusChange={onStatusChange}
            updating={updatingStatusId === reservation.id}
          />
        ))}
      </div>
    )}
  </section>
);

const InternalReservations = () => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [historyDate, setHistoryDate] = useState('');
  const [viewedReservationId, setViewedReservationId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const refreshInProgressRef = useRef(false);

  const loadReservations = useCallback(async ({ silent = false } = {}) => {
    if (refreshInProgressRef.current) return;
    refreshInProgressRef.current = true;

    if (silent) setAutoRefreshing(true);
    else setLoading(true);
    setErrorMessage('');

    try {
      const data = await fetchReservations();
      setReservas(data);
      setLastSyncAt(new Date());
    } catch (err) {
      console.error(err);
      setErrorMessage(INTERNAL_MESSAGES.LOAD_RESERVATIONS_ERROR);
      if (!silent) setReservas([]);
    } finally {
      if (silent) setAutoRefreshing(false);
      else setLoading(false);
      refreshInProgressRef.current = false;
    }
  }, []);

  const handleStatusChange = async (id, status) => {
    setUpdatingStatusId(id);
    setErrorMessage('');
    try {
      const updated = await updateReservationStatus(id, status);
      setReservas((prev) => prev.map((reserva) => (reserva.id === id ? updated : reserva)));
      setToastMessage('Reserva atualizada');
      setTimeout(() => setToastMessage(''), 2600);
    } catch (err) {
      console.error(err);
      setErrorMessage(INTERNAL_MESSAGES.UPDATE_RESERVATION_STATUS_ERROR);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  useEffect(() => {
    loadReservations();

    const intervalId = window.setInterval(() => {
      loadReservations({ silent: true });
    }, AUTO_REFRESH_MS);

    const handleVisibilityChange = () => {
      if (!document.hidden) loadReservations({ silent: true });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadReservations]);

  const activeReservations = useMemo(() => (
    reservas
      .filter(isActiveReservation)
      .sort((a, b) => getReservationDate(a).getTime() - getReservationDate(b).getTime())
  ), [reservas]);

  const filteredReservations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return activeReservations.filter((reserva) => matchesSearchTerm(reserva, query));
  }, [activeReservations, searchTerm]);

  const todayReservations = useMemo(() => {
    const today = new Date();
    return filteredReservations.filter((reserva) => isSameDay(getReservationDate(reserva), today));
  }, [filteredReservations]);

  const upcomingReservations = useMemo(() => {
    const today = new Date();
    return filteredReservations.filter((reserva) => !isSameDay(getReservationDate(reserva), today));
  }, [filteredReservations]);

  const historyReservations = useMemo(() => (
    reservas
      .filter((reserva) => !isActiveReservation(reserva))
      .filter((reserva) => matchesReservationDate(reserva, historyDate))
      .sort((a, b) => getReservationDate(b).getTime() - getReservationDate(a).getTime())
  ), [reservas, historyDate]);

  const viewedReservation = useMemo(
    () => reservas.find((reserva) => String(reserva.id) === String(viewedReservationId)) || null,
    [reservas, viewedReservationId]
  );

  const counters = useMemo(() => ({
    today: activeReservations.filter((reserva) => isSameDay(getReservationDate(reserva), new Date())).length,
    upcoming: activeReservations.filter((reserva) => !isSameDay(getReservationDate(reserva), new Date())).length,
    active: activeReservations.length,
    history: reservas.filter((reserva) => !isActiveReservation(reserva)).length,
    canceled: reservas.filter((reserva) => reserva.status === 'CANCELADA').length,
    finished: reservas.filter((reserva) => reserva.status === 'FINALIZADA').length
  }), [activeReservations, reservas]);

  const syncStatusText = lastSyncAt
    ? `Atualizacao automatica a cada 15s. Ultima sincronizacao: ${lastSyncAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Atualizacao automatica a cada 15s';

  const handleViewReservation = (reservation) => {
    setViewedReservationId(reservation.id);
  };

  const handleCloseReservation = () => {
    setViewedReservationId(null);
  };

  return (
    <div className="manager-block">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Reservas</p>
          <h2>Reservas</h2>
          <span>Reservas confirmadas e pendentes ainda validas para atendimento</span>
          <span className="sync-status">{autoRefreshing ? 'Sincronizando reservas...' : syncStatusText}</span>
        </div>
        <button className="primary-button" onClick={() => loadReservations()} disabled={loading}>
          {loading ? 'Carregando...' : 'Atualizar reservas'}
        </button>
      </div>

      <div className="counter-grid reservation-counters">
        <div className="counter-card active">
          <span>Hoje</span>
          <strong>{counters.today}</strong>
        </div>
        <div className="counter-card">
          <span>Proximas</span>
          <strong>{counters.upcoming}</strong>
        </div>
        <div className="counter-card finished">
          <span>No historico</span>
          <strong>{counters.history}</strong>
        </div>
        <div className="counter-card finished">
          <span>Finalizadas</span>
          <strong>{counters.finished}</strong>
        </div>
      </div>

      <div className="filter-bar single">
        <label>
          Buscar
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Nome, telefone ou e-mail"
          />
        </label>
      </div>

      {toastMessage ? <div className="toast-message">{toastMessage}</div> : null}

      {errorMessage && <div className="form-error">{errorMessage}</div>}

      <div className="reservation-page-grid">
        <ReservationSection
          title="Reservas de hoje"
          description="Reservas confirmadas e pendentes para o dia atual"
          reservations={todayReservations}
          loading={loading}
          emptyMessage="Nenhuma reserva ativa para hoje."
          onStatusChange={handleStatusChange}
          updatingStatusId={updatingStatusId}
        />

        <ReservationSection
          title="Proximas reservas"
          description="Reservas futuras em ordem de chegada"
          reservations={upcomingReservations}
          loading={loading}
          emptyMessage="Nenhuma proxima reserva ativa."
          onStatusChange={handleStatusChange}
          updatingStatusId={updatingStatusId}
        />
      </div>

      <section className="reservation-history-block">
        <div className="saved-orders-header">
          <div>
            <h3 className="command-section-title">Historico de reservas</h3>
            <span>Reservas finalizadas, canceladas ou vencidas pela data real</span>
          </div>
          <label className="history-date-filter">
            Dia
            <input type="date" value={historyDate} onChange={(event) => setHistoryDate(event.target.value)} />
          </label>
        </div>

        {loading ? (
          <div className="command-skeleton-list">
            <div className="command-skeleton" />
            <div className="command-skeleton" />
          </div>
        ) : historyReservations.length === 0 ? (
          <div className="empty compact-empty">Nenhuma reserva encontrada no historico.</div>
        ) : (
          <div className="reservation-history-list">
            {historyReservations.map((reservation) => {
              const { date, time } = formatReservationDate(reservation.date);
              const expired = isExpiredReservation(reservation);
              return (
                <button
                  key={reservation.id}
                  type="button"
                  className={`reservation-history-button ${String(viewedReservationId) === String(reservation.id) ? 'selected' : ''}`}
                  onClick={() => handleViewReservation(reservation)}
                >
                  <span className="reservation-history-content">
                    <span className="reservation-history-title">
                      <strong>#{reservation.id}</strong>
                      <span>{reservation.nome}</span>
                    </span>
                    <span className="reservation-history-meta">
                      <span>{date} as {time}</span>
                      <span>{reservation.telefone}</span>
                      {reservation.email ? <span>{reservation.email}</span> : null}
                    </span>
                    <span className="reservation-history-foot">
                      {reservation.pessoas} pessoas{expired ? ' - vencida' : ''}
                    </span>
                  </span>
                  <em className={`reservation-status ${statusClass(reservation.status)}`}>{reservation.status}</em>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {viewedReservation ? (
        <div className="order-modal-backdrop" role="presentation" onClick={handleCloseReservation}>
          <section className="order-modal" role="dialog" aria-modal="true" aria-labelledby="reservation-history-title" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="order-modal-close" aria-label="Fechar historico de reserva" onClick={handleCloseReservation}>
              X
            </button>
            <div className="order-modal-header">
              <div>
                <span>Consulta de reserva</span>
                <h3 id="reservation-history-title">Reserva #{viewedReservation.id}</h3>
              </div>
              <em className={`reservation-status ${statusClass(viewedReservation.status)}`}>{viewedReservation.status}</em>
            </div>

            <div className="order-modal-grid">
              <div><span>Cliente</span><strong>{viewedReservation.nome}</strong></div>
              <div><span>Telefone</span><strong>{viewedReservation.telefone}</strong></div>
              <div><span>E-mail</span><strong>{viewedReservation.email || '-'}</strong></div>
              <div><span>Pessoas</span><strong>{viewedReservation.pessoas}</strong></div>
              <div><span>Data</span><strong>{formatReservationDate(viewedReservation.date).date}</strong></div>
              <div><span>Horario</span><strong>{formatReservationDate(viewedReservation.date).time}</strong></div>
              <div><span>Status</span><strong>{viewedReservation.status}</strong></div>
              <div><span>Criada em</span><strong>{viewedReservation.createdAt ? formatReservationDate(viewedReservation.createdAt).date : '-'}</strong></div>
              <div><span>Atualizada em</span><strong>{viewedReservation.updatedAt ? formatReservationDate(viewedReservation.updatedAt).date : '-'}</strong></div>
              <div><span>Situacao</span><strong>{isExpiredReservation(viewedReservation) ? 'Vencida' : 'Dentro da data'}</strong></div>
            </div>

            <div className="reservation-history-note">
              <span>Observacao</span>
              <strong>{viewedReservation.observacao || 'Sem observacao registrada.'}</strong>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
};

export default InternalReservations;
