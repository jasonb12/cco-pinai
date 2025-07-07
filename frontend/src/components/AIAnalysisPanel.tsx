import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../contexts/ThemeContext';

interface AIInsight {
  type: 'summary' | 'keyPoints' | 'sentiment' | 'topics' | 'actionItems';
  title: string;
  content: string | string[];
  confidence: number;
  icon: string;
}

interface AIAnalysisPanelProps {
  transcriptText: string;
  fileName: string;
}

export default function AIAnalysisPanel({ transcriptText, fileName }: AIAnalysisPanelProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<string>('summary');
  const colors = useThemeColors();

  useEffect(() => {
    if (transcriptText) {
      generateInsights();
    }
  }, [transcriptText]);

  const generateInsights = async () => {
    setIsAnalyzing(true);
    
    try {
      // Simulate AI analysis - in a real app, this would call your AI service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockInsights: AIInsight[] = [
        {
          type: 'summary',
          title: 'AI Summary',
          content: generateSummary(transcriptText),
          confidence: 0.92,
          icon: 'document-text'
        },
        {
          type: 'keyPoints',
          title: 'Key Points',
          content: generateKeyPoints(transcriptText),
          confidence: 0.88,
          icon: 'list'
        },
        {
          type: 'sentiment',
          title: 'Sentiment Analysis',
          content: generateSentimentAnalysis(transcriptText),
          confidence: 0.85,
          icon: 'happy'
        },
        {
          type: 'topics',
          title: 'Main Topics',
          content: generateTopics(transcriptText),
          confidence: 0.90,
          icon: 'pricetags'
        },
        {
          type: 'actionItems',
          title: 'Action Items',
          content: generateActionItems(transcriptText),
          confidence: 0.78,
          icon: 'checkmark-circle'
        }
      ];
      
      setInsights(mockInsights);
    } catch (error) {
      console.error('Error generating insights:', error);
      Alert.alert('Error', 'Failed to generate AI insights');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateSummary = (text: string): string => {
    const sentences = text.split('.').filter(s => s.trim().length > 0);
    const wordCount = text.split(' ').length;
    
    if (wordCount < 50) {
      return 'This is a brief transcript that discusses the main topic concisely.';
    }
    
    return `This ${Math.ceil(wordCount / 200)}-minute transcript covers ${sentences.length} main points. The discussion focuses on key topics and includes important details that provide valuable insights into the subject matter.`;
  };

  const generateKeyPoints = (text: string): string[] => {
    const words = text.toLowerCase().split(' ');
    const commonKeywords = ['important', 'key', 'main', 'significant', 'critical', 'essential'];
    
    const points = [
      '📌 Main discussion points were covered comprehensively',
      '�� Important insights were shared throughout the conversation',
      '🎯 Key objectives and goals were clearly outlined',
      '📊 Relevant data and examples were provided',
      '🔗 Connections between different topics were established'
    ];
    
    return points.slice(0, Math.min(5, Math.ceil(words.length / 100)));
  };

  const generateSentimentAnalysis = (text: string): string => {
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'success', 'happy', 'pleased'];
    const negativeWords = ['bad', 'poor', 'negative', 'problem', 'issue', 'concern', 'difficult'];
    
    const words = text.toLowerCase().split(' ');
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    if (positiveCount > negativeCount) {
      return '😊 Overall Positive - The conversation has an optimistic and constructive tone with positive language and collaborative spirit.';
    } else if (negativeCount > positiveCount) {
      return '😐 Mixed/Concerned - The discussion includes some challenges or concerns that require attention and resolution.';
    } else {
      return '😌 Neutral/Balanced - The conversation maintains a professional and balanced tone throughout the discussion.';
    }
  };

  const generateTopics = (text: string): string[] => {
    const commonTopics = [
      '🏢 Business Strategy',
      '💼 Project Management', 
      '👥 Team Collaboration',
      '📈 Performance Analysis',
      '🎯 Goal Setting',
      '💡 Innovation & Ideas',
      '📊 Data & Analytics',
      '🔄 Process Improvement'
    ];
    
    const wordCount = text.split(' ').length;
    const topicCount = Math.min(6, Math.max(3, Math.ceil(wordCount / 150)));
    
    return commonTopics.slice(0, topicCount);
  };

  const generateActionItems = (text: string): string[] => {
    const actionWords = ['need', 'should', 'must', 'will', 'plan', 'next', 'follow', 'action'];
    const words = text.toLowerCase().split(' ');
    const hasActionWords = words.some(word => actionWords.includes(word));
    
    if (!hasActionWords) {
      return ['📝 Review transcript for potential action items', '🔄 Follow up on discussed topics'];
    }
    
    return [
      '✅ Follow up on key decisions made during the discussion',
      '📅 Schedule next meeting to continue important topics',
      '📋 Document and share important insights with team',
      '🎯 Implement suggested improvements and changes',
      '📊 Gather additional data or information as needed'
    ].slice(0, Math.ceil(words.length / 200));
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return colors.success;
    if (confidence >= 0.8) return colors.warning;
    return colors.textSecondary;
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.9) return 'High Confidence';
    if (confidence >= 0.8) return 'Good Confidence';
    return 'Moderate Confidence';
  };

  const renderInsightContent = (insight: AIInsight) => {
    if (Array.isArray(insight.content)) {
      return (
        <View style={dynamicStyles.listContainer}>
          {insight.content.map((item, index) => (
            <View key={index} style={dynamicStyles.listItem}>
              <Text style={dynamicStyles.listItemText}>{item}</Text>
            </View>
          ))}
        </View>
      );
    }
    
    return <Text style={dynamicStyles.insightContent}>{insight.content}</Text>;
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      margin: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    header: {
      backgroundColor: colors.primary,
      padding: 16,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.onPrimary,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.onPrimary,
      opacity: 0.9,
    },
    loadingContainer: {
      padding: 32,
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 12,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      paddingHorizontal: 4,
      paddingVertical: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 2,
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    inactiveTab: {
      backgroundColor: 'transparent',
    },
    tabText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    activeTabText: {
      color: colors.onPrimary,
    },
    contentContainer: {
      padding: 16,
    },
    insightHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    insightIcon: {
      marginRight: 8,
    },
    insightTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    confidenceBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: colors.successContainer,
    },
    confidenceText: {
      fontSize: 11,
      fontWeight: '500',
      color: colors.success,
    },
    insightContent: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    listContainer: {
      marginTop: 8,
    },
    listItem: {
      marginBottom: 8,
    },
    listItemText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    regenerateButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 16,
    },
    regenerateButtonText: {
      color: colors.onPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
  });

  if (isAnalyzing) {
    return (
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.header}>
          <Text style={dynamicStyles.headerTitle}>🤖 AI Analysis</Text>
          <Text style={dynamicStyles.headerSubtitle}>Generating insights...</Text>
        </View>
        <View style={dynamicStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={dynamicStyles.loadingText}>AI is analyzing your transcript...</Text>
        </View>
      </View>
    );
  }

  if (insights.length === 0) {
    return (
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.header}>
          <Text style={dynamicStyles.headerTitle}>🤖 AI Analysis</Text>
          <Text style={dynamicStyles.headerSubtitle}>No insights available</Text>
        </View>
        <View style={dynamicStyles.contentContainer}>
          <TouchableOpacity style={dynamicStyles.regenerateButton} onPress={generateInsights}>
            <Text style={dynamicStyles.regenerateButtonText}>Generate AI Insights</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const selectedInsightData = insights.find(insight => insight.type === selectedInsight) || insights[0];

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>�� AI Analysis</Text>
        <Text style={dynamicStyles.headerSubtitle}>{fileName}</Text>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dynamicStyles.tabContainer}>
        {insights.map((insight) => (
          <TouchableOpacity
            key={insight.type}
            style={[
              dynamicStyles.tab,
              selectedInsight === insight.type ? dynamicStyles.activeTab : dynamicStyles.inactiveTab
            ]}
            onPress={() => setSelectedInsight(insight.type)}
          >
            <Text style={[
              dynamicStyles.tabText,
              selectedInsight === insight.type ? dynamicStyles.activeTabText : null
            ]}>
              {insight.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={dynamicStyles.contentContainer}>
        <View style={dynamicStyles.insightHeader}>
          <Ionicons 
            name={selectedInsightData.icon as any} 
            size={20} 
            color={colors.primary} 
            style={dynamicStyles.insightIcon}
          />
          <Text style={dynamicStyles.insightTitle}>{selectedInsightData.title}</Text>
          <View style={[
            dynamicStyles.confidenceBadge,
            { backgroundColor: getConfidenceColor(selectedInsightData.confidence) + '20' }
          ]}>
            <Text style={[
              dynamicStyles.confidenceText,
              { color: getConfidenceColor(selectedInsightData.confidence) }
            ]}>
              {getConfidenceText(selectedInsightData.confidence)}
            </Text>
          </View>
        </View>
        
        {renderInsightContent(selectedInsightData)}
        
        <TouchableOpacity style={dynamicStyles.regenerateButton} onPress={generateInsights}>
          <Text style={dynamicStyles.regenerateButtonText}>🔄 Regenerate Analysis</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
} 