import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../../../lib/theme';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api';
import type { User } from '../../../types/api';
import UserRow from '../../../components/UserRow';
import { router } from 'expo-router';

type Meta = { page: number; total_pages: number; count: number };

function normalizeUsersResponse(raw: any): { users: User[]; meta?: Meta } {
  // dukung dua bentuk: { users: [...], meta: {...} } atau langsung array
  const users = Array.isArray(raw) ? raw : (raw?.users ?? []);
  const meta = raw?.meta;
  return { users, meta };
}

export default function SearchScreen() {
  const { token, user: me } = useAuth();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<User[]>([]);
  const [meta, setMeta] = useState<Meta | undefined>();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [followLoadingId, setFollowLoadingId] = useState<number | null>(null);

  // debounce input
  const typingRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedSetQuery = (text: string) => {
    setQ(text);
    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => {
      // reset page & fetch
      setPage(1);
      fetchUsers(text, 1, true);
    }, 300);
  };

  const fetchUsers = useCallback(async (query: string, pageNum: number, replace = false) => {
    try {
      if (pageNum === 1 && replace) setLoading(true);
      const url = `/search/users?q=${encodeURIComponent(query)}&page=${pageNum}`;
      const res = await api<any>(url, { token: token! });
      const { users, meta } = normalizeUsersResponse(res);
      setMeta(meta);
      setItems(prev => (pageNum === 1 || replace ? users : [...prev, ...users]));
    } catch (e) {
      // bisa tampilkan toast
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // initial fetch (kosongkan query untuk tampilkan semua/terurut username)
  useEffect(() => {
    fetchUsers('', 1, true);
    return () => { if (typingRef.current) clearTimeout(typingRef.current); };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchUsers(q, 1, true);
  };

  const onEndReached = () => {
    if (loading) return;
    if (meta && page >= (meta.total_pages || 1)) return;
    const next = page + 1;
    setPage(next);
    fetchUsers(q, next, false);
  };

  const onToggleFollow = async (u: User) => {
    try {
      setFollowLoadingId(u.id);
      if (u.is_following) {
        await api(`/users/${u.id}/follow`, { method: 'DELETE', token });
        setItems(prev => prev.map(x => x.id === u.id ? { ...x, is_following: false, followers_count: Math.max(0, (x.followers_count||0)-1) } : x));
      } else {
        await api(`/users/${u.id}/follow`, { method: 'POST', token });
        setItems(prev => prev.map(x => x.id === u.id ? { ...x, is_following: true, followers_count: (x.followers_count||0)+1 } : x));
      }
    } catch {
      // TODO: toast error
    } finally {
      setFollowLoadingId(null);
    }
  };

  const renderItem = ({ item }: { item: User }) => (
    <UserRow
      username={item.username}
      name={item.name}
      avatar_url={item.avatar_url || undefined}
      is_following={item.is_following}
      follows_me={item.follows_me}
      isSelf={item.id === me?.id}
      loading={followLoadingId === item.id}
      onPress={() => router.push(`/(app)/search/${item.username}`)}
      onToggleFollow={() => onToggleFollow(item)}
    />
  );

  const keyExtractor = (item: User) => `${item.id}`;

  const listEmpty = useMemo(() => (
    <View style={styles.empty}>
      {loading ? <ActivityIndicator /> : <Text style={{ color: theme.colors.muted }}>Tidak ada hasil</Text>}
    </View>
  ), [loading]);

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <TextInput
          placeholder="Search users..."
          placeholderTextColor={theme.colors.muted}
          style={styles.input}
          autoCapitalize="none"
          value={q}
          onChangeText={debouncedSetQuery}
          returnKeyType="search"
        />
      </View>

      {/* List */}
      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={listEmpty}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.text} />}
        onEndReachedThreshold={0.3}
        onEndReached={onEndReached}
        ListFooterComponent={
          meta && page < (meta.total_pages || 1)
            ? <View style={{ paddingVertical: 16 }}><ActivityIndicator /></View>
            : null
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  searchBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    fontSize: 16,
  },
  sep: { height: 1, backgroundColor: theme.colors.border, marginLeft: 72 }, // offset biar gak nabrak avatar
  empty: { alignItems: 'center', justifyContent: 'center', padding: 32 },
});
