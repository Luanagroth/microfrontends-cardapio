import React from 'react';

const navLinks = [
  { path: '/#inicio', label: 'Inicio', key: 'inicio' },
  { path: '/cardapio', label: 'Cardapio', key: 'cardapio' },
  { path: '/#reservas', label: 'Reservas', key: 'reservas' },
  { path: '/#curriculos', label: 'Curriculos', key: 'curriculos' },
  { path: '/#contato', label: 'Contato', key: 'contato' }
];

const Header = ({ onNavigate, activeNav }) => (
  <header className="public-header">
    <div className="header-brand">
      <img className="brand-mark" src="/assets/images/logo.svg" alt="Essenza Bistro" />
      <span className="brand-title">Essenza Bistro</span>
      <span className="brand-separator" aria-hidden="true">|</span>
      <span className="brand-subtitle">Culinaria Italiana</span>
    </div>
    <nav className="header-nav" aria-label="Menu principal">
      {navLinks.map((link) => (
        <a
          key={link.path}
          href={link.path}
          className={activeNav === link.key ? 'active' : ''}
          aria-current={activeNav === link.key ? 'page' : undefined}
          onClick={(event) => {
            if (!onNavigate) return;
            event.preventDefault();
            const [path, hash] = link.path.split('#');
            onNavigate(path || '/', hash ? `#${hash}` : '');
          }}
        >
          {link.label}
        </a>
      ))}
    </nav>
  </header>
);

export default Header;
