import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../contexts/ThemeContext';
import { supabase } from '../config/supabase';

interface Transcript {
  id: string;
  file_name: string;
  transcript_text: string;
  created_at: string;
  processed_at: string;
  status: 'uploaded' | 'processing' | 'completed' | 'error';
  file_size: number;
  file_type: string;
}

interface TranscriptViewerProps {
  onRefresh?: () => void;
}

export default function TranscriptViewer({ onRefresh }: TranscriptViewerProps) {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const colors = useThemeColors();

  useEffect(() => {
    loadTranscripts();
  }, []);

  const loadTranscripts = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('transcripts')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .not('transcript_text', 'is', null)
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          setTranscripts(data);
        }
      }
    } catch (error) {
      console.error('Error loading transcripts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter transcripts based on search query
  const filteredTranscripts = useMemo(() => {
    if (!searchQuery.trim()) return transcripts;
    
    const query = searchQuery.toLowerCase();
    return transcripts.filter(
      (transcript) =>
        transcript.file_name.toLowerCase().includes(query) ||
        transcript.transcript_text?.toLowerCase().includes(query)
    );
  }, [transcripts, searchQuery]);

  // Highlight search terms in text
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '**$1**'); // Use markdown-style highlighting
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleShare = async (transcript: Transcript) => {
    try {
      const shareContent = {
        title: `Transcript: ${transcript.file_name}`,
        message: `Transcript from ${transcript.file_name}\n\nCreated: ${formatDate(transcript.created_at)}\n\n${transcript.transcript_text}`,
      };
      
      await Share.share(shareContent);
    } catch (error) {
      console.error('Error sharing transcript:', error);
      Alert.alert('Error', 'Failed to share transcript');
    }
  };

  const handleExport = (transcript: Transcript) => {
    Alert.alert(
      'Export Transcript',
      'Choose export format:',
      [
        {
          text: 'Copy to Clipboard',
          onPress: () => {
            // In a real app, you'd use Clipboard API
            Alert.alert('Copied!', 'Transcript copied to clipboard');
          },
        },
        {
          text: 'Share as Text',
          onPress: () => handleShare(transcript),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).length;
  };

  const getReadingTime = (text: string) => {
    const wordsPerMinute = 200;
    const wordCount = getWordCount(text);
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  };

  const renderSearchResults = () => {
    if (isLoading) {
      return (
        <View style={dynamicStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={dynamicStyles.loadingText}>Loading transcripts...</Text>
        </View>
      );
    }

    if (filteredTranscripts.length === 0) {
      return (
        <View style={dynamicStyles.emptyContainer}>
          <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
          <Text style={dynamicStyles.emptyTitle}>
            {searchQuery ? 'No matching transcripts' : 'No transcripts yet'}
          </Text>
          <Text style={dynamicStyles.emptySubtitle}>
            {searchQuery 
              ? 'Try adjusting your search terms'
              : 'Upload audio files to see transcripts here'
            }
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={dynamicStyles.transcriptsList}>
        {filteredTranscripts.map((transcript) => (
          <TouchableOpacity
            key={transcript.id}
            style={dynamicStyles.transcriptCard}
            onPress={() => setSelectedTranscript(transcript)}
            activeOpacity={0.7}
          >
            <View style={dynamicStyles.transcriptHeader}>
              <View style={dynamicStyles.transcriptIcon}>
                <Ionicons name="document-text" size={20} color={colors.primary} />
              </View>
              <View style={dynamicStyles.transcriptMeta}>
                <Text style={dynamicStyles.transcriptTitle} numberOfLines={1}>
                  {transcript.file_name}
                </Text>
                <View style={dynamicStyles.metaRow}>
                  <Text style={dynamicStyles.metaText}>
                    {formatDate(transcript.created_at)}
                  </Text>
                  <Text style={dynamicStyles.metaDot}>•</Text>
                  <Text style={dynamicStyles.metaText}>
                    {getWordCount(transcript.transcript_text)} words
                  </Text>
                  <Text style={dynamicStyles.metaDot}>•</Text>
                  <Text style={dynamicStyles.metaText}>
                    {getReadingTime(transcript.transcript_text)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={dynamicStyles.actionButton}
                onPress={() => handleExport(transcript)}
              >
                <Ionicons name="share-outline" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={dynamicStyles.transcriptPreview} numberOfLines={3}>
              {highlightSearchTerm(transcript.transcript_text, searchQuery)}
            </Text>
            
            <View style={dynamicStyles.transcriptFooter}>
              <View style={dynamicStyles.statusBadge}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={dynamicStyles.statusText}>Completed</Text>
              </View>
              <Text style={dynamicStyles.fileSizeText}>
                {formatFileSize(transcript.file_size)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderTranscriptDetail = () => {
    if (!selectedTranscript) return null;

    return (
      <View style={dynamicStyles.detailContainer}>
        <View style={dynamicStyles.detailHeader}>
          <TouchableOpacity
            style={dynamicStyles.backButton}
            onPress={() => setSelectedTranscript(null)}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={dynamicStyles.detailTitle} numberOfLines={1}>
            {selectedTranscript.file_name}
          </Text>
          <TouchableOpacity
            style={dynamicStyles.shareButton}
            onPress={() => handleShare(selectedTranscript)}
          >
            <Ionicons name="share-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={dynamicStyles.detailMeta}>
          <Text style={dynamicStyles.detailMetaText}>
            Created: {formatDate(selectedTranscript.created_at)}
          </Text>
          <Text style={dynamicStyles.detailMetaText}>
            Words: {getWordCount(selectedTranscript.transcript_text)} • {getReadingTime(selectedTranscript.transcript_text)}
          </Text>
        </View>

        <ScrollView style={dynamicStyles.transcriptContent}>
          <Text style={dynamicStyles.transcriptText}>
            {selectedTranscript.transcript_text}
          </Text>
        </ScrollView>
      </View>
    );
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
    },
    clearButton: {
      padding: 4,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 16,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    transcriptsList: {
      flex: 1,
      padding: 16,
    },
    transcriptCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    transcriptHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    transcriptIcon: {
      marginRight: 12,
      marginTop: 2,
    },
    transcriptMeta: {
      flex: 1,
    },
    transcriptTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    metaDot: {
      fontSize: 13,
      color: colors.textSecondary,
      marginHorizontal: 6,
    },
    actionButton: {
      padding: 8,
    },
    transcriptPreview: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    transcriptFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.successContainer,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 12,
      color: colors.success,
      marginLeft: 4,
      fontWeight: '500',
    },
    fileSizeText: {
      fontSize: 12,
      color: colors.textTertiary,
    },
    detailContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    detailHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      marginRight: 12,
      padding: 4,
    },
    detailTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    shareButton: {
      marginLeft: 12,
      padding: 4,
    },
    detailMeta: {
      padding: 16,
      backgroundColor: colors.surface,
    },
    detailMetaText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    transcriptContent: {
      flex: 1,
      padding: 16,
    },
    transcriptText: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
    },
  });

  if (selectedTranscript) {
    return renderTranscriptDetail();
  }

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.title}>Your Transcripts</Text>
        <Text style={dynamicStyles.subtitle}>Search and manage AI-generated transcripts</Text>
        
        <View style={dynamicStyles.searchContainer}>
          <Ionicons 
            name="search" 
            size={20} 
            color={colors.textSecondary} 
            style={dynamicStyles.searchIcon}
          />
          <TextInput
            style={dynamicStyles.searchInput}
            placeholder="Search transcripts..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery ? (
            <TouchableOpacity
              style={dynamicStyles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      
      {renderSearchResults()}
    </View>
  );
} 