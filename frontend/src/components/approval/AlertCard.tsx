/**
 * Alert Card Component - Info/Warning/Error badges
 * Based on PRD-UI.md specifications
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Card } from '@tamagui/card';
import { Stack } from '@tamagui/core';
import { Button } from '@tamagui/button';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../contexts/ThemeContext';

interface AlertCardProps {
  title: string;
  description: string;
  type: 'info' | 'warning' | 'error' | 'success';
  onDismiss?: () => void;
  onAction?: () => void;
  actionLabel?: string;
}

export default function AlertCard({
  title,
  description,
  type,
  onDismiss,
  onAction,
  actionLabel,
}: AlertCardProps) {
  const colors = useThemeColors();

  const getIconAndColor = () => {
    switch (type) {
      case 'info':
        return { icon: 'information-circle', color: '#3b82f6' };
      case 'warning':
        return { icon: 'warning', color: '#f59e0b' };
      case 'error':
        return { icon: 'alert-circle', color: '#ef4444' };
      case 'success':
        return { icon: 'checkmark-circle', color: '#10b981' };
      default:
        return { icon: 'information-circle', color: '#3b82f6' };
    }
  };

  const { icon, color } = getIconAndColor();

  return (
    <Card backgroundColor={colors.surface} borderColor={colors.border} marginBottom="$3">
      <Card.Header>
        <Stack flexDirection="row" alignItems="center" space="$3">
          <Ionicons name={icon as any} size={24} color={color} />
          <Stack flex={1}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>{title}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{description}</Text>
          </Stack>
          {onDismiss && (
            <Button
              size="$2"
              circular
              onPress={onDismiss}
              backgroundColor="transparent"
            >
              <Ionicons name="close" size={16} color={colors.textSecondary} />
            </Button>
          )}
        </Stack>
      </Card.Header>
      {onAction && actionLabel && (
        <Card.Footer>
          <Button onPress={onAction} theme="blue" size="$3">
            {actionLabel}
          </Button>
        </Card.Footer>
      )}
    </Card>
  );
}