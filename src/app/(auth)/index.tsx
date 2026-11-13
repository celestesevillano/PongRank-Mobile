import { Redirect } from 'expo-router';

// Con Expo Router 58 la ruta inicial del grupo (auth) ya no se resuelve sola:
// sin una pantalla en "/", la app mostraba "Unmatched Route" al abrir sin sesión.
export default function AuthIndex() {
  return <Redirect href="/welcome" />;
}
