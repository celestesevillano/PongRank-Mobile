import { http } from '@/services/http';
import type { AuthResponse, PlayerResponse } from '@/types/api';

export const authService = {
  register: (input: {
    name: string;
    email: string;
    password: string;
    initialRating?: number;
    federatedDeclared?: boolean;
    categoryFdptm?: string;
  }) =>
    http.post<AuthResponse>('/auth/register', input).then((r) => r.data),

  login: (input: { email: string; password: string }) => http.post<AuthResponse>('/auth/login', input).then((r) => r.data),

  forgotPassword: (email: string) => http.post<void>('/auth/forgot-password', { email }).then((r) => r.data),

  me: () => http.get<PlayerResponse>('/auth/me').then((r) => r.data),
};
