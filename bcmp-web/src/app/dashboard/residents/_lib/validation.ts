/**
 * Resident form validation helpers.
 * Phase 3 will replace these with shared Zod schemas, but until then the
 * page imports from here so the helpers can be tested in isolation.
 */

export const isValidPHMobile = (v: string) => /^09\d{9}$/.test(v.replace(/\s/g, ""));

export const isValidEmail = (v: string) =>
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);

export const formatPHMobile = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  // Auto-format: 09XX XXX XXXX
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
};
