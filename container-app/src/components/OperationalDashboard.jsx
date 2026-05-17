import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatCurrency } from '../../../shared/formatters';
import { fetchOrders, fetchReservations } from '../services/api';
import { INTERNAL_MESSAGES } from '../constants/messages';

const AUTO_REFRESH_MS = 15000;
const ACTIVE_RESERVATION_STATUSES = ['PENDENTE', 'CONFIRMADA'];
const ACTIVE_ORDER_STATUSES = ['aberta', 'em preparo', 'entregue'];

const formatDateTime = (dateLike) => {
  const parsed = new Date(dateLike);
  return {
    date: parsed.toLocaleDateString('pt-BR'),
    time: parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
};

const isSameDay = (date, reference) =>
  date.getFullYear() === reference.getFullYear() &&
  date.getMonth() === reference.getMonth() &&
  date.getDate() === reference.getDate();

const sortByDate = (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime();

const OperationalDashboard = ({ freeCount, occupiedCount, selectedTable, onGoToSection }) => {
  const [reservations, setReservations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const loadingRef = useRef(false);

  const loadDashboardData = useCallback(async ({ silent = false } = {}) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [reservationList, orderList] = await Promise.all([fetchReservations(), fetchOrders()]);
      setReservations(reservationList);
      setOrders(orderList);
      setLastSyncAt(new Date());
    } catch (err) {
      console.error(err);
      setError(INTERNAL_MESSAGES.LOAD_DASHBOARD_ERROR);
    } finally {
      setLoading(false);
      setRefreshing(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    const intervalId = window.setInterval(() => loadDashboardData({ silent: true }), AUTO_REFRESH_MS);
    return () => window.clearInterval(intervalId);
  }, [loadDashboardData]);

  const summary = useMemo(() => {
    const now = new Date();
    const activeReservations = reservations.filter((reservation) =>
      ACTIVE_RESERVATION_STATUSES.includes(reservation.status)
    );

    const todayReservations = activeReservations
      .filter((reservation) => isSameDay(new Date(reservation.date), now))
      .sort(sortByDate);

    const upcomingReservations = activeReservations
      .filter((reservation) => new Date(reservation.date).getTime() >= now.getTime())
      .sort(sortByDate);

    const arrivingSoon = upcomingReservations.filter((reservation) => {
      const diffMinutes = (new Date(reservation.date).getTime() - now.getTime()) / 60000;
      return diffMinutes >= 0 && diffMinutes <= 30;
    });

    const pendingReservations = upcomingReservations.filter((reservation) => reservation.status === 'PENDENTE');

    const activeOrders = orders
      .filter((order) => ACTIVE_ORDER_STATUSES.includes(order.status))
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

    return {
      todayReservations,
      upcomingReservations,
      arrivingSoon,
      pendingReservations,
      activeOrders
    };
  }, [orders, reservations]);

  const alerts = useMemo(() => {
    const items = [];
    if (summary.arrivingSoon.length > 0) {
      items.push({
        tone: 'warning',
        title: `${summary.arrivingSoon.length} reserva(s) chegando em ate 30 min`,
        detail: 'Prepare mesa e equipe para atendimento.'
      });
    }
    if (summary.pendingReservations.length > 0) {
      items.push({
        tone: 'info',
        title: `${summary.pendingReservations.length} reserva(s) pendente(s)`,
        detail: 'Confirme ou acompanhe a solicitacao.'
      });
    }
    if (summary.activeOrders.length > 0) {
      items.push({
        tone: 'success',
        title: `${summary.activeOrders.length} comanda(s) aberta(s)`,
        detail: 'Acompanhe mesas ocupadas em atendimento.'
      });
    }
    return items;
  }, [summary]);

  const nextReservations = summary.upcomingReservations.slice(0, 4);
  const visibleTodayReservations = summary.todayReservations.slice(0, 4);
  const visibleOrders = summary.activeOrders.slice(0, 4);
  const syncText = lastSyncAt
    ? `Atualizado ${lastSyncAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Sincronizando dados';

  return (
    <section className="operations-dashboard" aria-label="Central do turno">
      <div className="section-heading operations-heading">
        <div>
          <p className="eyebrow">Central do turno</p>
          <h2>Hoje e agora</h2>
          <span>Resumo rapido para acompanhar reservas, mesas e comandas abertas.</span>
          <span className="sync-status">{refreshing ? 'Atualizando painel...' : syncText}</span>
        </div>
        <button type="button" className="ghost-button" onClick={() => loadDashboardData()}>
          {loading ? 'Carregando...' : 'Atualizar painel'}
        </button>
      </div>

      {error ? <div className="form-error">{error}</div> : null}

      <div className="operations-metrics">
        <article className="operation-metric-card">
          <span>Reservas de hoje</span>
          <strong>{summary.todayReservations.length}</strong>
        </article>
        <article className="operation-metric-card">
          <span>Proximas reservas</span>
          <strong>{summary.upcomingReservations.length}</strong>
        </article>
        <article className="operation-metric-card">
          <span>Comandas abertas</span>
          <strong>{summary.activeOrders.length}</strong>
        </article>
        <article className="operation-metric-card">
          <span>Alertas</span>
          <strong>{alerts.length}</strong>
        </article>
      </div>

      <div className="operations-grid">
        <article className="operations-panel">
          <div className="operations-panel-header">
            <div>
              <h3>Reservas de hoje</h3>
              <span>{visibleTodayReservations.length} em destaque</span>
            </div>
            <button type="button" className="small-button" onClick={() => onGoToSection('reservas')}>Ver reservas</button>
          </div>
          <div className="operations-list">
            {loading ? (
              <div className="empty compact-empty">Carregando reservas...</div>
            ) : visibleTodayReservations.length === 0 ? (
              <div className="empty compact-empty">Nenhuma reserva para hoje.</div>
            ) : (
              visibleTodayReservations.map((reservation) => {
                const when = formatDateTime(reservation.date);
                const expired = new Date(reservation.date).getTime() < Date.now();
                return (
                  <button key={reservation.id} type="button" className="operation-row" onClick={() => onGoToSection('reservas')}>
                    <span>
                      <strong>{reservation.nome}</strong>
                      <em>{when.time} - {reservation.pessoas} pessoas</em>
                    </span>
                    <small className={`operation-pill ${expired ? 'danger' : reservation.status.toLowerCase()}`}>{expired ? 'Vencida' : reservation.status}</small>
                  </button>
                );
              })
            )}
          </div>
        </article>

        <article className="operations-panel">
          <div className="operations-panel-header">
            <div>
              <h3>Proximas reservas</h3>
              <span>Ordem de chegada</span>
            </div>
          </div>
          <div className="operations-list">
            {loading ? (
              <div className="empty compact-empty">Carregando proximas reservas...</div>
            ) : nextReservations.length === 0 ? (
              <div className="empty compact-empty">Nenhuma proxima reserva.</div>
            ) : (
              nextReservations.map((reservation) => {
                const when = formatDateTime(reservation.date);
                return (
                  <button key={reservation.id} type="button" className="operation-row" onClick={() => onGoToSection('reservas')}>
                    <span>
                      <strong>{reservation.nome}</strong>
                      <em>{when.date} as {when.time}</em>
                    </span>
                    <small className={`operation-pill ${reservation.status.toLowerCase()}`}>{reservation.status}</small>
                  </button>
                );
              })
            )}
          </div>
        </article>

        <article className="operations-panel">
          <div className="operations-panel-header">
            <div>
              <h3>Mesas e comandas</h3>
              <span>{freeCount} livres, {occupiedCount} ocupadas</span>
            </div>
            <button type="button" className="small-button" onClick={() => onGoToSection('mesas')}>Ver mesas</button>
          </div>
          <div className="table-mini-summary">
            <div>
              <span>Selecionada</span>
              <strong>{selectedTable ? `Mesa ${String(selectedTable).padStart(2, '0')}` : '--'}</strong>
            </div>
            <div>
              <span>Ocupadas</span>
              <strong>{occupiedCount}</strong>
            </div>
          </div>
          <div className="operations-list">
            {visibleOrders.length === 0 ? (
              <div className="empty compact-empty">Nenhuma comanda aberta.</div>
            ) : (
              visibleOrders.map((order) => (
                <button key={order.id} type="button" className="operation-row" onClick={() => onGoToSection('comandas')}>
                  <span>
                    <strong>Mesa {String(order.tableNumber).padStart(2, '0')}</strong>
                    <em>{order.customerName || 'Cliente nao informado'} - {formatCurrency(Number(order.total || 0))}</em>
                  </span>
                  <small className="operation-pill success">{order.status}</small>
                </button>
              ))
            )}
          </div>
        </article>

        <article className="operations-panel alerts-panel">
          <div className="operations-panel-header">
            <div>
              <h3>Alertas rapidos</h3>
              <span>Prioridades do turno</span>
            </div>
          </div>
          <div className="operations-list">
            {alerts.length === 0 ? (
              <div className="empty compact-empty">Nenhum alerta no momento.</div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.title} className={`operation-alert ${alert.tone}`}>
                  <strong>{alert.title}</strong>
                  <span>{alert.detail}</span>
                </div>
              ))
            )}
          </div>
        </article>
      </div>
    </section>
  );
};

export default OperationalDashboard;
