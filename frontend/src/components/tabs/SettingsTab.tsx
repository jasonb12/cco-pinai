/**
 * Settings Tab - App Settings and Integrations
 * Based on PRD-UI.md specifications
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../contexts/ThemeContext';
import { authService } from '../../services/authService';
import { limitlessService, type LimitlessSettings } from '../../services/limitless';
import UserProfile from '../UserProfile';

interface SettingsSection {
  id: string;
  title: string;
  icon: string;
  component: React.ComponentType<any>;
}

// Limitless.ai Settings Component
function LimitlessIntegrationSettings() {
  const colors = useThemeColors();
  const [settings, setSettings] = useState<LimitlessSettings>({
    apiKey: '',
    isConnected: false,
    syncEnabled: false,
    timezone: 'UTC',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSync, setIsSync] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const limitlessSettings = await limitlessService.getSettings();
      setSettings(limitlessSettings);
      
      if (limitlessSettings.isConnected) {
        const status = await limitlessService.getConnectionStatus();
        setConnectionStatus(status.message);
      }
    } catch (error) {
      console.error('Error loading Limitless settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiKeyChange = (apiKey: string) => {
    setSettings(prev => ({ ...prev, apiKey }));
  };

  const handleSaveApiKey = async () => {
    if (!settings.apiKey.trim()) {
      Alert.alert('Error', 'Please enter a valid API key');
      return;
    }

    setIsLoading(true);
    try {
      await limitlessService.updateSettings({ apiKey: settings.apiKey });
      Alert.alert('Success', 'API key saved successfully');
      await loadSettings();
    } catch (error) {
      Alert.alert('Error', 'Failed to save API key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!settings.apiKey.trim()) {
      Alert.alert('Error', 'Please enter an API key first');
      return;
    }

    setIsTesting(true);
    try {
      const result = await limitlessService.testConnection(settings.apiKey);
      setConnectionStatus(result.message);
      
      Alert.alert(
        result.success ? 'Connection Successful' : 'Connection Failed',
        result.message,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to test connection');
    } finally {
      setIsTesting(false);
    }
  };

  const handleRemoveApiKey = async () => {
    Alert.alert(
      'Remove API Key',
      'This will disconnect your Limitless.ai account. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await limitlessService.removeApiKey();
              Alert.alert('Success', 'API key removed successfully');
              await loadSettings();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove API key');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSyncNow = async () => {
    const user = authService.getCurrentUser();
    if (!user) {
      Alert.alert('Error', 'Please sign in to sync data');
      return;
    }

    if (!settings.isConnected) {
      Alert.alert('Error', 'Please connect your Limitless.ai account first');
      return;
    }

    setIsSync(true);
    try {
      const result = await limitlessService.performIncrementalSync(user.id);
      
      Alert.alert(
        result.success ? 'Sync Successful' : 'Sync Failed',
        result.message,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to sync data');
    } finally {
      setIsSync(false);
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    section: {
      backgroundColor: colors.surface,
      marginBottom: 16,
      borderRadius: 12,
      padding: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
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
    input: {
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.text,
    },
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    passwordInput: {
      flex: 1,
    },
    eyeButton: {
      position: 'absolute',
      right: 12,
      padding: 4,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    button: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    buttonSecondary: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    buttonDanger: {
      backgroundColor: '#ef4444',
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onPrimary,
    },
    buttonTextSecondary: {
      color: colors.text,
    },
    buttonTextDanger: {
      color: '#ffffff',
    },
    buttonDisabled: {
      backgroundColor: colors.border,
    },
    statusContainer: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      marginTop: 12,
      borderWidth: 1,
      borderColor: settings.isConnected ? colors.success : colors.error,
    },
    statusText: {
      fontSize: 14,
      color: settings.isConnected ? colors.success : colors.error,
      textAlign: 'center',
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingLabel: {
      fontSize: 16,
      color: colors.text,
    },
    settingDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    helpText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 8,
      lineHeight: 16,
    },
  });

  if (isLoading) {
    return (
      <View style={[dynamicStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>🔗 Limitless.ai Integration</Text>
        
        <View style={dynamicStyles.inputContainer}>
          <Text style={dynamicStyles.inputLabel}>API Key</Text>
          <View style={dynamicStyles.passwordContainer}>
            <TextInput
              style={[dynamicStyles.input, dynamicStyles.passwordInput]}
              value={settings.apiKey}
              onChangeText={handleApiKeyChange}
              placeholder="Enter your Limitless.ai API key"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry={!showApiKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={dynamicStyles.eyeButton}
              onPress={() => setShowApiKey(!showApiKey)}
            >
              <Ionicons
                name={showApiKey ? 'eye-off' : 'eye'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          <Text style={dynamicStyles.helpText}>
            Get your API key from Limitless.ai dashboard under Account → API Keys
          </Text>
        </View>

        <View style={dynamicStyles.buttonRow}>
          <TouchableOpacity
            style={[dynamicStyles.button, dynamicStyles.buttonSecondary]}
            onPress={handleTestConnection}
            disabled={isTesting || !settings.apiKey.trim()}
          >
            {isTesting ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Ionicons name="wifi" size={16} color={colors.text} />
            )}
            <Text style={[dynamicStyles.buttonText, dynamicStyles.buttonTextSecondary]}>
              Test Connection
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              dynamicStyles.button,
              !settings.apiKey.trim() && dynamicStyles.buttonDisabled
            ]}
            onPress={handleSaveApiKey}
            disabled={isLoading || !settings.apiKey.trim()}
          >
            <Ionicons name="save" size={16} color={colors.onPrimary} />
            <Text style={dynamicStyles.buttonText}>Save Key</Text>
          </TouchableOpacity>
        </View>

        {settings.isConnected && (
          <TouchableOpacity
            style={[dynamicStyles.button, dynamicStyles.buttonDanger, { marginTop: 12 }]}
            onPress={handleRemoveApiKey}
          >
            <Ionicons name="unlink" size={16} color="#ffffff" />
            <Text style={dynamicStyles.buttonTextDanger}>Disconnect Account</Text>
          </TouchableOpacity>
        )}

        {connectionStatus && (
          <View style={dynamicStyles.statusContainer}>
            <Text style={dynamicStyles.statusText}>{connectionStatus}</Text>
          </View>
        )}
      </View>

      {settings.isConnected && (
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>🔄 Data Sync</Text>
          
          <View style={dynamicStyles.settingRow}>
            <View>
              <Text style={dynamicStyles.settingLabel}>Auto Sync</Text>
              <Text style={dynamicStyles.settingDescription}>
                Automatically sync Limitless data to your transcripts
              </Text>
            </View>
            <Switch
              value={settings.syncEnabled}
              onValueChange={(value) => setSettings(prev => ({ ...prev, syncEnabled: value }))}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
            />
          </View>

          <TouchableOpacity
            style={[dynamicStyles.button, { marginTop: 16 }]}
            onPress={handleSyncNow}
            disabled={isSync}
          >
            {isSync ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <Ionicons name="sync" size={16} color={colors.onPrimary} />
            )}
            <Text style={dynamicStyles.buttonText}>
              {isSync ? 'Syncing...' : 'Sync Now'}
            </Text>
          </TouchableOpacity>

          <Text style={dynamicStyles.helpText}>
            Sync will import your Limitless recordings as transcripts. This may take a few minutes for large amounts of data.
          </Text>
        </View>
      )}
    </View>
  );
}

// App Settings Component
function AppSettings() {
  const colors = useThemeColors();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [autoSync, setAutoSync] = useState(false);

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    section: {
      backgroundColor: colors.surface,
      marginBottom: 16,
      borderRadius: 12,
      padding: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingLabel: {
      fontSize: 16,
      color: colors.text,
    },
    settingDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>🔔 Notifications</Text>
        
        <View style={dynamicStyles.settingRow}>
          <View>
            <Text style={dynamicStyles.settingLabel}>Push Notifications</Text>
            <Text style={dynamicStyles.settingDescription}>
              Get notified about transcript processing and updates
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.background}
          />
        </View>
      </View>

      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>📊 Privacy & Analytics</Text>
        
        <View style={dynamicStyles.settingRow}>
          <View>
            <Text style={dynamicStyles.settingLabel}>Usage Analytics</Text>
            <Text style={dynamicStyles.settingDescription}>
              Help improve CCOPINAI by sharing anonymous usage data
            </Text>
          </View>
          <Switch
            value={analyticsEnabled}
            onValueChange={setAnalyticsEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.background}
          />
        </View>
      </View>

      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>⚙️ General</Text>
        
        <View style={dynamicStyles.settingRow}>
          <View>
            <Text style={dynamicStyles.settingLabel}>Auto Sync</Text>
            <Text style={dynamicStyles.settingDescription}>
              Automatically sync data when app opens
            </Text>
          </View>
          <Switch
            value={autoSync}
            onValueChange={setAutoSync}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.background}
          />
        </View>
      </View>
    </View>
  );
}

// Main Settings Tab Component
export default function SettingsTab() {
  const colors = useThemeColors();
  const [activeSection, setActiveSection] = useState('profile');

  const sections: SettingsSection[] = [
    {
      id: 'profile',
      title: 'Profile',
      icon: 'person',
      component: UserProfile,
    },
    {
      id: 'limitless',
      title: 'Limitless.ai',
      icon: 'infinite',
      component: LimitlessIntegrationSettings,
    },
    {
      id: 'app',
      title: 'App Settings',
      icon: 'settings',
      component: AppSettings,
    },
  ];

  const ActiveComponent = sections.find(s => s.id === activeSection)?.component || AppSettings;

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    tabsContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    content: {
      flex: 1,
      padding: 16,
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>Settings</Text>
      </View>

      <View style={dynamicStyles.tabsContainer}>
        {sections.map((section) => (
          <TouchableOpacity
            key={section.id}
            style={[
              dynamicStyles.tab,
              activeSection === section.id && dynamicStyles.tabActive,
            ]}
            onPress={() => setActiveSection(section.id)}
          >
            <Ionicons
              name={section.icon as any}
              size={16}
              color={activeSection === section.id ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                dynamicStyles.tabText,
                activeSection === section.id && dynamicStyles.tabTextActive,
              ]}
            >
              {section.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={dynamicStyles.content} showsVerticalScrollIndicator={false}>
        <ActiveComponent />
      </ScrollView>
    </SafeAreaView>
  );
}