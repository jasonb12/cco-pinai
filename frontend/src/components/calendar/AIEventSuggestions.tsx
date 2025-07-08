/**
 * AI Event Suggestions Component
 * Displays intelligent event suggestions based on transcript analysis and user patterns
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../contexts/ThemeContext';
import { calendarService, AIEventSuggestion } from '../../services/calendarService';
import { CalendarEvent } from './AgendaView';

interface AIEventSuggestionsProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: (event: CalendarEvent) => void;
  transcriptContent?: string;
}

export default function AIEventSuggestions({
  isOpen,
  onClose,
  onEventCreated,
  transcriptContent,
}: AIEventSuggestionsProps) {
  const colors = useThemeColors();
  const [suggestions, setSuggestions] = useState<AIEventSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSuggestions();
    }
  }, [isOpen, transcriptContent]);

  const loadSuggestions = async () => {
    setIsLoading(true);
    try {
      const newSuggestions = await calendarService.generateEventSuggestions(
        transcriptContent,
        'User requested suggestions'
      );
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      Alert.alert('Error', 'Failed to load event suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptSuggestion = async (suggestionId: string) => {
    try {
      const event = await calendarService.acceptSuggestion(suggestionId);
      if (event) {
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
        onEventCreated?.(event);
        Alert.alert('Success', 'Event added to your calendar!');
      }
    } catch (error) {
      console.error('Error accepting suggestion:', error);
      Alert.alert('Error', 'Failed to create event');
    }
  };

  const handleDismissSuggestion = async (suggestionId: string) => {
    try {
      await calendarService.dismissSuggestion(suggestionId);
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
    }
  };

  const getEventTypeIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting': return 'people-outline';
      case 'call': return 'call-outline';
      case 'task': return 'checkmark-circle-outline';
      case 'reminder': return 'alarm-outline';
      case 'event': return 'calendar-outline';
      default: return 'calendar-outline';
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

  const formatSuggestedTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.8) return { label: 'High', color: '#10b981' };
    if (confidence >= 0.5) return { label: 'Medium', color: '#f59e0b' };
    return { label: 'Low', color: '#6b7280' };
  };

  const getSourceDescription = (source: AIEventSuggestion['source']) => {
    switch (source) {
      case 'transcript': return 'Based on transcript analysis';
      case 'pattern': return 'Based on your patterns';
      case 'email': return 'From email content';
      case 'context': return 'Contextual suggestion';
      default: return 'AI suggested';
    }
  };

  if (!isOpen) return null;

  const styles = StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    container: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      margin: 20,
      maxHeight: '80%',
      width: '90%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    closeButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    content: {
      maxHeight: 400,
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 12,
    },
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
    emptyIcon: {
      marginBottom: 12,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    suggestionsList: {
      padding: 16,
    },
    suggestionCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    suggestionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    eventTypeIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    suggestionContent: {
      flex: 1,
    },
    suggestionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    suggestionTime: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
    },
    suggestionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginVertical: 8,
    },
    suggestionMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    priorityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: colors.surface,
    },
    priorityText: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    confidenceBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: colors.surface,
    },
    confidenceText: {
      fontSize: 11,
      fontWeight: '600',
    },
    suggestionActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
    },
    acceptButton: {
      backgroundColor: colors.primary,
    },
    dismissButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    acceptButtonText: {
      color: '#ffffff',
    },
    dismissButtonText: {
      color: colors.textSecondary,
    },
    footer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    footerText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
    },
  });

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>AI Event Suggestions</Text>
            <Text style={styles.headerSubtitle}>
              Smart scheduling based on your content and patterns
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="sparkles-outline" size={48} color={colors.primary} />
              <Text style={styles.loadingText}>Analyzing content for suggestions...</Text>
            </View>
          ) : suggestions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="bulb-outline" size={48} color={colors.textSecondary} />
              </View>
              <Text style={styles.emptyTitle}>No suggestions available</Text>
              <Text style={styles.emptySubtitle}>
                Try uploading a transcript or use the calendar more to get personalized suggestions
              </Text>
            </View>
          ) : (
            <ScrollView 
              style={styles.suggestionsList}
              showsVerticalScrollIndicator={false}
            >
              {suggestions.map((suggestion) => {
                const confidenceInfo = getConfidenceLevel(suggestion.confidence);
                const eventColor = getEventTypeColor(suggestion.type);
                const priorityColor = getPriorityColor(suggestion.priority);

                return (
                  <View key={suggestion.id} style={styles.suggestionCard}>
                    {/* Header */}
                    <View style={styles.suggestionHeader}>
                      <View style={[styles.eventTypeIcon, { backgroundColor: `${eventColor}20` }]}>
                        <Ionicons 
                          name={getEventTypeIcon(suggestion.type)} 
                          size={16} 
                          color={eventColor} 
                        />
                      </View>
                      <View style={styles.suggestionContent}>
                        <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                        <Text style={styles.suggestionTime}>
                          {formatSuggestedTime(suggestion.suggestedTime)} • {suggestion.duration} min
                        </Text>
                      </View>
                    </View>

                    {/* Description */}
                    <Text style={styles.suggestionDescription}>
                      {suggestion.description}
                    </Text>

                    {/* Meta Information */}
                    <View style={styles.suggestionMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="information-circle-outline" size={12} color={colors.textSecondary} />
                        <Text style={styles.metaText}>{getSourceDescription(suggestion.source)}</Text>
                      </View>
                      
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <View style={[styles.priorityBadge, { borderColor: priorityColor }]}>
                          <Text style={[styles.priorityText, { color: priorityColor }]}>
                            {suggestion.priority}
                          </Text>
                        </View>
                        
                        <View style={[styles.confidenceBadge, { borderColor: confidenceInfo.color }]}>
                          <Text style={[styles.confidenceText, { color: confidenceInfo.color }]}>
                            {confidenceInfo.label}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.suggestionActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={() => handleAcceptSuggestion(suggestion.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="checkmark-outline" size={16} color="#ffffff" />
                        <Text style={[styles.actionButtonText, styles.acceptButtonText]}>
                          Add to Calendar
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.actionButton, styles.dismissButton]}
                        onPress={() => handleDismissSuggestion(suggestion.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.actionButtonText, styles.dismissButtonText]}>
                          Dismiss
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Footer */}
        {suggestions.length > 0 && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              💡 Suggestions improve over time as AI learns your scheduling patterns
            </Text>
          </View>
        )}
      </View>
    </View>
  );
} 