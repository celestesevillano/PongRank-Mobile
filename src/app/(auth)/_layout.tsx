import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      initialRouteName="welcome"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000000' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="create-community" />
      <Stack.Screen name="onboarding-rating" />
      <Stack.Screen name="onboarding-community" />
    </Stack>
  );
}
