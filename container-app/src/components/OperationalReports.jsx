import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatCurrency } from '../../../shared/formatters';
import { fetchOrders, fetchReservations } from '../services/api';
import { INTERNAL_MESSAGES } from '../constants/messages';

const AUTO_REFRESH_MS = 30000;
const CLOSED_ORDER_STATUSES = ['fechada'];
const ACTIVE_ORDER_STATUSES = ['aberta', 'em preparo', 'entregue'];
const ACTIVE_RESERVATION_STATUSES = ['PENDENTE', 'CONFIRMADA'];
const PERIOD_OPTIONS = [
  { key: 'day', label: 'Diario' },
  { key: 'month', label: 'Mensal' },
  { key: 'quarter', label: 'Trimestral' },
  { key: 'custom', label: 'Periodo' }
];

const STATUS_LABELS = {
  aberta: 'Aberta',
  'em preparo': 'Em preparo',
  entregue: 'Aguardando pagamento',
  fechada: 'Fechada',
  cancelada: 'Cancelada'
};

const RESERVATION_STATUS_LABELS = {
  PENDENTE: 'Pendente',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
  FINALIZADA: 'Finalizada'
};

const toDateInputValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toMonthInputValue = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const fromDateInput = (dateValue, endOfDay = false) => {
  const time = endOfDay ? 'T23:59:59.999' : 'T00:00:00.000';
  return new Date(`${dateValue}${time}`);
};

const getQuarter = (date = new Date()) => Math.floor(date.getMonth() / 3) + 1;

const getQuarterRange = (year, quarter) => {
  const startMonth = (Number(quarter) - 1) * 3;
  const start = new Date(Number(year), startMonth, 1);
  const end = new Date(Number(year), startMonth + 3, 0);
  return { startDate: toDateInputValue(start), endDate: toDateInputValue(end) };
};

const getMonthRange = (monthValue) => {
  const [year, month] = monthValue.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { startDate: toDateInputValue(start), endDate: toDateInputValue(end) };
};

const formatDateShort = (dateLike) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(dateLike));

const formatMonthShort = (dateLike) =>
  new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' }).format(new Date(dateLike));

const formatPeriodLabel = (startDate, endDate) => {
  if (startDate === endDate) return formatDateShort(`${startDate}T12:00:00`);
  return `${formatDateShort(`${startDate}T12:00:00`)} ate ${formatDateShort(`${endDate}T12:00:00`)}`;
};

const formatTime = (dateLike) =>
  dateLike ? new Date(dateLike).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';

const isBetweenDates = (dateLike, startDate, endDate) => {
  if (!dateLike || !startDate || !endDate) return false;
  const date = new Date(dateLike);
  return date >= fromDateInput(startDate) && date <= fromDateInput(endDate, true);
};

const getOrderDate = (order) => order.details?.closedAt || order.updatedAt || order.createdAt;

const getItemCount = (order) =>
  (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);

const getPaymentMethod = (order) => order.details?.paymentMethod || 'Nao informado';

const getOrderTotal = (order) => Number(order.total || order.details?.total || 0);

const sumCurrency = (items, selector) =>
  Number(items.reduce((sum, item) => sum + Number(selector(item) || 0), 0).toFixed(2));

const getDaysBetween = (startDate, endDate) => {
  const start = fromDateInput(startDate);
  const end = fromDateInput(endDate);
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
};

const buildPaymentRows = (closedOrders) => {
  const map = closedOrders.reduce((acc, order) => {
    const method = getPaymentMethod(order);
    const current = acc[method] || { label: method, count: 0, total: 0 };
    current.count += 1;
    current.total += getOrderTotal(order);
    acc[method] = current;
    return acc;
  }, {});

  return Object.values(map)
    .map((item) => ({ ...item, total: Number(item.total.toFixed(2)) }))
    .sort((a, b) => b.total - a.total);
};

const buildProductRows = (closedOrders) => {
  const map = closedOrders.reduce((acc, order) => {
    (order.items || []).forEach((item) => {
      const key = item.name || 'Item sem nome';
      const current = acc[key] || {
        label: key,
        detail: item.category || 'Sem categoria',
        quantity: 0,
        total: 0
      };
      current.quantity += Number(item.quantity || 0);
      current.total += Number(item.subtotal || Number(item.price || 0) * Number(item.quantity || 1));
      acc[key] = current;
    });
    return acc;
  }, {});

  return Object.values(map)
    .map((item) => ({ ...item, total: Number(item.total.toFixed(2)) }))
    .sort((a, b) => b.quantity - a.quantity || b.total - a.total);
};

const buildStatusRows = (items, statusSelector, labels) => {
  const map = items.reduce((acc, item) => {
    const status = statusSelector(item) || 'sem status';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(map).map(([status, count]) => ({
    label: labels[status] || status,
    status,
    count
  }));
};

const buildOrderTotalRows = ({ periodOrders, closedOrders, activeOrders, itemCount }) => {
  const canceledOrders = periodOrders.filter((order) => order.status === 'cancelada');
  return [
    { label: 'Total de comandas', count: periodOrders.length },
    { label: 'Comandas fechadas', count: closedOrders.length },
    { label: 'Comandas ativas', count: activeOrders.length },
    { label: 'Comandas canceladas', count: canceledOrders.length },
    { label: 'Itens vendidos', count: itemCount }
  ];
};

const buildPeakHourRows = (orders) => {
  const map = orders.reduce((acc, order) => {
    const date = new Date(order.createdAt || getOrderDate(order));
    if (Number.isNaN(date.getTime())) return acc;
    const hour = date.getHours();
    const key = String(hour).padStart(2, '0');
    const current = acc[key] || {
      label: `${key}:00`,
      count: 0,
      total: 0
    };
    current.count += 1;
    current.total += getOrderTotal(order);
    acc[key] = current;
    return acc;
  }, {});

  return Object.values(map).sort((a, b) => Number(a.label.slice(0, 2)) - Number(b.label.slice(0, 2)));
};

const buildTimelineRows = (closedOrders, reservations, startDate, endDate) => {
  const days = getDaysBetween(startDate, endDate);
  const groupByMonth = days > 45;
  const rows = [];

  if (groupByMonth) {
    const cursor = new Date(fromDateInput(startDate).getFullYear(), fromDateInput(startDate).getMonth(), 1);
    const end = fromDateInput(endDate);
    while (cursor <= end) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      rows.push({ key, label: formatMonthShort(cursor), revenue: 0, reservations: 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  } else {
    const cursor = fromDateInput(startDate);
    const end = fromDateInput(endDate);
    while (cursor <= end) {
      const key = toDateInputValue(cursor);
      rows.push({ key, label: formatDateShort(cursor), revenue: 0, reservations: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const index = rows.reduce((acc, row) => {
    acc[row.key] = row;
    return acc;
  }, {});

  closedOrders.forEach((order) => {
    const date = new Date(getOrderDate(order));
    const key = groupByMonth ? toMonthInputValue(date) : toDateInputValue(date);
    if (index[key]) index[key].revenue += getOrderTotal(order);
  });

  reservations.forEach((reservation) => {
    const date = new Date(reservation.date);
    const key = groupByMonth ? toMonthInputValue(date) : toDateInputValue(date);
    if (index[key]) index[key].reservations += 1;
  });

  return rows.map((row) => ({ ...row, revenue: Number(row.revenue.toFixed(2)) }));
};

const BarChart = ({ rows, valueKey, labelKey = 'label', valueFormatter, emptyMessage }) => {
  const max = Math.max(...rows.map((row) => Number(row[valueKey] || 0)), 0);
  if (!rows.length || max === 0) {
    return <div className="empty compact-empty">{emptyMessage}</div>;
  }

  return (
    <div className="report-bar-chart">
      {rows.map((row) => {
        const value = Number(row[valueKey] || 0);
        const width = Math.max(5, (value / max) * 100);
        return (
          <div key={`${row[labelKey]}-${valueKey}`} className="report-bar-row">
            <span>{row[labelKey]}</span>
            <div className="report-bar-track">
              <i style={{ width: `${width}%` }} />
            </div>
            <strong>{valueFormatter ? valueFormatter(value, row) : value}</strong>
          </div>
        );
      })}
    </div>
  );
};

const TimelineChart = ({ rows }) => {
  const max = Math.max(...rows.map((row) => Number(row.revenue || 0)), 0);
  if (!rows.length || max === 0) {
    return <div className="empty compact-empty">Sem faturamento fechado no periodo.</div>;
  }

  return (
    <div className="timeline-chart">
      {rows.map((row) => {
        const height = Math.max(8, (Number(row.revenue || 0) / max) * 100);
        return (
          <div key={row.key} className="timeline-column">
            <div className="timeline-bar-wrap">
              <i style={{ height: `${height}%` }} title={`${row.label}: ${formatCurrency(row.revenue)}`} />
            </div>
            <span>{row.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const printableTimelineSvg = (rows) => {
  const chartRows = rows.filter((row) => Number(row.revenue || 0) > 0);
  const sourceRows = chartRows.length ? chartRows : rows;
  if (!sourceRows.length) return '<p class="empty-print">Sem dados para o grafico.</p>';

  const width = 760;
  const height = 240;
  const paddingTop = 18;
  const paddingRight = 18;
  const paddingBottom = 46;
  const paddingLeft = 48;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const maxRevenue = Math.max(...sourceRows.map((row) => Number(row.revenue || 0)), 1);
  const slotWidth = chartWidth / sourceRows.length;
  const barWidth = Math.max(8, Math.min(28, slotWidth * 0.62));

  const bars = sourceRows.map((row, index) => {
    const value = Number(row.revenue || 0);
    const barHeight = Math.max(value > 0 ? 4 : 0, (value / maxRevenue) * chartHeight);
    const x = paddingLeft + index * slotWidth + (slotWidth - barWidth) / 2;
    const y = paddingTop + chartHeight - barHeight;
    const labelX = paddingLeft + index * slotWidth + slotWidth / 2;
    return `
      <rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${barWidth.toFixed(2)}" height="${barHeight.toFixed(2)}" rx="3" fill="#7d552f" />
      <text x="${labelX.toFixed(2)}" y="${height - 23}" text-anchor="middle" font-size="9" fill="#75695d">${escapeHtml(row.label)}</text>
    `;
  }).join('');

  return `
    <svg viewBox="0 0 ${width} ${height}" class="print-chart" role="img" aria-label="Grafico de faturamento">
      <line x1="${paddingLeft}" y1="${paddingTop}" x2="${paddingLeft}" y2="${paddingTop + chartHeight}" stroke="#d9cec1" />
      <line x1="${paddingLeft}" y1="${paddingTop + chartHeight}" x2="${width - paddingRight}" y2="${paddingTop + chartHeight}" stroke="#d9cec1" />
      <text x="${paddingLeft}" y="12" font-size="10" fill="#75695d">Max. ${escapeHtml(formatCurrency(maxRevenue))}</text>
      ${bars}
    </svg>
  `;
};

const printableBarTable = (rows, valueKey, valueFormatter, emptyMessage) => {
  const max = Math.max(...rows.map((row) => Number(row[valueKey] || 0)), 0);
  if (!rows.length || max === 0) return `<p class="empty-print">${escapeHtml(emptyMessage)}</p>`;

  return `
    <table>
      <thead>
        <tr>
          <th>Descricao</th>
          <th>Grafico</th>
          <th>Valor</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((row) => {
          const value = Number(row[valueKey] || 0);
          const width = Math.max(4, (value / max) * 100);
          return `
            <tr>
              <td>
                <strong>${escapeHtml(row.label)}</strong>
                ${row.detail ? `<small>${escapeHtml(row.detail)}</small>` : ''}
              </td>
              <td>
                <svg viewBox="0 0 220 16" class="mini-chart" aria-hidden="true">
                  <rect x="0" y="2" width="220" height="12" rx="6" fill="#f1ebe3" />
                  <rect x="0" y="2" width="${(width * 2.2).toFixed(2)}" height="12" rx="6" fill="#7d552f" />
                </svg>
              </td>
              <td>${escapeHtml(valueFormatter(value, row))}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
};

const printableStatusTable = (rows, emptyMessage) => {
  if (!rows.length) return `<p class="empty-print">${escapeHtml(emptyMessage)}</p>`;
  return `
    <table>
      <thead>
        <tr><th>Status</th><th>Quantidade</th></tr>
      </thead>
      <tbody>
        ${rows.map((row) => `
          <tr>
            <td>${escapeHtml(row.label)}</td>
            <td>${escapeHtml(row.count)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
};

const printableLogo = `
  <svg class="brand-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Essenza Bistro">
    <rect width="64" height="64" rx="16" fill="#faf6ee"/>
    <rect x="6" y="6" width="52" height="52" rx="13" fill="#eef3e7" stroke="#a77d4d" stroke-width="2"/>
    <circle cx="48" cy="16" r="5" fill="#bd766a" opacity="0.86"/>
    <text x="32" y="40" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="24" font-weight="700" fill="#5f6f4b">EB</text>
  </svg>
`;

const buildPrintableReportHtml = ({ report, range, periodLabel, generatedAt }) => {
  const closedOrders = report.closedOrders
    .slice()
    .sort((a, b) => new Date(getOrderDate(b)).getTime() - new Date(getOrderDate(a)).getTime());

  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Relatorio Essenza ${escapeHtml(range.startDate)} ${escapeHtml(range.endDate)}</title>
        <style>
          @page { size: A4; margin: 8mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            color: #2b241d;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10.5px;
            line-height: 1.22;
          }
          header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 5px 0 8px;
            border-bottom: 2px solid #7d552f;
          }
          h1, h2, h3, p { margin: 0; }
          h1 { font-size: 19px; letter-spacing: 0.2px; }
          h2 { margin: 10px 0 5px; font-size: 13px; color: #7d552f; }
          h3 { margin-bottom: 4px; font-size: 12px; }
          small, .muted { color: #75695d; }
          .brand {
            display: flex;
            align-items: center;
            gap: 9px;
          }
          .brand-logo {
            width: 42px;
            height: 42px;
            flex: 0 0 42px;
          }
          .brand-kicker {
            color: #7d552f;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 1.2px;
            text-transform: uppercase;
          }
          .generated-box {
            min-width: 138px;
            padding: 7px 9px;
            border: 1px solid #d9cec1;
            border-radius: 8px;
            text-align: right;
          }
          .generated-box strong {
            display: block;
            color: #7d552f;
            font-size: 9px;
            text-transform: uppercase;
          }
          .summary {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 5px;
            margin-top: 8px;
          }
          .summary article {
            min-height: 52px;
            padding: 7px;
            border: 1px solid #d9cec1;
            border-radius: 6px;
          }
          .summary span {
            display: block;
            color: #75695d;
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .summary strong {
            display: block;
            margin: 3px 0;
            font-size: 13px;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
          section {
            break-inside: avoid;
            margin-top: 8px;
          }
          section.full {
            grid-column: 1 / -1;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            page-break-inside: auto;
          }
          tr { page-break-inside: avoid; page-break-after: auto; }
          th, td {
            padding: 4px 5px;
            border: 1px solid #d9cec1;
            text-align: left;
            vertical-align: middle;
          }
          th {
            background: #f4eee6;
            color: #2b241d;
            font-size: 8.5px;
            text-transform: uppercase;
          }
          td strong { display: block; }
          td small { display: block; margin-top: 1px; }
          .print-chart {
            display: block;
            width: 100%;
            height: 178px;
            border: 1px solid #d9cec1;
            border-radius: 6px;
          }
          .mini-chart {
            display: block;
            width: 100%;
            height: 12px;
          }
          .empty-print {
            padding: 7px;
            border: 1px dashed #d9cec1;
            color: #75695d;
          }
          .footer-note {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-top: 10px;
            padding-top: 6px;
            border-top: 1px solid #d9cec1;
            color: #75695d;
            font-size: 8.5px;
          }
        </style>
      </head>
      <body>
        <header>
          <div class="brand">
            ${printableLogo}
            <div>
              <p class="brand-kicker">Essenza Bistro</p>
              <h1>Relatorio Gerencial</h1>
              <p class="muted">Periodo: ${escapeHtml(periodLabel)} (${escapeHtml(range.startDate)} ate ${escapeHtml(range.endDate)})</p>
            </div>
          </div>
          <div class="generated-box">
            <strong>Gerado em</strong>
            <p class="muted">${escapeHtml(generatedAt)}</p>
          </div>
        </header>

        <div class="summary">
          <article><span>Faturamento fechado</span><strong>${escapeHtml(formatCurrency(report.revenue))}</strong><small>${escapeHtml(report.closedOrders.length)} comandas fechadas</small></article>
          <article><span>Ticket medio</span><strong>${escapeHtml(formatCurrency(report.ticketAverage))}</strong><small>${escapeHtml(report.itemCount)} itens vendidos</small></article>
          <article><span>Em aberto</span><strong>${escapeHtml(formatCurrency(report.pendingRevenue))}</strong><small>${escapeHtml(report.activeOrders.length)} comandas ativas</small></article>
          <article><span>Reservas</span><strong>${escapeHtml(report.periodReservations.length)}</strong><small>${escapeHtml(report.peopleForecast)} pessoas previstas</small></article>
          <article><span>Descontos</span><strong>${escapeHtml(formatCurrency(report.discount))}</strong><small>Cupons e ajustes aplicados</small></article>
          <article><span>Status</span><strong>${report.activeOrders.length ? 'Pendente' : 'Conferido'}</strong><small>${report.activeOrders.length ? 'Ha comandas abertas no periodo' : 'Sem comandas abertas'}</small></article>
        </div>

        <section>
          <h2>Grafico de faturamento</h2>
          ${printableTimelineSvg(report.timelineRows)}
        </section>

        <div class="grid">
          <section>
            <h2>Formas de pagamento</h2>
            ${printableBarTable(report.paymentRows, 'total', (value, row) => `${formatCurrency(value)} - ${row.count}x`, 'Nenhum pagamento fechado no periodo.')}
          </section>

          <section>
            <h2>Itens vendidos</h2>
            ${printableBarTable(report.productRows.slice(0, 10), 'quantity', (value, row) => `${value}x - ${formatCurrency(row.total)}`, 'Nenhum item vendido no periodo.')}
          </section>

          <section>
            <h2>Total de comandas</h2>
            ${printableStatusTable(report.orderTotalRows, 'Nenhuma comanda no periodo.')}
          </section>

          <section>
            <h2>Horarios de maior pico</h2>
            ${printableBarTable(report.peakHourRows, 'count', (value, row) => `${value} comandas - ${formatCurrency(row.total)}`, 'Nenhuma comanda no periodo.')}
          </section>

          <section>
            <h2>Status das reservas</h2>
            ${printableStatusTable(report.reservationStatusRows, 'Nenhuma reserva no periodo.')}
          </section>
        </div>

        <section>
          <h2>Comandas fechadas no periodo</h2>
          ${closedOrders.length === 0 ? '<p class="empty-print">Nenhuma comanda fechada no periodo.</p>' : `
            <table>
              <thead>
                <tr>
                  <th>Comanda</th>
                  <th>Mesa</th>
                  <th>Cliente</th>
                  <th>Itens</th>
                  <th>Pagamento</th>
                  <th>Horario</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${closedOrders.map((order) => `
                  <tr>
                    <td>#${escapeHtml(order.id)}</td>
                    <td>${escapeHtml(String(order.tableNumber).padStart(2, '0'))}</td>
                    <td>${escapeHtml(order.customerName || 'Nao informado')}</td>
                    <td>${escapeHtml(getItemCount(order))}</td>
                    <td>${escapeHtml(getPaymentMethod(order))}</td>
                    <td>${escapeHtml(formatTime(getOrderDate(order)))}</td>
                    <td>${escapeHtml(formatCurrency(getOrderTotal(order)))}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </section>

        <section>
          <h2>Reservas no periodo</h2>
          ${report.periodReservations.length === 0 ? '<p class="empty-print">Nenhuma reserva no periodo.</p>' : `
            <table>
              <thead>
                <tr>
                  <th>Reserva</th>
                  <th>Cliente</th>
                  <th>Telefone</th>
                  <th>Email</th>
                  <th>Data/Hora</th>
                  <th>Pessoas</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${report.periodReservations
                  .slice()
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((reservation) => `
                    <tr>
                      <td>#${escapeHtml(reservation.id)}</td>
                      <td>${escapeHtml(reservation.nome || 'Nao informado')}</td>
                      <td>${escapeHtml(reservation.telefone || '-')}</td>
                      <td>${escapeHtml(reservation.email || '-')}</td>
                      <td>${escapeHtml(formatDateShort(reservation.date))} ${escapeHtml(formatTime(reservation.date))}</td>
                      <td>${escapeHtml(reservation.pessoas || 0)}</td>
                      <td>${escapeHtml(RESERVATION_STATUS_LABELS[reservation.status] || reservation.status)}</td>
                    </tr>
                  `).join('')}
              </tbody>
            </table>
          `}
        </section>

        <p class="footer-note">
          <span>Relatorio gerado pelo sistema interno Essenza Bistro.</span>
          <span>Confira comandas abertas antes do fechamento definitivo.</span>
        </p>
      </body>
    </html>
  `;
};

const OperationalReports = ({ onGoToSection }) => {
  const today = new Date();
  const currentQuarter = getQuarter(today);
  const [periodMode, setPeriodMode] = useState('day');
  const [selectedDate, setSelectedDate] = useState(() => toDateInputValue(today));
  const [selectedMonth, setSelectedMonth] = useState(() => toMonthInputValue(today));
  const [selectedYear, setSelectedYear] = useState(() => String(today.getFullYear()));
  const [selectedQuarter, setSelectedQuarter] = useState(() => String(currentQuarter));
  const [customStartDate, setCustomStartDate] = useState(() => toDateInputValue(today));
  const [customEndDate, setCustomEndDate] = useState(() => toDateInputValue(today));
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const loadingRef = useRef(false);

  const range = useMemo(() => {
    if (periodMode === 'month') return getMonthRange(selectedMonth);
    if (periodMode === 'quarter') return getQuarterRange(selectedYear, selectedQuarter);
    if (periodMode === 'custom') {
      return {
        startDate: customStartDate <= customEndDate ? customStartDate : customEndDate,
        endDate: customStartDate <= customEndDate ? customEndDate : customStartDate
      };
    }
    return { startDate: selectedDate, endDate: selectedDate };
  }, [customEndDate, customStartDate, periodMode, selectedDate, selectedMonth, selectedQuarter, selectedYear]);

  const loadReports = useCallback(async ({ silent = false } = {}) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [orderList, reservationList] = await Promise.all([fetchOrders(), fetchReservations()]);
      setOrders(orderList);
      setReservations(reservationList);
      setLastSyncAt(new Date());
    } catch (err) {
      console.error(err);
      setError(INTERNAL_MESSAGES.LOAD_REPORTS_ERROR);
    } finally {
      setLoading(false);
      setRefreshing(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadReports();
    const intervalId = window.setInterval(() => loadReports({ silent: true }), AUTO_REFRESH_MS);
    return () => window.clearInterval(intervalId);
  }, [loadReports]);

  const report = useMemo(() => {
    const periodOrders = orders.filter((order) => isBetweenDates(getOrderDate(order), range.startDate, range.endDate));
    const closedOrders = periodOrders.filter((order) => CLOSED_ORDER_STATUSES.includes(order.status));
    const activeOrders = periodOrders.filter((order) => ACTIVE_ORDER_STATUSES.includes(order.status));
    const periodReservations = reservations.filter((reservation) => isBetweenDates(reservation.date, range.startDate, range.endDate));
    const activeReservations = periodReservations.filter((reservation) =>
      ACTIVE_RESERVATION_STATUSES.includes(reservation.status)
    );

    const revenue = sumCurrency(closedOrders, getOrderTotal);
    const discount = sumCurrency(closedOrders, (order) => order.details?.discount);
    const itemCount = closedOrders.reduce((sum, order) => sum + getItemCount(order), 0);
    const ticketAverage = closedOrders.length ? Number((revenue / closedOrders.length).toFixed(2)) : 0;
    const pendingRevenue = sumCurrency(activeOrders, getOrderTotal);
    const peopleForecast = periodReservations.reduce((sum, item) => sum + Number(item.pessoas || 0), 0);
    const productRows = buildProductRows(closedOrders);
    const orderTotalRows = buildOrderTotalRows({ periodOrders, closedOrders, activeOrders, itemCount });

    return {
      periodOrders,
      closedOrders,
      activeOrders,
      periodReservations,
      activeReservations,
      revenue,
      discount,
      itemCount,
      ticketAverage,
      pendingRevenue,
      peopleForecast,
      paymentRows: buildPaymentRows(closedOrders),
      productRows,
      orderTotalRows,
      peakHourRows: buildPeakHourRows(periodOrders),
      orderStatusRows: buildStatusRows(periodOrders, (order) => order.status, STATUS_LABELS),
      reservationStatusRows: buildStatusRows(periodReservations, (reservation) => reservation.status, RESERVATION_STATUS_LABELS),
      timelineRows: buildTimelineRows(closedOrders, periodReservations, range.startDate, range.endDate),
      recentClosedOrders: closedOrders
        .slice()
        .sort((a, b) => new Date(getOrderDate(b)).getTime() - new Date(getOrderDate(a)).getTime())
        .slice(0, 8)
    };
  }, [orders, range.endDate, range.startDate, reservations]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=1120,height=800');
    if (!printWindow) {
      setError(INTERNAL_MESSAGES.OPEN_PDF_ERROR);
      return;
    }

    const html = buildPrintableReportHtml({
      report,
      range,
      periodLabel,
      generatedAt: new Date().toLocaleString('pt-BR')
    });

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
  };

  const syncText = lastSyncAt
    ? `Atualizado ${lastSyncAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Sincronizando dados';
  const periodLabel = formatPeriodLabel(range.startDate, range.endDate);
  const canClosePeriod = report.activeOrders.length === 0;

  return (
    <section className="reports-dashboard report-print-area" aria-label="Relatorios operacionais">
      <div className="section-heading reports-heading">
        <div>
          <p className="eyebrow">Relatorio gerencial</p>
          <h2>Visao geral do periodo</h2>
          <span>{periodLabel} - comandas, faturamento, pagamentos e reservas.</span>
          <span className="sync-status">{refreshing ? 'Atualizando relatorios...' : syncText}</span>
        </div>
        <div className="reports-actions report-no-print">
          <button type="button" className="ghost-button" onClick={() => loadReports()}>
            {loading ? 'Carregando...' : 'Atualizar'}
          </button>
          <button type="button" className="primary-button" onClick={handlePrint}>
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="report-filter-panel report-no-print">
        <div className="segmented-filter report-period-tabs" role="tablist" aria-label="Tipo de periodo">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              className={periodMode === option.key ? 'active' : ''}
              onClick={() => setPeriodMode(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="report-filter-fields">
          {periodMode === 'day' ? (
            <label>
              Dia
              <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
            </label>
          ) : null}

          {periodMode === 'month' ? (
            <label>
              Mes
              <input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} />
            </label>
          ) : null}

          {periodMode === 'quarter' ? (
            <>
              <label>
                Ano
                <input type="number" min="2020" max="2100" value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)} />
              </label>
              <label>
                Trimestre
                <select value={selectedQuarter} onChange={(event) => setSelectedQuarter(event.target.value)}>
                  <option value="1">1 trimestre</option>
                  <option value="2">2 trimestre</option>
                  <option value="3">3 trimestre</option>
                  <option value="4">4 trimestre</option>
                </select>
              </label>
            </>
          ) : null}

          {periodMode === 'custom' ? (
            <>
              <label>
                Inicio
                <input type="date" value={customStartDate} onChange={(event) => setCustomStartDate(event.target.value)} />
              </label>
              <label>
                Fim
                <input type="date" value={customEndDate} onChange={(event) => setCustomEndDate(event.target.value)} />
              </label>
            </>
          ) : null}
        </div>
      </div>

      {error ? <div className="form-error">{error}</div> : null}

      <div className="report-summary-grid">
        <article>
          <span>Faturamento fechado</span>
          <strong>{formatCurrency(report.revenue)}</strong>
          <em>{report.closedOrders.length} comandas fechadas</em>
        </article>
        <article>
          <span>Ticket medio</span>
          <strong>{formatCurrency(report.ticketAverage)}</strong>
          <em>{report.itemCount} itens vendidos</em>
        </article>
        <article>
          <span>Em aberto</span>
          <strong>{formatCurrency(report.pendingRevenue)}</strong>
          <em>{report.activeOrders.length} comandas ativas</em>
        </article>
        <article>
          <span>Reservas</span>
          <strong>{report.periodReservations.length}</strong>
          <em>{report.peopleForecast} pessoas previstas</em>
        </article>
        <article>
          <span>Descontos</span>
          <strong>{formatCurrency(report.discount)}</strong>
          <em>Cupons e ajustes</em>
        </article>
        <article className={canClosePeriod ? 'ok' : 'warning'}>
          <span>Status do periodo</span>
          <strong>{canClosePeriod ? 'Conferido' : 'Pendente'}</strong>
          <em>{canClosePeriod ? 'Sem comandas abertas' : 'Ainda ha comandas abertas'}</em>
        </article>
      </div>

      <div className="reports-grid clean">
        <article className="reports-panel wide">
          <div className="reports-panel-header">
            <div>
              <h3>Faturamento no periodo</h3>
              <span>Barras por dia ou por mes, conforme o tamanho do periodo.</span>
            </div>
          </div>
          <TimelineChart rows={report.timelineRows} />
        </article>

        <article className="reports-panel">
          <div className="reports-panel-header">
            <div>
              <h3>Pagamentos</h3>
              <span>Total fechado por forma de pagamento.</span>
            </div>
          </div>
          <BarChart
            rows={report.paymentRows}
            valueKey="total"
            valueFormatter={(value, row) => `${formatCurrency(value)} - ${row.count}x`}
            emptyMessage="Nenhum pagamento fechado no periodo."
          />
        </article>

        <article className="reports-panel">
          <div className="reports-panel-header">
            <div>
              <h3>Itens mais vendidos</h3>
              <span>Quantidade vendida por produto.</span>
            </div>
          </div>
          <BarChart
            rows={report.productRows.slice(0, 10)}
            valueKey="quantity"
            valueFormatter={(value, row) => `${value}x - ${formatCurrency(row.total)}`}
            emptyMessage="Nenhum item vendido no periodo."
          />
        </article>

        <article className="reports-panel">
          <div className="reports-panel-header">
            <div>
              <h3>Total de comandas</h3>
              <span>Consolidado geral do periodo.</span>
            </div>
            <button type="button" className="small-button report-no-print" onClick={() => onGoToSection('comandas')}>Ver comandas</button>
          </div>
          <div className="report-status-list">
            {report.orderTotalRows.length === 0 ? (
              <div className="empty compact-empty">Nenhuma comanda no periodo.</div>
            ) : (
              report.orderTotalRows.map((item) => (
                <div key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.count}</strong>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="reports-panel">
          <div className="reports-panel-header">
            <div>
              <h3>Horarios de maior pico</h3>
              <span>Quantidade de comandas abertas por horario.</span>
            </div>
          </div>
          <BarChart
            rows={report.peakHourRows}
            valueKey="count"
            valueFormatter={(value, row) => `${value} comandas - ${formatCurrency(row.total)}`}
            emptyMessage="Nenhuma comanda no periodo."
          />
        </article>

        <article className="reports-panel">
          <div className="reports-panel-header">
            <div>
              <h3>Status das reservas</h3>
              <span>Resumo das reservas dentro do periodo.</span>
            </div>
            <button type="button" className="small-button report-no-print" onClick={() => onGoToSection('reservas')}>Ver reservas</button>
          </div>
          <div className="report-status-list">
            {report.reservationStatusRows.length === 0 ? (
              <div className="empty compact-empty">Nenhuma reserva no periodo.</div>
            ) : (
              report.reservationStatusRows.map((item) => (
                <div key={item.status}>
                  <span>{item.label}</span>
                  <strong>{item.count}</strong>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="reports-panel wide">
          <div className="reports-panel-header">
            <div>
              <h3>Comandas fechadas recentes</h3>
              <span>Ultimos registros para conferencia do caixa.</span>
            </div>
          </div>
          <div className="report-table">
            <div className="report-table-head">
              <span>Comanda</span>
              <span>Mesa</span>
              <span>Cliente</span>
              <span>Pagamento</span>
              <span>Horario</span>
              <span>Total</span>
            </div>
            {report.recentClosedOrders.length === 0 ? (
              <div className="empty compact-empty">Nenhuma comanda fechada no periodo.</div>
            ) : (
              report.recentClosedOrders.map((order) => (
                <div key={order.id} className="report-table-row">
                  <span>#{order.id}</span>
                  <span>{String(order.tableNumber).padStart(2, '0')}</span>
                  <span>{order.customerName || 'Nao informado'}</span>
                  <span>{getPaymentMethod(order)}</span>
                  <span>{formatTime(getOrderDate(order))}</span>
                  <strong>{formatCurrency(getOrderTotal(order))}</strong>
                </div>
              ))
            )}
          </div>
        </article>
      </div>
    </section>
  );
};

export default OperationalReports;
