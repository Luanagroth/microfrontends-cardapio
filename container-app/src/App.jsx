import React, { Suspense, useState, useEffect } from 'react';
import { EVENTS } from '../../shared/events';

const CardapioApp = React.lazy(() =>
  import('cardapio/CardapioApp').then((module) => ({ default: module.CardapioApp || module.default }))
);
const PedidoApp = React.lazy(() =>
  import('pedido/PedidoApp').then((module) => ({ default: module.PedidoApp || module.default }))
);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: '#a00', padding: '24px', fontFamily: 'Arial, sans-serif' }}>
          <h1>Erro ao carregar o container</h1>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme-mode');
    return saved ? saved === 'dark' : false;
  });
  const [selectedTable, setSelectedTable] = useState(null);
  const [occupiedTables, setOccupiedTables] = useState({});

  useEffect(() => {
    localStorage.setItem('theme-mode', isDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    const handlePedidoEstado = (event) => {
      const { mesa, itemCount } = event.detail || {};
      if (!mesa) return;
      setOccupiedTables((prev) => {
        const next = { ...prev };
        if (itemCount > 0) {
          next[mesa] = true;
        } else {
          delete next[mesa];
        }
        return next;
      });
    };

    window.addEventListener(EVENTS.ORDER_STATE, handlePedidoEstado);
    return () => window.removeEventListener(EVENTS.ORDER_STATE, handlePedidoEstado);
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const handleSelectTable = (table) => {
    setSelectedTable(table);
    window.dispatchEvent(new CustomEvent(EVENTS.TABLE_SELECTED, { detail: { mesa: String(table) } }));
  };

  const tableNumbers = Array.from({ length: 12 }, (_, index) => index + 1);

  return (
    <ErrorBoundary>
      <div className="app-wrap">
        <header className="topbar">
          <div className="topbar-brand">
            <div>
              <h1 className="brand-title">ESSENZA BISTRÔ</h1>
              <p className="brand-subtitle">Sistema interno de comandas e mesas</p>
            </div>
          </div>
          <div className="topbar-actions">
            <span className="status-badge online"><span className="status-dot" />Online</span>
            <button className="theme-toggle" onClick={toggleTheme} title={isDark ? 'Modo claro' : 'Modo escuro'}>
              {isDark ? 'Claro' : 'Escuro'}
            </button>
          </div>
        </header>

        <main className="dashboard-grid">
          <section className="panel panel-left">
            <div className="section-title">
              <div>
                <p className="panel-label">Comanda</p>
              </div>
            </div>
            <div className="panel-content compact">
              <div className="panel-summary">
                <div className="summary-row">
                  <span className="summary-label">Mesa</span>
                  <strong>{selectedTable ? `Mesa ${selectedTable}` : 'Nenhuma mesa'}</strong>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Status</span>
                  <span className={`status-pill ${selectedTable ? 'occupied' : 'free'}`}>
                    {selectedTable ? 'Aberta' : 'Aguardando mesa'}
                  </span>
                </div>
              </div>
              <div className="order-frame">
                <Suspense fallback={<div className="empty">Carregando pedido...</div>}>
                  <PedidoApp />
                </Suspense>
              </div>
            </div>
          </section>

          <section className="panel panel-center">
            <div className="section-title">
              <div>
                <p className="panel-label">Mesas</p>
              </div>
            </div>
            <div className="tables-grid">
              {tableNumbers.map((table) => {
                const occupied = Boolean(occupiedTables[String(table)]);
                const selected = selectedTable === table;
                return (
                  <button
                    key={table}
                    className={`table-card ${occupied ? 'occupied' : 'free'} ${selected ? 'selected' : ''}`}
                    onClick={() => handleSelectTable(table)}
                    type="button"
                  >
                    <div className="table-number">Mesa {String(table).padStart(2, '0')}</div>
                    <div className="table-state">{selected ? 'Selecionada' : occupied ? 'Ocupada' : 'Livre'}</div>
                    <div className="table-total">Total: R$ {occupied ? '...': '0,00'}</div>
                  </button>
                );
              })}
            </div>
            <div className="tables-legend">
              <span className="legend-chip free">Livre</span>
              <span className="legend-chip occupied">Ocupada</span>
              <span className="legend-chip selected">Selecionada</span>
            </div>
          </section>

          <section className="panel panel-right">
            <div className="section-title">
              <div>
                <p className="panel-label">Cardápio</p>
              </div>
            </div>
            <div className="panel-content">
              <div className="menu-frame">
                <Suspense fallback={<div className="empty">Carregando cardápio...</div>}>
                  <CardapioApp />
                </Suspense>
              </div>
            </div>
          </section>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default App;
