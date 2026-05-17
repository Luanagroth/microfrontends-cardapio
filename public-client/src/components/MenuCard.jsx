import React from 'react';

const imageFallbacks = {
  Entradas: '/assets/images/menu/bruschetta-italiana.png',
  'Pratos Principais': '/assets/images/menu/lasanha-artesanal.png',
  Bebidas: '/assets/images/menu/taca-vinho.png',
  Sobremesas: '/assets/images/menu/cheesecake.png',
  default: '/assets/images/menu/lasanha-artesanal.png'
};

const availabilityLabels = {
  Entradas: 'Feito na casa',
  'Pratos Principais': 'Feito na casa',
  Bebidas: 'Seleção Essenza',
  Sobremesas: 'Preparado hoje'
};

const menuImagesByDish = {
  'salada-caprese': '/assets/images/menu/salada-caprese.png',
  'bolinho-de-arroz': '/assets/images/menu/antipasto-italiano.png',
  'bruschetta-classica': '/assets/images/menu/bruschetta-italiana.png',
  'lasanha-da-casa': '/assets/images/menu/lasanha-artesanal.png',
  'file-mignon-ao-molho': '/assets/images/menu/file-mignon.png',
  'risoto-de-cogumelos': '/assets/images/menu/risoto-cogumelos.png',
  'vinho-da-casa': '/assets/images/menu/taca-vinho.png',
  'cerveja-artesanal': '/assets/images/menu/drink-autoral.png',
  'suco-natural': '/assets/images/menu/suco-natural.png',
  'brownie-quente': '/assets/images/menu/brownie.png',
  'cheesecake-de-frutas': '/assets/images/menu/cheesecake.png',
  'pudim-cremoso': '/assets/images/menu/pudim.png'
};

const normalizeDishName = (value = '') =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const formatPrice = (price) => {
  if (typeof price === 'number') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  }
  return price;
};

const MenuCard = ({ item }) => {
  const formattedPrice = formatPrice(item.price);
  const category = item.categoria || item.category?.label || 'default';
  const dishImage = menuImagesByDish[normalizeDishName(item.name)];
  const imageUrl = dishImage || item.imageUrl || imageFallbacks[category] || imageFallbacks.default;
  const imageStyle = { backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' };

  return (
    <article className="menu-card">
      <div className="menu-card-media" aria-hidden="true">
        <span className="menu-card-media-image" style={imageStyle} />
      </div>
      <div className="menu-card-content">
        <div className="menu-card-top-row">
          <div>
            <h4>{item.name}</h4>
            <p>{item.description}</p>
          </div>
          <div className="menu-card-price">{formattedPrice}</div>
        </div>

        <div className="menu-card-meta-row">
          <span className={`menu-card-availability ${item.available ? 'available' : 'unavailable'}`}>
            {item.available ? availabilityLabels[category] || 'Feito na casa' : 'Indisponível'}
          </span>
        </div>
      </div>
    </article>
  );
};

export default MenuCard;
