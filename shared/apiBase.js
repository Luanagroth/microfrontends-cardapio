// Base URL shared by all frontends for backend requests.
// In production hosts (for example *.vercel.app), fallback to Railway API.
const ENV_API_BASE =
  typeof process !== 'undefined' && process.env ? process.env.API_BASE : '';

const PROD_FALLBACK_API_BASE =
  'https://microfrontends-cardapio-production.up.railway.app/api';

const isBrowser = typeof window !== 'undefined';
const isVercelHost = isBrowser && /vercel\.app$/i.test(window.location.hostname);

const API_BASE = ENV_API_BASE || (isVercelHost ? PROD_FALLBACK_API_BASE : 'http://localhost:4000/api');

export { API_BASE };
