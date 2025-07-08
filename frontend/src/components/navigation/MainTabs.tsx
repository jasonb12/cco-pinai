/**
 * Main Tabs Navigation - React Navigation v7
 * Based on PRD-UI.md navigation specifications
 */
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../contexts/ThemeContext';
import ConnectionStatusIndicator from '../ConnectionStatus';

// Import tab screens
import DashboardTab from '../tabs/DashboardTab';
import ChatTab from '../tabs/ChatTab';
import CalendarTab from '../tabs/CalendarTab';
import ToolsTab from '../tabs/ToolsTab';
import MonitorTab from '../tabs/MonitorTab';
import NotificationsTab from '../tabs/NotificationsTab';
import SettingsTab from '../tabs/SettingsTab';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const colors = useThemeColors();

  // Helper function to wrap tab content with connection status
  const wrapWithConnectionStatus = (Component: React.ComponentType) => {
    return (props: any) => (
      <SafeAreaView style={styles.container}>
        <ConnectionStatusIndicator />
        <Component {...props} />
      </SafeAreaView>
    );
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case 'Chat':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Calendar':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Tools':
              iconName = focused ? 'build' : 'build-outline';
              break;
            case 'Monitor':
              iconName = focused ? 'pulse' : 'pulse-outline';
              break;
            case 'Notifications':
              iconName = focused ? 'notifications' : 'notifications-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={wrapWithConnectionStatus(DashboardTab)}
        options={{ tabBarBadge: undefined }}
      />
      <Tab.Screen 
        name="Chat" 
        component={wrapWithConnectionStatus(ChatTab)}
        options={{ tabBarBadge: undefined }}
      />
      <Tab.Screen 
        name="Calendar" 
        component={wrapWithConnectionStatus(CalendarTab)}
        options={{ tabBarBadge: undefined }}
      />
      <Tab.Screen 
        name="Tools" 
        component={wrapWithConnectionStatus(ToolsTab)}
        options={{ tabBarBadge: undefined }}
      />
      <Tab.Screen 
        name="Monitor" 
        component={wrapWithConnectionStatus(MonitorTab)}
        options={{ tabBarBadge: undefined }}
      />
      <Tab.Screen 
        name="Notifications" 
        component={wrapWithConnectionStatus(NotificationsTab)}
        options={{ tabBarBadge: undefined }}
      />
      <Tab.Screen 
        name="Settings" 
        component={wrapWithConnectionStatus(SettingsTab)}
        options={{ tabBarBadge: undefined }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});