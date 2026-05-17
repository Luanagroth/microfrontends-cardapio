import React, { useMemo, useState } from 'react';
import './styles.css';
import pratos from './data/pratos';
import PratoCard from './components/PratoCard';

const categories = [
  { key: 'Entrada', label: 'Entradas' },
  { key: 'Pratos Quentes', label: 'Pratos Quentes' },
  { key: 'Saladas', label: 'Saladas' },
  { key: 'Bebidas', label: 'Bebidas' }
];

export const CardapioApp = () => {
  const [activeCategory, setActiveCategory] = useState(categories[0].key);
  const [searchTerm, setSearchTerm] = useState('');

  const numberedPratos = useMemo(
    () => pratos.map((prato, index) => ({ ...prato, number: index + 1 })),
    []
  );

  const categoryPratos = numberedPratos.filter((prato) => prato.categoria === activeCategory);
  const shouldShowSearch = categoryPratos.length > 2;
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visiblePratos = normalizedSearch
    ? categoryPratos.filter((prato) => prato.nome.toLowerCase().includes(normalizedSearch))
    : categoryPratos;

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setSearchTerm('');
  };

  return (
    <div className="cardapio-root">
      <div className="cardapio-top">
        <nav className="category-tabs" aria-label="Categorias do cardápio">
          {categories.map((category) => {
            const isActive = category.key === activeCategory;

            return (
              <button
                key={category.key}
                type="button"
                className={`category-tab ${isActive ? 'active' : ''}`}
                aria-pressed={isActive}
                onClick={() => handleCategoryChange(category.key)}
              >
                {category.label}
              </button>
            );
          })}
        </nav>

        {shouldShowSearch && (
          <div className="menu-search">
            <label className="menu-search-label" htmlFor="menu-search-input">
              Buscar prato...
            </label>
            <input
              id="menu-search-input"
              className="menu-search-input"
              type="search"
              placeholder="Digite o nome do prato"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        )}
      </div>

      <div className="cards-grid">
        {visiblePratos.length > 0 ? (
          visiblePratos.map((prato) => (
            <PratoCard key={prato.id} prato={prato} number={prato.number} />
          ))
        ) : (
          <p className="menu-empty">Nenhum item encontrado nesta categoria.</p>
        )}
      </div>
    </div>
  );
};

export default CardapioApp;
