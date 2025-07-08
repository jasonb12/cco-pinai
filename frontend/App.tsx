import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { supabase } from './src/config/supabase';
import { User } from '@supabase/supabase-js';
import WelcomeScreen from './src/components/auth/WelcomeScreen';
import SignInScreen from './src/components/auth/SignInScreen';
import TranscriptUpload from './src/components/TranscriptUpload';
import TranscriptViewer from './src/components/TranscriptViewer';
import VoiceRecorder from './src/components/VoiceRecorder';
import AnalyticsDashboard from './src/components/AnalyticsDashboard';
import AIInsights from './src/components/AIInsights';
import UserProfile from './src/components/UserProfile';
import { ThemeProvider, useTheme, useThemeColors } from './src/contexts/ThemeContext';
import ThemeToggle from './src/components/ThemeToggle';
import { authService, AuthUser } from './src/services/authService';
import { notificationService, ActivityEvent } from './src/services/notificationService';
import NotificationPanel from './src/components/NotificationPanel';
import NotificationBadge from './src/components/NotificationBadge';
import LiveActivityFeed from './src/components/LiveActivityFeed';
import CalendarTab from './src/components/tabs/CalendarTab';

const Tab = createBottomTabNavigator();

// Linking configuration for URL routing
const linking = {
  prefixes: ['https://ccopinai.com', 'ccopinai://'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Dashboard: 'dashboard',
          Chat: 'chat',
          Calendar: 'calendar',
          Live: 'live',
          Analytics: 'analytics',
          Settings: 'settings',
        },
      },
      Welcome: 'welcome',
      SignIn: 'signin',
    },
  },
};

// Loading screen component
function LoadingScreen() {
  const colors = useThemeColors();
  
  const loadingStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 32,
    },
  });
  
  return (
    <SafeAreaView style={loadingStyles.container}>
      <View style={loadingStyles.content}>
        <Text style={loadingStyles.title}>CCOPINAI</Text>
        <Text style={loadingStyles.subtitle}>Loading...</Text>
      </View>
    </SafeAreaView>
  );
}

// Enhanced Dashboard screen with real-time features
function DashboardScreen() {
  const [transcriptCount, setTranscriptCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentActivity, setRecentActivity] = useState<ActivityEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const colors = useThemeColors();
  const user = authService.getCurrentUser();

  useEffect(() => {
    loadDashboardData();
    
    // Subscribe to real-time updates
    const unsubscribeActivity = notificationService.onActivityChange((activities) => {
      setRecentActivity(activities.slice(0, 3)); // Show last 3 activities
    });
    
    const unsubscribeConnection = notificationService.onConnectionChange(setIsConnected);
    
    // Load initial data
    setRecentActivity(notificationService.getActivityFeed().slice(0, 3));
    setIsConnected(notificationService.isConnectedToServer());
    
    return () => {
      unsubscribeActivity();
      unsubscribeConnection();
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load transcript count
      const { count, error } = await supabase
        .from('transcripts')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error loading transcripts:', error);
      } else {
        setTranscriptCount(count || 0);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign out');
    }
  };

  const simulateActivity = () => {
    notificationService.sendUserActivity({
      type: 'upload',
      title: 'New Recording Uploaded',
      description: 'Meeting_2024_01_15.mp3 uploaded successfully',
      userName: user?.name || 'You',
    });
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 32,
    },
    userInfo: {
      fontSize: 14,
      color: colors.primary,
      marginBottom: 16,
      textAlign: 'center',
    },
    statCard: {
      backgroundColor: colors.surface,
      padding: 20,
      borderRadius: 12,
      alignItems: 'center',
      minWidth: 120,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    statNumber: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    signOutButton: {
      backgroundColor: '#ef4444',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      marginTop: 16,
    },
    signOutButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
  });
  
  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.content}>
        <Text style={dynamicStyles.title}>Dashboard</Text>
        <Text style={dynamicStyles.subtitle}>Welcome to CCOPINAI</Text>
        {user && (
          <Text style={dynamicStyles.userInfo}>
            Welcome back, {user.name || user.email}!
          </Text>
        )}
        <View style={styles.statsContainer}>
          <View style={dynamicStyles.statCard}>
            <Text style={dynamicStyles.statNumber}>
              {isLoading ? '...' : transcriptCount}
            </Text>
            <Text style={dynamicStyles.statLabel}>Transcripts</Text>
          </View>
          <View style={dynamicStyles.statCard}>
            <Text style={dynamicStyles.statNumber}>
              {isLoading ? '...' : '0'}
            </Text>
            <Text style={dynamicStyles.statLabel}>Active Sessions</Text>
          </View>
        </View>
        <TouchableOpacity style={dynamicStyles.signOutButton} onPress={handleSignOut}>
          <Text style={dynamicStyles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Enhanced Chat screen with AI transcript management
function ChatScreen() {
  const [showUpload, setShowUpload] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const colors = useThemeColors();
  
  const handleUploadComplete = (transcriptId: string) => {
    setShowUpload(false);
    // The TranscriptViewer will automatically refresh
  };
  
  const handleRecordingComplete = (audioUri: string) => {
    setShowVoiceRecorder(false);
    // The TranscriptViewer will automatically refresh
    Alert.alert('Success', 'Recording saved and processing started!');
  };
  
  const dynamicChatStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    uploadContainer: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    toggleButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
      flex: 1,
    },
    recordButton: {
      backgroundColor: '#ff4444',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
      flex: 1,
    },
    toggleButtonText: {
      color: colors.onPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    recordButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    backButton: {
      backgroundColor: colors.surface,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    backButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
  });

  if (showUpload) {
    return (
      <SafeAreaView style={dynamicChatStyles.container}>
        <View style={dynamicChatStyles.uploadContainer}>
          <TouchableOpacity 
            style={dynamicChatStyles.backButton}
            onPress={() => setShowUpload(false)}
          >
            <Text style={dynamicChatStyles.backButtonText}>
              ← Back to Transcripts
            </Text>
          </TouchableOpacity>
        </View>
        <TranscriptUpload onUploadComplete={handleUploadComplete} />
      </SafeAreaView>
    );
  }

  if (showVoiceRecorder) {
    return (
      <SafeAreaView style={dynamicChatStyles.container}>
        <View style={dynamicChatStyles.uploadContainer}>
          <TouchableOpacity 
            style={dynamicChatStyles.backButton}
            onPress={() => setShowVoiceRecorder(false)}
          >
            <Text style={dynamicChatStyles.backButtonText}>
              ← Back to Transcripts
            </Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <VoiceRecorder onRecordingComplete={handleRecordingComplete} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicChatStyles.container}>
      <View style={dynamicChatStyles.uploadContainer}>
        <View style={dynamicChatStyles.buttonRow}>
          <TouchableOpacity 
            style={dynamicChatStyles.toggleButton}
            onPress={() => setShowUpload(true)}
          >
            <Text style={dynamicChatStyles.toggleButtonText}>
              📁 Upload Audio
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={dynamicChatStyles.recordButton}
            onPress={() => setShowVoiceRecorder(true)}
          >
            <Text style={dynamicChatStyles.recordButtonText}>
              🎤 Record Live
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <TranscriptViewer onRefresh={() => {}} />
    </SafeAreaView>
  );
}

// Enhanced Settings screen with UserProfile
function SettingsScreen() {
  const colors = useThemeColors();
  const [showProfile, setShowProfile] = useState(false);

  if (showProfile) {
    return <UserProfile onClose={() => setShowProfile(false)} />;
  }

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      padding: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 32,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    settingText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    settingDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingIcon: {
      marginRight: 12,
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.content}>
        <Text style={dynamicStyles.title}>Settings</Text>
        <Text style={dynamicStyles.subtitle}>App Configuration</Text>
        
        <TouchableOpacity style={dynamicStyles.settingItem} onPress={() => setShowProfile(true)}>
          <View style={dynamicStyles.settingLeft}>
            <Ionicons name="person-outline" size={20} color={colors.primary} style={dynamicStyles.settingIcon} />
            <View>
              <Text style={dynamicStyles.settingText}>Profile & Account</Text>
              <Text style={dynamicStyles.settingDescription}>Manage your profile and account settings</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>

        <ThemeToggle style={{ marginBottom: 12 }} />
        
        <TouchableOpacity style={dynamicStyles.settingItem}>
          <View style={dynamicStyles.settingLeft}>
            <Ionicons name="notifications-outline" size={20} color={colors.primary} style={dynamicStyles.settingIcon} />
            <View>
              <Text style={dynamicStyles.settingText}>Notifications</Text>
              <Text style={dynamicStyles.settingDescription}>Configure notification preferences</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={dynamicStyles.settingItem}>
          <View style={dynamicStyles.settingLeft}>
            <Ionicons name="shield-outline" size={20} color={colors.primary} style={dynamicStyles.settingIcon} />
            <View>
              <Text style={dynamicStyles.settingText}>Privacy & Security</Text>
              <Text style={dynamicStyles.settingDescription}>Control your data and privacy settings</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={dynamicStyles.settingItem}>
          <View style={dynamicStyles.settingLeft}>
            <Ionicons name="help-circle-outline" size={20} color={colors.primary} style={dynamicStyles.settingIcon} />
            <View>
              <Text style={dynamicStyles.settingText}>Help & Support</Text>
              <Text style={dynamicStyles.settingDescription}>Get help and contact support</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Live Activity Screen
function LiveScreen() {
  const colors = useThemeColors();
  const [showNotifications, setShowNotifications] = useState(false);
  
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
      backgroundColor: colors.surface,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    notificationButton: {
      position: 'relative',
      padding: 8,
      borderRadius: 20,
      backgroundColor: colors.background,
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>Live Activity</Text>
        <TouchableOpacity
          style={dynamicStyles.notificationButton}
          onPress={() => setShowNotifications(true)}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
          <NotificationBadge />
        </TouchableOpacity>
      </View>
      
      <LiveActivityFeed showHeader={false} />
      
      <NotificationPanel
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </SafeAreaView>
  );
}

// Main Tab Navigator
function MainTabs() {
  const colors = useThemeColors();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          
          if (route.name === 'Dashboard') {
            iconName = focused ? 'apps' : 'apps-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Live') {
            iconName = focused ? 'pulse' : 'pulse-outline';
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          
          const iconElement = <Ionicons name={iconName} size={size} color={color} />;
          
          // Add notification badge to Live tab
          if (route.name === 'Live') {
            return (
              <View style={{ position: 'relative' }}>
                {iconElement}
                <NotificationBadge />
              </View>
            );
          }
          
          return iconElement;
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Calendar" component={CalendarTab} />
      <Tab.Screen name="Live" component={LiveScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsDashboard} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

// App content component (wrapped by ThemeProvider)
function AppContent() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSignIn, setShowSignIn] = useState(false);
  const colors = useThemeColors();
  
  useEffect(() => {
    // Initialize auth service and listen for changes
    const initAuth = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const unsubscribe = authService.onSessionChange((session) => {
      setUser(session?.user || null);
      setIsLoading(false);
      if (session?.user) {
        setShowSignIn(false); // Hide sign-in when user is authenticated
      }
    });

    return () => unsubscribe();
  }, []);
  
  if (isLoading) {
    return (
      <SafeAreaProvider>
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }
  
  return (
    <SafeAreaProvider>
      <NavigationContainer linking={linking}>
        {user ? (
          <MainTabs />
        ) : showSignIn ? (
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <SignInScreen onSuccess={() => setShowSignIn(false)} />
          </View>
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <SimpleWelcomeScreen onGetStarted={() => setShowSignIn(true)} />
          </View>
        )}
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// Simple Welcome Screen without navigation dependencies
function SimpleWelcomeScreen({ onGetStarted }: { onGetStarted: () => void }) {
  const colors = useThemeColors();
  
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    logoSection: {
      alignItems: 'center',
      marginBottom: 48,
    },
    logoContainer: {
      width: 120,
      height: 120,
      backgroundColor: colors.primary,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    logoText: {
      fontSize: 32,
      fontWeight: '600',
      color: colors.onPrimary,
    },
    titleSection: {
      alignItems: 'center',
    },
    title: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      maxWidth: 280,
      lineHeight: 22,
    },
    buttonSection: {
      width: '100%',
      maxWidth: 300,
    },
    getStartedButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 16,
    },
    getStartedButtonText: {
      color: colors.onPrimary,
      fontSize: 18,
      fontWeight: '600',
    },
    signInRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    signInText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginRight: 4,
    },
    signInLink: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.content}>
        {/* Logo placeholder */}
        <View style={dynamicStyles.logoSection}>
          <View style={dynamicStyles.logoContainer}>
            <Text style={dynamicStyles.logoText}>CC</Text>
          </View>
          
          <View style={dynamicStyles.titleSection}>
            <Text style={dynamicStyles.title}>CCOPINAI</Text>
            <Text style={dynamicStyles.subtitle}>
              Automate continuous audio capture into actionable insights
            </Text>
          </View>
        </View>

        {/* Get Started Button */}
        <View style={dynamicStyles.buttonSection}>
          <TouchableOpacity
            style={dynamicStyles.getStartedButton}
            onPress={onGetStarted}
          >
            <Text style={dynamicStyles.getStartedButtonText}>Get Started</Text>
          </TouchableOpacity>
          
          <View style={dynamicStyles.signInRow}>
            <Text style={dynamicStyles.signInText}>
              Already have an account?
            </Text>
            <TouchableOpacity onPress={onGetStarted}>
              <Text style={dynamicStyles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Main App component with ThemeProvider
export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  userInfo: {
    fontSize: 14,
    color: '#3b82f6',
    marginBottom: 16,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#f3f4f6',
  },
  buttonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  switchButton: {
    paddingVertical: 8,
  },
  switchButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    textAlign: 'center',
  },
  signOutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  signOutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  statCard: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  chatContainer: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    maxWidth: 300,
  },
  chatMessage: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    maxWidth: 300,
  },
  settingText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  transcriptsSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#3b82f6',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  transcriptsList: {
    marginTop: 16,
  },
  transcriptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  transcriptIcon: {
    marginRight: 16,
  },
  transcriptDetails: {
    flex: 1,
  },
  transcriptName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  transcriptMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  transcriptSize: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  transcriptDot: {
    fontSize: 14,
    color: '#6b7280',
    marginHorizontal: 8,
  },
  transcriptDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  statusText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  statusUploaded: {
    backgroundColor: '#10b981',
  },
  statusTextUploaded: {
    color: 'white',
  },
  statusProcessing: {
    backgroundColor: '#3b82f6',
  },
  statusTextProcessing: {
    color: 'white',
  },
  statusCompleted: {
    backgroundColor: '#ef4444',
  },
  statusTextCompleted: {
    color: 'white',
  },
  transcriptAction: {
    padding: 8,
  },
});
