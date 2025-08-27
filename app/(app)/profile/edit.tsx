// app/(app)/profile/edit.tsx
import React, { useEffect, useState } from 'react';
import { 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  StyleSheet, 
  Switch, 
  Text, 
  TextInput, 
  View, 
  Image, 
  Pressable, 
  ActivityIndicator,
  StatusBar,
  Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { theme } from '../../../lib/theme';
import { useAuth } from '../../../lib/auth-context';
import { api, apiMultipart } from '../../../lib/api';
import type { User } from '../../../types/api';
import Button from '../../../components/Button';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../../../components/CustomAllert';
import { useAlert } from '../../../hooks/useAlert';


const { width } = Dimensions.get('window');

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

  const { 
    alertConfig, 
    hideAlert, 
    showSuccess, 
    showError 
  } = useAlert();
  

  // Fetch latest user data
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        let latest = await api<any>('/users/me', { token: token! });
        latest = latest.user;
        setName(latest.name ?? '');
        setBio((latest as any).bio ?? '');
        setWebsite((latest as any).website ?? '');
        setIsPrivate((latest as any).private ?? false);
        setAvatarUri(latest.avatar_url || undefined);
      } catch (error) {
        console.warn('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showError('Izin Diperlukan', 'Aktifkan izin galeri untuk memilih foto.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const manipulated = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: Math.min(asset.width ?? 1024, 1024) } }],
          { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
        );
        setAvatarUri(manipulated.uri);
        setNewAvatar({ uri: manipulated.uri, name: 'avatar.jpg' });
      }
    } catch (error) {
      showError('Error', 'Gagal memilih gambar. Coba lagi.');
    }
  };

  const clearImage = () => {
    setAvatarUri(undefined);
    setNewAvatar(null);
  };

  async function uriToBlob(uri: string): Promise<Blob> {
    const res = await fetch(uri);
    return await res.blob();
  }

  const normalizeWebsite = (url: string) => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    return `https://${url}`;
  };

  const onSave = async () => {
    try {
      // Basic validation
      if (!name.trim()) {
        showError('Validasi Error', 'Nama tidak boleh kosong.');
        return;
      }

      setSaving(true);

      const form = new FormData();
      form.append('user[name]', name?.trim() ?? '');
      form.append('user[bio]', bio?.trim() ?? '');
      form.append('user[website]', website?.trim() ? normalizeWebsite(website.trim()) : '');
      form.append('user[private]', isPrivate ? 'true' : 'false');

      if (newAvatar) {
        const filename = newAvatar.name || 'avatar.jpg';
        const blob = await uriToBlob(newAvatar.uri);
        form.append('user[avatar]', blob, filename);
      }

      await apiMultipart<User>('/users', form, { method: 'PATCH', token });

      try { 
        await refreshMe(); 
      } catch(e) { 
        console.warn('refreshMe gagal', e); 
      }

      showSuccess('Berhasil!', 'Profil berhasil diperbarui.');
    } catch (e: any) {
      console.error('Save profile error:', e);
      showError('Gagal', e.message || 'Tidak bisa update profil. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <Stack.Screen 
        options={{ 
          headerShown: true, 
          title: 'Edit Profile',
          headerTitleStyle: { fontWeight: '600' }
        }} 
      />
      <KeyboardAvoidingView 
        behavior={Platform.select({ ios: 'padding', android: undefined })} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.container} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.muted }]}>
                Memuat data...
              </Text>
            </View>
          ) : (
            <>
              {/* Avatar Section */}
              <View style={styles.avatarSection}>
                <View style={styles.avatarContainer}>
                  <Pressable onPress={pickImage} style={styles.avatarPressable}>
                    <Image
                      source={avatarUri ? { uri: avatarUri } : require('../../../assets/images/avatar-placeholder.png')}
                      style={styles.avatar}
                    />
                    <View style={styles.cameraIcon}>
                      <Ionicons name="camera" size={20} color="#fff" />
                    </View>
                  </Pressable>
                </View>
                
                <Text style={[styles.changePhotoText, { color: theme.colors.primary }]}>
                  Ketuk untuk mengubah foto
                </Text>
                
                {avatarUri && (
                  <Pressable onPress={clearImage} style={styles.removeButton}>
                    <Text style={[styles.removeText, { color: theme.colors.muted }]}>
                      Hapus foto
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* Form Fields */}
              <View style={styles.formContainer}>
                <Field label="Nama *" required>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Masukkan nama kamu"
                    placeholderTextColor={theme.colors.muted}
                    style={styles.input}
                    maxLength={50}
                  />
                  <Text style={[styles.charCount, { color: theme.colors.muted }]}>
                    {name.length}/50
                  </Text>
                </Field>

                <Field label="Bio">
                  <TextInput
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Ceritakan tentang dirimu..."
                    placeholderTextColor={theme.colors.muted}
                    style={[styles.input, styles.bioInput]}
                    multiline
                    numberOfLines={4}
                    maxLength={150}
                  />
                  <Text style={[styles.charCount, { color: theme.colors.muted }]}>
                    {bio.length}/150
                  </Text>
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

                <Field label="Akun Privat">
                  <View style={styles.switchContainer}>
                    <View style={styles.switchInfo}>
                      <Text style={[styles.switchLabel, { color: theme.colors.text }]}>
                        Akun Privat
                      </Text>
                      <Text style={[styles.switchDescription, { color: theme.colors.muted }]}>
                        Hanya follower yang bisa melihat postingan kamu
                      </Text>
                    </View>
                    <Switch
                      value={isPrivate}
                      onValueChange={setIsPrivate}
                      thumbColor={isPrivate ? '#fff' : '#f4f3f4'}
                      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                      ios_backgroundColor={theme.colors.border}
                    />
                  </View>
                </Field>
              </View>

              <Button 
                title={saving ? "Menyimpan..." : "Simpan Perubahan"}
                onPress={onSave} 
                loading={saving} 
                style={styles.saveButton}
                disabled={saving}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={hideAlert}
      />
    </>
  );
}

function Field({ label, children, required = false }: { 
  label: string; 
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
        {label}
        {required && <Text style={{ color: '#F44336' }}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarPressable: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.surface,
    borderWidth: 3,
    borderColor: theme.colors.border,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.background,
  },
  changePhotoText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  removeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  removeText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  formContainer: {
    gap: 24,
    marginBottom: 32,
  },
  fieldContainer: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    minHeight: 50,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  saveButton: {
    marginTop: 8,
    paddingVertical: 16,
  },
  // Custom Alert Styles
  alertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  alertContainer: {
    width: width - 60,
    maxWidth: 320,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  alertIcon: {
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  alertButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});