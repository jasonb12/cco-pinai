/**
 * Main Tabs Navigation - React Navigation v7
 * Based on PRD-UI.md navigation specifications
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Badge, Text, View } from '@tamagui/core';
import { Ionicons } from '@expo/vector-icons';

// Import tab screens
import ChatTab from '../tabs/ChatTab';
import DashboardTab from '../tabs/DashboardTab';
import CalendarTab from '../tabs/CalendarTab';
import NotificationsTab from '../tabs/NotificationsTab';
import ToolsTab from '../tabs/ToolsTab';
import MonitorTab from '../tabs/MonitorTab';
import SettingsTab from '../tabs/SettingsTab';

// Import stores
import { useNotifStore } from '../../stores/notifStore';
import { useThemeStore } from '../../stores/themeStore';

const Tab = createBottomTabNavigator();

interface TabIconProps {
  name: string;
  color: string;
  size: number;
  badge?: number;
}

const TabIcon: React.FC<TabIconProps> = ({ name, color, size, badge }) => (
  <View position="relative">
    <Ionicons name={name as any} size={size} color={color} />
    {badge && badge > 0 && (
      <Badge
        position="absolute"
        top={-8}
        right={-8}
        size="$1"
        backgroundColor="$red10"
        color="white"
        borderRadius="$10"
        minWidth={16}
        height={16}
        alignItems="center"
        justifyContent="center"
      >
        <Text fontSize="$1" color="white" fontWeight="600">
          {badge > 99 ? '99+' : badge.toString()}
        </Text>
      </Badge>
    )}
  </View>
);

export default function MainTabs() {
  const { unreadCount } = useNotifStore();
  const { activeTheme } = useThemeStore();
  
  const tabBarStyle = {
    backgroundColor: activeTheme === 'dark' ? '#1c1c1e' : '#ffffff',
    borderTopColor: activeTheme === 'dark' ? '#38383a' : '#dee2e6',
    borderTopWidth: 1,
    paddingBottom: 8,
    paddingTop: 8,
    height: 80,
  };
  
  const activeTintColor = activeTheme === 'dark' ? '#0A84FF' : '#007AFF';
  const inactiveTintColor = activeTheme === 'dark' ? '#8e8e93' : '#6c757d';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: activeTintColor,
        tabBarInactiveTintColor: inactiveTintColor,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Chat"
        component={ChatTab}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="chatbubbles-outline" color={color} size={size} />
          ),
        }}
      />
      
      <Tab.Screen
        name="Dashboard"
        component={DashboardTab}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="apps-outline" color={color} size={size} />
          ),
        }}
      />
      
      <Tab.Screen
        name="Calendar"
        component={CalendarTab}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="calendar-outline" color={color} size={size} />
          ),
        }}
      />
      
      <Tab.Screen
        name="Notifications"
        component={NotificationsTab}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon 
              name="notifications-outline" 
              color={color} 
              size={size} 
              badge={unreadCount}
            />
          ),
        }}
      />
      
      <Tab.Screen
        name="Tools"
        component={ToolsTab}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="build-outline" color={color} size={size} />
          ),
        }}
      />
      
      <Tab.Screen
        name="Monitor"
        component={MonitorTab}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="pulse-outline" color={color} size={size} />
          ),
        }}
      />
      
      <Tab.Screen
        name="Settings"
        component={SettingsTab}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="settings-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}