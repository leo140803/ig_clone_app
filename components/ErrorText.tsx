// components/ErrorText.tsx
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { theme } from '../lib/theme';

export default function ErrorText({ children }: { children?: string }) {
  if (!children) return null;
  return <Text style={styles.err}>{children}</Text>;
}

const styles = StyleSheet.create({
  err: {
    color: theme.colors.danger,
    marginTop: 6,
  },
});
