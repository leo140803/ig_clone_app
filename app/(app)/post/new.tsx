// app/(app)/post/new.tsx
import React, { useState } from 'react';
import {
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Pressable,
  StyleSheet, Text, TextInput, View, Image, ScrollView, Animated, Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../../lib/theme';
import Button from '../../../components/Button';
import { apiMultipart } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { uriToBlob } from '../../../lib/file';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const GRID_SPACING = 8;
const GRID_COLUMNS = 3;
const CELL_SIZE = (width - 32 - (GRID_SPACING * (GRID_COLUMNS - 1))) / GRID_COLUMNS;

type Picked = { uri: string; name?: string; width?: number; height?: number };

export default function NewPostScreen() {
  const { token } = useAuth();
  const [images, setImages] = useState<Picked[]>([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [uploading, setUploading] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  const askLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin dibutuhkan', 'Aktifkan izin galeri untuk memilih foto.');
      return false;
    }
    return true;
  };

  const pickImages = async () => {
    if (!(await askLibrary())) return;
    
    // Add subtle animation feedback
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start();

    const res = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 0.9,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });
    if (res.canceled) return;

    const out: Picked[] = [];
    for (const a of res.assets) {
      const targetW = Math.min(a.width ?? 1440, 1440);
      const manipulated = await ImageManipulator.manipulateAsync(
        a.uri,
        a.width && a.width > targetW ? [{ resize: { width: targetW } }] : [],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );
      out.push({ 
        uri: manipulated.uri, 
        name: 'image.jpg', 
        width: manipulated.width, 
        height: manipulated.height 
      });
    }
    setImages(prev => [...prev, ...out]);
  };

  const removeAt = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const onSubmit = async () => {
    if (images.length === 0) {
      Alert.alert('Pilih foto dulu', 'Tambahkan minimal 1 foto untuk posting.');
      return;
    }
    try {
      setUploading(true);
      const form = new FormData();
      form.append('post[caption]', caption.trim());
      form.append('post[location]', location.trim());

      for (const img of images) {
        const blob = await uriToBlob(img.uri);
        form.append('images[]', blob, img.name || 'image.jpg');
      }

      await apiMultipart('/posts', form, { method: 'POST', token });
      Alert.alert('Sukses', 'Postingan kamu sudah ter-upload.');
      router.replace('/(app)/home');
    } catch (e: any) {
      Alert.alert('Gagal upload', e.message || 'Periksa koneksi / format file.');
    } finally {
      setUploading(false);
    }
  };

  const renderImageGrid = () => {
    if (images.length === 0) {
      return (
        <Pressable onPress={pickImages} style={styles.emptyState}>
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.1)', 'rgba(168, 85, 247, 0.1)']}
            style={styles.emptyGradient}
          >
            <View style={styles.emptyIconContainer}>
              <Ionicons name="camera" size={48} color="#6366f1" />
            </View>
            <Text style={styles.emptyTitle}>Add Your First Photo</Text>
            <Text style={styles.emptySubtitle}>Tap to select photos from your gallery</Text>
          </LinearGradient>
        </Pressable>
      );
    }

    return (
      <View style={styles.grid}>
        {images.map((img, idx) => (
          <View key={`${img.uri}-${idx}`} style={[styles.cell, { width: CELL_SIZE, height: CELL_SIZE }]}>
            <Image source={{ uri: img.uri }} style={styles.cellImg} />
            <LinearGradient
              colors={['rgba(0,0,0,0.6)', 'transparent']}
              style={styles.cellOverlay}
            />
            <Pressable onPress={() => removeAt(idx)} style={styles.removeChip} hitSlop={8}>
              <Ionicons name="close" size={16} color="white" />
            </Pressable>
            <View style={styles.imageNumber}>
              <Text style={styles.imageNumberText}>{idx + 1}</Text>
            </View>
          </View>
        ))}
        
        {/* Add more button */}
        {images.length < 10 && (
          <Pressable onPress={pickImages} style={[styles.addMoreCell, { width: CELL_SIZE, height: CELL_SIZE }]}>
            <Ionicons name="add" size={32} color="#6366f1" />
            <Text style={styles.addMoreText}>Add More</Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={styles.kav}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>New Post</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Photo Selection Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="images" size={20} color="#6366f1" />
                <Text style={styles.sectionTitle}>Photos</Text>
              </View>
              <View style={styles.photoCounter}>
                <Text style={styles.photoCounterText}>{images.length}/10</Text>
              </View>
            </View>
            
            {renderImageGrid()}
          </View>

          {/* Caption Section */}
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="text" size={20} color="#10b981" />
              <Text style={styles.sectionTitle}>Caption</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.captionInput]}
                placeholder="Write something inspiring..."
                placeholderTextColor={theme.colors.muted}
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={2200}
              />
              <View style={styles.characterCounter}>
                <Text style={[
                  styles.characterCountText,
                  { color: caption.length > 2000 ? '#ef4444' : theme.colors.muted }
                ]}>
                  {caption.length}/2200
                </Text>
              </View>
            </View>
          </View>

          {/* Location Section */}
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="location" size={20} color="#f59e0b" />
              <Text style={styles.sectionTitle}>Location</Text>
              <Text style={styles.optionalText}>(optional)</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Add location..."
                placeholderTextColor={theme.colors.muted}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          {/* Post Button */}
          <Animated.View style={[styles.buttonContainer, { transform: [{ scale: scaleAnim }] }]}>
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={styles.postButtonGradient}
            >
              <Button 
                title={uploading ? 'Uploading...' : 'Share Post'} 
                onPress={onSubmit} 
                loading={uploading}
                style={styles.postButton}
              />
            </LinearGradient>
          </Animated.View>
        </ScrollView>

        {/* Upload Overlay */}
        {uploading && (
          <View style={styles.overlay}>
            <View style={styles.uploadModal}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.uploadText}>Uploading your post...</Text>
              <View style={styles.progressBar}>
                <View style={styles.progressFill} />
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  },
  kav: { 
    flex: 1 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  scroll: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  },
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },

  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  optionalText: {
    fontSize: 14,
    color: theme.colors.muted,
    fontStyle: 'italic',
  },
  photoCounter: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  photoCounterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },

  // Empty State
  emptyState: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyGradient: {
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 16,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.muted,
    textAlign: 'center',
  },

  // Image Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_SPACING,
  },
  cell: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cellImg: { 
    width: '100%', 
    height: '100%' 
  },
  cellOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  removeChip: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    padding: 6,
  },
  imageNumber: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  imageNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  addMoreCell: {
    borderRadius: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 2,
    borderColor: '#6366f1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addMoreText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '600',
  },

  // Input Fields
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderWidth: 2,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  captionInput: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  characterCounter: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  characterCountText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Post Button
  buttonContainer: {
    marginTop: 16,
    marginBottom: 32,
  },
  postButtonGradient: {
    borderRadius: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  postButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },

  // Upload Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  uploadModal: {
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    minWidth: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
    width: '70%', // You can animate this based on actual progress
  },
});