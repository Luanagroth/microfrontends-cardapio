import React from 'react';
import HomeImage from './HomeImage';

const Hero = ({ onExplore, onReserve }) => (
  <section id="inicio" className="hero-section hero-section-premium">
    <div className="hero-copy">
      <h1>Culinária italiana com alma artesanal</h1>
      <p className="hero-text">
        Ingredientes selecionados, massas frescas e uma experiência pensada para encontros memoráveis.
      </p>
    </div>
    <div className="hero-visual">
      <HomeImage
        className="hero-image"
        src="/assets/images/hero-restaurant.jpg"
        alt="Mesa elegante do restaurante Essenza Bistro"
        loading="eager"
      />
    </div>
    <div className="hero-actions">
      <button type="button" className="button button-primary" onClick={onExplore}>
        Ver cardápio completo
      </button>
      <button type="button" className="button button-secondary" onClick={onReserve}>
        Reservar mesa
      </button>
    </div>
  </section>
);

export default Hero;
