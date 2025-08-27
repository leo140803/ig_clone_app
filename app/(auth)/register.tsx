// app/(auth)/register.tsx
import React, { useState } from 'react';
import { Link, router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import TextField from '../../components/TextField';
import Button from '../../components/Button';
import ErrorText from '../../components/ErrorText';
import { theme } from '../../lib/theme';
import { useAuth } from '../../lib/auth-context';

export default function RegisterScreen() {
  const { signup } = useAuth();
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Validasi input yang lebih comprehensive
  const validateInput = () => {
    if (!username.trim()) {
      setError('Username wajib diisi');
      return false;
    }
    if (username.trim().length < 3) {
      setError('Username minimal 3 karakter');
      return false;
    }
    if (!email.trim()) {
      setError('Email wajib diisi');
      return false;
    }
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Format email tidak valid');
      return false;
    }
    if (!password) {
      setError('Password wajib diisi');
      return false;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return false;
    }
    return true;
  };

  const onSubmit = async () => {
    setError(undefined);
    
    if (!validateInput()) return;

    try {
      setSubmitting(true);
      await signup({ 
        username: username.trim().toLowerCase(), 
        email: email.trim().toLowerCase(), 
        password, 
        name: name.trim() || undefined 
      });
      router.replace('/(app)/home');
    } catch (e: any) {
      setError(e.message || 'Gagal membuat akun. Silakan coba lagi.');
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
          <Text style={styles.title}>Buat Akun Baru ✨</Text>
          <Text style={styles.subtitle}>Bergabunglah dan mulai jelajahi feed menarik</Text>
        </View>

        <View style={styles.formContainer}>
          <TextField
            label="Username"
            placeholder="johndoe"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoComplete="username"
            textContentType="username"
          />
          
          <TextField
            label="Nama Lengkap (opsional)"
            placeholder="John Doe"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            textContentType="name"
          />
          
          <TextField
            label="Email"
            placeholder="john@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />
          
          <TextField
            label="Password"
            placeholder="Minimal 6 karakter"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            showPasswordToggle={true}
            onTogglePassword={() => setShowPassword(!showPassword)}
          />
          
          {error && <ErrorText>{error}</ErrorText>}
          
          <Button 
            title="Buat Akun" 
            onPress={onSubmit} 
            loading={submitting}
            style={styles.registerButton}
          />
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>Sudah punya akun?</Text>
          <Link href="/(auth)/login" style={styles.link}>
            Masuk di sini
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
  },
  header: {
    gap: 8,
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
  },
  formContainer: {
    gap: 20,
  },
  registerButton: {
    marginTop: 8,
  },
  bottomRow: {
    marginTop: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  bottomText: {
    color: theme.colors.muted,
    fontSize: 14,
  },
  link: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});