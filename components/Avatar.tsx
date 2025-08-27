// components/Avatar.tsx
import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { theme } from '../lib/theme';

export default function Avatar({ uri, size = 86 }: { uri?: string|null; size?: number }) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size/2 }]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size/2 }} />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size, borderRadius: size/2 }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 2, borderColor: theme.colors.border, overflow: 'hidden' },
  placeholder: { backgroundColor: theme.colors.surface },
});
