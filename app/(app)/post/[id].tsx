// app/(app)/post/[id].tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions, FlatList, Image, Pressable,
  StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform, RefreshControl
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { theme } from '../../../lib/theme';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { Ionicons } from '@expo/vector-icons';

type Post = {
  id: number;
  caption: string | null;
  location?: string | null;
  created_at: string;
  image_urls: string[];
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
  tags: string[];
  user: {
    id: number;
    username: string;
    name?: string | null;
    avatar_url?: string | null;
  };
};

type Comment = {
  id: number;
  body: string;
  created_at: string;
  like_count: number;
  user: {
    id: number;
    username: string;
    name?: string | null;
    avatar_url?: string | null;
  };
};

type Meta = { page: number; total_pages: number } | undefined;

// Helper function untuk format waktu relatif
const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);

  if (diffInHours < 1) return 'now';
  if (diffInHours < 24) return `${diffInHours}h`;
  if (diffInDays < 7) return `${diffInDays}d`;
  if (diffInWeeks < 4) return `${diffInWeeks}w`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

export default function PostDetailScreen() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { token, user: me } = useAuth();
  const [data, setData] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const commentInputRef = useRef<TextInput>(null);

  // ---- comments state ----
  const [comments, setComments] = useState<Comment[]>([]);
  const [cMeta, setCMeta] = useState<Meta>();
  const [cPage, setCPage] = useState(1);
  const [cLoading, setCLoading] = useState(true);
  const [cRefreshing, setCRefreshing] = useState(false);
  const [newBody, setNewBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ---- fetch post ----
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        let res = await api<any>(`/posts/${id}`, { token: token! });
        // BE kamu sebelumnya ada 2 bentuk; sesuaikan:
        const post: Post = res.post ?? res;
        setData(post);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ---- fetch comments ----
  async function fetchComments(pageNum = 1, replace = false) {
    try {
      if (pageNum === 1) setCLoading(true);
      const res = await api<any>(`/posts/${id}/comments?page=${pageNum}`, { token: token! });
      // normalisasi: {comments:[...], meta:{...}} atau array saja
      const list: Comment[] = Array.isArray(res) ? res : (res.comments ?? res.data ?? []);
      const meta: Meta = res.meta;
      setCMeta(meta);
      setComments(prev => (replace || pageNum === 1 ? list : [...prev, ...list]));
    } catch {
      // bisa tampilkan toast
    } finally {
      setCLoading(false);
      setCRefreshing(false);
    }
  }

  useEffect(() => { fetchComments(1, true); }, [id]);

  const onCommentsRefresh = () => {
    setCRefreshing(true);
    setCPage(1);
    fetchComments(1, true);
  };

  const onCommentsEnd = () => {
    if (cLoading) return;
    if (cMeta && cPage >= (cMeta.total_pages || 1)) return;
    const next = cPage + 1;
    setCPage(next);
    fetchComments(next, false);
  };

  // ---- like post ----
  const onToggleLike = async () => {
    if (!data) return;
    try {
      if (data.liked_by_me) {
        await api(`/posts/${id}/like`, { method: 'DELETE', token });
        setData({ ...data, liked_by_me: false, like_count: Math.max(0, data.like_count - 1) });
      } else {
        await api(`/posts/${id}/like`, { method: 'POST', token });
        setData({ ...data, liked_by_me: true, like_count: data.like_count + 1 });
      }
    } catch {}
  };

  // ---- submit comment ----
  const onSubmitComment = async () => {
    const body = newBody.trim();
    if (!body) return;
    try {
      setSubmitting(true);
      const res = await api<any>(`/posts/${id}/comments`, {
        method: 'POST',
        token,
        body: { comment: { body: newBody.trim() } },
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });
      const created: Comment = res.comment ?? res; // normalize
      setNewBody('');
      // prepend ke list & update count
      setComments(prev => [created, ...prev]);
      setData(d => (d ? { ...d, comment_count: d.comment_count + 1 } : d));
      commentInputRef.current?.blur();
    } catch (e: any) {
      Alert.alert('Gagal', e.message || 'Tidak bisa mengirim komentar.');
    } finally {
      setSubmitting(false);
    }
  };

  // ---- delete comment (own only) ----
  const onDeleteComment = (c: Comment) => {
    Alert.alert('Hapus komentar?', 'Tindakan ini tidak bisa dibatalkan.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await api(`/comments/${c.id}`, { method: 'DELETE', token });
            setComments(prev => prev.filter(x => x.id !== c.id));
            setData(d => (d ? { ...d, comment_count: Math.max(0, d.comment_count - 1) } : d));
          } catch {
            Alert.alert('Gagal', 'Tidak bisa menghapus komentar.');
          }
        },
      },
    ]);
  };

  // Focus ke input comment
  const focusCommentInput = () => {
    commentInputRef.current?.focus();
  };

  if (loading || !data) {
    return (
      <>
        <Stack.Screen options={{ title: '', headerShown: true, headerBackButtonDisplayMode: 'minimal' }} />
        <View style={styles.center}><ActivityIndicator /></View>
      </>
    );
  }

  const { width } = Dimensions.get('window');
  const itemWidth = width;
  const itemHeight = width;

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / itemWidth);
    setIndex(currentIndex);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShadowVisible: false,
          headerShown: true,
          headerTitle: 'Post',
          headerTitleStyle: { color: theme.colors.text, fontSize: 18, fontWeight: '600' },
          headerLeft: () => (
            <Pressable
              onPress={() => {
                if (from && typeof from === 'string') {
                  router.replace({ pathname: from as any });
                  return;
                }
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(app)/home');
                }
              }}
              hitSlop={16}
              style={styles.headerButton}
            >
              <Ionicons name="chevron-back" size={26} color={theme.colors.text} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={() => { /* TODO share */ }} hitSlop={16} style={styles.headerButton}>
              <Ionicons name="share-outline" size={24} color={theme.colors.text} />
            </Pressable>
          ),
          headerStyle: { backgroundColor: theme.colors.background },
          headerBackVisible: false,
        }}
      />

      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
        <View style={styles.container}>
          {/* Header user mini */}
          <Pressable
            style={styles.userRow}
            onPress={() => router.push(`/(app)/search/${data.user.username}`)}
          >
            <Image
              source={data.user.avatar_url ? { uri: data.user.avatar_url } : require('../../../assets/images/avatar-placeholder.png')}
              style={styles.userAvatar}
            />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.username}>{data.user.username}</Text>
              {!!data.location && <Text style={styles.location}>{data.location}</Text>}
            </View>
          </Pressable>

          {/* Carousel gambar */}
          <View style={{ width: itemWidth, height: itemHeight, backgroundColor: theme.colors.surface }}>
            <FlatList
              ref={flatListRef}
              data={data.image_urls}
              keyExtractor={(u, i) => `${i}-${u}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={{ width: itemWidth, height: itemHeight }} />
              )}
            />
            {data.image_urls.length > 1 && (
              <View style={styles.carouselBadge}>
                <Text style={styles.carouselText}>
                  {index + 1}/{data.image_urls.length}
                </Text>
              </View>
            )}
          </View>

          {/* Action bar */}
          <View style={styles.actions}>
            <Pressable onPress={onToggleLike} hitSlop={8} style={{ marginRight: 16 }}>
              <Ionicons
                name={data.liked_by_me ? 'heart' : 'heart-outline'}
                size={26}
                color={data.liked_by_me ? '#ff3040' : theme.colors.text}
              />
            </Pressable>
            <Pressable onPress={focusCommentInput} hitSlop={8} style={{ marginRight: 16 }}>
              <Ionicons name="chatbubble-outline" size={24} color={theme.colors.text} />
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable onPress={focusCommentInput} hitSlop={8}>
              <Text style={styles.commentCount}>{data.comment_count} comments</Text>
            </Pressable>
          </View>

          {/* Likes & caption */}
          <View style={styles.contentSection}>
            <Text style={styles.likesText}>{data.like_count} likes</Text>
            {!!data.caption && (
              <Text style={styles.captionText}>
                <Text style={styles.captionUsername}>{data.user.username} </Text>
                {data.caption}
              </Text>
            )}
            {data.tags?.length ? (
              <View style={styles.tagsWrap}>
                {data.tags.map((t) => (
                  <View key={t} style={styles.tagChip}>
                    <Text style={styles.tagText}>#{t}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          {/* --- COMMENTS SECTION --- */}
          <View style={styles.commentsWrap}>
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments</Text>
            </View>

            <FlatList
              data={comments}
              keyExtractor={(c) => `${c.id}`}
              refreshControl={
                <RefreshControl 
                  refreshing={cRefreshing} 
                  onRefresh={onCommentsRefresh} 
                  tintColor={theme.colors.text}
                  colors={[theme.colors.primary]}
                />
              }
              onEndReachedThreshold={0.2}
              onEndReached={onCommentsEnd}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.commentSeparator} />}
              ListEmptyComponent={
                cLoading ? (
                  <View style={styles.emptyState}>
                    <ActivityIndicator size="large" color={theme.colors.text} />
                    <Text style={styles.emptyText}>Loading comments...</Text>
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="chatbubble-outline" size={48} color={theme.colors.muted} />
                    <Text style={styles.emptyTitle}>No comments yet</Text>
                    <Text style={styles.emptyText}>Be the first to comment!</Text>
                  </View>
                )
              }
              renderItem={({ item }) => (
                <Pressable
                  onLongPress={() => {
                    if (item.user.id === me?.id) onDeleteComment(item);
                  }}
                  style={[
                    styles.commentRow,
                    item.user.id === me?.id && styles.ownCommentRow
                  ]}
                >
                  <Pressable 
                    onPress={() => router.push(`/(app)/search/${item.user.username}`)}
                    style={styles.commentAvatarContainer}
                  >
                    <Image
                      source={item.user.avatar_url ? { uri: item.user.avatar_url } : require('../../../assets/images/avatar-placeholder.png')}
                      style={styles.commentAvatar}
                    />
                  </Pressable>
                  <View style={styles.commentContent}>
                    <View style={styles.commentBubble}>
                      <Pressable onPress={() => router.push(`/(app)/search/${item.user.username}`)}>
                        <Text style={styles.commentUsername}>{item.user.username}</Text>
                      </Pressable>
                      <Text style={styles.commentBody}>{item.body}</Text>
                    </View>
                    <View style={styles.commentMeta}>
                      <Text style={styles.commentTime}>{formatTimeAgo(item.created_at)}</Text>
                      {item.like_count > 0 && (
                        <>
                          <Text style={styles.commentMetaDivider}>•</Text>
                          <Text style={styles.commentLikes}>{item.like_count} likes</Text>
                        </>
                      )}
                      {item.user.id === me?.id && (
                        <>
                          <Text style={styles.commentMetaDivider}>•</Text>
                          <Text style={styles.ownCommentIndicator}>Your comment</Text>
                        </>
                      )}
                    </View>
                  </View>
                </Pressable>
              )}
              ListFooterComponent={
                cMeta && cPage < (cMeta.total_pages || 1) ? (
                  <View style={styles.loadingMore}>
                    <ActivityIndicator size="small" color={theme.colors.muted} />
                    <Text style={styles.loadingMoreText}>Loading more comments...</Text>
                  </View>
                ) : null
              }
              contentContainerStyle={{ 
                paddingBottom: 100,
                flexGrow: 1
              }}
            />
          </View>

          {/* ENHANCED INPUT BAR */}
          <View style={styles.inputBar}>
            <Image
              source={me?.avatar_url ? { uri: me.avatar_url } : require('../../../assets/images/avatar-placeholder.png')}
              style={styles.inputAvatar}
            />
            <View style={styles.inputContainer}>
              <TextInput
                ref={commentInputRef}
                value={newBody}
                onChangeText={setNewBody}
                placeholder="Add a comment..."
                placeholderTextColor={theme.colors.muted}
                style={styles.input}
                multiline
                maxLength={1000}
                textAlignVertical="center"
              />
              <Pressable 
                onPress={onSubmitComment} 
                disabled={submitting || !newBody.trim()} 
                style={[
                  styles.sendBtn,
                  (submitting || !newBody.trim()) && styles.sendBtnDisabled
                ]}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={theme.colors.muted} />
                ) : (
                  <Ionicons 
                    name="send" 
                    size={18} 
                    color={newBody.trim() ? theme.colors.primary : theme.colors.muted} 
                  />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  },
  center: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: theme.colors.background 
  },

  // User Header
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userAvatar: {
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  username: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  location: {
    color: theme.colors.muted,
    fontSize: 12,
    marginTop: 2,
  },

  // Carousel
  carouselBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  carouselText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  commentCount: {
    color: theme.colors.muted,
    fontSize: 14,
    fontWeight: '500',
  },

  // Content
  contentSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  likesText: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  captionText: {
    color: theme.colors.text,
    marginTop: 8,
    lineHeight: 20,
    fontSize: 15,
  },
  captionUsername: {
    fontWeight: '700',
  },

  // Tags
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tagChip: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: { 
    color: theme.colors.primary,
    fontSize: 12, 
    fontWeight: '600' 
  },

  // Header Buttons
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Comments Section
  commentsWrap: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: 8,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  commentsTitle: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  commentsSubtitle: {
    color: theme.colors.muted,
    fontSize: 14,
  },

  // Comment Items
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ownCommentRow: {
    backgroundColor: theme.colors.surface + '30',
  },
  commentAvatarContainer: {
    marginRight: 12,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  commentUsername: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 2,
  },
  commentBody: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 20,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 4,
  },
  commentTime: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  commentMetaDivider: {
    color: theme.colors.muted,
    fontSize: 12,
    marginHorizontal: 8,
  },
  commentLikes: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  ownCommentIndicator: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  commentSeparator: {
    height: 1,
    backgroundColor: theme.colors.border + '30',
    marginLeft: 64,
  },

  // Empty States & Loading
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: theme.colors.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingMoreText: {
    color: theme.colors.muted,
    fontSize: 14,
  },

  // Input Bar
  inputBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 12,
    marginBottom: 4,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    paddingVertical: 8,
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 20,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary + '20',
    marginLeft: 8,
  },
  sendBtnDisabled: {
    backgroundColor: theme.colors.surface,
  },
});