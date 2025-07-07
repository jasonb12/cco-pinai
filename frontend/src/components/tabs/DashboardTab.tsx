/**
 * Dashboard Tab - KPI Cards and Quick Actions
 * Based on PRD-UI.md specifications
 */
import React from 'react';
import { ScrollView } from 'react-native';
import {
  View,
  Text,
  Card,
  XStack,
  YStack,
  Button,
} from '@tamagui/core';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useThemeStore } from '../../stores/themeStore';
import { useNotifStore } from '../../stores/notifStore';

export default function DashboardTab() {
  const { activeTheme } = useThemeStore();
  const { pendingActions } = useNotifStore();
  
  const backgroundColor = activeTheme === 'dark' ? '#000000' : '#ffffff';
  const surfaceColor = activeTheme === 'dark' ? '#1c1c1e' : '#f8f9fa';
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      <ScrollView style={{ flex: 1 }}>
        <YStack padding="$4" gap="$4">
          {/* Header */}
          <YStack gap="$2">
            <Text fontSize="$7" fontWeight="700" color="$color">
              Dashboard
            </Text>
            <Text fontSize="$4" color="$color11">
              Your AI automation overview
            </Text>
          </YStack>
          
          {/* KPI Cards */}
          <YStack gap="$3">
            <Text fontSize="$5" fontWeight="600" color="$color">
              Quick Stats
            </Text>
            
            <XStack gap="$3">
              <Card
                flex={1}
                backgroundColor={surfaceColor}
                borderColor={activeTheme === 'dark' ? '#38383a' : '#dee2e6'}
                borderWidth={1}
                padding="$4"
                gap="$2"
              >
                <Text fontSize="$6" fontWeight="700" color="$blue10">
                  {pendingActions.length}
                </Text>
                <Text fontSize="$3" color="$color11">
                  Pending Approvals
                </Text>
              </Card>
              
              <Card
                flex={1}
                backgroundColor={surfaceColor}
                borderColor={activeTheme === 'dark' ? '#38383a' : '#dee2e6'}
                borderWidth={1}
                padding="$4"
                gap="$2"
              >
                <Text fontSize="$6" fontWeight="700" color="$green10">
                  24
                </Text>
                <Text fontSize="$3" color="$color11">
                  Actions Today
                </Text>
              </Card>
            </XStack>
            
            <XStack gap="$3">
              <Card
                flex={1}
                backgroundColor={surfaceColor}
                borderColor={activeTheme === 'dark' ? '#38383a' : '#dee2e6'}
                borderWidth={1}
                padding="$4"
                gap="$2"
              >
                <Text fontSize="$6" fontWeight="700" color="$orange10">
                  5 min
                </Text>
                <Text fontSize="$3" color="$color11">
                  Avg Processing
                </Text>
              </Card>
              
              <Card
                flex={1}
                backgroundColor={surfaceColor}
                borderColor={activeTheme === 'dark' ? '#38383a' : '#dee2e6'}
                borderWidth={1}
                padding="$4"
                gap="$2"
              >
                <Text fontSize="$6" fontWeight="700" color="$purple10">
                  98%
                </Text>
                <Text fontSize="$3" color="$color11">
                  Success Rate
                </Text>
              </Card>
            </XStack>
          </YStack>
          
          {/* Quick Actions */}
          <YStack gap="$3">
            <Text fontSize="$5" fontWeight="600" color="$color">
              Quick Actions
            </Text>
            
            <XStack gap="$3" flexWrap="wrap">
              <Button
                flex={1}
                backgroundColor="$blue4"
                borderColor="$blue8"
                borderWidth={1}
                flexDirection="column"
                height={80}
                gap="$2"
                minWidth="45%"
              >
                <Ionicons name="add-circle-outline" size={24} color="#0A84FF" />
                <Text fontSize="$3" fontWeight="500">
                  New Note
                </Text>
              </Button>
              
              <Button
                flex={1}
                backgroundColor="$red4"
                borderColor="$red8"
                borderWidth={1}
                flexDirection="column"
                height={80}
                gap="$2"
                minWidth="45%"
              >
                <Ionicons name="mic-outline" size={24} color="#FF453A" />
                <Text fontSize="$3" fontWeight="500">
                  Record
                </Text>
              </Button>
            </XStack>
            
            <XStack gap="$3" flexWrap="wrap">
              <Button
                flex={1}
                backgroundColor="$green4"
                borderColor="$green8"
                borderWidth={1}
                flexDirection="column"
                height={80}
                gap="$2"
                minWidth="45%"
              >
                <Ionicons name="cloud-upload-outline" size={24} color="#30D158" />
                <Text fontSize="$3" fontWeight="500">
                  Upload File
                </Text>
              </Button>
              
              <Button
                flex={1}
                backgroundColor="$purple4"
                borderColor="$purple8"
                borderWidth={1}
                flexDirection="column"
                height={80}
                gap="$2"
                minWidth="45%"
              >
                <Ionicons name="sync-outline" size={24} color="#BF5AF2" />
                <Text fontSize="$3" fontWeight="500">
                  Sync Now
                </Text>
              </Button>
            </XStack>
          </YStack>
          
          {/* Recent Activity */}
          <YStack gap="$3">
            <Text fontSize="$5" fontWeight="600" color="$color">
              Recent Activity
            </Text>
            
            <Card
              backgroundColor={surfaceColor}
              borderColor={activeTheme === 'dark' ? '#38383a' : '#dee2e6'}
              borderWidth={1}
              padding="$4"
            >
              <Text fontSize="$4" color="$color11" textAlign="center">
                Activity timeline coming soon...
              </Text>
            </Card>
          </YStack>
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}