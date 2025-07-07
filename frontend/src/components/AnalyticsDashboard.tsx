import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../contexts/ThemeContext';
import { supabase } from '../config/supabase';

interface AnalyticsData {
  totalTranscripts: number;
  totalDuration: number;
  averageSentiment: number;
  actionItemsCreated: number;
  dailyActivity: { date: string; count: number }[];
  sentimentTrend: { date: string; sentiment: number }[];
  topicsDistribution: { topic: string; count: number; color: string }[];
  weeklyStats: { week: string; transcripts: number; actions: number }[];
}

export default function AnalyticsDashboard() {
  const colors = useThemeColors();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  
  const screenData = Dimensions.get('window');
  const chartWidth = screenData.width - 32;

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // In real app, this would fetch from your analytics API
      const mockData = generateMockAnalytics();
      setAnalytics(mockData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockAnalytics = (): AnalyticsData => {
    const now = new Date();
    const days = selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 365;
    
    // Generate daily activity data
    const dailyActivity = Array.from({ length: days }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (days - 1 - i));
      return {
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 10) + 1,
      };
    });

    // Generate sentiment trend
    const sentimentTrend = Array.from({ length: days }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (days - 1 - i));
      return {
        date: date.toISOString().split('T')[0],
        sentiment: (Math.random() - 0.5) * 2, // -1 to 1
      };
    });

    // Generate topics distribution
    const topics = [
      { topic: 'Meetings', count: 45, color: '#3b82f6' },
      { topic: 'Ideas', count: 32, color: '#10b981' },
      { topic: 'Tasks', count: 28, color: '#f59e0b' },
      { topic: 'Decisions', count: 20, color: '#ef4444' },
      { topic: 'Personal', count: 15, color: '#8b5cf6' },
    ];

    // Generate weekly stats
    const weeklyStats = Array.from({ length: 4 }, (_, i) => ({
      week: `Week ${i + 1}`,
      transcripts: Math.floor(Math.random() * 50) + 20,
      actions: Math.floor(Math.random() * 20) + 5,
    }));

    return {
      totalTranscripts: dailyActivity.reduce((sum, day) => sum + day.count, 0),
      totalDuration: Math.floor(Math.random() * 500) + 200, // minutes
      averageSentiment: 0.3, // Positive
      actionItemsCreated: Math.floor(Math.random() * 50) + 25,
      dailyActivity,
      sentimentTrend,
      topicsDistribution: topics,
      weeklyStats,
    };
  };

  const chartConfig = {
    backgroundColor: colors.background,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => colors.text,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: colors.border,
      strokeWidth: 1,
    },
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingBottom: 10,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    periodSelector: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 4,
    },
    periodButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    periodButtonActive: {
      backgroundColor: colors.primary,
    },
    periodButtonText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    periodButtonTextActive: {
      color: colors.onPrimary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      marginBottom: 24,
    },
    statCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      flex: 1,
      minWidth: '45%',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    statValue: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    statIcon: {
      position: 'absolute',
      top: 16,
      right: 16,
      opacity: 0.3,
    },
    chartSection: {
      marginBottom: 24,
    },
    chartTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
      paddingHorizontal: 4,
    },
    chartContainer: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 16,
    },
    insightCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    insightTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    insightText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
  });

  if (isLoading) {
    return (
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.loadingContainer}>
          <Ionicons name="analytics-outline" size={48} color={colors.primary} />
          <Text style={dynamicStyles.loadingText}>Loading analytics...</Text>
        </View>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.loadingContainer}>
          <Text style={dynamicStyles.loadingText}>No analytics data available</Text>
        </View>
      </View>
    );
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getSentimentText = (sentiment: number) => {
    if (sentiment > 0.3) return 'Very Positive';
    if (sentiment > 0.1) return 'Positive';
    if (sentiment > -0.1) return 'Neutral';
    if (sentiment > -0.3) return 'Negative';
    return 'Very Negative';
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.1) return '#10b981';
    if (sentiment > -0.1) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <View style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.title}>Analytics</Text>
        <View style={dynamicStyles.periodSelector}>
          {(['week', 'month', 'year'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                dynamicStyles.periodButton,
                selectedPeriod === period && dynamicStyles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  dynamicStyles.periodButtonText,
                  selectedPeriod === period && dynamicStyles.periodButtonTextActive,
                ]}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={dynamicStyles.scrollView} contentContainerStyle={dynamicStyles.scrollContent}>
        {/* Stats Grid */}
        <View style={dynamicStyles.statsGrid}>
          <View style={dynamicStyles.statCard}>
            <Ionicons name="document-text-outline" size={24} color={colors.primary} style={dynamicStyles.statIcon} />
            <Text style={dynamicStyles.statValue}>{analytics.totalTranscripts}</Text>
            <Text style={dynamicStyles.statLabel}>Transcripts</Text>
          </View>
          
          <View style={dynamicStyles.statCard}>
            <Ionicons name="time-outline" size={24} color={colors.primary} style={dynamicStyles.statIcon} />
            <Text style={dynamicStyles.statValue}>{formatDuration(analytics.totalDuration)}</Text>
            <Text style={dynamicStyles.statLabel}>Total Duration</Text>
          </View>
          
          <View style={dynamicStyles.statCard}>
            <Ionicons name="checkmark-done-outline" size={24} color={colors.primary} style={dynamicStyles.statIcon} />
            <Text style={dynamicStyles.statValue}>{analytics.actionItemsCreated}</Text>
            <Text style={dynamicStyles.statLabel}>Action Items</Text>
          </View>
          
          <View style={dynamicStyles.statCard}>
            <Ionicons name="happy-outline" size={24} color={getSentimentColor(analytics.averageSentiment)} style={dynamicStyles.statIcon} />
            <Text style={[dynamicStyles.statValue, { color: getSentimentColor(analytics.averageSentiment) }]}>
              {getSentimentText(analytics.averageSentiment)}
            </Text>
            <Text style={dynamicStyles.statLabel}>Avg. Sentiment</Text>
          </View>
        </View>

        {/* Daily Activity Chart */}
        <View style={dynamicStyles.chartSection}>
          <Text style={dynamicStyles.chartTitle}>Daily Activity</Text>
          <View style={dynamicStyles.chartContainer}>
            <LineChart
              data={{
                labels: analytics.dailyActivity.slice(-7).map(d => 
                  new Date(d.date).toLocaleDateString('en', { weekday: 'short' })
                ),
                datasets: [{
                  data: analytics.dailyActivity.slice(-7).map(d => d.count),
                  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                  strokeWidth: 3,
                }],
              }}
              width={chartWidth - 32}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </View>
        </View>

        {/* Topics Distribution */}
        <View style={dynamicStyles.chartSection}>
          <Text style={dynamicStyles.chartTitle}>Topics Distribution</Text>
          <View style={dynamicStyles.chartContainer}>
            <PieChart
              data={analytics.topicsDistribution.map(topic => ({
                name: topic.topic,
                population: topic.count,
                color: topic.color,
                legendFontColor: colors.text,
                legendFontSize: 14,
              }))}
              width={chartWidth - 32}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 50]}
              absolute
            />
          </View>
        </View>

        {/* Sentiment Trend */}
        <View style={dynamicStyles.chartSection}>
          <Text style={dynamicStyles.chartTitle}>Sentiment Trend</Text>
          <View style={dynamicStyles.chartContainer}>
            <LineChart
              data={{
                labels: analytics.sentimentTrend.slice(-7).map(d => 
                  new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })
                ),
                datasets: [{
                  data: analytics.sentimentTrend.slice(-7).map(d => d.sentiment),
                  color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                  strokeWidth: 3,
                }],
              }}
              width={chartWidth - 32}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </View>
        </View>

        {/* AI Insights */}
        <View style={dynamicStyles.chartSection}>
          <Text style={dynamicStyles.chartTitle}>AI Insights</Text>
          
          <View style={dynamicStyles.insightCard}>
            <Text style={dynamicStyles.insightTitle}>🎯 Peak Activity</Text>
            <Text style={dynamicStyles.insightText}>
              Your most productive day this {selectedPeriod} was {
                analytics.dailyActivity.reduce((max, day) => 
                  day.count > max.count ? day : max
                ).date
              } with {
                Math.max(...analytics.dailyActivity.map(d => d.count))
              } transcripts.
            </Text>
          </View>

          <View style={dynamicStyles.insightCard}>
            <Text style={dynamicStyles.insightTitle}>💡 Content Analysis</Text>
            <Text style={dynamicStyles.insightText}>
              Your conversations are trending {getSentimentText(analytics.averageSentiment).toLowerCase()}. 
              Most discussed topic: {analytics.topicsDistribution[0].topic}.
            </Text>
          </View>

          <View style={dynamicStyles.insightCard}>
            <Text style={dynamicStyles.insightTitle}>⚡ Productivity</Text>
            <Text style={dynamicStyles.insightText}>
              You've created {analytics.actionItemsCreated} action items from your transcripts, 
              showing strong follow-through on conversations.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
} 