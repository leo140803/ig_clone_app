import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  ActivityIndicator, 
  FlatList, 
  Pressable, 
  StyleSheet, 
  Text, 
  View, 
  Image,
  Animated,
  RefreshControl,
  Dimensions,
  StatusBar,
  Platform
} from 'react-native';
import { api } from '../../../lib/api';
import { theme } from '../../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type User = {
  id: number;
  username: string;
  avatar_url: string | null;
  name?: string;
};

type Post = {
  id: number;
  caption: string;
  image_urls: string[];
  like_count: number;
  comment_count: number;
  user: User;
};

type Notification = {
  id: number;
  action: string;
  read: boolean;
  created_at: string;
  notifiable_type: string;
  notifiable_id: number;
  actor: User;
  notifiable?: Post;
  notifiable_data?: {
    id: number;
    image_urls: string[];
  };
};

type GroupedNotification = {
  title: string;
  data: Notification[];
};

// Skeleton Component
const SkeletonItem = () => {
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const shimmer = () => {
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => shimmer());
    };
    shimmer();
  }, []);

  return (
    <View style={styles.notificationContainer}>
      <Animated.View 
        style={[
          styles.skeletonAvatar, 
          { opacity: shimmerAnim }
        ]} 
      />
      <View style={styles.middleSection}>
        <Animated.View 
          style={[
            styles.skeletonText, 
            { opacity: shimmerAnim }
          ]} 
        />
        <Animated.View 
          style={[
            styles.skeletonTextSmall, 
            { opacity: shimmerAnim, marginTop: 8 }
          ]} 
        />
      </View>
      <Animated.View 
        style={[
          styles.skeletonThumbnail, 
          { opacity: shimmerAnim }
        ]} 
      />
    </View>
  );
};

// Enhanced Notification Item Component
const NotificationItem = React.memo(({ 
  item, 
  onPress, 
  onMarkAsRead 
}: { 
  item: Notification; 
  onPress: (notification: Notification) => void;
  onMarkAsRead: (id: number) => void;
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const fadeAnim = React.useRef(new Animated.Value(item.read ? 0.7 : 1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (!item.read) {
      onMarkAsRead(item.id);
      Animated.timing(fadeAnim, {
        toValue: 0.7,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    onPress(item);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 604800)}w`;
  };

  const getActionIcon = () => {
    if (item.action.includes('liked')) return 'heart';
    if (item.action.includes('commented')) return 'chatbubble';
    if (item.action.includes('followed')) return 'person-add';
    if (item.action.includes('mentioned')) return 'at';
    return 'notifications';
  };

  const getActionColor = () => {
    if (item.action.includes('liked')) return '#FF3040';
    if (item.action.includes('commented')) return '#0095F6';
    if (item.action.includes('followed')) return '#00C896';
    if (item.action.includes('mentioned')) return '#FFCD00';
    return '#8E8E8E';
  };

  const getPostThumbnail = () => {
    if (item.action.includes('followed') || item.action.includes('follow')) {
      return (
        <Pressable style={styles.followButton}>
          <Text style={styles.followButtonText}>Follow</Text>
        </Pressable>
      );
    }

    if (item.notifiable_data?.image_urls && item.notifiable_data.image_urls.length > 0) {
      const firstImageUrl = item.notifiable_data.image_urls[0];
      const imageUrls = item.notifiable_data.image_urls;
      return (
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: firstImageUrl }}
            style={styles.postThumbnail}
          />
          {imageUrls.length > 1 && (
            <View style={styles.multipleImagesIndicator}>
              <Ionicons name="layers" size={12} color="#FFFFFF" />
            </View>
          )}
        </View>
      );
    }

    return null;
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        opacity: fadeAnim,
      }}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.notificationContainer,
          !item.read && styles.unreadNotification,
        ]}
      >
        {/* Gradient overlay for unread notifications */}
        {!item.read && (
          <LinearGradient
            colors={['rgba(0, 149, 246, 0.1)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        )}

        <View style={styles.leftSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ 
                uri: item.actor.avatar_url || `https://ui-avatars.com/api/?name=${item.actor.username}&background=1A1A1A&color=FFFFFF&size=44`
              }}
              style={styles.avatar}
            />
            <View style={[styles.actionIconContainer, { backgroundColor: getActionColor() }]}>
              <Ionicons name={getActionIcon()} size={12} color="#FFFFFF" />
            </View>
          </View>
        </View>
        
        <View style={styles.middleSection}>
          <View style={styles.textContainer}>
            <Text style={styles.notificationText} numberOfLines={2}>
              <Text style={styles.username}>{item.actor.username}</Text>
              <Text style={styles.action}> {item.action}</Text>
            </Text>
            <Text style={styles.timeAgo}>{formatTimeAgo(item.created_at)}</Text>
          </View>
        </View>
        
        <View style={styles.rightSection}>
          {getPostThumbnail()}
        </View>
        
        {!item.read && <View style={styles.unreadDot} />}
      </Pressable>
    </Animated.View>
  );
});

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { token } = useAuth();

  const groupNotificationsByTime = (notifications: Notification[]): GroupedNotification[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const groups: GroupedNotification[] = [
      { title: 'Today', data: [] },
      { title: 'Yesterday', data: [] },
      { title: 'This Week', data: [] },
      { title: 'Earlier', data: [] },
    ];

    notifications.forEach(notification => {
      const notificationDate = new Date(notification.created_at);
      
      if (notificationDate >= today) {
        groups[0].data.push(notification);
      } else if (notificationDate >= yesterday) {
        groups[1].data.push(notification);
      } else if (notificationDate >= thisWeek) {
        groups[2].data.push(notification);
      } else {
        groups[3].data.push(notification);
      }
    });

    return groups.filter(group => group.data.length > 0);
  };

  const groupedNotifications = useMemo(() => 
    groupNotificationsByTime(notifications), 
    [notifications]
  );

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
      } else if (page === 1) {
        setLoading(true);
      }
      
      setError(null);
      
      const response = await api<any>('/notifications', { 
        method: 'GET', 
        token,
        // Add pagination if your API supports it
        // params: { page: isRefresh ? 1 : page }
      });
      
      let notificationsList: Notification[] = response.notifications?.notifications || [];
      
      if (isRefresh) {
        setNotifications(notificationsList);
      } else {
        setNotifications(prev => page === 1 ? notificationsList : [...prev, ...notificationsList]);
      }
      
      setHasMore(notificationsList.length >= 20); // Adjust based on your API
      
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      if (error.response?.status === 401) {
        setError('Please login again');
      } else if (error.response?.status >= 500) {
        setError('Server error, please try again later');
      } else {
        setError('Failed to fetch notifications');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, page]);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      // Optimistically update UI
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );

      // Make API call
      await api(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
        token
      });
    } catch (error) {
      console.error('Failed to mark as read:', error);
      // Revert optimistic update on error
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: false }
            : notif
        )
      );
    }
  }, [token]);

  const onNotificationPress = useCallback(async (notification: Notification) => {
    try {
      if (notification.notifiable_type === 'Post' || notification.notifiable_type === 'Comment') {
        const postId = notification.notifiable_type === 'Comment' 
          ? notification.notifiable_data?.id 
          : notification.notifiable_id;
        
        if (postId) {
          router.push({
            pathname: '/(app)/post/[id]',
            params: { id: String(postId) }
          });
        }
      } else if (notification.action.includes('followed')) {
        router.push({
          pathname: '/(app)/search/[username]',
          params: { username: notification.actor.username }
        });
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || refreshing) return;
    
    setPage(prev => prev + 1);
  }, [hasMore, loading, refreshing]);

  useEffect(() => {
    if (token) {
      fetchNotifications();
    } else {
      setLoading(false);
    }
  }, [token, page]);

  const onRefresh = useCallback(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  const renderSectionHeader = ({ section }: { section: GroupedNotification }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: Notification }) => (
    <NotificationItem
      item={item}
      onPress={onNotificationPress}
      onMarkAsRead={markAsRead}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['rgba(0, 149, 246, 0.1)', 'rgba(0, 149, 246, 0.05)']}
        style={styles.emptyIconContainer}
      >
        <Ionicons name="heart-outline" size={48} color="#0095F6" />
      </LinearGradient>
      <Text style={styles.emptyText}>Activity On Your Posts</Text>
      <Text style={styles.emptySubText}>
        When someone likes or comments on one of your posts, you'll see it here.
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="cloud-offline-outline" size={48} color="#FF3040" />
      <Text style={styles.errorText}>{error}</Text>
      <Pressable 
        style={styles.retryButton}
        onPress={() => {
          setError(null);
          setPage(1);
          fetchNotifications();
        }}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </Pressable>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.container}>
      <FlatList
        data={Array(8).fill(0)}
        renderItem={() => <SkeletonItem />}
        keyExtractor={(_, index) => `skeleton-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );

  if (loading && notifications.length === 0) {
    return renderLoadingState();
  }

  if (error && notifications.length === 0) {
    return (
      <View style={styles.center}>
        {renderErrorState()}
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={styles.center}>
        {renderEmptyState()}
      </View>
    );
  }

  // Flatten grouped data for FlatList
  const flatData = groupedNotifications.reduce<Array<{ type: 'header'; title: string } | { type: 'item' } & Notification>>((acc, group) => {
    acc.push({ type: 'header' as const, title: group.title });
    acc.push(...group.data.map(item => ({ type: 'item' as const, ...item })));
    return acc;
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <FlatList
        data={flatData}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{item.title}</Text>
              </View>
            );
          }
          return renderItem({ item });
        }}
        keyExtractor={(item, index) => 
          item.type === 'header' ? `header-${item.title}` : `notification-${item.id}`
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0095F6']}
            tintColor="#0095F6"
            titleColor="#FFFFFF"
            progressBackgroundColor="#1A1A1A"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={() => 
          hasMore && notifications.length > 0 ? (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color="#0095F6" />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 32,
  },
  
  // Section Header Styles
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#262626',
    backgroundColor: '#000000',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // Notification Item Styles
  notificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#000000',
    position: 'relative',
    borderBottomWidth: 0.5,
    borderBottomColor: '#0F0F0F',
  },
  unreadNotification: {
    backgroundColor: 'rgba(0, 149, 246, 0.02)',
  },
  
  // Avatar Section
  leftSection: {
    marginRight: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
  },
  actionIconContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  
  // Content Section
  middleSection: {
    flex: 1,
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  username: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  action: {
    fontWeight: '400',
    color: '#FFFFFF',
  },
  timeAgo: {
    color: '#8E8E8E',
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Right Section
  rightSection: {
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailContainer: {
    position: 'relative',
  },
  postThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1A1A1A',
  },
  multipleImagesIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 10,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButton: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: '#0095F6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  
  // Unread Indicator
  unreadDot: {
    position: 'absolute',
    right: 12,
    top: '50%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0095F6',
    marginTop: -4,
    shadowColor: '#0095F6',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubText: {
    color: '#8E8E8E',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  
  // Error State
  errorContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    color: '#FF3040',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#0095F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Loading More
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  
  // Skeleton Styles
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    marginRight: 12,
  },
  skeletonText: {
    height: 14,
    backgroundColor: '#1A1A1A',
    borderRadius: 7,
    width: '80%',
  },
  skeletonTextSmall: {
    height: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
    width: '40%',
  },
  skeletonThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1A1A1A',
  },
});