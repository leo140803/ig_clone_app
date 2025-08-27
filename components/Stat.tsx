// components/Stat.tsx
import React from 'react';
import { Text, View } from 'react-native';
import { theme } from '../lib/theme';
import { nCompact } from '../lib/format';

export default function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 18 }}>{nCompact(value)}</Text>
      <Text style={{ color: theme.colors.muted, fontSize: 12 }}>{label}</Text>
    </View>
  );
}
