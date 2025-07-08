/**
 * Quick Actions Component - Dashboard quick action buttons
 * Based on PRD-UI.md specifications for Dashboard QuickActions
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../contexts/ThemeContext';

export interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
  badge?: string | number;
}

interface QuickActionsProps {
  actions: QuickAction[];
  title?: string;
  horizontal?: boolean;
}

export default function QuickActions({ 
  actions, 
  title = 'Quick Actions',
  horizontal = true 
}: QuickActionsProps) {
  const colors = useThemeColors();

  const renderAction = (action: QuickAction) => (
    <TouchableOpacity
      key={action.id}
      style={[styles.actionButton, { borderColor: colors.border }]}
      onPress={action.onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${action.color}20` }]}>
        <Ionicons
          name={action.icon as any}
          size={24}
          color={action.color}
        />
        {action.badge && (
          <View style={[styles.badge, { backgroundColor: action.color }]}>
            <Text style={styles.badgeText}>
              {typeof action.badge === 'number' && action.badge > 99 ? '99+' : action.badge}
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.actionTitle, { color: colors.text }]} numberOfLines={2}>
        {action.title}
      </Text>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    actionsContainer: {
      gap: 12,
    },
    horizontalContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    verticalContainer: {
      flexDirection: 'column',
    },
    actionButton: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      minHeight: 100,
      flex: horizontal ? 1 : undefined,
      minWidth: horizontal ? 0 : undefined,
      maxWidth: horizontal ? '48%' : undefined,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      position: 'relative',
    },
    badge: {
      position: 'absolute',
      top: -4,
      right: -4,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#ffffff',
    },
    actionTitle: {
      fontSize: 12,
      fontWeight: '500',
      textAlign: 'center',
      lineHeight: 16,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      
      <View style={[
        styles.actionsContainer,
        horizontal ? styles.horizontalContainer : styles.verticalContainer
      ]}>
        {actions.map(renderAction)}
      </View>
    </View>
  );
} 