function isValidationError(error) {
  if (!error || typeof error.message !== 'string') return false;

  const message = error.message.toLowerCase();
  return (
    message.includes('invalido') ||
    message.includes('inválido') ||
    message.includes('obrigatorio') ||
    message.includes('obrigatório')
  );
}

function resolveErrorStatus(error, fallbackStatus = 500) {
  return isValidationError(error) ? 400 : fallbackStatus;
}

module.exports = {
  isValidationError,
  resolveErrorStatus
};
