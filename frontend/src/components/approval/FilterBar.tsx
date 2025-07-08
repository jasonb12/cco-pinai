/**
 * Filter Bar Component - Filter approvals by type, priority, status
 * Based on PRD-UI.md specifications
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../contexts/ThemeContext';
import { ActionType, Priority, ActionStatus } from '../../types/actions';

interface FilterBarProps {
  onFilterChange: (filters: ApprovalFilters) => void;
  activeFilters: ApprovalFilters;
}

export interface ApprovalFilters {
  types: ActionType[];
  priorities: Priority[];
  statuses: ActionStatus[];
  searchQuery: string;
}

export default function FilterBar({ onFilterChange, activeFilters }: FilterBarProps) {
  const colors = useThemeColors();
  const [showFilters, setShowFilters] = useState(false);

  const actionTypes = Object.values(ActionType);
  const priorities = Object.values(Priority);
  const statuses = Object.values(ActionStatus);

  const getActiveFilterCount = () => {
    return (
      activeFilters.types.length +
      activeFilters.priorities.length +
      activeFilters.statuses.length +
      (activeFilters.searchQuery ? 1 : 0)
    );
  };

  const toggleFilter = (
    category: 'types' | 'priorities' | 'statuses',
    value: ActionType | Priority | ActionStatus
  ) => {
    const currentFilters = activeFilters[category] as any[];
    const newFilters = currentFilters.includes(value)
      ? currentFilters.filter(item => item !== value)
      : [...currentFilters, value];
    
    onFilterChange({
      ...activeFilters,
      [category]: newFilters,
    });
  };

  const clearAllFilters = () => {
    onFilterChange({
      types: [],
      priorities: [],
      statuses: [],
      searchQuery: '',
    });
  };

  const getActionTypeIcon = (actionType: ActionType) => {
    switch (actionType) {
      case ActionType.SINGLE_EVENT: return 'flash-outline';
      case ActionType.SCHEDULED_EVENT: return 'calendar-outline';
      case ActionType.RECURRING_EVENT: return 'repeat-outline';
      case ActionType.TASK: return 'checkmark-circle-outline';
      case ActionType.EMAIL: return 'mail-outline';
      case ActionType.CONTACT: return 'person-outline';
      case ActionType.REMINDER: return 'alarm-outline';
      case ActionType.CALL: return 'call-outline';
      case ActionType.DOCUMENT: return 'document-outline';
      default: return 'cog-outline';
    }
  };

  const getActionTypeColor = (actionType: ActionType) => {
    switch (actionType) {
      case ActionType.SINGLE_EVENT: return '#FF6B6B';
      case ActionType.SCHEDULED_EVENT: return '#3b82f6';
      case ActionType.RECURRING_EVENT: return '#8b5cf6';
      case ActionType.TASK: return '#f59e0b';
      case ActionType.EMAIL: return '#10b981';
      case ActionType.CONTACT: return '#06b6d4';
      case ActionType.REMINDER: return '#ef4444';
      case ActionType.CALL: return '#84cc16';
      case ActionType.DOCUMENT: return '#6366f1';
      default: return colors.textSecondary;
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.URGENT: return '#dc2626';
      case Priority.HIGH: return '#ea580c';
      case Priority.MEDIUM: return '#d97706';
      case Priority.LOW: return '#65a30d';
      default: return colors.textSecondary;
    }
  };

  const getStatusColor = (status: ActionStatus) => {
    switch (status) {
      case ActionStatus.PENDING: return '#f59e0b';
      case ActionStatus.APPROVED: return '#10b981';
      case ActionStatus.DENIED: return '#ef4444';
      case ActionStatus.EXECUTED: return '#6366f1';
      case ActionStatus.FAILED: return '#dc2626';
      case ActionStatus.CANCELLED: return '#6b7280';
      default: return colors.textSecondary;
    }
  };

  const formatLabel = (value: string) => {
    return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderFilterChip = (
    label: string,
    isActive: boolean,
    onPress: () => void,
    color?: string,
    icon?: string
  ) => (
    <TouchableOpacity
      key={label}
      style={[
        styles.filterChip,
        {
          backgroundColor: isActive ? (color || colors.primary) : colors.surface,
          borderColor: isActive ? (color || colors.primary) : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && (
        <Ionicons
          name={icon as any}
          size={14}
          color={isActive ? '#ffffff' : (color || colors.textSecondary)}
        />
      )}
      <Text
        style={[
          styles.filterChipText,
          {
            color: isActive ? '#ffffff' : colors.text,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    filterToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    filterToggleText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    filterCount: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    filterCountText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#ffffff',
    },
    clearButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.border,
    },
    clearButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    filtersContainer: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    filterSection: {
      marginBottom: 16,
    },
    filterSectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    filterChipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
  });

  const styles = StyleSheet.create({
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      gap: 6,
    },
    filterChipText: {
      fontSize: 12,
      fontWeight: '500',
    },
  });

  return (
    <View style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <View style={dynamicStyles.headerLeft}>
          <TouchableOpacity
            style={dynamicStyles.filterToggle}
            onPress={() => setShowFilters(!showFilters)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showFilters ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.text}
            />
            <Text style={dynamicStyles.filterToggleText}>Filters</Text>
            {getActiveFilterCount() > 0 && (
              <View style={dynamicStyles.filterCount}>
                <Text style={dynamicStyles.filterCountText}>
                  {getActiveFilterCount()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {getActiveFilterCount() > 0 && (
          <TouchableOpacity
            style={dynamicStyles.clearButton}
            onPress={clearAllFilters}
            activeOpacity={0.7}
          >
            <Text style={dynamicStyles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={dynamicStyles.filtersContainer}>
          {/* Action Types */}
          <View style={dynamicStyles.filterSection}>
            <Text style={dynamicStyles.filterSectionTitle}>Action Types</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={dynamicStyles.filterChipsContainer}
            >
              {actionTypes.map(type => (
                renderFilterChip(
                  formatLabel(type),
                  activeFilters.types.includes(type),
                  () => toggleFilter('types', type),
                  getActionTypeColor(type),
                  getActionTypeIcon(type)
                )
              ))}
            </ScrollView>
          </View>

          {/* Priorities */}
          <View style={dynamicStyles.filterSection}>
            <Text style={dynamicStyles.filterSectionTitle}>Priority</Text>
            <View style={dynamicStyles.filterChipsContainer}>
              {priorities.map(priority => (
                renderFilterChip(
                  formatLabel(priority),
                  activeFilters.priorities.includes(priority),
                  () => toggleFilter('priorities', priority),
                  getPriorityColor(priority),
                  'flag-outline'
                )
              ))}
            </View>
          </View>

          {/* Status */}
          <View style={dynamicStyles.filterSection}>
            <Text style={dynamicStyles.filterSectionTitle}>Status</Text>
            <View style={dynamicStyles.filterChipsContainer}>
              {statuses.map(status => (
                renderFilterChip(
                  formatLabel(status),
                  activeFilters.statuses.includes(status),
                  () => toggleFilter('statuses', status),
                  getStatusColor(status),
                  status === ActionStatus.PENDING ? 'time-outline' :
                  status === ActionStatus.APPROVED ? 'checkmark-circle-outline' :
                  status === ActionStatus.DENIED ? 'close-circle-outline' :
                  status === ActionStatus.EXECUTED ? 'play-circle-outline' :
                  status === ActionStatus.FAILED ? 'warning-outline' :
                  'stop-circle-outline'
                )
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}