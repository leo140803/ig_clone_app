// app/(app)/profile/ProfileView.tsx
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { theme } from '../../../lib/theme';
import Avatar from '../../../components/Avatar';
import Button from '../../../components/Button';
import Stat from '../../../components/Stat';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import type { User } from '../../../types/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

type Props = {
  username?: string; // jika kosong => self profile
};

export default function ProfileView({ username }: Props) {
  const { token, user: me } = useAuth();
  const isSelf = !username || username === me?.username;

  const [data, setData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function fetchData() {
    try {
      setLoading(true);
      if (isSelf) {
        const res = await api<any>('/users/me', { token: token! });
        setData(res.user);
      } else {
        const res = await api<any>(`/users/${encodeURIComponent(username!)}`, { token: token! });
        setData(res.user);
      }
    } catch (e: any) {
      setError(e.message || 'Gagal memuat profil');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, [username]);

  const onOpenWebsite = () => {
    if (data?.website) {
      const url = data.website.startsWith('http') ? data.website : `https://${data.website}`;
      Linking.openURL(url).catch(() => Alert.alert('Tidak bisa membuka URL'));
    }
  };

  const onFollowToggle = async () => {
    if (!data) return;
    try {
      setFollowLoading(true);
      if (data.is_following) {
        await api(`/users/${data.id}/follow`, { method: 'DELETE', token });
        setData({ ...data, is_following: false, followers_count: Math.max(0, data.followers_count - 1) });
      } else {
        await api(`/users/${data.id}/follow`, { method: 'POST', token });
        setData({ ...data, is_following: true, followers_count: data.followers_count + 1 });
      }
    } catch (e: any) {
      Alert.alert('Gagal', e.message || 'Tidak bisa update follow');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator /></View>;
  }
  if (error || !data) {
    return <View style={styles.center}><Text style={{ color: theme.colors.danger }}>{error || 'Profil tidak ditemukan'}</Text></View>;
  }

  return (
    <ScrollView style={{ flex:1, backgroundColor: theme.colors.background }} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Header ala Instagram */}
      <View style={styles.header}>
        <Text style={styles.username}>{data.username}</Text>
        <Ionicons name="ellipsis-horizontal" size={22} color={theme.colors.text} />
      </View>

      {/* Avatar + stats */}
      <View style={styles.topRow}>
        <Avatar uri={data.avatar_url || undefined} size={86} />
        <View style={styles.stats}>
          <Stat label="Posts" value={data.posts_count} />
          <Stat label="Followers" value={data.followers_count} />
          <Stat label="Following" value={data.following_count} />
        </View>
      </View>

      {/* Name, bio, website */}
      <View style={{ paddingHorizontal: 16, gap: 4, marginTop: 8 }}>
        {data.name ? <Text style={styles.name}>{data.name}</Text> : null}
        {data.bio ? <Text style={styles.bio}>{data.bio}</Text> : null}
        {data.website ? (
          <Pressable onPress={onOpenWebsite}>
            <Text style={styles.link}>{data.website}</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Action buttons */}
      <View style={{ paddingHorizontal: 16, marginTop: 12, flexDirection: 'row', gap: 8 }}>
        {isSelf ? (
          <>
            <ActionButton title="Edit Profile" onPress={() => router.push('/(app)/profile/edit')} />
            <ActionButton title="Share Profile" onPress={() => { /* TODO */ }} />
          </>
        ) : (
          <>
            <ActionButton
              title={data.is_following ? 'Following' : 'Follow'}
              onPress={onFollowToggle}
              loading={followLoading}
              primary={!data.is_following}
            />
            <ActionButton title="Message" onPress={() => { /* TODO */ }} />
          </>
        )}
      </View>

      {/* Segmented Tabs (Posts/Tagged) – visual only untuk sekarang */}
      <View style={styles.segments}>
        <Segment icon="grid-outline" active />
        <Segment icon="pricetag-outline" />
      </View>

      {/* Grid posts — tampilan menyusul */}
      <View style={styles.gridPlaceholder}>
        <Ionicons name="image-outline" size={48} color={theme.colors.muted} />
        <Text style={{ color: theme.colors.muted, marginTop: 8 }}>Posts — tampilan menyusul</Text>
      </View>
    </ScrollView>
  );
}

function ActionButton({ title, onPress, primary, loading }: { title: string; onPress?: () => void; primary?: boolean; loading?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        {
          flex: 1,
          paddingVertical: 8,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: primary ? theme.colors.primary : theme.colors.border,
          backgroundColor: primary ? theme.colors.primary : theme.colors.surface,
          opacity: pressed || loading ? 0.8 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{title}</Text>
      )}
    </Pressable>
  );
}

function Segment({ icon, active }: { icon: any; active?: boolean }) {
  return (
    <View style={{ flex:1, alignItems:'center', paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: active ? theme.colors.text : 'transparent' }}>
      <Ionicons name={icon} size={20} color={active ? theme.colors.text : theme.colors.muted} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex:1, alignItems:'center', justifyContent:'center', backgroundColor: theme.colors.background },
  header: {
    paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', alignItems:'center', justifyContent:'space-between',
  },
  username: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
  topRow: { flexDirection: 'row', alignItems:'center', gap: 24, paddingHorizontal: 16, marginTop: 4 },
  stats: { flex:1, flexDirection: 'row', justifyContent: 'space-around' },
  name: { color: theme.colors.text, fontWeight: '700' },
  bio: { color: theme.colors.text },
  link: { color: theme.colors.primary, fontWeight:'600' },
  segments: {
    flexDirection: 'row', marginTop: 14, borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  gridPlaceholder: {
    height: 260, alignItems:'center', justifyContent:'center', borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
});
