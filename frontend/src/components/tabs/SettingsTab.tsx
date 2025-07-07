/**
 * Settings Tab - App Settings and Integrations
 * Based on PRD-UI.md specifications
 */
import React from 'react';
import {
  View,
  Text,
  YStack,
} from '@tamagui/core';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeStore } from '../../stores/themeStore';

export default function SettingsTab() {
  const { activeTheme } = useThemeStore();
  
  const backgroundColor = activeTheme === 'dark' ? '#000000' : '#ffffff';
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$6">
        <Text fontSize="$6" fontWeight="600" color="$color" textAlign="center">
          Settings
        </Text>
        <Text fontSize="$4" color="$color11" textAlign="center" marginTop="$2">
          Profile, theme, integrations, and privacy settings coming soon...
        </Text>
      </YStack>
    </SafeAreaView>
  );
}