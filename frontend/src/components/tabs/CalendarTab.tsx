/**
 * Enhanced Calendar Tab - Complete calendar interface with AI features
 * Integrated with advanced CalendarService and AI suggestions
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../contexts/ThemeContext';
import AgendaView, { CalendarEvent } from '../calendar/AgendaView';
import EventDetailSheet from '../calendar/EventDetailSheet';
import NewEventForm from '../calendar/NewEventForm';
import AIEventSuggestions from '../calendar/AIEventSuggestions';
import { calendarService, CalendarStats } from '../../services/calendarService';
import { googleCalendarService, CalendarConnectionStatus, CalendarSyncResult } from '../../services/googleCalendar';

export default function CalendarTab() {
  const colors = useThemeColors();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [currentView, setCurrentView] = useState<'week' | 'month'>('week');
  const [stats, setStats] = useState<CalendarStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Google Calendar Integration State
  const [googleConnectionStatus, setGoogleConnectionStatus] = useState<CalendarConnectionStatus | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<CalendarSyncResult | null>(null);
  const [showGoogleCalendarSheet, setShowGoogleCalendarSheet] = useState(false);

  // Initialize calendar service and load events
  useEffect(() => {
    const initializeCalendar = async () => {
      try {
        setIsLoading(true);
        
        // Load existing events from service
        const existingEvents = calendarService.getEvents();
        setEvents(existingEvents);
        
        // If no events exist, create some sample events
        if (existingEvents.length === 0) {
          await createSampleEvents();
        }
        
        // Get calendar statistics
        const calendarStats = calendarService.getCalendarStats();
        setStats(calendarStats);
        
        // Check Google Calendar connection status
        await checkGoogleCalendarConnection();
        
      } catch (error) {
        console.error('Error initializing calendar:', error);
        Alert.alert('Error', 'Failed to load calendar data');
      } finally {
        setIsLoading(false);
      }
    };

    initializeCalendar();

    // Listen for calendar events changes
    const unsubscribe = calendarService.onEventsChange((updatedEvents) => {
      setEvents(updatedEvents);
      setStats(calendarService.getCalendarStats());
    });

    return () => unsubscribe();
  }, []);

  // Check Google Calendar connection status
  const checkGoogleCalendarConnection = async () => {
    try {
      const result = await googleCalendarService.getConnectionStatus();
      if (result.success && result.data) {
        setGoogleConnectionStatus(result.data);
      }
    } catch (error) {
      console.error('Error checking Google Calendar connection:', error);
    }
  };

  // Connect to Google Calendar
  const handleConnectGoogleCalendar = async () => {
    try {
      setIsConnecting(true);
      
      // In a real app, this would initiate OAuth flow
      Alert.alert(
        'Google Calendar Integration',
        'This would initiate the Google OAuth flow to connect your Google Calendar. The integration includes:\n\n• Import Google Calendar events\n• Export CCOPINAI events to Google\n• Bidirectional sync\n• Conflict resolution\n• Task synchronization',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Connect', 
            onPress: async () => {
              // Simulate successful connection for demo
              setGoogleConnectionStatus({
                connected: true,
                provider: 'google',
                connected_at: new Date().toISOString(),
                sync_stats: {
                  provider: 'google',
                  calendar_id: 'primary',
                  full_sync_completed: true,
                  incremental_sync_enabled: true,
                  sync_interval_minutes: 15,
                  error_count: 0,
                  events_imported: 0,
                  events_exported: 0,
                  conflicts_detected: 0,
                }
              });
              Alert.alert('Success', 'Google Calendar connected successfully!');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error connecting Google Calendar:', error);
      Alert.alert('Error', 'Failed to connect Google Calendar');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect Google Calendar
  const handleDisconnectGoogleCalendar = async () => {
    try {
      Alert.alert(
        'Disconnect Google Calendar',
        'Are you sure you want to disconnect Google Calendar? This will:\n\n• Stop syncing events\n• Remove Google Calendar events from your view\n• Revoke access tokens',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Disconnect', 
            style: 'destructive',
            onPress: async () => {
              const result = await googleCalendarService.disconnectGoogleCalendar();
              if (result.success) {
                setGoogleConnectionStatus(null);
                Alert.alert('Success', 'Google Calendar disconnected successfully');
              } else {
                Alert.alert('Error', result.error || 'Failed to disconnect Google Calendar');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      Alert.alert('Error', 'Failed to disconnect Google Calendar');
    }
  };

  // Sync Google Calendar
  const handleSyncGoogleCalendar = async (forceFullSync: boolean = false) => {
    try {
      setIsSyncing(true);
      
      const result = await googleCalendarService.syncCalendar(forceFullSync);
      if (result.success && result.data) {
        setLastSyncResult(result.data);
        
        // Update connection status to reflect new sync stats
        await checkGoogleCalendarConnection();
        
        const { google } = result.data.results;
        Alert.alert(
          'Sync Complete',
          `Imported: ${google.imported} events\nExported: ${google.exported} events\nConflicts: ${result.data.results.conflicts.length}`
        );
      } else {
        Alert.alert('Sync Failed', result.error || 'Failed to sync Google Calendar');
      }
    } catch (error) {
      console.error('Error syncing Google Calendar:', error);
      Alert.alert('Error', 'Failed to sync Google Calendar');
    } finally {
      setIsSyncing(false);
    }
  };

  // Create sample events if none exist
  const createSampleEvents = async () => {
    const sampleEvents = [
      {
        title: 'Team Meeting with Sarah',
        description: 'Discuss quarterly goals and project timeline',
        start_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        end_time: new Date(Date.now() + 86400000 + 3600000).toISOString(), // Tomorrow + 1 hour
        location: 'Conference Room A',
        attendees: ['sarah@company.com', 'john@company.com'],
        type: 'meeting' as const,
        priority: 'high' as const,
        color: '#3b82f6',
      },
      {
        title: 'Client Call - Budget Review',
        description: 'Review marketing budget allocation with client',
        start_time: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
        end_time: new Date(Date.now() + 172800000 + 1800000).toISOString(), // Day after tomorrow + 30 mins
        type: 'call' as const,
        priority: 'urgent' as const,
        color: '#10b981',
      },
      {
        title: 'Weekly Team Standup',
        description: 'Weekly team standup meeting',
        start_time: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
        end_time: new Date(Date.now() + 259200000 + 1800000).toISOString(), // 3 days from now + 30 mins
        location: 'Main Conference Room',
        type: 'meeting' as const,
        priority: 'medium' as const,
        color: '#8b5cf6',
        recurring: true,
      },
      {
        title: 'Complete Marketing Analysis',
        description: 'Finish the marketing analysis report for Q1',
        start_time: new Date(Date.now() + 345600000).toISOString(), // 4 days from now
        end_time: new Date(Date.now() + 345600000 + 7200000).toISOString(), // 4 days from now + 2 hours
        type: 'task' as const,
        priority: 'high' as const,
        color: '#f59e0b',
      },
    ];

    // Create events using calendar service
    for (const eventData of sampleEvents) {
      await calendarService.createEvent(eventData);
    }
  };

  const handleEventPress = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
  };

  const handleDatePress = (date: string) => {
    setSelectedDate(date);
    console.log('Date selected:', date);
  };

  const handleAddEvent = (date?: string) => {
    setSelectedDate(date);
    setEditingEvent(null);
    setShowNewEventForm(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setShowEventDetail(false);
    setShowNewEventForm(true);
  };

  const handleSaveEvent = async (eventData: Partial<CalendarEvent>) => {
    try {
      if (editingEvent) {
        // Update existing event using calendar service
        await calendarService.updateEvent(editingEvent.id, eventData);
      } else {
        // Create new event using calendar service
        await calendarService.createEvent({
          ...eventData,
          start_time: eventData.start_time || selectedDate || new Date().toISOString(),
          end_time: eventData.end_time || new Date(Date.now() + 3600000).toISOString(),
        });
      }
      setShowNewEventForm(false);
      setEditingEvent(null);
      setSelectedDate(undefined);
    } catch (error) {
      console.error('Error saving event:', error);
      Alert.alert('Error', 'Failed to save event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await calendarService.deleteEvent(eventId);
      setShowEventDetail(false);
    } catch (error) {
      console.error('Error deleting event:', error);
      Alert.alert('Error', 'Failed to delete event');
    }
  };

  const handleMarkComplete = async (eventId: string) => {
    try {
      await calendarService.updateEvent(eventId, { status: 'completed' });
      setShowEventDetail(false);
    } catch (error) {
      console.error('Error updating event:', error);
      Alert.alert('Error', 'Failed to update event');
    }
  };

  const handleCancelEvent = async (eventId: string) => {
    try {
      await calendarService.updateEvent(eventId, { status: 'cancelled' });
      setShowEventDetail(false);
    } catch (error) {
      console.error('Error cancelling event:', error);
      Alert.alert('Error', 'Failed to cancel event');
    }
  };

  const handleDuplicateEvent = async (event: CalendarEvent) => {
    try {
      await calendarService.createEvent({
        ...event,
        title: `${event.title} (Copy)`,
        status: 'scheduled',
        source: 'manual',
      });
      setShowEventDetail(false);
    } catch (error) {
      console.error('Error duplicating event:', error);
      Alert.alert('Error', 'Failed to duplicate event');
    }
  };

  const handleShowAISuggestions = () => {
    setShowAISuggestions(true);
  };

  const handleAIEventCreated = (event: CalendarEvent) => {
    // Event is automatically added to calendar via service
    Alert.alert('Success', `Event "${event.title}" has been added to your calendar!`);
  };

  const getUpcomingEventsCount = () => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate >= now && eventDate <= nextWeek && event.status !== 'cancelled';
    }).length;
  };

  const getPendingEventsCount = () => {
    return events.filter(event => event.status === 'scheduled').length;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flex: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    headerButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    aiButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
    },
    aiButtonText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '600',
    },
    addButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.primary,
    },
    statsBar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    statItem: {
      alignItems: 'center',
      gap: 4,
    },
    statNumber: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    statLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '500',
      textTransform: 'uppercase',
    },
    enhancedStatsBar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    productivityStat: {
      alignItems: 'center',
      gap: 4,
    },
    productivityNumber: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
    },
    viewToggle: {
      flexDirection: 'row',
      backgroundColor: colors.border,
      borderRadius: 8,
      padding: 2,
      marginHorizontal: 20,
      marginVertical: 12,
    },
    viewToggleButton: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 6,
    },
    activeViewToggle: {
      backgroundColor: colors.primary,
    },
    viewToggleText: {
      fontSize: 14,
      fontWeight: '500',
    },
    activeViewToggleText: {
      color: '#ffffff',
    },
    inactiveViewToggleText: {
      color: colors.textSecondary,
    },
    agendaContainer: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 12,
    },
    // Google Calendar Integration Styles
    googleCalendarPanel: {
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    googleCalendarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    googleCalendarTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    googleCalendarTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    connectedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#dcfce7',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    connectedBadgeText: {
      fontSize: 11,
      fontWeight: '500',
      color: '#166534',
    },
    googleCalendarActions: {
      flexDirection: 'row',
      gap: 8,
    },
    connectButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#4285f4',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    connectButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#ffffff',
    },
    syncButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    syncButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#ffffff',
    },
    settingsButton: {
      padding: 6,
      borderRadius: 6,
      backgroundColor: colors.background,
    },
    disabledButton: {
      opacity: 0.6,
    },
    disabledButtonText: {
      color: colors.textSecondary,
    },
    syncStatsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    syncStat: {
      alignItems: 'center',
      gap: 2,
    },
    syncStatNumber: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    syncStatLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: '500',
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="calendar-outline" size={48} color={colors.primary} />
          <Text style={styles.loadingText}>Loading Calendar...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Smart Calendar</Text>
          <Text style={styles.subtitle}>
            {getPendingEventsCount()} pending • {getUpcomingEventsCount()} this week
            {stats && ` • ${stats.productivityScore}% productive`}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => console.log('Search events')}
            activeOpacity={0.7}
          >
            <Ionicons name="search-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.aiButton}
            onPress={handleShowAISuggestions}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles-outline" size={16} color="#ffffff" />
            <Text style={styles.aiButtonText}>AI</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddEvent()}
            activeOpacity={0.8}
          >
            <Ionicons name="add-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Google Calendar Integration Panel */}
      <View style={styles.googleCalendarPanel}>
        <View style={styles.googleCalendarHeader}>
          <View style={styles.googleCalendarTitleContainer}>
            <Ionicons name="logo-google" size={20} color="#4285f4" />
            <Text style={styles.googleCalendarTitle}>Google Calendar</Text>
            {googleConnectionStatus?.connected && (
              <View style={styles.connectedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.connectedBadgeText}>Connected</Text>
              </View>
            )}
          </View>
          
          <View style={styles.googleCalendarActions}>
            {googleConnectionStatus?.connected ? (
              <>
                <TouchableOpacity
                  style={[styles.syncButton, isSyncing && styles.disabledButton]}
                  onPress={() => handleSyncGoogleCalendar(false)}
                  disabled={isSyncing}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={isSyncing ? "sync-outline" : "refresh-outline"} 
                    size={16} 
                    color={isSyncing ? colors.textSecondary : "#ffffff"} 
                  />
                  <Text style={[styles.syncButtonText, isSyncing && styles.disabledButtonText]}>
                    {isSyncing ? 'Syncing...' : 'Sync'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.settingsButton}
                  onPress={() => setShowGoogleCalendarSheet(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="settings-outline" size={16} color={colors.text} />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.connectButton, isConnecting && styles.disabledButton]}
                onPress={handleConnectGoogleCalendar}
                disabled={isConnecting}
                activeOpacity={0.8}
              >
                <Ionicons name="link-outline" size={16} color="#ffffff" />
                <Text style={styles.connectButtonText}>
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {googleConnectionStatus?.connected && googleConnectionStatus.sync_stats && (
          <View style={styles.syncStatsContainer}>
            <View style={styles.syncStat}>
              <Text style={styles.syncStatNumber}>
                {googleConnectionStatus.sync_stats.events_imported}
              </Text>
              <Text style={styles.syncStatLabel}>Imported</Text>
            </View>
            <View style={styles.syncStat}>
              <Text style={styles.syncStatNumber}>
                {googleConnectionStatus.sync_stats.events_exported}
              </Text>
              <Text style={styles.syncStatLabel}>Exported</Text>
            </View>
            <View style={styles.syncStat}>
              <Text style={[styles.syncStatNumber, { color: googleConnectionStatus.sync_stats.conflicts_detected > 0 ? '#ef4444' : '#10b981' }]}>
                {googleConnectionStatus.sync_stats.conflicts_detected}
              </Text>
              <Text style={styles.syncStatLabel}>Conflicts</Text>
            </View>
            <View style={styles.syncStat}>
              <Text style={styles.syncStatNumber}>
                {googleConnectionStatus.sync_stats.sync_interval_minutes}m
              </Text>
              <Text style={styles.syncStatLabel}>Interval</Text>
            </View>
          </View>
        )}
      </View>

      {/* Enhanced Stats Bar */}
      <View style={styles.enhancedStatsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{events.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#f59e0b' }]}>
            {events.filter(e => e.status === 'scheduled').length}
          </Text>
          <Text style={styles.statLabel}>Scheduled</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>
            {events.filter(e => e.status === 'completed').length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#8b5cf6' }]}>
            {events.filter(e => e.source === 'ai_generated').length}
          </Text>
          <Text style={styles.statLabel}>AI Generated</Text>
        </View>
        {stats && (
          <View style={styles.productivityStat}>
            <Text style={styles.productivityNumber}>{stats.productivityScore}%</Text>
            <Text style={styles.statLabel}>Productive</Text>
          </View>
        )}
      </View>

      {/* View Toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[
            styles.viewToggleButton,
            currentView === 'week' && styles.activeViewToggle,
          ]}
          onPress={() => setCurrentView('week')}
        >
          <Text
            style={[
              styles.viewToggleText,
              currentView === 'week' ? styles.activeViewToggleText : styles.inactiveViewToggleText,
            ]}
          >
            Week View
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.viewToggleButton,
            currentView === 'month' && styles.activeViewToggle,
          ]}
          onPress={() => setCurrentView('month')}
        >
          <Text
            style={[
              styles.viewToggleText,
              currentView === 'month' ? styles.activeViewToggleText : styles.inactiveViewToggleText,
            ]}
          >
            Month View
          </Text>
        </TouchableOpacity>
      </View>

      {/* Agenda View */}
      <View style={styles.agendaContainer}>
        <AgendaView
          events={events}
          onEventPress={handleEventPress}
          onDatePress={handleDatePress}
          onAddEvent={handleAddEvent}
          initialView={currentView}
          selectedDate={selectedDate}
        />
      </View>

      {/* Event Detail Sheet */}
      <EventDetailSheet
        event={selectedEvent}
        isOpen={showEventDetail}
        onClose={() => setShowEventDetail(false)}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        onDuplicate={handleDuplicateEvent}
        onMarkComplete={handleMarkComplete}
        onCancel={handleCancelEvent}
      />

      {/* New Event Form */}
      <NewEventForm
        isOpen={showNewEventForm}
        onClose={() => setShowNewEventForm(false)}
        onSave={handleSaveEvent}
        editingEvent={editingEvent}
        initialDate={selectedDate}
      />

      {/* AI Event Suggestions */}
      <AIEventSuggestions
        isOpen={showAISuggestions}
        onClose={() => setShowAISuggestions(false)}
        onEventCreated={handleAIEventCreated}
        transcriptContent="Sample transcript: Let's schedule a meeting to discuss the quarterly budget review. We should also call the insurance company about policy renewal next week."
      />
    </View>
  );
}