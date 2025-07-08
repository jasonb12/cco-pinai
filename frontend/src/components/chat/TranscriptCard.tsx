/**
 * Transcript Card Component - Individual transcript display
 * Based on PRD-UI.md specifications for Chat tab
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../contexts/ThemeContext';
import { Transcript } from './TranscriptList';

interface TranscriptCardProps {
  transcript: Transcript;
  expanded?: boolean;
  onToggleExpand?: () => void;
  onActionPress?: (actionId: string) => void;
  showActions?: boolean;
}

export default function TranscriptCard({
  transcript,
  expanded = false,
  onToggleExpand,
  onActionPress,
  showActions = true
}: TranscriptCardProps) {
  const colors = useThemeColors();
  const [isExpanded, setIsExpanded] = useState(expanded);

  const handleToggleExpand = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const getStatusIcon = (status: Transcript['status']) => {
    switch (status) {
      case 'processing': return 'hourglass-outline';
      case 'completed': return 'checkmark-circle-outline';
      case 'failed': return 'close-circle-outline';
    }
  };

  const getStatusColor = (status: Transcript['status']) => {
    switch (status) {
      case 'processing': return '#f59e0b';
      case 'completed': return '#10b981';
      case 'failed': return '#ef4444';
    }
  };

  const getSourceIcon = (source: Transcript['source']) => {
    switch (source) {
      case 'audio': return 'mic-outline';
      case 'text': return 'document-text-outline';
      case 'upload': return 'cloud-upload-outline';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderContent = () => {
    if (transcript.status === 'processing') {
      return (
        <View style={styles.processingContainer}>
          <Ionicons name="hourglass-outline" size={24} color="#f59e0b" />
          <Text style={[styles.processingText, { color: colors.textSecondary }]}>
            Processing transcript...
          </Text>
        </View>
      );
    }

    if (transcript.status === 'failed') {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={24} color="#ef4444" />
          <Text style={[styles.errorText, { color: colors.text }]}>
            Processing failed
          </Text>
          <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
            Unable to process this transcript. Please try again.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView 
        style={styles.contentScroll}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <Text style={[styles.content, { color: colors.text }]}>
          {transcript.content}
        </Text>
      </ScrollView>
    );
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      overflow: 'hidden',
    },
    header: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    titleContainer: {
      flex: 1,
      marginRight: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    metadataRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8,
    },
    metadataItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metadataText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8,
    },
    tag: {
      backgroundColor: colors.border,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    tagText: {
      fontSize: 10,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    contentContainer: {
      maxHeight: isExpanded ? 400 : 120,
      minHeight: 80,
    },
    contentScroll: {
      padding: 16,
    },
    content: {
      fontSize: 14,
      lineHeight: 20,
    },
    processingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      gap: 12,
    },
    processingText: {
      fontSize: 14,
      fontWeight: '500',
    },
    errorContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      gap: 8,
    },
    errorText: {
      fontSize: 16,
      fontWeight: '600',
    },
    errorSubtext: {
      fontSize: 14,
      textAlign: 'center',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    actionCount: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    actionCountText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    expandButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: colors.background,
    },
    expandButtonText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    actionsContainer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    actionsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    actionsList: {
      gap: 8,
    },
    actionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    actionTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: colors.primary,
    },
    actionButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#ffffff',
    },
  });

  // Mock actions for demonstration
  const mockActions = [
    { id: '1', title: 'Schedule team meeting', type: 'calendar' },
    { id: '2', title: 'Send follow-up email', type: 'email' },
    { id: '3', title: 'Create task reminder', type: 'task' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{transcript.title}</Text>
          </View>
          <View style={styles.statusContainer}>
            <Ionicons
              name={getStatusIcon(transcript.status)}
              size={14}
              color={getStatusColor(transcript.status)}
            />
            <Text style={[styles.statusText, { color: getStatusColor(transcript.status) }]}>
              {transcript.status}
            </Text>
          </View>
        </View>

        <View style={styles.metadataRow}>
          <View style={styles.metadataItem}>
            <Ionicons
              name={getSourceIcon(transcript.source)}
              size={12}
              color={colors.textSecondary}
            />
            <Text style={styles.metadataText}>
              {transcript.source}
            </Text>
          </View>
          <View style={styles.metadataItem}>
            <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.metadataText}>
              {formatTimestamp(transcript.timestamp)}
            </Text>
          </View>
          {transcript.duration && (
            <View style={styles.metadataItem}>
              <Ionicons name="timer-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.metadataText}>
                {transcript.duration}
              </Text>
            </View>
          )}
        </View>

        {transcript.tags && transcript.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {transcript.tags.map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.actionCount}>
          <Ionicons name="flash-outline" size={16} color={colors.primary} />
          <Text style={styles.actionCountText}>
            {transcript.actionCount} actions detected
          </Text>
        </View>
        
        {transcript.status === 'completed' && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={handleToggleExpand}
            activeOpacity={0.7}
          >
            <Text style={styles.expandButtonText}>
              {isExpanded ? 'Show Less' : 'Show More'}
            </Text>
            <Ionicons
              name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}
              size={14}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Actions */}
      {showActions && isExpanded && transcript.status === 'completed' && (
        <View style={styles.actionsContainer}>
          <Text style={styles.actionsTitle}>Detected Actions</Text>
          <View style={styles.actionsList}>
            {mockActions.map(action => (
              <View key={action.id} style={styles.actionItem}>
                <View style={styles.actionLeft}>
                  <Ionicons
                    name={
                      action.type === 'calendar' ? 'calendar-outline' :
                      action.type === 'email' ? 'mail-outline' :
                      'checkmark-circle-outline'
                    }
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.actionTitle}>{action.title}</Text>
                </View>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onActionPress?.(action.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonText}>Review</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
} 