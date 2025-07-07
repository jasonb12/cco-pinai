/**
 * Filter Bar Component - Pending/Completed/All filter
 * Based on PRD-UI.md specifications
 */
import React from 'react';
import {
  XStack,
  Button,
  Text,
} from '@tamagui/core';

import { useThemeStore } from '../../stores/themeStore';

interface FilterBarProps {
  currentFilter: 'all' | 'pending' | 'completed';
  onFilterChange: (filter: 'all' | 'pending' | 'completed') => void;
  backgroundColor?: string;
}

export default function FilterBar({
  currentFilter,
  onFilterChange,
  backgroundColor,
}: FilterBarProps) {
  const { activeTheme } = useThemeStore();
  
  const filters = [
    { key: 'all' as const, label: 'All' },
    { key: 'pending' as const, label: 'Pending' },
    { key: 'completed' as const, label: 'Completed' },
  ];
  
  return (
    <XStack
      paddingHorizontal="$4"
      paddingVertical="$3"
      gap="$2"
      backgroundColor={backgroundColor}
      borderBottomWidth={1}
      borderBottomColor={activeTheme === 'dark' ? '#38383a' : '#dee2e6'}
    >
      {filters.map((filter) => (
        <Button
          key={filter.key}
          size="$3"
          variant={currentFilter === filter.key ? 'outlined' : 'ghost'}
          backgroundColor={
            currentFilter === filter.key
              ? activeTheme === 'dark'
                ? '$blue4'
                : '$blue2'
              : 'transparent'
          }
          borderColor={
            currentFilter === filter.key
              ? activeTheme === 'dark'
                ? '$blue8'
                : '$blue6'
              : 'transparent'
          }
          color={
            currentFilter === filter.key
              ? activeTheme === 'dark'
                ? '$blue11'
                : '$blue11'
              : '$color11'
          }
          onPress={() => onFilterChange(filter.key)}
          flex={1}
        >
          <Text
            fontSize="$3"
            fontWeight={currentFilter === filter.key ? '600' : '400'}
            color={
              currentFilter === filter.key
                ? activeTheme === 'dark'
                  ? '$blue11'
                  : '$blue11'
                : '$color11'
            }
          >
            {filter.label}
          </Text>
        </Button>
      ))}
    </XStack>
  );
}