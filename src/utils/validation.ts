const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateName = (value: string) => (value.trim().length === 0 ? 'Ingresa tu nombre.' : null);

export const validateEmail = (value: string) => (EMAIL_PATTERN.test(value.trim()) ? null : 'Ingresa un correo válido.');

export function validatePassword(value: string) {
  if (value.length < 8) return 'Usa al menos 8 caracteres.';
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Incluye al menos una letra y un número.';
  return null;
}

export const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const toIsoDate = (day: number, month: number, year: number) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

/** Edad en años cumplidos, o null si la fecha no existe o es futura. */
export function ageFromDate(day: number, month: number, year: number, today = new Date()) {
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  if (date >= today) return null;
  let age = today.getFullYear() - year;
  const birthdayPassed = today.getMonth() > month - 1 || (today.getMonth() === month - 1 && today.getDate() >= day);
  if (!birthdayPassed) age -= 1;
  return age;
}

export const validateBirthDate = (day: number | null, month: number | null, year: number | null) => {
  if (!day || !month || !year) return 'Elige tu fecha de nacimiento.';
  return ageFromDate(day, month, year) === null ? 'Esa fecha no es válida.' : null;
};
