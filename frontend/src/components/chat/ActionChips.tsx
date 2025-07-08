/**
 * Action Chips Component - Quick action buttons for chat
 * Based on PRD-UI.md specifications for Chat tab
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
import { ActionType } from '../../types/actions';

export interface ActionChip {
  id: string;
  title: string;
  icon: string;
  type: ActionType;
  count?: number;
  color: string;
  onPress: () => void;
}

interface ActionChipsProps {
  chips: ActionChip[];
  title?: string;
  horizontal?: boolean;
  showCount?: boolean;
}

export default function ActionChips({
  chips,
  title = 'Quick Actions',
  horizontal = true,
  showCount = true
}: ActionChipsProps) {
  const colors = useThemeColors();

  const renderChip = (chip: ActionChip) => (
    <TouchableOpacity
      key={chip.id}
      style={[
        styles.chip,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      onPress={chip.onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${chip.color}20` }]}>
        <Ionicons
          name={chip.icon as any}
          size={16}
          color={chip.color}
        />
        {showCount && chip.count && chip.count > 0 && (
          <View style={[styles.badge, { backgroundColor: chip.color }]}>
            <Text style={styles.badgeText}>
              {chip.count > 99 ? '99+' : chip.count}
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.chipText, { color: colors.text }]} numberOfLines={1}>
        {chip.title}
      </Text>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      paddingVertical: 8,
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
      paddingHorizontal: 16,
    },
    chipsContainer: {
      paddingHorizontal: horizontal ? 16 : 0,
    },
    horizontalContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    verticalContainer: {
      flexDirection: 'column',
      gap: 8,
      paddingHorizontal: 16,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      gap: 8,
      minWidth: horizontal ? 120 : undefined,
    },
    iconContainer: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    badge: {
      position: 'absolute',
      top: -6,
      right: -6,
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    badgeText: {
      fontSize: 8,
      fontWeight: '600',
      color: '#ffffff',
    },
    chipText: {
      fontSize: 12,
      fontWeight: '500',
      flex: 1,
    },
  });

  if (chips.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {title && (
        <Text style={styles.title}>{title}</Text>
      )}
      
      {horizontal ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
        >
          <View style={styles.horizontalContainer}>
            {chips.map(renderChip)}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.verticalContainer}>
          {chips.map(renderChip)}
        </View>
      )}
    </View>
  );
} 