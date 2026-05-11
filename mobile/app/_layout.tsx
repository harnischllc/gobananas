import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../lib/theme';
import { configureNotifications } from '../lib/notifications';

// One-time setup so the pet-banana peak alerts behave correctly
// when fired while the app is foregrounded.
configureNotifications();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="result"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        {/* Rewards is a dev-only modal route. Production builds render
            it as a hidden screen (no entry point exists in You either). */}
        {__DEV__ && (
          <Stack.Screen
            name="rewards"
            options={{
              presentation: 'modal',
              headerShown: false,
            }}
          />
        )}
      </Stack>
    </SafeAreaProvider>
  );
}
