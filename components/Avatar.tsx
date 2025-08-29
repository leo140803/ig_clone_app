// components/Avatar.tsx
import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { theme } from '../lib/theme';

export default function Avatar({ uri, size = 86 }: { uri?: string|null; size?: number }) {
  const borderRadius = size / 2;

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius }]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius }}
        />
      ) : (
        <Image
          // path relatif dari folder `components/` -> naik satu level ke root
          // lalu ke assets/images/avatar-placeholder.png
          source={require('../assets/images/avatar-placeholder.png')}
          style={{ width: size, height: size, borderRadius, backgroundColor: theme.colors.surface }}
          resizeMode="cover"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
});
