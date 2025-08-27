// app/(auth)/login.tsx
import React, { useState } from 'react';
import { Link, router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import TextField from '../../components/TextField';
import Button from '../../components/Button';
import ErrorText from '../../components/ErrorText';
import { theme } from '../../lib/theme';
import { useAuth } from '../../lib/auth-context';

export default function LoginScreen() {
  const { login } = useAuth();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async () => {
    setError(undefined);
    
    if (!loginId.trim() || !password) {
      setError('Mohon isi semua field.');
      return;
    }
    
    try {
      setSubmitting(true);
      await login(loginId.trim(), password);
      router.replace('/(app)/home');
    } catch (e: any) {
      setError(e.message || 'Gagal login. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.select({ ios: 'padding', android: undefined })} 
      style={styles.keyboardView}
    >
      <ScrollView 
        contentContainerStyle={styles.container} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome back 👋</Text>
          <Text style={styles.subtitle}>Masuk dengan username atau email kamu</Text>
        </View>

        <View style={styles.form}>
          <TextField
            label="Username atau Email"
            placeholder="johndoe / john@doe.com"
            value={loginId}
            onChangeText={setLoginId}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
          />
          <TextField
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            textContentType="password"
            autoComplete="password"
            showPasswordToggle
            onTogglePassword={() => setShowPassword(!showPassword)}
          />
          {error && <ErrorText>{error}</ErrorText>}
          <Button 
            title="Login" 
            onPress={onSubmit} 
            loading={submitting}
            disabled={!loginId.trim() || !password || submitting}
          />
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>Belum punya akun?</Text>
          <Link href="/(auth)/register" style={styles.link}>
            Register
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    gap: 8,
    marginBottom: 32,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 20,
  },
  form: {
    gap: 16,
  },
  bottomRow: {
    marginTop: theme.spacing.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  bottomText: {
    color: theme.colors.muted,
    fontSize: 15,
  },
  link: { 
    color: theme.colors.primary, 
    fontWeight: '600',
    fontSize: 15,
  },
});