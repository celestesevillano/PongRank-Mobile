export function whatsAppInternationalNumber(value?: string | null) {
  const raw = value?.trim();
  if (!raw || !/^[+\d\s().-]+$/.test(raw)) return null;
  const digits = raw.replace(/\D/g, '');
  if (!raw.startsWith('+') && /^9\d{8}$/.test(digits)) return `51${digits}`;
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}
