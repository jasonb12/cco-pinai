/**
 * Approval Card Component - Accept/Deny swipe actions
 * Based on PRD-UI.md specifications for approval queue
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../contexts/ThemeContext';
import { MCPAction, ActionType, Priority } from '../../types/actions';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface ApprovalCardProps {
  action: MCPAction;
  onPress: () => void;
  onApprove: () => void;
  onDeny: () => void;
}

export default function ApprovalCard({ action, onPress, onApprove, onDeny }: ApprovalCardProps) {
  const colors = useThemeColors();
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  
  const translateX = new Animated.Value(0);
  const scale = new Animated.Value(1);
  const opacity = new Animated.Value(1);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 50;
    },
    onPanResponderGrant: () => {
      Animated.spring(scale, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    },
    onPanResponderMove: (_, gestureState) => {
      translateX.setValue(gestureState.dx);
      
      // Update swipe direction
      if (gestureState.dx > 50) {
        setSwipeDirection('right'); // Approve
      } else if (gestureState.dx < -50) {
        setSwipeDirection('left'); // Deny
      } else {
        setSwipeDirection(null);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      const { dx } = gestureState;
      
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();

      if (dx > SWIPE_THRESHOLD) {
        // Swipe right - Approve
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onApprove();
        });
      } else if (dx < -SWIPE_THRESHOLD) {
        // Swipe left - Deny
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onDeny();
        });
      } else {
        // Snap back
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
        setSwipeDirection(null);
      }
    },
  });

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

  const formatActionType = (actionType: ActionType) => {
    return actionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const renderActionDetails = () => {
    switch (action.type) {
      case ActionType.SCHEDULED_EVENT:
        const scheduledAction = action as any;
        return (
          <Text style={[styles.actionDetails, { color: colors.textSecondary }]}>
            📅 {scheduledAction.event_details?.start_date} at {scheduledAction.event_details?.start_time}
          </Text>
        );
      
      case ActionType.RECURRING_EVENT:
        const recurringAction = action as any;
        return (
          <Text style={[styles.actionDetails, { color: colors.textSecondary }]}>
            🔄 {recurringAction.recurrence?.pattern} • Starts {recurringAction.event_details?.start_date}
          </Text>
        );
      
      case ActionType.TASK:
        const taskAction = action as any;
        return (
          <Text style={[styles.actionDetails, { color: colors.textSecondary }]}>
            {taskAction.task_details?.due_date ? `📅 Due: ${taskAction.task_details.due_date}` : '📝 Task'}
          </Text>
        );
      
      case ActionType.EMAIL:
        const emailAction = action as any;
        return (
          <Text style={[styles.actionDetails, { color: colors.textSecondary }]}>
            📧 To: {emailAction.email_details?.to?.join(', ') || 'Recipients TBD'}
          </Text>
        );
      
      default:
        return null;
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginHorizontal: 16,
      marginVertical: 8,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      overflow: 'hidden',
    },
    backgroundActions: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
    },
    leftAction: {
      flex: 1,
      backgroundColor: '#ef4444',
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingRight: 20,
    },
    rightAction: {
      flex: 1,
      backgroundColor: '#10b981',
      justifyContent: 'center',
      alignItems: 'flex-start',
      paddingLeft: 20,
    },
    actionIcon: {
      color: '#ffffff',
    },
    actionText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
      marginTop: 4,
    },
    cardContent: {
      backgroundColor: colors.surface,
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    typeIcon: {
      marginRight: 12,
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    badges: {
      flexDirection: 'row',
      gap: 8,
    },
    typeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: colors.border,
    },
    typeBadgeText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    priorityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      gap: 4,
    },
    priorityText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#ffffff',
    },
    description: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      marginBottom: 8,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    confidence: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    confidenceText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    timeAgo: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    swipeHint: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 8,
      opacity: 0.7,
    },
  });

  const styles = StyleSheet.create({
    actionDetails: {
      fontSize: 13,
      marginBottom: 4,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      {/* Background Actions */}
      <View style={dynamicStyles.backgroundActions}>
        <View style={dynamicStyles.leftAction}>
          <Ionicons name="close-outline" size={24} style={dynamicStyles.actionIcon} />
          <Text style={dynamicStyles.actionText}>Deny</Text>
        </View>
        <View style={dynamicStyles.rightAction}>
          <Ionicons name="checkmark-outline" size={24} style={dynamicStyles.actionIcon} />
          <Text style={dynamicStyles.actionText}>Approve</Text>
        </View>
      </View>

      {/* Card Content */}
      <Animated.View
        style={[
          dynamicStyles.cardContent,
          {
            transform: [
              { translateX },
              { scale },
            ],
            opacity,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          <View style={dynamicStyles.header}>
            <Ionicons
              name={getActionTypeIcon(action.type)}
              size={20}
              color={getActionTypeColor(action.type)}
              style={dynamicStyles.typeIcon}
            />
            <View style={dynamicStyles.titleContainer}>
              <Text style={dynamicStyles.title}>{action.title}</Text>
              <Text style={dynamicStyles.subtitle}>{formatActionType(action.type)}</Text>
            </View>
            <View style={dynamicStyles.badges}>
              <View style={[dynamicStyles.priorityBadge, { backgroundColor: getPriorityColor(action.priority) }]}>
                <Ionicons name="flag-outline" size={12} color="#ffffff" />
                <Text style={dynamicStyles.priorityText}>{action.priority}</Text>
              </View>
            </View>
          </View>

          <Text style={dynamicStyles.description} numberOfLines={2}>
            {action.description}
          </Text>

          {renderActionDetails()}

          <View style={dynamicStyles.footer}>
            <View style={dynamicStyles.confidence}>
              <Ionicons name="analytics-outline" size={14} color={colors.textSecondary} />
              <Text style={dynamicStyles.confidenceText}>
                {(action.confidence * 100).toFixed(0)}% confidence
              </Text>
            </View>
            <Text style={dynamicStyles.timeAgo}>
              {getTimeAgo(action.created_at)}
            </Text>
          </View>

          {swipeDirection && (
            <Text style={[
              dynamicStyles.swipeHint,
              { color: swipeDirection === 'right' ? '#10b981' : '#ef4444' }
            ]}>
              {swipeDirection === 'right' ? '👉 Release to approve' : '👈 Release to deny'}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}