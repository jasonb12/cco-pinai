import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../contexts/ThemeContext';
import { authService, AuthUser } from '../services/authService';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../config/supabase';

interface UserProfileProps {
  onClose?: () => void;
}

export default function UserProfile({ onClose }: UserProfileProps) {
  const colors = useThemeColors();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setName(currentUser.name || '');
        setEmail(currentUser.email || '');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setIsLoading(true);

    try {
      await authService.updateProfile({
        name: name.trim(),
      });

      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
      await loadUserProfile();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await authService.updatePassword(newPassword);
      Alert.alert('Success', 'Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload an avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadAvatar = async (uri: string) => {
    setIsLoading(true);

    try {
      const user = authService.getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'Please sign in to upload an avatar');
        return;
      }

      // Check if we can reach the backend first
      let backendAvailable = false;
      try {
        const healthResponse = await fetch('http://localhost:8000/health', {
          method: 'GET',
          timeout: 5000,
        } as RequestInit);
        backendAvailable = healthResponse.ok;
      } catch (error) {
        console.log('Backend health check failed:', error);
      }

      if (!backendAvailable) {
        // Fallback to direct Supabase upload without backend processing
        console.log('Backend not available, using direct Supabase upload');
      }

      // Create a unique filename
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;

      // Convert URI to blob for upload with retry logic
      let blob: Blob;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          const response = await fetch(uri);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
          }
          blob = await response.blob();
          break;
        } catch (error) {
          retryCount++;
          console.log(`Retry ${retryCount} for image fetch:`, error);
          
          if (retryCount >= maxRetries) {
            throw new Error('Failed to process image after multiple attempts');
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      // Upload to Supabase Storage with retry logic
      let uploadResult;
      retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {
          const { data, error } = await supabase.storage
            .from('avatars')
            .upload(fileName, blob!, {
              contentType: 'image/jpeg',
              upsert: true,
            });

          if (error) {
            throw error;
          }

          uploadResult = data;
          break;
        } catch (error: any) {
          retryCount++;
          console.log(`Upload retry ${retryCount}:`, error);
          
          if (retryCount >= maxRetries) {
            throw new Error(`Upload failed after ${maxRetries} attempts: ${error.message}`);
          }
          
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)));
        }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      if (!urlData.publicUrl) {
        throw new Error('Failed to get public URL for uploaded avatar');
      }

      // Update user profile with avatar URL
      await authService.updateProfile({
        avatar_url: urlData.publicUrl,
      });

      Alert.alert(
        'Success',
        'Avatar updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Refresh profile to show new avatar
              loadUserProfile();
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to upload avatar';
      
      if (error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('size')) {
        errorMessage = 'Image is too large. Please choose a smaller image.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Upload timed out. Please try again.';
      } else if (error.message.includes('storage')) {
        errorMessage = 'Storage error. Please try again later.';
      } else if (error.message.includes('network') || error.message.includes('connection')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      Alert.alert(
        'Upload Failed',
        errorMessage,
        [
          {
            text: 'Try Again',
            onPress: () => {
              // Retry with the same image
              uploadAvatar(uri);
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.signOut();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Type "DELETE" to confirm account deletion',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm',
                  style: 'destructive',
                  onPress: async () => {
                    // Implement account deletion logic
                    Alert.alert('Info', 'Account deletion feature will be implemented soon');
                  },
                },
              ],
              { cancelable: true }
            );
          },
        },
      ]
    );
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    headerButton: {
      padding: 8,
    },
    headerButtonText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '500',
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 20,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    avatarContainer: {
      alignItems: 'center',
      marginBottom: 24,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    avatarImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    avatarPlaceholder: {
      fontSize: 36,
      fontWeight: '600',
      color: colors.primary,
    },
    changeAvatarButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    changeAvatarText: {
      fontSize: 14,
      color: colors.text,
      marginLeft: 8,
    },
    inputContainer: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    inputWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      position: 'relative',
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      flex: 1,
      paddingRight: 40,
    },
    editToggleIcon: {
      position: 'absolute',
      right: 12,
      padding: 4,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelIcon: {
      position: 'absolute',
      right: 50,
      padding: 4,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    lockIcon: {
      position: 'absolute',
      right: 12,
      padding: 4,
    },
    inputDisabled: {
      backgroundColor: colors.background,
      color: colors.textSecondary,
    },
    settingItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingContent: {
      flex: 1,
    },
    settingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    settingText: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    settingDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 12,
    },
    buttonDisabled: {
      backgroundColor: colors.border,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onPrimary,
    },
    buttonTextDisabled: {
      color: colors.textTertiary,
    },
    secondaryButton: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    dangerButton: {
      backgroundColor: '#ef4444',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 12,
    },
    dangerButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
    },
    providerBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    providerBadgeText: {
      fontSize: 12,
      color: colors.onPrimary,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
  });

  if (!user) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.header}>
          <Text style={dynamicStyles.headerTitle}>Profile</Text>
          {onClose && (
            <TouchableOpacity style={dynamicStyles.headerButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>Profile</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {onClose && (
            <TouchableOpacity style={dynamicStyles.headerButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={dynamicStyles.scrollView} contentContainerStyle={dynamicStyles.content}>
        {/* Avatar Section */}
        <View style={dynamicStyles.section}>
          <View style={dynamicStyles.avatarContainer}>
            <View style={dynamicStyles.avatar}>
              {user.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={dynamicStyles.avatarImage} />
              ) : (
                <Text style={dynamicStyles.avatarPlaceholder}>
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={dynamicStyles.changeAvatarButton}
              onPress={handlePickImage}
              disabled={isLoading}
            >
              <Ionicons name="camera-outline" size={16} color={colors.text} />
              <Text style={dynamicStyles.changeAvatarText}>Change Avatar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Basic Information */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Basic Information</Text>
          
          <View style={dynamicStyles.inputContainer}>
            <Text style={dynamicStyles.inputLabel}>Full Name</Text>
            <View style={dynamicStyles.inputWithIcon}>
              <TextInput
                style={[
                  dynamicStyles.input, 
                  !isEditing && dynamicStyles.inputDisabled,
                  isEditing && { paddingRight: 80 } // Extra padding for both icons
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                editable={isEditing}
                placeholderTextColor={colors.textTertiary}
              />
              <TouchableOpacity 
                style={dynamicStyles.editToggleIcon}
                onPress={() => {
                  if (isEditing) {
                    handleSaveProfile();
                  } else {
                    setIsEditing(true);
                  }
                }}
                disabled={isLoading}
              >
                <Ionicons 
                  name={isEditing ? "checkmark" : "pencil"} 
                  size={16} 
                  color={isEditing ? colors.primary : colors.textSecondary} 
                />
              </TouchableOpacity>
              {isEditing && (
                <TouchableOpacity 
                  style={dynamicStyles.cancelIcon}
                  onPress={() => {
                    setIsEditing(false);
                    setName(user?.name || ''); // Reset to original value
                  }}
                >
                  <Ionicons 
                    name="close" 
                    size={16} 
                    color={colors.textSecondary} 
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={dynamicStyles.inputContainer}>
            <Text style={dynamicStyles.inputLabel}>Email</Text>
            <View style={dynamicStyles.inputWithIcon}>
              <TextInput
                style={[dynamicStyles.input, dynamicStyles.inputDisabled]}
                value={email}
                editable={false}
                placeholderTextColor={colors.textTertiary}
              />
              <View style={dynamicStyles.lockIcon}>
                <Ionicons name="lock-closed" size={16} color={colors.textTertiary} />
              </View>
            </View>
            {user.provider && (
              <View style={dynamicStyles.providerBadge}>
                <Text style={dynamicStyles.providerBadgeText}>
                  {user.provider} Account
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Password Section (only for email users) */}
        {!user.provider && (
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Change Password</Text>
            
            <View style={dynamicStyles.inputContainer}>
              <Text style={dynamicStyles.inputLabel}>New Password</Text>
              <TextInput
                style={dynamicStyles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={dynamicStyles.inputContainer}>
              <Text style={dynamicStyles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={dynamicStyles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <TouchableOpacity
              style={[
                dynamicStyles.secondaryButton,
                isLoading && dynamicStyles.buttonDisabled,
              ]}
              onPress={handleChangePassword}
              disabled={isLoading || !newPassword || !confirmPassword}
            >
              <Text
                style={[
                  dynamicStyles.secondaryButtonText,
                  (isLoading || !newPassword || !confirmPassword) && dynamicStyles.buttonTextDisabled,
                ]}
              >
                Update Password
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Notification Settings */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Notifications</Text>
          
          <View style={dynamicStyles.settingItem}>
            <View style={dynamicStyles.settingContent}>
              <View style={dynamicStyles.settingHeader}>
                <Text style={dynamicStyles.settingText}>Email Notifications</Text>
                <Switch
                  value={emailNotifications}
                  onValueChange={setEmailNotifications}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.background}
                />
              </View>
              <Text style={dynamicStyles.settingDescription}>
                Receive updates about your transcripts via email
              </Text>
            </View>
          </View>

          <View style={dynamicStyles.settingItem}>
            <View style={dynamicStyles.settingContent}>
              <View style={dynamicStyles.settingHeader}>
                <Text style={dynamicStyles.settingText}>Push Notifications</Text>
                <Switch
                  value={pushNotifications}
                  onValueChange={setPushNotifications}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.background}
                />
              </View>
              <Text style={dynamicStyles.settingDescription}>
                Get notified when AI analysis is complete
              </Text>
            </View>
          </View>
        </View>

        {/* Privacy Settings */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Privacy</Text>
          
          <View style={dynamicStyles.settingItem}>
            <View style={dynamicStyles.settingContent}>
              <View style={dynamicStyles.settingHeader}>
                <Text style={dynamicStyles.settingText}>Analytics</Text>
                <Switch
                  value={analyticsEnabled}
                  onValueChange={setAnalyticsEnabled}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.background}
                />
              </View>
              <Text style={dynamicStyles.settingDescription}>
                Help improve CCOPINAI with usage analytics
              </Text>
            </View>
          </View>
        </View>

        {/* Account Actions */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Account</Text>
          
          <TouchableOpacity style={dynamicStyles.secondaryButton} onPress={handleSignOut}>
            <Text style={dynamicStyles.secondaryButtonText}>Sign Out</Text>
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.dangerButton} onPress={handleDeleteAccount}>
            <Text style={dynamicStyles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 