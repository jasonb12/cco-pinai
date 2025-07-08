/**
 * Recent Activity Component - Dashboard activity timeline
 * Based on PRD-UI.md specifications for Dashboard RecentActivity
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../contexts/ThemeContext';
import { ActionType, ActionStatus } from '../../types/actions';

export interface ActivityItem {
  id: string;
  type: 'action_approved' | 'action_executed' | 'action_denied' | 'system_event' | 'user_action';
  title: string;
  description: string;
  timestamp: string;
  actionType?: ActionType;
  status?: ActionStatus;
  user?: string;
  onPress?: () => void;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  title?: string;
  maxItems?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

export default function RecentActivity({ 
  activities, 
  title = 'Recent Activity',
  maxItems = 10,
  showViewAll = true,
  onViewAll
}: RecentActivityProps) {
  const colors = useThemeColors();

  const getActivityIcon = (item: ActivityItem) => {
    switch (item.type) {
      case 'action_approved':
        return { icon: 'checkmark-circle-outline', color: '#10b981' };
      case 'action_executed':
        return { icon: 'play-circle-outline', color: '#3b82f6' };
      case 'action_denied':
        return { icon: 'close-circle-outline', color: '#ef4444' };
      case 'system_event':
        return { icon: 'settings-outline', color: '#6b7280' };
      case 'user_action':
        return { icon: 'person-outline', color: '#8b5cf6' };
      default:
        return { icon: 'ellipse-outline', color: colors.textSecondary };
    }
  };

  const getActionTypeIcon = (actionType?: ActionType) => {
    if (!actionType) return null;
    
    switch (actionType) {
      case ActionType.SCHEDULED_EVENT: return 'calendar-outline';
      case ActionType.EMAIL: return 'mail-outline';
      case ActionType.TASK: return 'checkmark-circle-outline';
      case ActionType.REMINDER: return 'alarm-outline';
      default: return 'cog-outline';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return time.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: time.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const renderActivityItem = (item: ActivityItem, index: number) => {
    const { icon, color } = getActivityIcon(item);
    const actionIcon = getActionTypeIcon(item.actionType);
    const isLast = index === Math.min(activities.length, maxItems) - 1;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.activityItem}
        onPress={item.onPress}
        activeOpacity={item.onPress ? 0.7 : 1}
        disabled={!item.onPress}
      >
        <View style={styles.timelineContainer}>
          <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon as any} size={16} color={color} />
          </View>
          {!isLast && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {item.title}
              </Text>
              {actionIcon && (
                <Ionicons 
                  name={actionIcon as any} 
                  size={12} 
                  color={colors.textSecondary}
                  style={styles.actionTypeIcon}
                />
              )}
            </View>
            <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
              {formatTimeAgo(item.timestamp)}
            </Text>
          </View>
          
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
          
          {item.user && (
            <Text style={[styles.user, { color: colors.textSecondary }]}>
              by {item.user}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const displayedActivities = activities.slice(0, maxItems);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    viewAllButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: colors.background,
    },
    viewAllText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.primary,
    },
    activitiesContainer: {
      gap: 0,
    },
    activityItem: {
      flexDirection: 'row',
      paddingVertical: 8,
    },
    timelineContainer: {
      alignItems: 'center',
      marginRight: 12,
      position: 'relative',
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },
    timelineLine: {
      position: 'absolute',
      top: 32,
      bottom: -8,
      width: 2,
      left: 15,
    },
    contentContainer: {
      flex: 1,
      paddingBottom: 8,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 8,
    },
    actionTypeIcon: {
      marginLeft: 6,
    },
    timestamp: {
      fontSize: 12,
      fontWeight: '500',
    },
    description: {
      fontSize: 14,
      lineHeight: 18,
      marginTop: 2,
    },
    user: {
      fontSize: 12,
      fontStyle: 'italic',
      marginTop: 4,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    emptyIcon: {
      marginBottom: 8,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 4,
    },
    emptyDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {showViewAll && onViewAll && activities.length > maxItems && (
          <TouchableOpacity style={styles.viewAllButton} onPress={onViewAll}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {displayedActivities.length > 0 ? (
        <ScrollView 
          style={styles.activitiesContainer}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {displayedActivities.map(renderActivityItem)}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons 
            name="time-outline" 
            size={48} 
            color={colors.textSecondary}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>No Recent Activity</Text>
          <Text style={styles.emptyDescription}>
            Recent actions and events will appear here
          </Text>
        </View>
      )}
    </View>
  );
} 