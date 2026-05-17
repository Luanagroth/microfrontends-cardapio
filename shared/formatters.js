export const formatCurrency = (value) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

export const formatPrice = formatCurrency;

export const formatTime = (date) => {
  if (!date) return null;
  const parsedDate = new Date(date);
  return parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
