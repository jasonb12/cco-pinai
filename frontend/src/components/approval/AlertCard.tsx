/**
 * Alert Card Component - Info/Warning/Error badges
 * Based on PRD-UI.md specifications
 */
import React from 'react';
import {
  Card,
  XStack,
  YStack,
  Text,
  Button,
  Badge,
  View,
} from '@tamagui/core';
import { Ionicons } from '@expo/vector-icons';

import { Alert } from '../../stores/notifStore';
import { useThemeStore } from '../../stores/themeStore';

interface AlertCardProps {
  alert: Alert;
  onPress: () => void;
  onDismiss: () => void;
}

export default function AlertCard({ alert, onPress, onDismiss }: AlertCardProps) {
  const { activeTheme } = useThemeStore();
  
  const getAlertConfig = (type: Alert['type']) => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          color: activeTheme === 'dark' ? '#30D158' : '#34C759',
          backgroundColor: activeTheme === 'dark' ? '#0d3a1a' : '#d1f2d9',
          borderColor: activeTheme === 'dark' ? '#165b2c' : '#a8e6b5',
        };
      case 'warning':
        return {
          icon: 'warning' as const,
          color: activeTheme === 'dark' ? '#FF9F0A' : '#FF9500',
          backgroundColor: activeTheme === 'dark' ? '#3d2d0a' : '#fff3cd',
          borderColor: activeTheme === 'dark' ? '#5a421a' : '#ffecb5',
        };
      case 'error':
        return {
          icon: 'close-circle' as const,
          color: activeTheme === 'dark' ? '#FF453A' : '#FF3B30',
          backgroundColor: activeTheme === 'dark' ? '#3d1317' : '#f8d7da',
          borderColor: activeTheme === 'dark' ? '#5a1f25' : '#f5c6cb',
        };
      case 'info':
      default:
        return {
          icon: 'information-circle' as const,
          color: activeTheme === 'dark' ? '#0A84FF' : '#007AFF',
          backgroundColor: activeTheme === 'dark' ? '#0a1f3d' : '#cce7ff',
          borderColor: activeTheme === 'dark' ? '#1a355a' : '#99d1ff',
        };
    }
  };
  
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };
  
  const config = getAlertConfig(alert.type);
  
  return (
    <Card
      elevate
      backgroundColor={config.backgroundColor}
      borderColor={config.borderColor}
      borderWidth={1}
      borderRadius="$4"
      padding="$4"
      pressStyle={{ scale: 0.98 }}
      onPress={onPress}
    >
      <XStack alignItems="flex-start" gap="$3">
        {/* Icon */}
        <View
          backgroundColor={config.color}
          padding="$2"
          borderRadius="$10"
          marginTop="$1"
        >
          <Ionicons
            name={config.icon}
            size={20}
            color="white"
          />
        </View>
        
        {/* Content */}
        <YStack flex={1} gap="$2">
          <XStack alignItems="center" justifyContent="space-between">
            <Text
              fontSize="$4"
              fontWeight="600"
              color="$color"
              flex={1}
            >
              {alert.title}
            </Text>
            
            <XStack alignItems="center" gap="$2">
              {!alert.read && (
                <View
                  width={8}
                  height={8}
                  backgroundColor={config.color}
                  borderRadius="$10"
                />
              )}
              
              <Text fontSize="$2" color="$color11">
                {formatTimeAgo(alert.timestamp)}
              </Text>
            </XStack>
          </XStack>
          
          <Text fontSize="$3" color="$color11" lineHeight="$1">
            {alert.message}
          </Text>
          
          {/* Action buttons */}
          <XStack gap="$2" marginTop="$2">
            {alert.action && (
              <Button
                size="$2"
                variant="outlined"
                backgroundColor={config.color}
                borderColor={config.color}
                color="white"
                onPress={alert.action.onPress}
              >
                {alert.action.label}
              </Button>
            )}
            
            {!alert.persistent && (
              <Button
                size="$2"
                variant="ghost"
                color="$color11"
                onPress={onDismiss}
                icon={<Ionicons name="close" size={14} />}
              >
                Dismiss
              </Button>
            )}
          </XStack>
        </YStack>
      </XStack>
    </Card>
  );
}