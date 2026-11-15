export function normalizeStudentNisn(nisn: string): string {
  return String(nisn ?? '').trim();
}

export async function studentNisnHash(nisn: string): Promise<string> {
  const normalized = normalizeStudentNisn(nisn);
  if (!normalized || normalized.length > 30) {
    throw new Error('NISN harus diisi dan tidak boleh lebih dari 30 karakter.');
  }
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
}
