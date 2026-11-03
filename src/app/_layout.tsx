import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { SessionProvider, useSession } from '@/context/session';
import { ToastProvider } from '@/context/toast';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isAuthenticated, isLoading, onboardingComplete } = useSession();

  if (isLoading) {
    return null;
  }

  const showApp = isAuthenticated && onboardingComplete;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={showApp}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!showApp}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <SessionProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <ToastProvider>
          <RootNavigator />
        </ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
