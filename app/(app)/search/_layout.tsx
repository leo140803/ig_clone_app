import { Stack } from 'expo-router';
import { theme } from '../../../lib/theme';

export default function SearchStack() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { color: theme.colors.text },
        contentStyle: { backgroundColor: theme.colors.background },
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      {/* Halaman list search: tanpa header */}
      <Stack.Screen name="index" options={{ headerShown: false }} />

      {/* Halaman profil user: header kustom (judul bukan path) */}
      <Stack.Screen name="[username]" options={{ headerShown: true, title: '' }} />
    </Stack>
  );
}
