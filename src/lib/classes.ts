export const SCHOOL_CLASSES = ['VII (Tujuh)', 'VIII (Delapan)', 'IX (Sembilan)'] as const;

export type SchoolClass = typeof SCHOOL_CLASSES[number];

export function getClassLevel(value: string | null | undefined): 'VII' | 'VIII' | 'IX' | '' {
  const normalized = String(value || '').trim().toUpperCase().replace(/^KELAS\s+/, '');
  const match = normalized.match(/^(VIII|VII|IX)(?=$|[\s(-])/);
  return match ? (match[1] as 'VII' | 'VIII' | 'IX') : '';
}

export function getClassDisplayName(value: string | null | undefined): string {
  const level = getClassLevel(value);
  if (level === 'VII') return SCHOOL_CLASSES[0];
  if (level === 'VIII') return SCHOOL_CLASSES[1];
  if (level === 'IX') return SCHOOL_CLASSES[2];
  return '';
}
