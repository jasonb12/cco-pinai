/**
 * Event Detail Sheet Component - Bottom sheet for event details and editing
 * Based on PRD-UI.md specifications for Calendar tab
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../contexts/ThemeContext';
import { CalendarEvent } from './AgendaView';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EventDetailSheetProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
  onDuplicate?: (event: CalendarEvent) => void;
  onMarkComplete?: (eventId: string) => void;
  onCancel?: (eventId: string) => void;
}

export default function EventDetailSheet({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onMarkComplete,
  onCancel
}: EventDetailSheetProps) {
  const colors = useThemeColors();
  const [activeTab, setActiveTab] = useState<'details' | 'attendees' | 'notes'>('details');
  
  const slideAnim = new Animated.Value(SCREEN_HEIGHT);

  React.useEffect(() => {
    if (isOpen) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: SCREEN_HEIGHT,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [isOpen]);

  if (!event) return null;

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

  const getStatusColor = (status: CalendarEvent['status']) => {
    switch (status) {
      case 'scheduled': return '#f59e0b';
      case 'confirmed': return '#10b981';
      case 'cancelled': return '#ef4444';
      case 'completed': return '#6b7280';
      default: return colors.textSecondary;
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

  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
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

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete?.(event.id);
            onClose();
          },
        },
      ]
    );
  };

  const handleMarkComplete = () => {
    onMarkComplete?.(event.id);
    onClose();
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Event',
      'Are you sure you want to cancel this event?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel Event',
          style: 'destructive',
          onPress: () => {
            onCancel?.(event.id);
            onClose();
          },
        },
      ]
    );
  };

  const renderDetailsTab = () => {
    const startDateTime = formatDateTime(event.start_time);
    const endDateTime = formatDateTime(event.end_time);
    const eventColor = event.color || getEventTypeColor(event.type);

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Event Header */}
        <View style={styles.eventHeader}>
          <View style={[styles.eventTypeIndicator, { backgroundColor: `${eventColor}20` }]}>
            <Ionicons
              name={getEventTypeIcon(event.type)}
              size={24}
              color={eventColor}
            />
          </View>
          <View style={styles.eventHeaderText}>
            <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
            <Text style={[styles.eventType, { color: eventColor }]}>
              {event.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(event.priority) }]}>
            <Ionicons name="flag-outline" size={12} color="#ffffff" />
            <Text style={styles.priorityText}>{event.priority.toUpperCase()}</Text>
          </View>
        </View>

        {/* Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Status</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(event.status)}20` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(event.status) }]}>
              {event.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
          </View>
        </View>

        {/* Time & Duration */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Time & Duration</Text>
          </View>
          
          <View style={styles.timeDetails}>
            <View style={styles.timeRow}>
              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Start:</Text>
              <View style={styles.timeValue}>
                <Text style={[styles.timeDate, { color: colors.text }]}>{startDateTime.date}</Text>
                <Text style={[styles.timeTime, { color: colors.text }]}>{startDateTime.time}</Text>
              </View>
            </View>
            
            <View style={styles.timeRow}>
              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>End:</Text>
              <View style={styles.timeValue}>
                <Text style={[styles.timeDate, { color: colors.text }]}>{endDateTime.date}</Text>
                <Text style={[styles.timeTime, { color: colors.text }]}>{endDateTime.time}</Text>
              </View>
            </View>
            
            <View style={styles.timeRow}>
              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Duration:</Text>
              <Text style={[styles.timeDuration, { color: colors.text }]}>
                {formatDuration(event.start_time, event.end_time)}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {event.description && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            </View>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {event.description}
            </Text>
          </View>
        )}

        {/* Location */}
        {event.location && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
            </View>
            <Text style={[styles.location, { color: colors.text }]}>{event.location}</Text>
          </View>
        )}

        {/* Recurrence */}
        {event.recurring && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="repeat-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recurrence</Text>
            </View>
            <Text style={[styles.recurrence, { color: colors.text }]}>Repeating Event</Text>
          </View>
        )}

        {/* Source */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="code-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Source</Text>
          </View>
          <View style={styles.sourceContainer}>
            <Ionicons
              name={event.source === 'ai_generated' ? 'sparkles-outline' : 
                   event.source === 'imported' ? 'download-outline' : 'person-outline'}
              size={14}
              color={colors.textSecondary}
            />
            <Text style={[styles.sourceText, { color: colors.textSecondary }]}>
              {event.source === 'ai_generated' ? 'AI Generated' :
               event.source === 'imported' ? 'Imported' : 'Manual Entry'}
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderAttendeesTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {event.attendees && event.attendees.length > 0 ? (
        <View style={styles.attendeesList}>
          {event.attendees.map((attendee, index) => (
            <View key={index} style={styles.attendeeItem}>
              <View style={styles.attendeeAvatar}>
                <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
              </View>
              <Text style={[styles.attendeeEmail, { color: colors.text }]}>{attendee}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
            No attendees for this event
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const renderNotesTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.emptyState}>
        <Ionicons name="document-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
          No additional notes for this event
        </Text>
      </View>
    </ScrollView>
  );

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: SCREEN_HEIGHT * 0.9,
      minHeight: SCREEN_HEIGHT * 0.6,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: 8,
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    tabContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 4,
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    inactiveTab: {
      backgroundColor: colors.surface,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
    },
    activeTabText: {
      color: '#ffffff',
    },
    inactiveTabText: {
      color: colors.textSecondary,
    },
    tabContent: {
      flex: 1,
      paddingHorizontal: 20,
    },
    eventHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      gap: 12,
    },
    eventTypeIndicator: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    eventHeaderText: {
      flex: 1,
    },
    eventTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 2,
    },
    eventType: {
      fontSize: 14,
      fontWeight: '500',
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
      fontSize: 10,
      fontWeight: '600',
      color: '#ffffff',
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
    },
    statusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    statusText: {
      fontSize: 14,
      fontWeight: '600',
    },
    timeDetails: {
      gap: 12,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    timeLabel: {
      fontSize: 14,
      fontWeight: '500',
      minWidth: 60,
    },
    timeValue: {
      flex: 1,
      alignItems: 'flex-end',
    },
    timeDate: {
      fontSize: 14,
      fontWeight: '500',
    },
    timeTime: {
      fontSize: 14,
      marginTop: 2,
    },
    timeDuration: {
      fontSize: 14,
      fontWeight: '500',
    },
    description: {
      fontSize: 14,
      lineHeight: 20,
    },
    location: {
      fontSize: 14,
      fontWeight: '500',
    },
    recurrence: {
      fontSize: 14,
      fontWeight: '500',
    },
    sourceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sourceText: {
      fontSize: 14,
      fontWeight: '500',
    },
    attendeesList: {
      gap: 12,
      paddingVertical: 16,
    },
    attendeeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 8,
    },
    attendeeAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    attendeeEmail: {
      fontSize: 14,
      fontWeight: '500',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyStateText: {
      fontSize: 16,
      fontWeight: '500',
      marginTop: 16,
      textAlign: 'center',
    },
    actions: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 12,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    primaryAction: {
      backgroundColor: colors.primary,
    },
    secondaryAction: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    destructiveAction: {
      backgroundColor: '#ef4444',
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    primaryActionText: {
      color: '#ffffff',
    },
    secondaryActionText: {
      color: colors.text,
    },
    destructiveActionText: {
      color: '#ffffff',
    },
  });

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Event Details</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'details' ? styles.activeTab : styles.inactiveTab]}
              onPress={() => setActiveTab('details')}
            >
              <Text style={[styles.tabText, activeTab === 'details' ? styles.activeTabText : styles.inactiveTabText]}>
                Details
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'attendees' ? styles.activeTab : styles.inactiveTab]}
              onPress={() => setActiveTab('attendees')}
            >
              <Text style={[styles.tabText, activeTab === 'attendees' ? styles.activeTabText : styles.inactiveTabText]}>
                Attendees
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'notes' ? styles.activeTab : styles.inactiveTab]}
              onPress={() => setActiveTab('notes')}
            >
              <Text style={[styles.tabText, activeTab === 'notes' ? styles.activeTabText : styles.inactiveTabText]}>
                Notes
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {activeTab === 'details' && renderDetailsTab()}
          {activeTab === 'attendees' && renderAttendeesTab()}
          {activeTab === 'notes' && renderNotesTab()}

          {/* Actions */}
          <View style={styles.actions}>
            {event.status === 'scheduled' && onMarkComplete && (
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryAction]}
                onPress={handleMarkComplete}
              >
                <Ionicons name="checkmark-outline" size={16} color="#ffffff" />
                <Text style={[styles.actionButtonText, styles.primaryActionText]}>
                  Complete
                </Text>
              </TouchableOpacity>
            )}
            
            {onEdit && (
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryAction]}
                onPress={() => {
                  onEdit(event);
                  onClose();
                }}
              >
                <Ionicons name="create-outline" size={16} color={colors.text} />
                <Text style={[styles.actionButtonText, styles.secondaryActionText]}>
                  Edit
                </Text>
              </TouchableOpacity>
            )}
            
            {event.status !== 'cancelled' && onCancel && (
              <TouchableOpacity
                style={[styles.actionButton, styles.destructiveAction]}
                onPress={handleCancel}
              >
                <Ionicons name="close-outline" size={16} color="#ffffff" />
                <Text style={[styles.actionButtonText, styles.destructiveActionText]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
} 