/**
 * Agenda View Component - Calendar with week/month view switching
 * Based on PRD-UI.md specifications for Calendar tab
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../contexts/ThemeContext';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string; // ISO datetime
  end_time: string;   // ISO datetime
  location?: string;
  attendees?: string[];
  type: 'meeting' | 'task' | 'reminder' | 'call' | 'event';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  color?: string;
  all_day?: boolean;
  recurring?: boolean;
  source: 'manual' | 'ai_generated' | 'imported' | 'recurring';
}

interface AgendaViewProps {
  events: CalendarEvent[];
  onEventPress: (event: CalendarEvent) => void;
  onDatePress?: (date: string) => void;
  onAddEvent?: (date: string) => void;
  initialView?: 'week' | 'month';
  selectedDate?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AgendaView({
  events,
  onEventPress,
  onDatePress,
  onAddEvent,
  initialView = 'week',
  selectedDate
}: AgendaViewProps) {
  const colors = useThemeColors();
  const [currentView, setCurrentView] = useState<'week' | 'month'>(initialView);
  const [currentDate, setCurrentDate] = useState(new Date(selectedDate || new Date()));

  // Helper functions for date calculations
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const getMonthStart = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  const getMonthEnd = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };

  const getDaysInView = () => {
    if (currentView === 'week') {
      const start = getWeekStart(currentDate);
      const days = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        days.push(day);
      }
      return days;
    } else {
      const start = getMonthStart(currentDate);
      const end = getMonthEnd(currentDate);
      const days = [];
      
      // Add days from previous month to fill first week
      const firstDayOfWeek = start.getDay();
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const day = new Date(start);
        day.setDate(start.getDate() - i - 1);
        days.push(day);
      }
      
      // Add all days of current month
      for (let i = 1; i <= end.getDate(); i++) {
        const day = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
        days.push(day);
      }
      
      // Add days from next month to fill last week
      const totalCells = Math.ceil(days.length / 7) * 7;
      const remainingCells = totalCells - days.length;
      for (let i = 1; i <= remainingCells; i++) {
        const day = new Date(end);
        day.setDate(end.getDate() + i);
        days.push(day);
      }
      
      return days;
    }
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.start_time).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
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

  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDateHeader = () => {
    if (currentView === 'week') {
      const start = getWeekStart(currentDate);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      
      if (start.getMonth() === end.getMonth()) {
        return `${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
      } else {
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${start.getFullYear()}`;
      }
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'week') {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setMonth(currentDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'week') {
      newDate.setDate(currentDate.getDate() + 7);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const renderWeekView = () => {
    const days = getDaysInView();
    
    return (
      <View style={styles.weekContainer}>
        {/* Week Header */}
        <View style={styles.weekHeader}>
          {days.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.weekDayHeader,
                isToday(day) && { backgroundColor: colors.primary },
              ]}
              onPress={() => onDatePress?.(day.toISOString())}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.weekDayName,
                { color: isToday(day) ? '#ffffff' : colors.textSecondary }
              ]}>
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text style={[
                styles.weekDayNumber,
                { color: isToday(day) ? '#ffffff' : colors.text }
              ]}>
                {day.getDate()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Week Events */}
        <ScrollView style={styles.weekEvents} showsVerticalScrollIndicator={false}>
          {days.map((day, dayIndex) => {
            const dayEvents = getEventsForDate(day);
            
            return (
              <View key={dayIndex} style={styles.weekDay}>
                <View style={styles.weekDayEvents}>
                  {dayEvents.map(event => (
                    <TouchableOpacity
                      key={event.id}
                      style={[
                        styles.weekEvent,
                        {
                          backgroundColor: event.color || getEventTypeColor(event.type),
                          borderLeftColor: getPriorityColor(event.priority),
                        },
                      ]}
                      onPress={() => onEventPress(event)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.weekEventTime}>
                        {event.all_day ? 'All day' : formatTime(event.start_time)}
                      </Text>
                      <Text style={styles.weekEventTitle} numberOfLines={1}>
                        {event.title}
                      </Text>
                      {event.location && (
                        <Text style={styles.weekEventLocation} numberOfLines={1}>
                          📍 {event.location}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                  
                  {dayEvents.length === 0 && (
                    <TouchableOpacity
                      style={styles.emptyDaySlot}
                      onPress={() => onAddEvent?.(day.toISOString())}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="add-outline" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderMonthView = () => {
    const days = getDaysInView();
    const weeks = [];
    
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <ScrollView style={styles.monthContainer} showsVerticalScrollIndicator={false}>
        {/* Month Header */}
        <View style={styles.monthHeader}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Text key={day} style={[styles.monthHeaderDay, { color: colors.textSecondary }]}>
              {day}
            </Text>
          ))}
        </View>

        {/* Month Grid */}
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.monthWeek}>
            {week.map((day, dayIndex) => {
              const dayEvents = getEventsForDate(day);
              const isCurrentMonthDay = isCurrentMonth(day);
              
              return (
                <TouchableOpacity
                  key={dayIndex}
                  style={[
                    styles.monthDay,
                    isToday(day) && { backgroundColor: colors.primary },
                    !isCurrentMonthDay && { opacity: 0.3 },
                  ]}
                  onPress={() => onDatePress?.(day.toISOString())}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.monthDayNumber,
                    {
                      color: isToday(day) ? '#ffffff' : 
                             isCurrentMonthDay ? colors.text : colors.textSecondary
                    }
                  ]}>
                    {day.getDate()}
                  </Text>
                  
                  <View style={styles.monthDayEvents}>
                    {dayEvents.slice(0, 3).map((event, eventIndex) => (
                      <View
                        key={event.id}
                        style={[
                          styles.monthEvent,
                          {
                            backgroundColor: event.color || getEventTypeColor(event.type),
                          },
                        ]}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <Text style={[styles.monthEventMore, { color: colors.textSecondary }]}>
                        +{dayEvents.length - 3}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
    );
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
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    navButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      minWidth: 200,
      textAlign: 'center',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    todayButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: colors.primary,
    },
    todayButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#ffffff',
    },
    viewToggle: {
      flexDirection: 'row',
      backgroundColor: colors.border,
      borderRadius: 8,
      padding: 2,
    },
    viewToggleButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    activeViewToggle: {
      backgroundColor: colors.primary,
    },
    viewToggleText: {
      fontSize: 12,
      fontWeight: '500',
    },
    activeViewToggleText: {
      color: '#ffffff',
    },
    inactiveViewToggleText: {
      color: colors.textSecondary,
    },
    weekContainer: {
      flex: 1,
    },
    weekHeader: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    weekDayHeader: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: 8,
      marginHorizontal: 2,
    },
    weekDayName: {
      fontSize: 12,
      fontWeight: '500',
      marginBottom: 2,
    },
    weekDayNumber: {
      fontSize: 16,
      fontWeight: '600',
    },
    weekEvents: {
      flex: 1,
    },
    weekDay: {
      flexDirection: 'row',
      minHeight: 80,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    weekDayEvents: {
      flex: 1,
      padding: 8,
      gap: 4,
    },
    weekEvent: {
      padding: 8,
      borderRadius: 6,
      borderLeftWidth: 3,
      marginVertical: 1,
    },
    weekEventTime: {
      fontSize: 10,
      color: 'rgba(255,255,255,0.8)',
      fontWeight: '500',
      marginBottom: 2,
    },
    weekEventTitle: {
      fontSize: 12,
      color: '#ffffff',
      fontWeight: '600',
      marginBottom: 2,
    },
    weekEventLocation: {
      fontSize: 10,
      color: 'rgba(255,255,255,0.7)',
    },
    emptyDaySlot: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 40,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    monthContainer: {
      flex: 1,
    },
    monthHeader: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    monthHeaderDay: {
      flex: 1,
      textAlign: 'center',
      paddingVertical: 12,
      fontSize: 12,
      fontWeight: '600',
    },
    monthWeek: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    monthDay: {
      flex: 1,
      minHeight: 80,
      padding: 4,
      alignItems: 'center',
      borderRightWidth: 1,
      borderRightColor: colors.border,
    },
    monthDayNumber: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
    },
    monthDayEvents: {
      width: '100%',
      alignItems: 'center',
      gap: 2,
    },
    monthEvent: {
      width: '80%',
      height: 4,
      borderRadius: 2,
    },
    monthEventMore: {
      fontSize: 8,
      fontWeight: '500',
      marginTop: 2,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.navButton} onPress={navigatePrevious}>
            <Ionicons name="chevron-back-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={navigateNext}>
            <Ionicons name="chevron-forward-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.headerTitle}>{formatDateHeader()}</Text>
        
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.todayButton} onPress={navigateToday}>
            <Text style={styles.todayButtonText}>Today</Text>
          </TouchableOpacity>
          
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                currentView === 'week' && styles.activeViewToggle,
              ]}
              onPress={() => setCurrentView('week')}
            >
              <Text style={[
                styles.viewToggleText,
                currentView === 'week' ? styles.activeViewToggleText : styles.inactiveViewToggleText,
              ]}>
                Week
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                currentView === 'month' && styles.activeViewToggle,
              ]}
              onPress={() => setCurrentView('month')}
            >
              <Text style={[
                styles.viewToggleText,
                currentView === 'month' ? styles.activeViewToggleText : styles.inactiveViewToggleText,
              ]}>
                Month
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Calendar Content */}
      {currentView === 'week' ? renderWeekView() : renderMonthView()}
    </View>
  );
} 