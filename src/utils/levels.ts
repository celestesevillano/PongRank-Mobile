export const INITIAL_LEVELS = [
  { value: 'NEW', label: 'Nuevo', hint: 'Recién empiezo', rating: 1000 },
  { value: 'BEGINNER', label: 'Principiante', hint: 'Juego de vez en cuando', rating: 1200 },
  { value: 'INTERMEDIATE', label: 'Intermedio', hint: 'Juego con regularidad', rating: 1500 },
  { value: 'ADVANCED', label: 'Avanzado', hint: 'Compito en torneos', rating: 1800 },
  { value: 'EXPERT', label: 'Experto', hint: 'Nivel federado', rating: 2000 },
] as const;

export type InitialLevel = (typeof INITIAL_LEVELS)[number]['value'];
