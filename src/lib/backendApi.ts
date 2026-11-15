const configuredApiUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
export const SIMPATIK_API_BASE_URL = configuredApiUrl ? configuredApiUrl.replace(/\/$/, '') : '';
export const simpatikApi = (path: string) => (SIMPATIK_API_BASE_URL ? SIMPATIK_API_BASE_URL + path : path);
