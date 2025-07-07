import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

interface AIInsightsProps {
  transcriptText: string;
  transcriptId: string;
  onActionCreated?: (action: ActionItem) => void;
}

interface ActionItem {
  id: string;
  type: 'task' | 'reminder' | 'contact' | 'event';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  confidence: number;
}

interface Sentiment {
  overall: 'positive' | 'neutral' | 'negative';
  score: number;
  emotions: string[];
}

interface KeyInsight {
  type: 'summary' | 'topic' | 'decision' | 'question';
  content: string;
  confidence: number;
}

export default function AIInsights({ transcriptText, transcriptId, onActionCreated }: AIInsightsProps) {
  const colors = useThemeColors();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [keyInsights, setKeyInsights] = useState<KeyInsight[]>([]);
  const [summary, setSummary] = useState<string>('');
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    if (transcriptText && transcriptText.length > 10) {
      analyzeTranscript();
    }
  }, [transcriptText]);

  useEffect(() => {
    if (!isAnalyzing && (actionItems.length > 0 || sentiment || keyInsights.length > 0)) {
      // Animate in the results
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isAnalyzing, actionItems, sentiment, keyInsights]);

  const analyzeTranscript = async () => {
    if (!transcriptText || transcriptText.length < 10) return;
    
    setIsAnalyzing(true);
    
    try {
      // Simulate AI analysis (in real app, this would call your AI service)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock insights based on transcript content
      const insights = generateMockInsights(transcriptText);
      
      setActionItems(insights.actions);
      setSentiment(insights.sentiment);
      setKeyInsights(insights.insights);
      setSummary(insights.summary);
      
    } catch (error) {
      console.error('Error analyzing transcript:', error);
      Alert.alert('Analysis Error', 'Failed to analyze transcript. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateMockInsights = (text: string): {
    actions: ActionItem[];
    sentiment: Sentiment;
    insights: KeyInsight[];
    summary: string;
  } => {
    const words = text.toLowerCase().split(' ');
    const wordCount = words.length;
    
    // Detect action words
    const actionWords = ['todo', 'task', 'reminder', 'schedule', 'meeting', 'call', 'email', 'follow up', 'deadline', 'due'];
    const hasActionWords = actionWords.some(word => text.toLowerCase().includes(word));
    
    // Detect sentiment
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'success', 'amazing', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'sad', 'problem', 'issue', 'concern', 'worry'];
    
    const positiveCount = positiveWords.filter(word => text.toLowerCase().includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.toLowerCase().includes(word)).length;
    
    let sentimentScore = 0;
    let overallSentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    
    if (positiveCount > negativeCount) {
      sentimentScore = Math.min(0.8, 0.3 + (positiveCount * 0.1));
      overallSentiment = 'positive';
    } else if (negativeCount > positiveCount) {
      sentimentScore = Math.max(-0.8, -0.3 - (negativeCount * 0.1));
      overallSentiment = 'negative';
    } else {
      sentimentScore = 0;
    }

    // Generate actions
    const actions: ActionItem[] = [];
    if (hasActionWords) {
      actions.push({
        id: '1',
        type: 'task',
        title: 'Follow up on discussion points',
        description: 'Review and act on items mentioned in the conversation',
        priority: 'medium',
        confidence: 0.75,
      });
    }
    
    if (text.toLowerCase().includes('meeting') || text.toLowerCase().includes('schedule')) {
      actions.push({
        id: '2',
        type: 'event',
        title: 'Schedule mentioned meeting',
        description: 'Set up the meeting discussed in the conversation',
        priority: 'high',
        confidence: 0.85,
      });
    }

    // Generate insights
    const insights: KeyInsight[] = [
      {
        type: 'summary',
        content: `This ${wordCount}-word conversation covers ${Math.ceil(wordCount / 50)} main topics`,
        confidence: 0.9,
      },
    ];
    
    if (text.toLowerCase().includes('decision') || text.toLowerCase().includes('decide')) {
      insights.push({
        type: 'decision',
        content: 'Decision points were discussed that may require follow-up',
        confidence: 0.8,
      });
    }
    
    if (text.toLowerCase().includes('?')) {
      insights.push({
        type: 'question',
        content: 'Questions were raised that might need answers',
        confidence: 0.7,
      });
    }

    return {
      actions,
      sentiment: {
        overall: overallSentiment,
        score: sentimentScore,
        emotions: overallSentiment === 'positive' ? ['optimistic', 'confident'] : 
                 overallSentiment === 'negative' ? ['concerned', 'cautious'] : ['neutral'],
      },
      insights,
      summary: `AI Analysis: This conversation contains ${wordCount} words with ${overallSentiment} sentiment. ${hasActionWords ? 'Action items were detected.' : 'No specific action items identified.'}`
    };
  };

  const handleActionApprove = (action: ActionItem) => {
    if (onActionCreated) {
      onActionCreated(action);
    }
    Alert.alert('Action Created', `"${action.title}" has been added to your tasks.`);
  };

  const getSentimentColor = (sentiment: Sentiment) => {
    switch (sentiment.overall) {
      case 'positive': return '#10b981';
      case 'negative': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getSentimentIcon = (sentiment: Sentiment) => {
    switch (sentiment.overall) {
      case 'positive': return 'happy-outline';
      case 'negative': return 'sad-outline';
      default: return 'remove-outline';
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 20,
      margin: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    headerIcon: {
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    summaryCard: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryText: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
    },
    sentimentCard: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    sentimentIcon: {
      marginRight: 12,
    },
    sentimentText: {
      flex: 1,
    },
    sentimentLabel: {
      fontSize: 16,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    sentimentScore: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    actionItem: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    actionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    actionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    actionType: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    actionTypeText: {
      fontSize: 12,
      color: colors.onPrimary,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    actionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    actionFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    confidenceText: {
      fontSize: 12,
      color: colors.textTertiary,
    },
    approveButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    approveButtonText: {
      color: colors.onPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    insightItem: {
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
    },
    insightText: {
      fontSize: 14,
      color: colors.text,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  if (isAnalyzing) {
    return (
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.header}>
          <Ionicons name="analytics-outline" size={24} color={colors.primary} style={dynamicStyles.headerIcon} />
          <Text style={dynamicStyles.headerTitle}>AI Insights</Text>
        </View>
        
        <View style={dynamicStyles.loadingContainer}>
          <Ionicons name="sync-outline" size={48} color={colors.primary} />
          <Text style={dynamicStyles.loadingText}>🤖 Analyzing transcript...</Text>
        </View>
      </View>
    );
  }

  if (!transcriptText || transcriptText.length < 10) {
    return (
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.header}>
          <Ionicons name="analytics-outline" size={24} color={colors.primary} style={dynamicStyles.headerIcon} />
          <Text style={dynamicStyles.headerTitle}>AI Insights</Text>
        </View>
        
        <View style={dynamicStyles.emptyState}>
          <Text style={dynamicStyles.emptyText}>No transcript available for analysis</Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View 
      style={[
        dynamicStyles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={dynamicStyles.header}>
        <Ionicons name="analytics-outline" size={24} color={colors.primary} style={dynamicStyles.headerIcon} />
        <Text style={dynamicStyles.headerTitle}>AI Insights</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Summary */}
        {summary && (
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Summary</Text>
            <View style={dynamicStyles.summaryCard}>
              <Text style={dynamicStyles.summaryText}>{summary}</Text>
            </View>
          </View>
        )}

        {/* Sentiment Analysis */}
        {sentiment && (
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Sentiment Analysis</Text>
            <View style={dynamicStyles.sentimentCard}>
              <Ionicons 
                name={getSentimentIcon(sentiment)} 
                size={24} 
                color={getSentimentColor(sentiment)} 
                style={dynamicStyles.sentimentIcon}
              />
              <View style={dynamicStyles.sentimentText}>
                <Text style={[dynamicStyles.sentimentLabel, { color: getSentimentColor(sentiment) }]}>
                  {sentiment.overall}
                </Text>
                <Text style={dynamicStyles.sentimentScore}>
                  Confidence: {Math.abs(sentiment.score * 100).toFixed(0)}%
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Items */}
        {actionItems.length > 0 && (
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Suggested Actions</Text>
            {actionItems.map((action) => (
              <View key={action.id} style={dynamicStyles.actionItem}>
                <View style={dynamicStyles.actionHeader}>
                  <Text style={dynamicStyles.actionTitle}>{action.title}</Text>
                  <View style={dynamicStyles.actionType}>
                    <Text style={dynamicStyles.actionTypeText}>{action.type}</Text>
                  </View>
                </View>
                <Text style={dynamicStyles.actionDescription}>{action.description}</Text>
                <View style={dynamicStyles.actionFooter}>
                  <Text style={dynamicStyles.confidenceText}>
                    Confidence: {(action.confidence * 100).toFixed(0)}%
                  </Text>
                  <TouchableOpacity 
                    style={dynamicStyles.approveButton}
                    onPress={() => handleActionApprove(action)}
                  >
                    <Text style={dynamicStyles.approveButtonText}>Create Task</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Key Insights */}
        {keyInsights.length > 0 && (
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Key Insights</Text>
            {keyInsights.map((insight, index) => (
              <View key={index} style={dynamicStyles.insightItem}>
                <Text style={dynamicStyles.insightText}>{insight.content}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
} 