const configuredApiUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
export const SIMPATIK_API_BASE_URL = (configuredApiUrl || 'https://simpatik-backend.onrender.com').replace(/\/$/, '');
export const simpatikApi = (path: string) => SIMPATIK_API_BASE_URL + path;
