/**
 * Transcript List Component - List of processed transcripts
 * Based on PRD-UI.md specifications for Chat tab
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../contexts/ThemeContext';

export interface Transcript {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  duration?: string;
  actionCount: number;
  status: 'processing' | 'completed' | 'failed';
  source: 'audio' | 'text' | 'upload';
  tags?: string[];
}

interface TranscriptListProps {
  transcripts: Transcript[];
  onTranscriptPress: (transcript: Transcript) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  emptyMessage?: string;
}

export default function TranscriptList({
  transcripts,
  onTranscriptPress,
  onRefresh,
  refreshing = false,
  emptyMessage = 'No transcripts available'
}: TranscriptListProps) {
  const colors = useThemeColors();

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

  const renderTranscript = ({ item }: { item: Transcript }) => (
    <TouchableOpacity
      style={[styles.transcriptItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => onTranscriptPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.metadata}>
            <Ionicons
              name={getSourceIcon(item.source)}
              size={12}
              color={colors.textSecondary}
            />
            <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
              {formatTimeAgo(item.timestamp)}
            </Text>
            {item.duration && (
              <>
                <Text style={[styles.separator, { color: colors.textSecondary }]}>•</Text>
                <Text style={[styles.duration, { color: colors.textSecondary }]}>
                  {item.duration}
                </Text>
              </>
            )}
          </View>
        </View>
        
        <View style={styles.statusContainer}>
          <Ionicons
            name={getStatusIcon(item.status)}
            size={16}
            color={getStatusColor(item.status)}
          />
        </View>
      </View>

      <Text style={[styles.content, { color: colors.textSecondary }]} numberOfLines={2}>
        {item.content}
      </Text>

      <View style={styles.footer}>
        <View style={styles.actionCount}>
          <Ionicons name="flash-outline" size={14} color={colors.primary} />
          <Text style={[styles.actionCountText, { color: colors.primary }]}>
            {item.actionCount} actions
          </Text>
        </View>
        
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tags}>
            {item.tags.slice(0, 2).map(tag => (
              <View key={tag} style={[styles.tag, { backgroundColor: colors.border }]}>
                <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                  {tag}
                </Text>
              </View>
            ))}
            {item.tags.length > 2 && (
              <Text style={[styles.moreTagsText, { color: colors.textSecondary }]}>
                +{item.tags.length - 2}
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No Transcripts
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
        {emptyMessage}
      </Text>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    transcriptItem: {
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 8,
      borderWidth: 1,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    header: {
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
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    metadata: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    timestamp: {
      fontSize: 12,
      fontWeight: '500',
    },
    separator: {
      fontSize: 12,
    },
    duration: {
      fontSize: 12,
      fontWeight: '500',
    },
    statusContainer: {
      padding: 4,
    },
    content: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 12,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    actionCount: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    actionCountText: {
      fontSize: 12,
      fontWeight: '600',
    },
    tags: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    tag: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    tagText: {
      fontSize: 10,
      fontWeight: '500',
    },
    moreTagsText: {
      fontSize: 10,
      fontWeight: '500',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingVertical: 60,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginTop: 16,
      marginBottom: 8,
    },
    emptyDescription: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  return (
    <FlatList
      style={styles.container}
      data={transcripts}
      keyExtractor={(item) => item.id}
      renderItem={renderTranscript}
      ListEmptyComponent={renderEmptyState}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}
      contentContainerStyle={transcripts.length === 0 ? { flex: 1 } : undefined}
    />
  );
} 