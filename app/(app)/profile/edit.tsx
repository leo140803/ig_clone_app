// app/(app)/profile/edit.tsx
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, View, Image, Pressable, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { theme } from '../../../lib/theme';
import { useAuth } from '../../../lib/auth-context';
import { api, apiMultipart } from '../../../lib/api';
import type { User } from '../../../types/api';
import Button from '../../../components/Button';
import { Stack } from 'expo-router';

function guessMime(filename?: string) {
  if (!filename) return 'image/jpeg';
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic' || ext === 'heif') return 'image/heic';
  return 'image/jpeg';
}

export default function EditProfile() {
  const { token, user: me, refreshMe } = useAuth();
  const [name, setName] = useState(me?.name ?? '');
  const [bio, setBio] = useState((me as any)?.bio ?? '');
  const [website, setWebsite] = useState((me as any)?.website ?? '');
  const [isPrivate, setIsPrivate] = useState<boolean>((me as any)?.private ?? false);
  const [avatarUri, setAvatarUri] = useState<string | undefined>(me?.avatar_url || undefined);
  const [newAvatar, setNewAvatar] = useState<{ uri: string; name?: string } | null>(null);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Ambil data terbaru (optional, supaya form up-to-date)
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        let latest = await api<any>('/users/me', { token: token! });
        latest= latest.user
        setName(latest.name ?? '');
        setBio((latest as any).bio ?? '');
        setWebsite((latest as any).website ?? '');
        setIsPrivate((latest as any).private ?? false);
        setAvatarUri(latest.avatar_url || undefined);
      } catch {
        // abaikan
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin diperlukan', 'Aktifkan izin galeri untuk memilih foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled) {
      // (opsional) kecilkan/fix format ke JPEG biar aman di backend
      const asset = result.assets[0];
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: Math.min(asset.width ?? 1024, 1024) } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );
      setAvatarUri(manipulated.uri);
      setNewAvatar({ uri: manipulated.uri, name: 'avatar.jpg' });
    }
  };

  const clearImage = () => {
    setAvatarUri(undefined);
    setNewAvatar(null);
    // Catatan: menghapus avatar di backend perlu endpoint khusus (mis. kirim null & handle)
    // atau kamu tambahin param user[remove_avatar]=true. Untuk sekarang, kita hanya tidak mengubah kalau tidak kirim file.
  };

  async function uriToBlob(uri: string): Promise<Blob> {
    const res = await fetch(uri);   // fetch file lokal (expo polyfill)
    return await res.blob();        // hasil: Blob
  }

  const normalizeWebsite = (url: string) => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    return `https://${url}`;
  };

  const onSave = async () => {
    try {
      setSaving(true);

      // gunakan multipart supaya bisa kirim file & field lain
      const form = new FormData();

      form.append('user[name]', name?.trim() ?? '');
      form.append('user[bio]', bio?.trim() ?? '');
      form.append('user[website]', website?.trim() ? normalizeWebsite(website.trim()) : '');
      form.append('user[private]', isPrivate ? 'true' : 'false');

      if (newAvatar) {
        const filename = newAvatar.name || 'avatar.jpg';
        const mime = guessMime(filename);
      
        const blob = await uriToBlob(newAvatar.uri);
        // Opsional: kalau perlu paksa mime, kamu bisa:
        // const blob = await uriToBlob(newAvatar.uri);
        // const typed = blob.slice(0, blob.size, mime); // set content-type
      
        form.append('user[avatar]', blob, filename); // <- ini yg benar utk TS
      }
      

      // PATCH /api/v1/users
      const updated = await apiMultipart<User>('/users', form, { method: 'PATCH', token });

      await refreshMe();
      Alert.alert('Sukses', 'Profil berhasil diperbarui.');
    } catch (e: any) {
      Alert.alert('Gagal', e.message || 'Tidak bisa update profil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Edit Profile' }} />
      <KeyboardAvoidingView behavior={Platform.select({ ios:'padding', android: undefined })} style={{ flex:1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {loading ? (
            <View style={{ alignItems:'center', justifyContent:'center', padding: 24 }}>
              <ActivityIndicator />
            </View>
          ) : (
            <>
              {/* Avatar */}
              <View style={{ alignItems:'center', gap: 12 }}>
                <Pressable onPress={pickImage} style={{ alignItems:'center' }}>
                  <Image
                    source={avatarUri ? { uri: avatarUri } : require('../../../assets/images/avatar-placeholder.png')}
                    style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: theme.colors.surface }}
                  />
                  <Text style={{ color: theme.colors.primary, marginTop: 8, fontWeight:'600' }}>Change photo</Text>
                </Pressable>
                {avatarUri ? (
                  <Pressable onPress={clearImage}>
                    <Text style={{ color: theme.colors.muted, textDecorationLine:'underline' }}>Remove photo (local)</Text>
                  </Pressable>
                ) : null}
              </View>

              {/* Fields */}
              <View style={{ marginTop: 18, gap: 14 }}>
                <Field label="Name">
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Nama kamu"
                    placeholderTextColor={theme.colors.muted}
                    style={styles.input}
                  />
                </Field>

                <Field label="Bio">
                  <TextInput
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Ceritakan tentang dirimu"
                    placeholderTextColor={theme.colors.muted}
                    style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
                    multiline
                    numberOfLines={4}
                  />
                </Field>

                <Field label="Website">
                  <TextInput
                    value={website}
                    onChangeText={setWebsite}
                    autoCapitalize="none"
                    keyboardType="url"
                    placeholder="yourdomain.com"
                    placeholderTextColor={theme.colors.muted}
                    style={styles.input}
                  />
                </Field>

                <Field label="Private account">
                  <Switch
                    value={isPrivate}
                    onValueChange={setIsPrivate}
                    thumbColor={isPrivate ? theme.colors.text : '#ccc'}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  />
                </Field>
              </View>

              <Button title="Save" onPress={onSave} loading={saving} style={{ marginTop: 24 }} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: theme.colors.muted, fontSize: 13 }}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
  },
});
