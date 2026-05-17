import React, { Suspense, useEffect, useState } from 'react';
import { EVENTS } from '../../shared/events';
import { formatCurrency } from '../../shared/formatters';
import InternalReservations from './components/InternalReservations';
import OperationalDashboard from './components/OperationalDashboard';
import OperationalReports from './components/OperationalReports';
import ProductManager from './components/ProductManager';
import CurriculumManager from './components/CurriculumManager';

const PedidoApp = React.lazy(() =>
  import('pedido/PedidoApp').then((module) => ({ default: module.PedidoApp || module.default }))
);

const ADMIN_PROFILES = [
  {
    email: 'admin@essenza.local',
    password: 'admin123',
    name: 'Administrador',
    role: 'Gestao interna'
  },
  {
    email: 'gerente@essenza.local',
    password: 'gerente123',
    name: 'Gerente',
    role: 'Operacao do restaurante'
  }
];

const SUPPORT_CONTACT = {
  name: 'Suporte Essenza',
  phone: '(47) 99999-0101',
  email: 'suporte@essenza.local'
};

const PAGE_META = {
  painel: {
    eyebrow: 'Operacao do restaurante',
    title: 'Painel interno',
    description: 'Resumo do turno, reservas proximas, comandas abertas e alertas.'
  },
  reservas: {
    eyebrow: 'Reservas',
    title: 'Reservas',
    description: 'Acompanhe reservas ativas, proximas e historico.'
  },
  mesas: {
    eyebrow: 'Mesas',
    title: 'Mapa de mesas',
    description: 'Selecione uma mesa para abrir ou carregar a comanda ativa.'
  },
  comandas: {
    eyebrow: 'Comandas',
    title: 'Comandas',
    description: 'Adicione itens reais do cardapio e acompanhe o status da mesa.'
  },
  cardapio: {
    eyebrow: 'Cardapio',
    title: 'Gestao de cardapio',
    description: 'Gerencie produtos, categorias, imagens e disponibilidade.'
  },
  relatorios: {
    eyebrow: 'Relatorios',
    title: 'Relatorios',
    description: 'Acompanhe fechamento do dia, pagamentos, itens vendidos e reservas.'
  },
  curriculos: {
    eyebrow: 'Curriculos',
    title: 'Curriculos',
    description: 'Analise candidaturas recebidas pelo site publico.'
  }
};

const navItems = [
  ['#painel', 'Painel'],
  ['#reservas', 'Reservas'],
  ['#mesas', 'Mesas'],
  ['#comandas', 'Comandas'],
  ['#cardapio', 'Cardapio'],
  ['#relatorios', 'Relatorios'],
  ['#curriculos', 'Curriculos']
];

const TABLE_FILTERS = [
  { key: 'todas', label: 'Todas' },
  { key: 'livres', label: 'Livres' },
  { key: 'ocupadas', label: 'Ocupadas' }
];

const getTableStatusMeta = (occupied, details = {}) => {
  if (!occupied) {
    return {
      key: 'free',
      label: 'Disponivel',
      helper: 'Pronta para iniciar atendimento'
    };
  }

  if (details.status === 'em preparo') {
    return {
      key: 'preparing',
      label: 'Em preparo',
      helper: 'Pedido em andamento'
    };
  }

  if (details.status === 'entregue') {
    return {
      key: 'payment',
      label: 'Aguardando pagamento',
      helper: 'Conferir consumo e fechar'
    };
  }

  return {
    key: 'occupied',
    label: 'Em atendimento',
    helper: 'Comanda aberta'
  };
};

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

const getInitialPage = () => {
  const hash = window.location.hash.replace('#', '');
  return PAGE_META[hash] ? hash : 'painel';
};

const getPageFromHash = () => {
  const hash = window.location.hash.replace('#', '');
  return PAGE_META[hash] ? hash : 'painel';
};

const App = () => {
  const [adminProfile, setAdminProfile] = useState(() => {
    const savedProfile = localStorage.getItem('admin-profile');
    if (!savedProfile) return null;
    try {
      return JSON.parse(savedProfile);
    } catch (err) {
      localStorage.removeItem('admin-profile');
      return null;
    }
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [selectedTable, setSelectedTable] = useState(null);
  const [occupiedTables, setOccupiedTables] = useState({});
  const [tableDetails, setTableDetails] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(getInitialPage);
  const [tableFilter, setTableFilter] = useState('todas');

  const tableNumbers = Array.from({ length: 12 }, (_, index) => index + 1);
  const occupiedCount = Object.keys(occupiedTables).length;
  const freeCount = tableNumbers.length - occupiedCount;
  const selectedTableDetails = selectedTable ? tableDetails[String(selectedTable)] : null;
  const activePage = PAGE_META[activeSection] ? activeSection : 'painel';
  const activePageMeta = PAGE_META[activePage];
  const shouldShowPageHeader = !['reservas', 'curriculos'].includes(activePage);

  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
  }, []);

  useEffect(() => {
    const handlePedidoEstado = (event) => {
      const { mesa, itemCount, isOccupied, occupiedTables: nextOccupiedTables, tableDetails: nextTableDetails } = event.detail || {};
      if (nextOccupiedTables) {
        setOccupiedTables(nextOccupiedTables);
        setTableDetails(nextTableDetails || {});
        return;
      }
      if (!mesa) return;
      setOccupiedTables((prev) => {
        const next = { ...prev };
        if (isOccupied || itemCount > 0) {
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

  useEffect(() => {
    const handleTableSelected = (event) => {
      const nextTable = event.detail?.mesa;
      if (nextTable) {
        setSelectedTable(Number(nextTable));
      }
    };

    window.addEventListener(EVENTS.TABLE_SELECTED, handleTableSelected);
    return () => window.removeEventListener(EVENTS.TABLE_SELECTED, handleTableSelected);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const nextPage = getPageFromHash();
      setActiveSection(nextPage);
      setSidebarOpen(false);
      window.scrollTo({ top: 0, behavior: 'auto' });
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateToPage = (sectionId) => {
    const safeSection = PAGE_META[sectionId] ? sectionId : 'painel';
    if (window.location.hash !== `#${safeSection}`) {
      window.location.hash = safeSection;
      return;
    }
    // If user clicks the current section again, keep UX consistent.
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleLogin = (event) => {
    event.preventDefault();
    const profile = ADMIN_PROFILES.find(
      (item) =>
        item.email.toLowerCase() === loginEmail.trim().toLowerCase() &&
        item.password === loginPassword
    );

    if (!profile) {
      setLoginError('Login ou senha invalidos.');
      return;
    }

    const sessionProfile = {
      email: profile.email,
      name: profile.name,
      role: profile.role
    };
    localStorage.setItem('admin-profile', JSON.stringify(sessionProfile));
    setAdminProfile(sessionProfile);
    setLoginEmail('');
    setLoginPassword('');
    setLoginError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('admin-profile');
    setAdminProfile(null);
    setSidebarOpen(false);
  };

  const handleNavClick = (event, href) => {
    event.preventDefault();
    navigateToPage(href.replace('#', ''));
  };

  const handleSelectTable = (table) => {
    setSelectedTable(table);
    navigateToPage('comandas');
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent(EVENTS.TABLE_SELECTED, { detail: { mesa: String(table) } }));
    }, 100);
  };

  const renderTablesPage = () => (
    <section className="dashboard-section page-section">
      <div className="table-page-summary">
        <article>
          <span>Livres</span>
          <strong>{freeCount}</strong>
        </article>
        <article>
          <span>Ocupadas</span>
          <strong>{occupiedCount}</strong>
        </article>
        <article>
          <span>Mesa selecionada</span>
          <strong>{selectedTable ? String(selectedTable).padStart(2, '0') : '--'}</strong>
        </article>
      </div>

      <div className="table-toolbar">
        <div className="segmented-filter table-filter" role="tablist" aria-label="Filtrar mesas">
          {TABLE_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={tableFilter === filter.key ? 'active' : ''}
              onClick={() => setTableFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <span>Selecione uma mesa para abrir ou consultar a comanda.</span>
      </div>

      <div className="tables-grid">
        {tableNumbers.filter((table) => {
          const occupied = Boolean(occupiedTables[String(table)]);
          if (tableFilter === 'livres') return !occupied;
          if (tableFilter === 'ocupadas') return occupied;
          return true;
        }).map((table) => {
          const occupied = Boolean(occupiedTables[String(table)]);
          const details = tableDetails[String(table)];
          const selected = selectedTable === table;
          const statusMeta = getTableStatusMeta(occupied, details);
          return (
            <button
              key={table}
              className={`table-card ${statusMeta.key} ${selected ? 'selected' : ''}`}
              onClick={() => handleSelectTable(table)}
              type="button"
            >
              <div className="table-card-top">
                <div>
                  <div className="table-number">Mesa {String(table).padStart(2, '0')}</div>
                  <div className="table-state">{statusMeta.helper}</div>
                </div>
                <div className={`table-status-badge ${statusMeta.key}`}>
                  {statusMeta.label}
                </div>
              </div>
              {selected ? <div className="table-state">Selecionada</div> : null}
              <div className="table-card-details">
                <div>
                  <span>Cliente</span>
                  <strong>{details?.customerName || '-'}</strong>
                </div>
                <div>
                  <span>Itens</span>
                  <strong>{details?.itemCount || 0}</strong>
                </div>
                <div>
                  <span>Total</span>
                  <strong>{details ? formatCurrency(details.total || 0) : formatCurrency(0)}</strong>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="tables-legend">
        <span className="legend-chip free">Disponivel</span>
        <span className="legend-chip occupied">Em atendimento</span>
        <span className="legend-chip payment">Aguardando pagamento</span>
        <span className="legend-chip selected">Selecionada</span>
      </div>
    </section>
  );

  const renderActivePage = () => {
    if (activePage === 'painel') {
      return (
        <OperationalDashboard
          freeCount={freeCount}
          occupiedCount={occupiedCount}
          selectedTable={selectedTable}
          onGoToSection={navigateToPage}
        />
      );
    }

    if (activePage === 'reservas') {
      return (
        <section className="dashboard-section page-section">
          <InternalReservations />
        </section>
      );
    }

    if (activePage === 'mesas') {
      return renderTablesPage();
    }

    if (activePage === 'comandas') {
      return (
        <section className="dashboard-section page-section">
          <div className="command-page-context">
            <div>
              <span>Mesa em foco</span>
              <strong>{selectedTable ? `Mesa ${String(selectedTable).padStart(2, '0')}` : 'Nenhuma mesa selecionada'}</strong>
              <em>
                {selectedTable
                  ? `${selectedTableDetails?.customerName || 'Cliente nao informado'} - ${selectedTableDetails ? formatCurrency(selectedTableDetails.total || 0) : formatCurrency(0)}`
                  : 'Selecione uma mesa no mapa para iniciar ou carregar a comanda.'}
              </em>
            </div>
            <button type="button" className="ghost-button" onClick={() => navigateToPage('mesas')}>
              Ver mapa de mesas
            </button>
          </div>
          <Suspense fallback={<div className="empty">Carregando pedido...</div>}>
            <PedidoApp />
          </Suspense>
        </section>
      );
    }

    if (activePage === 'cardapio') {
      return (
        <section className="dashboard-section page-section">
          <ProductManager />
        </section>
      );
    }

    if (activePage === 'relatorios') {
      return (
        <OperationalReports onGoToSection={navigateToPage} />
      );
    }

    if (activePage === 'curriculos') {
      return (
        <section className="dashboard-section page-section">
          <CurriculumManager />
        </section>
      );
    }

    return (
      <OperationalDashboard
        freeCount={freeCount}
        occupiedCount={occupiedCount}
        selectedTable={selectedTable}
        onGoToSection={navigateToPage}
      />
    );
  };

  if (!adminProfile) {
    return (
      <ErrorBoundary>
        <main className="login-shell">
          <section className="login-panel" aria-label="Acesso administrativo">
            <div className="login-brand">
              <img className="sidebar-logo" src="/favicon.svg" alt="Essenza Bistro" />
              <div>
                <p className="eyebrow">Sistema interno</p>
                <h1>Essenza Bistro</h1>
                <span>Acesso administrativo</span>
              </div>
            </div>

            <form className="login-form" onSubmit={handleLogin}>
              <label>
                Login
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  placeholder="admin@essenza.local"
                  autoComplete="username"
                />
              </label>
              <label>
                Senha
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  placeholder="Senha"
                  autoComplete="current-password"
                />
              </label>
              {loginError ? <div className="form-error">{loginError}</div> : null}
              <button type="submit" className="primary-button">Entrar</button>
            </form>

            <div className="login-support">
              <span>Suporte</span>
              <strong>{SUPPORT_CONTACT.name}</strong>
              <a href={`mailto:${SUPPORT_CONTACT.email}`}>{SUPPORT_CONTACT.email}</a>
              <a href={`tel:${SUPPORT_CONTACT.phone.replace(/\D/g, '')}`}>{SUPPORT_CONTACT.phone}</a>
            </div>
          </section>
        </main>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="admin-shell">
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-brand">
            <img className="sidebar-logo" src="/favicon.svg" alt="Essenza Bistro" />
            <div>
              <h1>Essenza</h1>
              <span>Bistro Admin</span>
            </div>
          </div>

          <nav className="sidebar-nav" aria-label="Navegacao administrativa">
            {navItems.map(([href, label]) => {
              const pageId = href.replace('#', '');
              return (
                <a
                  key={href}
                  href={href}
                  className={activePage === pageId ? 'active' : ''}
                  onClick={(event) => handleNavClick(event, href)}
                >
                  {label}
                </a>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <section className="profile-card" aria-label="Perfil administrativo">
              <div className="profile-avatar">{adminProfile.name.charAt(0)}</div>
              <div>
                <strong>{adminProfile.name}</strong>
                <span>{adminProfile.role}</span>
                <em>{adminProfile.email}</em>
              </div>
            </section>

            <section className="support-card" aria-label="Contato de suporte">
              <span>Suporte</span>
              <strong>{SUPPORT_CONTACT.phone}</strong>
              <a href={`mailto:${SUPPORT_CONTACT.email}`}>{SUPPORT_CONTACT.email}</a>
            </section>

            <button className="logout-button" type="button" onClick={handleLogout}>Sair</button>
          </div>
        </aside>

        <main className="admin-main page-main">
          {shouldShowPageHeader ? (
            <header className="admin-header page-header">
              <button
                type="button"
                className="menu-toggle"
                aria-label="Abrir menu"
                onClick={() => setSidebarOpen((current) => !current)}
              >
                Menu
              </button>
              <div>
                <p className="eyebrow">{activePageMeta.eyebrow}</p>
                <h2>{activePageMeta.title}</h2>
                <span>{activePageMeta.description}</span>
              </div>
            </header>
          ) : null}

          {renderActivePage()}
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default App;
