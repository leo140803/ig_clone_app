import { Stack } from 'expo-router';
import { theme } from '../../../lib/theme';

export default function ProfileStack() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { color: theme.colors.text },
        contentStyle: { backgroundColor: theme.colors.background },
        // GANTI INI:
        headerBackButtonDisplayMode: 'minimal', // <- tanpa teks back
      }}
    />
  );
}
