export async function studentNisnHash(nisn: string): Promise<string> {
  const normalized = String(nisn || '').replace(/\D/g, '');
  if (!/^\d{10}$/.test(normalized)) throw new Error('NISN harus terdiri dari 10 angka.');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
}