/**
 * Event Item Component - Individual calendar event display
 * Based on PRD-UI.md specifications for Calendar tab
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../contexts/ThemeContext';
import { CalendarEvent } from './AgendaView';

interface EventItemProps {
  event: CalendarEvent;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  compact?: boolean;
  showDate?: boolean;
}

export default function EventItem({
  event,
  onPress,
  onEdit,
  onDelete,
  compact = false,
  showDate = false
}: EventItemProps) {
  const colors = useThemeColors();

  const getEventTypeIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting': return 'people-outline';
      case 'task': return 'checkmark-circle-outline';
      case 'reminder': return 'alarm-outline';
      case 'call': return 'call-outline';
      case 'event': return 'calendar-outline';
      default: return 'ellipse-outline';
    }
  };

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting': return '#3b82f6';
      case 'task': return '#f59e0b';
      case 'reminder': return '#ef4444';
      case 'call': return '#10b981';
      case 'event': return '#8b5cf6';
      default: return colors.primary;
    }
  };

  const getPriorityColor = (priority: CalendarEvent['priority']) => {
    switch (priority) {
      case 'urgent': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#65a30d';
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: CalendarEvent['status']) => {
    switch (status) {
      case 'scheduled': return 'time-outline';
      case 'confirmed': return 'checkmark-circle-outline';
      case 'cancelled': return 'close-circle-outline';
      case 'completed': return 'checkmark-done-outline';
      default: return 'ellipse-outline';
    }
  };

  const getStatusColor = (status: CalendarEvent['status']) => {
    switch (status) {
      case 'scheduled': return '#f59e0b';
      case 'confirmed': return '#10b981';
      case 'cancelled': return '#ef4444';
      case 'completed': return '#6b7280';
      default: return colors.textSecondary;
    }
  };

  const formatTime = (startTime: string, endTime: string, allDay?: boolean) => {
    if (allDay) return 'All day';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    const startStr = start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    
    const endStr = end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    
    return `${startStr} - ${endStr}`;
  };

  const formatDate = (datetime: string) => {
    return new Date(datetime).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  const eventColor = event.color || getEventTypeColor(event.type);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: compact ? 8 : 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 4,
      borderLeftColor: eventColor,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
      overflow: 'hidden',
    },
    content: {
      padding: compact ? 12 : 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: compact ? 4 : 8,
    },
    titleContainer: {
      flex: 1,
      marginRight: 8,
    },
    title: {
      fontSize: compact ? 14 : 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    typeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: compact ? 2 : 4,
    },
    typeText: {
      fontSize: compact ? 10 : 12,
      fontWeight: '500',
      color: eventColor,
      textTransform: 'capitalize',
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statusText: {
      fontSize: compact ? 10 : 12,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: compact ? 4 : 8,
    },
    timeText: {
      fontSize: compact ? 12 : 14,
      fontWeight: '500',
      color: colors.text,
    },
    durationText: {
      fontSize: compact ? 10 : 12,
      color: colors.textSecondary,
    },
    dateText: {
      fontSize: compact ? 10 : 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    description: {
      fontSize: compact ? 12 : 14,
      color: colors.textSecondary,
      lineHeight: compact ? 16 : 20,
      marginBottom: compact ? 4 : 8,
    },
    metadataContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: compact ? 4 : 8,
    },
    metadataLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    metadataItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metadataText: {
      fontSize: compact ? 10 : 12,
      color: colors.textSecondary,
    },
    priorityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      gap: 2,
    },
    priorityText: {
      fontSize: compact ? 8 : 10,
      fontWeight: '600',
      color: '#ffffff',
      textTransform: 'uppercase',
    },
    actions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      padding: 6,
      borderRadius: 6,
      backgroundColor: colors.background,
    },
    recurringIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.border,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    recurringText: {
      fontSize: compact ? 8 : 10,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    sourceIndicator: {
      position: 'absolute',
      top: 8,
      right: 8,
      padding: 2,
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={compact ? 1 : 2}>
              {event.title}
            </Text>
            
            <View style={styles.typeContainer}>
              <Ionicons
                name={getEventTypeIcon(event.type)}
                size={compact ? 12 : 14}
                color={eventColor}
              />
              <Text style={styles.typeText}>{event.type}</Text>
              
              {event.recurring && (
                <View style={styles.recurringIndicator}>
                  <Ionicons name="repeat-outline" size={compact ? 8 : 10} color={colors.textSecondary} />
                  <Text style={styles.recurringText}>Recurring</Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.statusContainer}>
            <Ionicons
              name={getStatusIcon(event.status)}
              size={compact ? 12 : 14}
              color={getStatusColor(event.status)}
            />
            <Text style={[styles.statusText, { color: getStatusColor(event.status) }]}>
              {event.status}
            </Text>
          </View>
        </View>

        {/* Time */}
        <View style={styles.timeContainer}>
          <Ionicons name="time-outline" size={compact ? 12 : 14} color={colors.textSecondary} />
          <Text style={styles.timeText}>
            {formatTime(event.start_time, event.end_time, event.all_day)}
          </Text>
          <Text style={styles.durationText}>
            ({formatDuration(event.start_time, event.end_time)})
          </Text>
          
          {showDate && (
            <Text style={styles.dateText}>
              • {formatDate(event.start_time)}
            </Text>
          )}
        </View>

        {/* Description */}
        {event.description && !compact && (
          <Text style={styles.description} numberOfLines={2}>
            {event.description}
          </Text>
        )}

        {/* Metadata */}
        <View style={styles.metadataContainer}>
          <View style={styles.metadataLeft}>
            {event.location && (
              <View style={styles.metadataItem}>
                <Ionicons name="location-outline" size={compact ? 10 : 12} color={colors.textSecondary} />
                <Text style={styles.metadataText} numberOfLines={1}>
                  {event.location}
                </Text>
              </View>
            )}
            
            {event.attendees && event.attendees.length > 0 && (
              <View style={styles.metadataItem}>
                <Ionicons name="people-outline" size={compact ? 10 : 12} color={colors.textSecondary} />
                <Text style={styles.metadataText}>
                  {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            {/* Priority Badge */}
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(event.priority) }]}>
              <Ionicons name="flag-outline" size={compact ? 8 : 10} color="#ffffff" />
              <Text style={styles.priorityText}>{event.priority}</Text>
            </View>

            {/* Action Buttons */}
            {onEdit && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onEdit}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={compact ? 14 : 16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            
            {onDelete && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onDelete}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={compact ? 14 : 16} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Source Indicator */}
      {event.source === 'ai_generated' && (
        <View style={styles.sourceIndicator}>
          <Ionicons name="sparkles-outline" size={compact ? 12 : 14} color={colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
} 