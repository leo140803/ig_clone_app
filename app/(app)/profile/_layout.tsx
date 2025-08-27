import { Stack } from 'expo-router';
import { theme } from '../../../lib/theme';

export default function ProfileStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { color: theme.colors.text },
        contentStyle: { backgroundColor: theme.colors.background },
        headerBackButtonDisplayMode: 'minimal', // tanpa teks back
      }}
    >
      {/* Sembunyikan header di tab Profile (index) */}
      <Stack.Screen name="index" options={{ headerShown: false }} />

      {/* Profil user lain: mau tampilkan header? (opsional) */}
      <Stack.Screen name="[username]" options={{ headerShown: true, title: '' }} />

      {/* Edit Profile: tampilkan header */}
      <Stack.Screen name="edit" options={{ headerShown: true, title: 'Edit Profile' }} />
    </Stack>
  );
}
