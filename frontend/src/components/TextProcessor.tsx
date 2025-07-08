/**
 * Text Processor Component - Comprehensive MCP Processing
 * Uses the new MCP Analysis Engine for advanced action extraction
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../contexts/ThemeContext';
import { MCPAnalysisEngine } from '../services/mcpAnalysisEngine';
import { MCPAction, MCPAnalysisResult, ActionType, Priority, ActionStatus } from '../types/actions';
import { supabase } from '../config/supabase';

export default function TextProcessor() {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<MCPAnalysisResult | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const colors = useThemeColors();

  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(30);

  useEffect(() => {
    const words = inputText.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [inputText]);

  useEffect(() => {
    if (analysisResult) {
      // Animate in the results
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [analysisResult]);

  const handleProcessText = async () => {
    if (!inputText.trim()) {
      Alert.alert('No Text', 'Please enter some text to process.');
      return;
    }

    if (wordCount < 10) {
      Alert.alert('Text Too Short', 'Please enter at least 10 words for meaningful analysis.');
      return;
    }

    setIsProcessing(true);
    setAnalysisResult(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Authentication Error', 'Please sign in to process text.');
        return;
      }

      // Use the comprehensive MCP Analysis Engine
      const engine = MCPAnalysisEngine.getInstance();
      const result = await engine.analyzeText(inputText, user.id);
      
      setAnalysisResult(result);

    } catch (error) {
      console.error('MCP Processing Error:', error);
      Alert.alert('Processing Error', 'Failed to process text. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveAction = (action: MCPAction) => {
    Alert.alert(
      'Approve Action',
      `Do you want to approve this ${action.type.replace('_', ' ')}?\n\n${action.title}\n\nConfidence: ${(action.confidence * 100).toFixed(0)}%\nPriority: ${action.priority}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            // TODO: Implement actual action approval and execution
            Alert.alert('Action Approved', `"${action.title}" has been approved for execution.`);
            // Update action status
            action.status = ActionStatus.APPROVED;
          },
        },
      ]
    );
  };

  const handleDenyAction = (action: MCPAction) => {
    Alert.alert('Action Denied', `"${action.title}" has been denied.`);
    action.status = ActionStatus.DENIED;
  };

  const getActionTypeIcon = (actionType: ActionType) => {
    switch (actionType) {
      case ActionType.SINGLE_EVENT: return 'flash-outline';
      case ActionType.SCHEDULED_EVENT: return 'calendar-outline';
      case ActionType.RECURRING_EVENT: return 'repeat-outline';
      case ActionType.TASK: return 'checkmark-circle-outline';
      case ActionType.EMAIL: return 'mail-outline';
      case ActionType.CONTACT: return 'person-outline';
      case ActionType.REMINDER: return 'alarm-outline';
      case ActionType.CALL: return 'call-outline';
      case ActionType.DOCUMENT: return 'document-outline';
      default: return 'cog-outline';
    }
  };

  const getActionTypeColor = (actionType: ActionType) => {
    switch (actionType) {
      case ActionType.SINGLE_EVENT: return '#FF6B6B';
      case ActionType.SCHEDULED_EVENT: return '#3b82f6';
      case ActionType.RECURRING_EVENT: return '#8b5cf6';
      case ActionType.TASK: return '#f59e0b';
      case ActionType.EMAIL: return '#10b981';
      case ActionType.CONTACT: return '#06b6d4';
      case ActionType.REMINDER: return '#ef4444';
      case ActionType.CALL: return '#84cc16';
      case ActionType.DOCUMENT: return '#6366f1';
      default: return colors.textSecondary;
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.URGENT: return '#dc2626';
      case Priority.HIGH: return '#ea580c';
      case Priority.MEDIUM: return '#d97706';
      case Priority.LOW: return '#65a30d';
      default: return colors.textSecondary;
    }
  };

  const getPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case Priority.URGENT: return 'warning-outline';
      case Priority.HIGH: return 'chevron-up-outline';
      case Priority.MEDIUM: return 'remove-outline';
      case Priority.LOW: return 'chevron-down-outline';
      default: return 'remove-outline';
    }
  };

  const formatActionType = (actionType: ActionType) => {
    return actionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderActionDetails = (action: MCPAction) => {
    switch (action.type) {
      case ActionType.SCHEDULED_EVENT:
        const scheduledAction = action as any;
        return (
          <View style={dynamicStyles.actionDetails}>
            <Text style={dynamicStyles.detailText}>
              📅 {scheduledAction.event_details.start_date} at {scheduledAction.event_details.start_time}
            </Text>
            {scheduledAction.event_details.duration_minutes && (
              <Text style={dynamicStyles.detailText}>
                ⏱️ Duration: {scheduledAction.event_details.duration_minutes} minutes
              </Text>
            )}
            {scheduledAction.event_details.attendees?.length > 0 && (
              <Text style={dynamicStyles.detailText}>
                👥 Attendees: {scheduledAction.event_details.attendees.join(', ')}
              </Text>
            )}
          </View>
        );
      
      case ActionType.RECURRING_EVENT:
        const recurringAction = action as any;
        return (
          <View style={dynamicStyles.actionDetails}>
            <Text style={dynamicStyles.detailText}>
              🔄 Repeats: {recurringAction.recurrence.pattern} (every {recurringAction.recurrence.interval})
            </Text>
            <Text style={dynamicStyles.detailText}>
              📅 Starts: {recurringAction.event_details.start_date} at {recurringAction.event_details.start_time}
            </Text>
          </View>
        );
      
      case ActionType.TASK:
        const taskAction = action as any;
        return (
          <View style={dynamicStyles.actionDetails}>
            {taskAction.task_details.due_date && (
              <Text style={dynamicStyles.detailText}>
                📅 Due: {taskAction.task_details.due_date}
              </Text>
            )}
            {taskAction.task_details.assignee && (
              <Text style={dynamicStyles.detailText}>
                👤 Assigned to: {taskAction.task_details.assignee}
              </Text>
            )}
          </View>
        );
      
      case ActionType.EMAIL:
        const emailAction = action as any;
        return (
          <View style={dynamicStyles.actionDetails}>
            <Text style={dynamicStyles.detailText}>
              📧 To: {emailAction.email_details.to.join(', ') || 'Recipients to be determined'}
            </Text>
            <Text style={dynamicStyles.detailText}>
              📝 Subject: {emailAction.email_details.subject}
            </Text>
          </View>
        );
      
      default:
        return null;
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 16,
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
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    inputSection: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    textInput: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      textAlignVertical: 'top',
      minHeight: 120,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    wordCount: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    processButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    processButtonDisabled: {
      backgroundColor: colors.textSecondary,
      opacity: 0.6,
    },
    processButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    processingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    processingText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginLeft: 12,
    },
    resultsContainer: {
      marginTop: 20,
    },
    resultsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    resultsTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginLeft: 8,
    },
    summaryCard: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryText: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    actionsList: {
      marginTop: 8,
    },
    actionCard: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    actionIcon: {
      marginRight: 12,
    },
    actionTitleContainer: {
      flex: 1,
    },
    actionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    actionType: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: colors.border,
      marginLeft: 8,
    },
    actionTypeText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    priorityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginLeft: 8,
    },
    priorityText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#ffffff',
      marginLeft: 4,
    },
    actionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 12,
      lineHeight: 20,
    },
    actionDetails: {
      marginBottom: 12,
    },
    detailText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    actionFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    confidenceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    confidenceText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 4,
    },
    reasoningText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontStyle: 'italic',
      marginTop: 4,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    approveButton: {
      backgroundColor: '#10b981',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
    },
    denyButton: {
      backgroundColor: '#ef4444',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
    },
    buttonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '600',
    },
    insightsSection: {
      marginTop: 16,
    },
    insightsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    insightItem: {
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    insightText: {
      fontSize: 14,
      color: colors.text,
    },
  });

  return (
    <ScrollView style={dynamicStyles.container} showsVerticalScrollIndicator={false}>
      <View style={dynamicStyles.header}>
        <Ionicons name="analytics-outline" size={28} color={colors.primary} style={dynamicStyles.headerIcon} />
        <Text style={dynamicStyles.headerTitle}>MCP Analysis Engine</Text>
      </View>

      <View style={dynamicStyles.inputSection}>
        <Text style={dynamicStyles.inputLabel}>Enter Text for Comprehensive Analysis</Text>
        <TextInput
          style={dynamicStyles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Enter your text here for AI analysis and action extraction..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={6}
        />
        <View style={dynamicStyles.inputFooter}>
          <Text style={dynamicStyles.wordCount}>
            {wordCount} words
          </Text>
          <TouchableOpacity
            style={[
              dynamicStyles.processButton,
              (isProcessing || wordCount < 10) && dynamicStyles.processButtonDisabled,
            ]}
            onPress={handleProcessText}
            disabled={isProcessing || wordCount < 10}
          >
            <Ionicons name="analytics-outline" size={20} color="#ffffff" />
            <Text style={dynamicStyles.processButtonText}>
              {isProcessing ? 'Analyzing...' : 'Analyze Text'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isProcessing && (
        <View style={dynamicStyles.processingIndicator}>
          <Ionicons name="hourglass-outline" size={24} color={colors.primary} />
          <Text style={dynamicStyles.processingText}>
            Running comprehensive MCP analysis...
          </Text>
        </View>
      )}

      {analysisResult && (
        <Animated.View
          style={[
            dynamicStyles.resultsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={dynamicStyles.resultsHeader}>
            <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
            <Text style={dynamicStyles.resultsTitle}>Analysis Complete</Text>
          </View>

          <View style={dynamicStyles.summaryCard}>
            <Text style={dynamicStyles.summaryText}>
              {analysisResult.summary}
            </Text>
            
            <View style={dynamicStyles.statsRow}>
              <View style={dynamicStyles.statItem}>
                <Text style={dynamicStyles.statValue}>{analysisResult.actions.length}</Text>
                <Text style={dynamicStyles.statLabel}>Actions</Text>
              </View>
              <View style={dynamicStyles.statItem}>
                <Text style={dynamicStyles.statValue}>{(analysisResult.overall_confidence * 100).toFixed(0)}%</Text>
                <Text style={dynamicStyles.statLabel}>Confidence</Text>
              </View>
              <View style={dynamicStyles.statItem}>
                <Text style={dynamicStyles.statValue}>{analysisResult.processing_time_ms}ms</Text>
                <Text style={dynamicStyles.statLabel}>Processing</Text>
              </View>
              <View style={dynamicStyles.statItem}>
                <Text style={dynamicStyles.statValue}>{analysisResult.sentiment?.overall || 'N/A'}</Text>
                <Text style={dynamicStyles.statLabel}>Sentiment</Text>
              </View>
            </View>
          </View>

          {analysisResult.actions.length > 0 && (
            <View style={dynamicStyles.actionsList}>
              {analysisResult.actions.map((action) => (
                <View key={action.id} style={dynamicStyles.actionCard}>
                  <View style={dynamicStyles.actionHeader}>
                    <Ionicons
                      name={getActionTypeIcon(action.type)}
                      size={20}
                      color={getActionTypeColor(action.type)}
                      style={dynamicStyles.actionIcon}
                    />
                    <View style={dynamicStyles.actionTitleContainer}>
                      <Text style={dynamicStyles.actionTitle}>{action.title}</Text>
                    </View>
                    <View style={dynamicStyles.actionType}>
                      <Text style={dynamicStyles.actionTypeText}>{formatActionType(action.type)}</Text>
                    </View>
                    <View style={[dynamicStyles.priorityBadge, { backgroundColor: getPriorityColor(action.priority) }]}>
                      <Ionicons name={getPriorityIcon(action.priority)} size={12} color="#ffffff" />
                      <Text style={dynamicStyles.priorityText}>{action.priority}</Text>
                    </View>
                  </View>
                  
                  <Text style={dynamicStyles.actionDescription}>
                    {action.description}
                  </Text>

                  {renderActionDetails(action)}
                  
                  <View style={dynamicStyles.actionFooter}>
                    <View style={dynamicStyles.confidenceContainer}>
                      <Ionicons 
                        name="analytics-outline" 
                        size={16} 
                        color={colors.textSecondary} 
                      />
                      <Text style={dynamicStyles.confidenceText}>
                        {(action.confidence * 100).toFixed(0)}% confidence
                      </Text>
                    </View>
                    
                    <View style={dynamicStyles.actionButtons}>
                      <TouchableOpacity
                        style={dynamicStyles.denyButton}
                        onPress={() => handleDenyAction(action)}
                      >
                        <Text style={dynamicStyles.buttonText}>Deny</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={dynamicStyles.approveButton}
                        onPress={() => handleApproveAction(action)}
                      >
                        <Text style={dynamicStyles.buttonText}>Approve</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <Text style={dynamicStyles.reasoningText}>
                    {action.reasoning}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {analysisResult.key_insights.length > 0 && (
            <View style={dynamicStyles.insightsSection}>
              <Text style={dynamicStyles.insightsTitle}>Key Insights</Text>
              {analysisResult.key_insights.map((insight, index) => (
                <View key={index} style={dynamicStyles.insightItem}>
                  <Text style={dynamicStyles.insightText}>{insight}</Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      )}
    </ScrollView>
  );
} 