const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateName = (value: string) => (value.trim().length === 0 ? 'Ingresa tu nombre.' : null);

export const validateEmail = (value: string) => (EMAIL_PATTERN.test(value.trim()) ? null : 'Ingresa un correo válido.');

export function validatePassword(value: string) {
  if (value.length < 8) return 'Usa al menos 8 caracteres.';
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Incluye al menos una letra y un número.';
  return null;
}
