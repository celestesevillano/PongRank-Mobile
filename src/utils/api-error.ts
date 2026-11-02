import axios from 'axios';

export class ApiError extends Error {
  status: number | null;
  isNetwork: boolean;

  constructor(message: string, status: number | null, isNetwork = false) {
    super(message);
    this.status = status;
    this.isNetwork = isNetwork;
  }
}

const FRIENDLY: Record<number, string> = {
  400: 'Revisa los datos ingresados.',
  401: 'Tu sesión expiró. Inicia sesión de nuevo.',
  403: 'No tienes permiso para hacer esto.',
  404: 'No encontramos lo que buscabas.',
  409: 'Esa acción entra en conflicto con el estado actual.',
};

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      const timedOut = error.code === 'ECONNABORTED';
      return new ApiError(
        timedOut ? 'El servidor tardó demasiado en responder.' : 'Sin conexión. Revisa tu internet.',
        null,
        true,
      );
    }
    const { status, data } = error.response;
    const serverMessage = status < 500 && typeof data?.message === 'string' ? data.message : null;
    return new ApiError(serverMessage ?? FRIENDLY[status] ?? 'Algo salió mal de nuestro lado. Intenta de nuevo.', status);
  }

  return new ApiError('Ocurrió un error inesperado.', null);
}

export const isRetryable = (error: ApiError) => error.isNetwork || (error.status !== null && error.status >= 500);
