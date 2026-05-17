export const COUPONS = [
  {
    code: 'MESA10',
    label: '10% OFF',
    description: 'Desconto de 10% no total',
    type: 'percent',
    value: 10,
    message: 'Cupom aplicado: 10% de desconto'
  },
  {
    code: 'ALMOCO5',
    label: 'R$ 5 OFF',
    description: 'Desconto fixo de R$ 5',
    type: 'fixed',
    value: 5,
    message: 'Cupom aplicado: R$ 5,00 de desconto'
  }
];

export const findCouponByCode = (code) =>
  COUPONS.find((coupon) => coupon.code === code);
