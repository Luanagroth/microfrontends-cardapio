const MENU_ASSET_BASE = process.env.MENU_ASSET_BASE || 'http://localhost:4000/assets/images/menu';

const imageBySlug = {
  'salada-caprese': 'salada-caprese.png',
  'bolinho-de-arroz': 'antipasto-italiano.png',
  'bruschetta-classica': 'bruschetta-italiana.png',
  'lasanha-da-casa': 'lasanha-artesanal.png',
  'file-mignon-ao-molho': 'file-mignon.png',
  'risoto-de-cogumelos': 'risoto-cogumelos.png',
  'vinho-da-casa': 'taca-vinho.png',
  'cerveja-artesanal': 'drink-autoral.png',
  'suco-natural': 'suco-natural.png',
  'brownie-quente': 'brownie.png',
  'cheesecake-de-frutas': 'cheesecake.png',
  'pudim-cremoso': 'pudim.png'
};

const fallbackByCategory = {
  Entradas: 'bruschetta-italiana.png',
  'Pratos Principais': 'lasanha-artesanal.png',
  Bebidas: 'taca-vinho.png',
  Sobremesas: 'cheesecake.png'
};

const normalizeDishName = (value = '') =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const buildMenuImageUrl = (fileName) => `${MENU_ASSET_BASE}/${fileName}`;

exports.resolveMenuImageUrl = (product) => {
  if (product.imageUrl) return product.imageUrl;

  const slug = normalizeDishName(product.name);
  const categoryLabel = product.category?.label;
  const fileName = imageBySlug[slug] || fallbackByCategory[categoryLabel];

  return fileName ? buildMenuImageUrl(fileName) : '';
};
