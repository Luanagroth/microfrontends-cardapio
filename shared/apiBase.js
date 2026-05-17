// Base URL shared by all frontends for backend requests.
// Use API_BASE in the shell or CI when pointing to another environment.
const API_BASE =
  (typeof process !== 'undefined' && process.env && process.env.API_BASE) ||
  'http://localhost:4000/api';

export { API_BASE };
