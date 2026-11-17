# PongRank Mobile

Aplicación móvil de **PongRank**, la plataforma de tenis de mesa para jugadores de UTEC: partidas con marcador en vivo, ranking, comunidades, clubes, Pongmigos (amigos), planes de membresía y un coach de postura. Proyecto de CS2031 Desarrollo Basado en Plataformas (Proyecto 2).

Construida con **React Native + Expo** (Expo Router, TypeScript) y conectada al backend REST de PongRank.

## Enlaces

| Componente | URL |
| --- | --- |
| API (Spring Boot, AWS) | https://pongrank-api.duckdns.org |
| Documentación de la API (Swagger) | https://pongrank-api.duckdns.org/swagger-ui.html |
| Web (Vercel) | https://pong-rank-web.vercel.app |
| App móvil (build EAS) | https://expo.dev/accounts/pongrank-team/projects/pongrank-mobile |

## Cómo ejecutarla

```bash
npm ci
npx expo start --go
```

La URL de la API se toma de `EXPO_PUBLIC_API_URL` (ver `.env.example`); por defecto apunta al backend desplegado. Para generar el APK se usa EAS (`eas.json`).

## Funcionalidades

- Registro e inicio de sesión con JWT (refresh automático) y registro en cuatro pasos con nivel inicial y categoría FDPTM sugerida.
- Partidas: crear (contra Pongmigos, comunidades o clubes, o abierta), buscar partidas cerca, marcador en vivo, confirmación y disputa del resultado, historial y estadísticas.
- Social: comunidades, clubes (registro con revisión), Pongmigos (solicitudes, lista y perfil público).
- Planes y pagos (Mercado Pago), perfil editable con foto, redes y WhatsApp.
- Coach Pongi: análisis de postura y golpes con la cámara y retroalimentación por voz.

## Arquitectura

```
src/
  app/          pantallas y rutas (Expo Router)
  components/   componentes reutilizables (auth, common, communities, clubs, matches, plans, profile...)
  context/      estado global: sesión, plan, registro y avisos
  hooks/        lógica reutilizable (useFetch, usePaginated, useLocation, useDebouncedValue, ...)
  services/     capa de API: cliente axios con interceptores y un servicio por recurso
  utils/        validaciones, errores de API, estadísticas, puntuación
  constants/    tema, planes y textos
  types/        tipos de la API
docs/           sistema de diseño y visores de pantallas
tests/          pruebas de la lógica del cuadro de torneos
```

- **Integración con el backend:** un único cliente `axios` con `baseURL`, cabeceras por defecto, interceptor de autenticación (Bearer) y renovación del token ante un 401. Los tokens se guardan con `expo-secure-store`. Las lecturas usan `AbortController` y reintentos con espera exponencial para errores recuperables.
- **Sensores y APIs externas:** ubicación (`expo-location`) para partidas cercanas y direcciones, cámara (`expo-camera`) para el Coach, galería (`expo-image-picker`) para la foto de perfil, voz (`expo-speech`); pagos con Mercado Pago. Los permisos tienen mensajes claros y alternativas cuando no se conceden.
- **Errores y carga:** los mensajes de error son amigables (no técnicos), hay indicadores de carga, estados vacíos, pantalla sin conexión con «Reintentar», validaciones antes de enviar y avisos de éxito o error como ventanas emergentes.
- **Diseño:** ver [`docs/pongrank-sistema-de-diseno.md`](docs/pongrank-sistema-de-diseno.md).

## Equipo y participación

| Integrante | Código | Principales aportes | Participación |
| --- | --- | --- | --- |
| Adriana Celeste Sevillano Común | 202310146 | Backend, sistema de diseño, pantallas y flujos de Mobile, pruebas y coordinación | 100 % |
| Treicy Calsina Gutiérrez | 202520007 | Despliegue (API y EAS) y Web | 100 % |
| Adriana Celeste Alvarado León | 202420154 | Coach (análisis de postura), Web y correcciones de navegación | 100 % |
| Andrea Alejandra Vidal Coello | 202410193 | _completar_ | 100 % |

> Cada integrante cumplió completamente sus responsabilidades (100 %).
