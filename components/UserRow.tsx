import React from 'react';
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { theme } from '../lib/theme';
import Avatar from './Avatar';

type Props = {
  username: string;
  name?: string | null;
  avatar_url?: string | null;
  isSelf?: boolean;
  is_following?: boolean;
  follows_me?: boolean;
  loading?: boolean;
  onPress?: () => void;            // buka profil
  onToggleFollow?: () => void;     // follow/unfollow
};

export default function UserRow({
  username, name, avatar_url, is_following, isSelf, loading, onPress, onToggleFollow, follows_me,
}: Props) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Avatar uri={avatar_url || undefined} size={44} />
      <View style={styles.info}>
        <Text style={styles.username}>{username}</Text>
        {!!name && <Text style={styles.name}>{name}</Text>}
      </View>

      {!isSelf && (
        <Pressable
          onPress={onToggleFollow}
          disabled={loading}
          style={({ pressed }) => [
            styles.btn,
            is_following ? styles.btnSecondary : styles.btnPrimary,
            pressed && { opacity: 0.85 },
          ]}
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.btnText}>
  {is_following ? 'Following' : follows_me ? 'Follow back' : 'Follow'}
</Text>
          )}
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  info: { flex: 1 },
  username: { color: theme.colors.text, fontWeight: '700' },
  name: { color: theme.colors.muted, marginTop: 2, fontSize: 12 },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  btnPrimary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  btnSecondary: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  btnText: { color: theme.colors.text, fontWeight: '700' },
});
