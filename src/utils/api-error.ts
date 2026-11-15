import axios from 'axios';

const FRIENDLY: Partial<Record<number, string>> = {
  400: 'Revisa los datos ingresados.',
  401: 'Tu sesión expiró. Inicia sesión de nuevo.',
  403: 'No tienes permiso para hacer esto.',
  404: 'No encontramos lo que buscabas.',
  409: 'No pudimos completar la acción. Actualiza e intenta de nuevo.',
  422: 'Revisa los datos ingresados.',
  429: 'Espera un momento antes de volver a intentarlo.',
};

type TransportFailure = 'offline' | 'timeout';

export class ApiError extends Error {
  readonly status: number | null;
  readonly isNetwork: boolean;

  constructor(status: number | null, transportFailure?: TransportFailure) {
    // Los textos visibles salen de la app. La respuesta puede incluir rutas o detalles internos.
    const message = transportFailure === 'timeout'
      ? 'PongRank tardó demasiado en responder. Intenta de nuevo.'
      : transportFailure === 'offline'
        ? 'No pudimos conectar con PongRank. Revisa tu conexión.'
        : status === null
          ? 'Ocurrió un error inesperado.'
          : FRIENDLY[status] ?? 'No pudimos completar la operación. Intenta de nuevo.';
    super(message);
    this.status = status;
    this.isNetwork = transportFailure !== undefined;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (!axios.isAxiosError(error)) return new ApiError(null);

  if (error.response) return new ApiError(error.response.status);
  const timedOut = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
  return new ApiError(null, timedOut ? 'timeout' : 'offline');
}

export const isRetryable = (error: ApiError) => error.isNetwork || (error.status !== null && error.status >= 500);
