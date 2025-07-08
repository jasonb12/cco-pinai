/**
 * User Profile Manager - Comprehensive user account management
 * Handles profile editing, account settings, preferences, and security
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../contexts/ThemeContext';
import { authService, AuthUser } from '../services/authService';
import { notificationService } from '../services/notificationService';

interface UserProfileManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (user: AuthUser) => void;
}

interface ProfileSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  aiSuggestions: boolean;
  darkMode: boolean;
  autoSync: boolean;
  dataSharing: boolean;
  twoFactorAuth: boolean;
  sessionTimeout: '15min' | '1hour' | '4hours' | 'never';
  language: 'en' | 'es' | 'fr' | 'de';
  timezone: string;
}

interface EditableProfile {
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  company?: string;
  position?: string;
}

export default function UserProfileManager({ 
  isOpen, 
  onClose, 
  onProfileUpdated 
}: UserProfileManagerProps) {
  const colors = useThemeColors();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'security'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Profile editing state
  const [editableProfile, setEditableProfile] = useState<EditableProfile>({
    name: '',
    email: '',
    phone: '',
    bio: '',
    company: '',
    position: '',
  });

  // Settings state
  const [settings, setSettings] = useState<ProfileSettings>({
    emailNotifications: true,
    pushNotifications: true,
    aiSuggestions: true,
    darkMode: false,
    autoSync: true,
    dataSharing: false,
    twoFactorAuth: false,
    sessionTimeout: '1hour',
    language: 'en',
    timezone: 'UTC',
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadUserProfile();
      loadUserSettings();
    }
  }, [isOpen]);

  const loadUserProfile = async () => {
    try {
      const user = authService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setEditableProfile({
          name: user.name || '',
          email: user.email,
          phone: user.phone || '',
          bio: user.bio || '',
          company: user.company || '',
          position: user.position || '',
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadUserSettings = async () => {
    try {
      // In a real app, load from user preferences API
      // For now, use default settings
      const savedSettings = await loadSettingsFromStorage();
      if (savedSettings) {
        setSettings(savedSettings);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const loadSettingsFromStorage = async (): Promise<ProfileSettings | null> => {
    // Implementation would use AsyncStorage or API
    return null;
  };

  const saveSettingsToStorage = async (settings: ProfileSettings) => {
    // Implementation would save to AsyncStorage or API
    console.log('Saving settings:', settings);
  };

  const handleProfileSave = async () => {
    setIsLoading(true);
    try {
      // In a real app, update user profile via API
      const updatedUser: AuthUser = {
        ...currentUser!,
        ...editableProfile,
        updated_at: new Date().toISOString(),
      };

      setCurrentUser(updatedUser);
      setIsEditing(false);
      onProfileUpdated?.(updatedUser);
      
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsChange = async (key: keyof ProfileSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveSettingsToStorage(newSettings);
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    try {
      // In a real app, change password via API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowChangePassword(false);
      Alert.alert('Success', 'Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'Failed to change password. Please try again.');
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
              onClose();
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Confirmation', 'Type "DELETE" to confirm account deletion');
            // In a real app, implement account deletion flow
          }
        }
      ]
    );
  };

  const renderProfileTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <TouchableOpacity style={styles.changeAvatarButton}>
            <Ionicons name="camera-outline" size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{currentUser?.name || 'User'}</Text>
        <Text style={styles.userEmail}>{currentUser?.email}</Text>
      </View>

      {/* Profile Form */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Ionicons 
              name={isEditing ? 'checkmark-outline' : 'pencil-outline'} 
              size={20} 
              color={colors.primary} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={editableProfile.name}
              onChangeText={(text) => setEditableProfile(prev => ({ ...prev, name: text }))}
              editable={isEditing}
              placeholder="Enter your full name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={editableProfile.email}
              editable={false}
              placeholder="Email address"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.inputHint}>Email cannot be changed</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={editableProfile.phone}
              onChangeText={(text) => setEditableProfile(prev => ({ ...prev, phone: text }))}
              editable={isEditing}
              placeholder="Enter phone number"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Company</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={editableProfile.company}
              onChangeText={(text) => setEditableProfile(prev => ({ ...prev, company: text }))}
              editable={isEditing}
              placeholder="Enter company name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Position</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={editableProfile.position}
              onChangeText={(text) => setEditableProfile(prev => ({ ...prev, position: text }))}
              editable={isEditing}
              placeholder="Enter your position"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={[styles.textArea, !isEditing && styles.disabledInput]}
              value={editableProfile.bio}
              onChangeText={(text) => setEditableProfile(prev => ({ ...prev, bio: text }))}
              editable={isEditing}
              placeholder="Tell us about yourself"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          {isEditing && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setIsEditing(false);
                  loadUserProfile(); // Reset changes
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleProfileSave}
                disabled={isLoading}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );

  const renderSettingsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Email Notifications</Text>
            <Text style={styles.settingDescription}>Receive updates via email</Text>
          </View>
          <Switch
            value={settings.emailNotifications}
            onValueChange={(value) => handleSettingsChange('emailNotifications', value)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={settings.emailNotifications ? '#ffffff' : colors.textSecondary}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Push Notifications</Text>
            <Text style={styles.settingDescription}>Receive push notifications on your device</Text>
          </View>
          <Switch
            value={settings.pushNotifications}
            onValueChange={(value) => handleSettingsChange('pushNotifications', value)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={settings.pushNotifications ? '#ffffff' : colors.textSecondary}
          />
        </View>
      </View>

      {/* AI & Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI & Features</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>AI Suggestions</Text>
            <Text style={styles.settingDescription}>Get smart event suggestions from AI</Text>
          </View>
          <Switch
            value={settings.aiSuggestions}
            onValueChange={(value) => handleSettingsChange('aiSuggestions', value)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={settings.aiSuggestions ? '#ffffff' : colors.textSecondary}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Auto Sync</Text>
            <Text style={styles.settingDescription}>Automatically sync data across devices</Text>
          </View>
          <Switch
            value={settings.autoSync}
            onValueChange={(value) => handleSettingsChange('autoSync', value)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={settings.autoSync ? '#ffffff' : colors.textSecondary}
          />
        </View>
      </View>

      {/* Privacy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Data Sharing</Text>
            <Text style={styles.settingDescription}>Share anonymized data to improve AI</Text>
          </View>
          <Switch
            value={settings.dataSharing}
            onValueChange={(value) => handleSettingsChange('dataSharing', value)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={settings.dataSharing ? '#ffffff' : colors.textSecondary}
          />
        </View>
      </View>
    </ScrollView>
  );

  const renderSecurityTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Password */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Password & Authentication</Text>
        
        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => setShowChangePassword(true)}
        >
          <Ionicons name="key-outline" size={24} color={colors.primary} />
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Change Password</Text>
            <Text style={styles.actionDescription}>Update your account password</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Two-Factor Authentication</Text>
            <Text style={styles.settingDescription}>Add extra security to your account</Text>
          </View>
          <Switch
            value={settings.twoFactorAuth}
            onValueChange={(value) => handleSettingsChange('twoFactorAuth', value)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={settings.twoFactorAuth ? '#ffffff' : colors.textSecondary}
          />
        </View>
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity 
          style={styles.actionItem}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={24} color="#f59e0b" />
          <View style={styles.actionInfo}>
            <Text style={[styles.actionTitle, { color: '#f59e0b' }]}>Sign Out</Text>
            <Text style={styles.actionDescription}>Sign out of your account</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionItem}
          onPress={handleDeleteAccount}
        >
          <Ionicons name="trash-outline" size={24} color="#ef4444" />
          <View style={styles.actionInfo}>
            <Text style={[styles.actionTitle, { color: '#ef4444' }]}>Delete Account</Text>
            <Text style={styles.actionDescription}>Permanently delete your account</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const styles = StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '95%',
      minHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      margin: 16,
      borderRadius: 12,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 8,
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    activeTabText: {
      color: '#ffffff',
      fontWeight: '600',
    },
    tabContent: {
      flex: 1,
      padding: 16,
    },
    profileHeader: {
      alignItems: 'center',
      paddingVertical: 24,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 24,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: 16,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 32,
      fontWeight: '700',
      color: '#ffffff',
    },
    changeAvatarButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: colors.surface,
      padding: 8,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: colors.background,
    },
    userName: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    editButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    formContainer: {
      gap: 16,
    },
    inputGroup: {
      gap: 8,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
    },
    textArea: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    disabledInput: {
      backgroundColor: colors.surface,
      color: colors.textSecondary,
    },
    inputHint: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    saveButton: {
      backgroundColor: colors.primary,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingInfo: {
      flex: 1,
      marginRight: 16,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    actionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    actionInfo: {
      flex: 1,
      marginLeft: 16,
      marginRight: 12,
    },
    actionTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 4,
    },
    actionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
  });

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modal}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>User Profile</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
              onPress={() => setActiveTab('profile')}
            >
              <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
                Profile
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
              onPress={() => setActiveTab('settings')}
            >
              <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
                Settings
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'security' && styles.activeTab]}
              onPress={() => setActiveTab('security')}
            >
              <Text style={[styles.tabText, activeTab === 'security' && styles.activeTabText]}>
                Security
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'settings' && renderSettingsTab()}
          {activeTab === 'security' && renderSecurityTab()}
        </View>
      </View>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePassword}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChangePassword(false)}
      >
        <View style={styles.modal}>
          <View style={[styles.container, { minHeight: 'auto', maxHeight: '70%' }]}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Change Password</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowChangePassword(false)}
              >
                <Ionicons name="close-outline" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.tabContent}>
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Current Password</Text>
                  <TextInput
                    style={styles.input}
                    value={passwordData.currentPassword}
                    onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
                    placeholder="Enter current password"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>New Password</Text>
                  <TextInput
                    style={styles.input}
                    value={passwordData.newPassword}
                    onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
                    placeholder="Enter new password"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm New Password</Text>
                  <TextInput
                    style={styles.input}
                    value={passwordData.confirmPassword}
                    onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
                    placeholder="Confirm new password"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry
                  />
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setShowChangePassword(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={handlePasswordChange}
                    disabled={isLoading}
                  >
                    <Text style={styles.saveButtonText}>
                      {isLoading ? 'Changing...' : 'Change Password'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
} 