// app/(app)/home.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../lib/theme';
import Button from '../../components/Button';
import { useAuth } from '../../lib/auth-context';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Halo, {user?.name || user?.username}! 🎉</Text>
      <Text style={styles.subtitle}>Kamu berhasil login. Lanjutkan membangun fitur lain…</Text>

      <Button
        title="Logout"
        onPress={async () => {
          await logout();
          router.replace('/(auth)/login');
        }}
        style={{ marginTop: theme.spacing.xl }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  title: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: theme.colors.muted,
  },
});
