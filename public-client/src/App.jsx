import React, { useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import MenuCard from './components/MenuCard';
import ReservationForm from './components/ReservationForm';
import WorkWithUsForm from './components/WorkWithUsForm';
import Footer from './components/Footer';
import HomeImage from './components/HomeImage';
import { getPublicMenuProducts } from './services/publicMenuService.ts';
import { useActiveSection } from './hooks/useActiveSection';
import { PUBLIC_MESSAGES } from './constants/messages';

const categories = [
  { key: 'Todos', label: 'Todos' },
  { key: 'Entradas', label: 'Entradas' },
  { key: 'Pratos Principais', label: 'Principais' },
  { key: 'Bebidas', label: 'Bebidas' },
  { key: 'Sobremesas', label: 'Sobremesas' }
];

const reviewItems = [
  {
    name: 'Sofia Costa',
    rating: 5,
    comment: 'Uma experiencia memoravel: pratos refinados, atendimento atento e ambiente acolhedor.'
  },
  {
    name: 'Leonardo B.',
    rating: 5,
    comment: 'O jantar ficou perfeito. A selecao de vinhos e o clima do restaurante sao impecaveis.'
  },
  {
    name: 'Marina G.',
    rating: 4,
    comment: 'Delicioso e elegante, perfeito para uma noite especial com amigos ou familia.'
  }
];

const ingredientHighlights = [
  {
    title: 'Ingredientes frescos',
    description: 'Produtores locais selecionados para garantir sabor e autenticidade em cada receita.'
  },
  {
    title: 'Massas artesanais',
    description: 'Preparadas diariamente com farinha especial e tecnicas tradicionais italianas.'
  },
  {
    title: 'Carta de vinhos',
    description: 'Rotulos reconhecidos e descobertas sazonais para harmonizar com cada prato.'
  },
  {
    title: 'Fornecedores locais',
    description: 'Parceiros de confianca que trazem o melhor da estacao ate sua mesa.'
  }
];

const HOME = '/';
const CARDAPIO = '/cardapio';

const getRouteFromPath = (pathname) => (pathname === CARDAPIO ? CARDAPIO : HOME);

const getActiveNavFromLocation = (pathname, hash) => {
  if (pathname === CARDAPIO) return 'cardapio';
  if (hash === '#reservas') return 'reservas';
  if (hash === '#curriculos') return 'curriculos';
  if (hash === '#contato') return 'contato';
  return 'inicio';
};

const App = () => {
  const [route, setRoute] = useState(() => getRouteFromPath(window.location.pathname));
  const [activeNav, setActiveNav] = useState(() =>
    getActiveNavFromLocation(window.location.pathname, window.location.hash)
  );
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState('');
  const navLockUntilRef = useRef(0);

  useEffect(() => {
    const loadProducts = async () => {
      setMenuLoading(true);
      setMenuError('');
      try {
        const products = await getPublicMenuProducts();
        setMenuItems(products);
      } catch (err) {
        console.error(err);
        setMenuError(PUBLIC_MESSAGES.LOAD_MENU_ERROR);
      } finally {
        setMenuLoading(false);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    const syncFromLocation = () => {
      setRoute(getRouteFromPath(window.location.pathname));
      setActiveNav(getActiveNavFromLocation(window.location.pathname, window.location.hash));
    };

    const handlePopState = () => {
      syncFromLocation();
      if (window.location.hash) {
        const anchor = document.querySelector(window.location.hash);
        if (anchor) {
          setTimeout(() => anchor.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
          return;
        }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', syncFromLocation);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', syncFromLocation);
    };
  }, []);

  const navigateTo = (path, hash = '') => {
    const nextUrl = `${path}${hash}`;
    if (window.location.pathname + window.location.hash !== nextUrl) {
      window.history.pushState({}, '', nextUrl);
    }
    setRoute(getRouteFromPath(path));
    setActiveNav(getActiveNavFromLocation(path, hash));
    if (hash) {
      navLockUntilRef.current = Date.now() + 1400;
      setTimeout(() => {
        const anchor = document.querySelector(hash);
        if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useActiveSection({
    route,
    cardapioRoute: CARDAPIO,
    navLockUntilRef,
    setActiveNav
  });

  const normalizedItems = useMemo(
    () =>
      menuItems.map((item) => ({
        ...item,
        categoria: item.category?.label || item.categoria || 'Sem categoria',
        available: item.available !== false
      })),
    [menuItems]
  );

  const availableItems = useMemo(
    () => normalizedItems.filter((item) => item.available),
    [normalizedItems]
  );

  const categoryCounts = useMemo(() => {
    const counts = { Todos: 0 };
    availableItems.forEach((item) => {
      counts.Todos += 1;
      counts[item.categoria] = (counts[item.categoria] || 0) + 1;
    });
    return counts;
  }, [availableItems]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return availableItems.filter((item) => {
      const matchesCategory = activeCategory === 'Todos' || item.categoria === activeCategory;
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        (item.description || '').toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [availableItems, activeCategory, searchQuery]);

  const sections = useMemo(
    () =>
      categories
        .filter((category) => category.key !== 'Todos')
        .map((category) => ({
          ...category,
          items: filteredItems.filter((item) => item.categoria === category.key)
        })),
    [filteredItems]
  );

  const recommendedItems = availableItems.slice(0, 3);
  const resultSummary = searchQuery.trim()
    ? `${filteredItems.length} resultado${filteredItems.length === 1 ? '' : 's'} para "${searchQuery.trim()}"`
    : `${filteredItems.length} item${filteredItems.length === 1 ? '' : 's'} disponivel${filteredItems.length === 1 ? '' : 'is'}`;

  const homeView = (
    <div className="home-flow">
      <Hero onExplore={() => navigateTo(CARDAPIO)} onReserve={() => navigateTo(HOME, '#reservas')} />

      <section className="section home-section section-reservation" id="reservas">
        <div className="section-header">
          <p className="section-label">Reservas</p>
          <h2>Reserve sua mesa com antecedencia</h2>
        </div>
        <div className="reservation-panel">
          <article className="reservation-info-card">
            <HomeImage className="reservation-info-image" src="/assets/images/reservas.png" alt="Mesa preparada para uma reserva no Essenza Bistro" />
            <div className="reservation-info-content">
              <h3>Experiencia preparada para voce</h3>
              <p>
                Selecione data, horario e numero de pessoas. Nossa equipe ira confirmar sua reserva em breve para que
                sua noite seja impecavel.
              </p>
            </div>
          </article>
          <ReservationForm />
        </div>
      </section>

      <section className="section home-section career-section" id="curriculos">
        <div className="career-card">
          <div className="career-copy">
            <p className="section-label">Trabalhe conosco</p>
            <h2>Venha fazer parte do nosso time.</h2>
            <p>Se voce ama hospitalidade, tem atencao aos detalhes e busca um ambiente elegante, queremos conhecer sua candidatura.</p>
          </div>
          <div className="career-content">
            <WorkWithUsForm />
          </div>
        </div>
      </section>

      <section className="section home-section contact-section" id="contato">
        <div className="section-header">
          <p className="section-label">Contato</p>
          <h2>Fale conosco e conheca o Essenza.</h2>
        </div>
        <div className="contact-grid">
          <article className="contact-card">
            <h3>Endereco</h3>
            <p>Rua das Flores, 123</p>
            <p>Jardim das Delicias - Sao Paulo</p>
          </article>
          <article className="contact-card">
            <h3>Telefone</h3>
            <p>(11) 1234-5678</p>
            <p>reservas@essenzabistro.com.br</p>
          </article>
          <article className="contact-card">
            <h3>Funcionamento</h3>
            <p>Segunda a Domingo</p>
            <p>12:00 - 23:00</p>
          </article>
        </div>
        <div className="social-links">
          <a href="https://wa.me/551112345678" target="_blank" rel="noreferrer" className="social-button">WhatsApp</a>
          <a href="https://instagram.com/essenzabistro" target="_blank" rel="noreferrer" className="social-button">Instagram</a>
          <a href="https://facebook.com/essenzabistro" target="_blank" rel="noreferrer" className="social-button">Facebook</a>
        </div>
      </section>

      <section className="section home-section about-section">
        <div className="about-grid">
          <div className="about-copy">
            <p className="section-label">Sobre o restaurante</p>
            <h2>Essenza Bistro celebra a tradicao italiana com um toque contemporaneo.</h2>
            <p>
              Localizado no coracao da cidade, o Essenza Bistro oferece uma experiencia gastronomica refinada,
              com pratos elaborados a partir de ingredientes sazonais, massas artesanais e uma carta de vinhos pensada
              para harmonizar cada momento.
            </p>
            <p>
              Aqui, cada detalhe e pensado para trazer a sensacao de estar em uma casa italiana acolhedora, moderna e
              profundamente ligada a arte do servico.
            </p>
          </div>
          <HomeImage className="about-image" src="/assets/images/about-restaurant.jpg" alt="Area interna elegante do Essenza Bistro" />
        </div>
      </section>

      <section className="section home-section history-section">
        <div className="history-card">
          <p className="section-label">Breve historia</p>
          <h2>Uma paixao iniciada em receitas de familia e nas ruas de Florenca.</h2>
          <p>
            Em 2022, a Essenza nasceu da vontade de trazer para a cidade uma cozinha que celebra o simples com o melhor.
            O cardapio foi criado a partir de memorias afetivas, ingredientes escolhidos e um servico que valoriza
            momentos compartilhados.
          </p>
        </div>
      </section>

      <section className="section home-section ingredients-section">
        <div className="section-header">
          <p className="section-label">Selecao de ingredientes</p>
          <h2>Frescor, artesanal e origem local em cada detalhe.</h2>
        </div>
        <div className="ingredients-layout">
          <div className="ingredient-grid">
            {ingredientHighlights.map((item) => (
              <article key={item.title} className="ingredient-card">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
          <div className="ingredients-image-card ingredients-photo-stack">
            <HomeImage className="ingredients-image ingredients-image-main" src="/assets/images/ingredients.jpg" alt="Ingredientes frescos selecionados" />
            <HomeImage className="ingredients-image ingredients-image-secondary" src="/assets/images/artisan-kitchen.jpg" alt="Preparo artesanal na cozinha" />
          </div>
        </div>
      </section>

      <section className="section home-section ambience-section">
        <div className="ambience-grid">
          <div className="ambience-copy">
            <p className="section-label">Ambiente</p>
            <h2>Um espaco pensado para encontros, comemoracoes e jantares especiais.</h2>
            <p>
              O Essenza Bistro combina iluminacao suave, texturas naturais e mesas postas com porcelana refinada. E um
              local onde o tempo desacelera e cada visita se torna uma pequena celebracao.
            </p>
          </div>
          <HomeImage className="ambience-image" src="/assets/images/dining-room.jpg" alt="Sala de jantar acolhedora do restaurante" />
        </div>
      </section>

      <section className="section home-section experience-section">
        <div className="experience-panel">
          <div className="experience-copy">
            <p className="section-label">Experiencia / encontros</p>
            <h2>Momentos a mesa com ritmo calmo, servico atento e atmosfera acolhedora.</h2>
            <p>
              Do primeiro brinde a sobremesa, cada detalhe e organizado para receber jantares a dois, celebracoes
              discretas e encontros entre amigos com conforto e elegancia.
            </p>
          </div>
          <div className="experience-image-card">
            <HomeImage className="experience-image" src="/assets/images/table-setting.jpg" alt="Mesa posta para uma experiencia gastronomica especial" />
          </div>
        </div>
      </section>

      <section className="section home-section reviews-section">
        <div className="section-header">
          <p className="section-label">Comentarios</p>
          <h2>O que nossos clientes elogiam</h2>
        </div>
        <div className="review-grid">
          {reviewItems.map((item) => (
            <article key={item.name} className="review-card">
              <div className="review-meta">
                <strong>{item.name}</strong>
                <span className="review-rating">{'*'.repeat(item.rating)}</span>
              </div>
              <p>{item.comment}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section home-section team-section">
        <div className="team-card">
          <HomeImage className="team-image" src="/assets/images/team-award.jpg" alt="Equipe do Essenza Bistro em momento de reconhecimento" />
          <div className="team-copy">
            <p className="section-label">Nossa equipe</p>
            <h2>Nossa equipe</h2>
            <h3>Paixao, cuidado e excelencia em cada detalhe.</h3>
            <p>Acreditamos que grandes experiencias sao construidas por pessoas. Nossa equipe trabalha diariamente para transformar cada visita em um momento especial.</p>
          </div>
        </div>
      </section>
    </div>
  );

  const cardapioView = (
    <>
      <section className="section section-cardapio-banner">
        <div className="section-banner-content">
          <h2>Selecao Essenza</h2>
          <p>Nossa carta reune massas frescas, entradas delicadas, bebidas selecionadas e sobremesas autorais.</p>
          <div className="menu-summary-row" aria-label="Resumo do cardapio">
            <span>{categoryCounts.Todos || 0} itens disponiveis</span>
            <span>{categories.length - 1} categorias</span>
          </div>
        </div>
      </section>

      <section className="section section-menu" id="cardapio">
        {!menuLoading && !menuError && recommendedItems.length > 0 ? (
          <section className="menu-featured-block" aria-label="Destaques da casa">
            <div className="menu-featured-heading">
              <div>
                <p className="section-label">Destaques da casa</p>
                <h3>Escolhas para comecar</h3>
              </div>
            </div>
            <div className="menu-featured-grid">
              {recommendedItems.map((item) => (
                <MenuCard key={`featured-${item.id}`} item={item} />
              ))}
            </div>
          </section>
        ) : null}

        <div className="menu-filter-panel">
          <div className="menu-search-box">
            <label htmlFor="public-menu-search">Buscar no cardapio</label>
            <div className="menu-search-control">
              <input
                id="public-menu-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="search-input"
                placeholder="Prato, ingrediente ou descricao"
                aria-label="Buscar no cardapio"
              />
              {searchQuery ? (
                <button type="button" className="menu-clear-button" onClick={() => setSearchQuery('')}>
                  Limpar
                </button>
              ) : null}
            </div>
            <span>{resultSummary}</span>
          </div>

          <div className="category-filter" role="tablist" aria-label="Filtrar categorias">
            {categories.map((category) => {
              const count = categoryCounts[category.key] || 0;
              return (
                <button
                  key={category.key}
                  type="button"
                  className={`category-filter-button ${activeCategory === category.key ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category.key)}
                  aria-pressed={activeCategory === category.key}
                >
                  <span>{category.label}</span>
                  <small>{count}</small>
                </button>
              );
            })}
          </div>
        </div>

        {menuLoading ? (
          <div className="menu-grid menu-skeleton-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="menu-card menu-card-skeleton">
                <div className="menu-card-media menu-card-media-skeleton" />
                <div className="menu-card-content-skeleton">
                  <div className="skeleton-line skeleton-title" />
                  <div className="skeleton-line skeleton-text" />
                  <div className="skeleton-line skeleton-text short" />
                  <div className="skeleton-line skeleton-price" />
                </div>
              </div>
            ))}
          </div>
        ) : menuError ? (
          <div className="form-error">{menuError}</div>
        ) : filteredItems.length === 0 ? (
          <div className="empty menu-empty-state">
            Nenhum prato encontrado para os filtros selecionados.
            {searchQuery ? (
              <button type="button" className="menu-clear-button" onClick={() => setSearchQuery('')}>
                Limpar busca
              </button>
            ) : null}
          </div>
        ) : (
          <div className="menu-grid">
            {sections.map((section) =>
              section.items.length > 0 ? (
                <div key={section.key} className="menu-category-card">
                  <div className="menu-category-header">
                    <h3>{section.label}</h3>
                    <span>{section.items.length} itens</span>
                  </div>
                  <div className="menu-items-list">
                    {section.items.map((item) => (
                      <MenuCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}
      </section>
    </>
  );

  return (
    <div className="public-client-app">
      <Header onNavigate={navigateTo} activeNav={activeNav} />
      <main>{route === CARDAPIO ? cardapioView : homeView}</main>
      <Footer />
    </div>
  );
};

export default App;
