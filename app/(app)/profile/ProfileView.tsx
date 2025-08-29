// app/(app)/profile/ProfileView.tsx
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View, Pressable, Alert, Modal, Animated, Dimensions, Image } from 'react-native';
import { theme } from '../../../lib/theme';
import Avatar from '../../../components/Avatar';
import Button from '../../../components/Button';
import Stat from '../../../components/Stat';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import type { User } from '../../../types/api';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { BlurView } from 'expo-blur';

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

  // state untuk preview avatar
  const [previewOpen, setPreviewOpen] = useState(false);

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
    <>
      <View style={styles.mainContainer}>
        <ScrollView style={{ flex:1 }} contentContainerStyle={{ paddingBottom: 24 }}>
          {/* Header ala Instagram */}
          <View style={styles.header}>
            <Text style={styles.username}>{data.username}</Text>
            {isSelf ? (<Ionicons name="ellipsis-horizontal" size={22} color={theme.colors.text} />) : (<></>)}
          </View>

          {/* Avatar + stats */}
          <View style={styles.topRow}>
            <Pressable onLongPress={() => setPreviewOpen(true)}>
              <Avatar uri={data.avatar_url || undefined} size={86} />
            </Pressable>
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
                title={
                  data.is_following
                    ? 'Following'
                    : data.follows_me
                    ? 'Follow back'
                    : 'Follow'
                }
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

          {/* Grid posts */}
          <PostsGrid userId={data.id} token={token!} />

        </ScrollView>
      </View>

      {/* Modal preview avatar */}
      <AvatarPreview
        visible={previewOpen}
        onClose={() => setPreviewOpen(false)}
        uri={data.avatar_url || undefined}
      />
    </>
  );
}

/* ----------------- Preview Modal ----------------- */
function AvatarPreview({ visible, onClose, uri }: { visible: boolean; onClose: () => void; uri?: string }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7 }),
      ]).start();
    } else {
      opacity.setValue(0);
      scale.setValue(0.9);
    }
  }, [visible]);

  const { width } = Dimensions.get('window');
  const size = Math.min(width * 0.8, 340);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      </Animated.View>

      <View style={modalStyles.center}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <View style={[modalStyles.imageWrap, { width: size, height: size, borderRadius: size/2 }]}>
            <Pressable onPress={onClose} hitSlop={20}>
              {/* pakai Image biasa biar full-res */}
              <Avatar uri={uri} size={size} />
            </Pressable>
          </View>
        </Animated.View>

        <Pressable onPress={onClose} style={modalStyles.closeBtn}>
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </Pressable>
      </View>
    </Modal>
  );
}

/* ----------------- Small UI pieces ----------------- */
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

type PostLite = {
  id: number;
  image_urls: string[];   // dari PostSerializer
  user: { id: number; username: string }; // minimal yang dipakai
};
type Meta = { page: number; total_pages: number; count: number } | undefined;


function PostsGrid({ userId, token }: { userId: number; token: string }) {
  const pathname = usePathname();
  const [items, setItems] = useState<PostLite[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<Meta>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // helper normalisasi respons (bisa {posts, meta} atau array saja)
  function normalize(raw: any): { posts: PostLite[]; meta?: Meta } {
    const posts = Array.isArray(raw) ? raw : (raw?.posts ?? raw?.data ?? []);
    return { posts, meta: raw?.meta };
  }

  const fetchPage = async (pageNum: number, replace = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      // coba pakai filter user_id (aman kalau diabaikan BE)
      const url = `/posts?page=${pageNum}&user_id=${userId}`;
      const res = await api<any>(url, { token });
      let { posts, meta } = normalize(res);
      // fallback: kalau BE gak filter di server, filter di FE
      if (Array.isArray(posts)) {
        posts = posts.filter(p => p.user?.id === userId);
      }
      setMeta(meta);
      setItems(prev => (replace || pageNum === 1 ? posts : [...prev, ...posts]));
    } catch (e) {
      // TODO: toast kalau perlu
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchPage(1, true); }, [userId]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchPage(1, true);
  };

  const onEndReached = () => {
    if (loading) return;
    if (meta && page >= (meta.total_pages || 1)) return;
    const next = page + 1;
    setPage(next);
    fetchPage(next, false);
  };

  if (loading && items.length === 0) {
    return (
      <View style={styles.gridLoading}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <View style={styles.gridEmpty}>
        <Ionicons name="image-outline" size={48} color={theme.colors.muted} />
        <Text style={{ color: theme.colors.muted, marginTop: 8 }}>Belum ada postingan</Text>
      </View>
    );
  }

  // simple grid 3 kolom
  return (
    <ScrollView
      contentContainerStyle={{ paddingTop: 8 }}
      refreshControl={
        // pakai RefreshControl manual (optional): bisa juga FlatList numColumns=3,
        // tapi di profile kita sudah pakai ScrollView parent—jadi grid manual saja.
        // Jika mau performa besar, pindah ke FlatList numColumns=3.
        undefined
      }
    >
      <View style={styles.gridWrap}>
        {items.map((p) => {
          const thumb = p.image_urls?.[0];
          if (!thumb) return null;
          return (
            <Pressable
              key={p.id}
              style={styles.gridCell}
              onPress={() =>
                router.push({
                  pathname: '/(app)/post/[id]',
                  params: { id: String(p.id), from: pathname || '/(app)/profile' },
                })
              }
            >
              <Image source={{ uri: thumb }} style={styles.gridImg} />

              {/* Tanda multi-foto */}
              {p.image_urls.length > 1 && (
                <View style={styles.multiIcon}>
                  <Ionicons name="albums-outline" size={14} color="#fff" />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* infinite scroll sederhana */}
      {meta && page < (meta.total_pages || 1) ? (
        <Pressable onPress={onEndReached} style={{ paddingVertical: 16 }}>
          <ActivityIndicator />
        </Pressable>
      ) : null}
    </ScrollView>
  );
}


/* ----------------- Styles ----------------- */
const styles = StyleSheet.create({
  mainContainer: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  },
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
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2, // rapat ala IG
    paddingHorizontal: 1,
  },
  gridCell: {
    width: '33.333%',
    aspectRatio: 1,
    backgroundColor: theme.colors.surface,
  },
  gridImg: {
    width: '100%',
    height: '100%',
  },
  gridLoading: {
    height: 200, alignItems: 'center', justifyContent: 'center',
  },
  gridEmpty: {
    height: 200, alignItems: 'center', justifyContent: 'center',
    borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  multiIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 3,
    borderRadius: 8,
  },
  
});

const modalStyles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrap: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  closeBtn: {
    marginTop: 16,
    padding: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});