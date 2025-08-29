import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Text, View, Pressable, StyleSheet } from 'react-native';
import ProfileView from '../profile/ProfileView';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../lib/theme';

export default function UserProfile() {
  const { username } = useLocalSearchParams<{ username: string }>();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          // Back custom → pop ke screen sebelumnya
          headerLeft: () => (
            <Pressable onPress={() => router.navigate('/(app)/search')} hitSlop={16} style={{ paddingRight: 8 }}>
              <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
            </Pressable>
          ),
          // Title custom (username tebal, ala IG)
          headerTitle: () => (
            <View style={styles.titleWrap}>
              <Text style={styles.titleText}>{username}</Text>
              {/* bisa tambahkan badge/lock jika account private */}
            </View>
          ),
          headerStyle: { backgroundColor: theme.colors.background },
          headerTitleAlign: 'center',
        }}
      />
      <ProfileView username={username} />
    </>
  );
}

const styles = StyleSheet.create({
  titleWrap: { alignItems: 'center', justifyContent: 'center' },
  titleText: { color: theme.colors.text, fontWeight: '700', fontSize: 16 },
});
