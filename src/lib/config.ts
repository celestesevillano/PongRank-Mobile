import Constants from 'expo-constants';

// El backend ya está desplegado en AWS (EC2 + RDS); se puede sobreescribir con EXPO_PUBLIC_API_URL en .env
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  'https://pongrank-api.duckdns.org';
