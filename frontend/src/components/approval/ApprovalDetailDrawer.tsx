/**
 * Approval Detail Drawer - Bottom sheet with action details
 * Based on PRD-UI.md specifications
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../contexts/ThemeContext';
import { MCPAction, ActionType, Priority, ActionStatus } from '../../types/actions';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ApprovalDetailDrawerProps {
  action: MCPAction | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (action: MCPAction, modifications?: Partial<MCPAction>) => void;
  onDeny: (action: MCPAction, reason?: string) => void;
  onSchedule: (action: MCPAction, executeAt: string) => void;
}

export default function ApprovalDetailDrawer({
  action,
  isOpen,
  onClose,
  onApprove,
  onDeny,
  onSchedule
}: ApprovalDetailDrawerProps) {
  const colors = useThemeColors();
  const [activeTab, setActiveTab] = useState<'details' | 'payload' | 'schedule'>('details');
  const [modifications, setModifications] = useState<Partial<MCPAction>>({});
  const [denyReason, setDenyReason] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  
  const slideAnim = new Animated.Value(SCREEN_HEIGHT);

  React.useEffect(() => {
    if (isOpen) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: SCREEN_HEIGHT,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [isOpen]);

  if (!action) return null;

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

  const formatActionType = (actionType: ActionType) => {
    return actionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderPayloadView = () => {
    const payload = JSON.stringify(action, null, 2);
    return (
      <View style={styles.payloadContainer}>
        <Text style={[styles.payloadTitle, { color: colors.text }]}>Execution Payload</Text>
        <ScrollView style={styles.payloadScroll} nestedScrollEnabled>
          <Text style={[styles.payloadText, { color: colors.textSecondary }]}>
            {payload}
          </Text>
        </ScrollView>
        
        <View style={styles.payloadActions}>
          <TouchableOpacity 
            style={[styles.payloadButton, { backgroundColor: colors.border }]}
            onPress={() => {
              // Copy to clipboard functionality would go here
              console.log('Copy payload to clipboard');
            }}
          >
            <Ionicons name="copy-outline" size={16} color={colors.text} />
            <Text style={[styles.payloadButtonText, { color: colors.text }]}>Copy JSON</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderScheduleView = () => {
    return (
      <View style={styles.scheduleContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Schedule Execution</Text>
        
        <View style={styles.scheduleForm}>
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Execute Date</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={scheduleDate}
              onChangeText={setScheduleDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Execute Time</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={scheduleTime}
              onChangeText={setScheduleTime}
              placeholder="HH:MM"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          
          <TouchableOpacity
            style={[styles.scheduleButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              if (scheduleDate && scheduleTime) {
                const executeAt = `${scheduleDate}T${scheduleTime}:00Z`;
                onSchedule(action, executeAt);
                onClose();
              }
            }}
          >
            <Ionicons name="time-outline" size={16} color="#ffffff" />
            <Text style={styles.scheduleButtonText}>Schedule Execution</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderDetailsView = () => {
    return (
      <ScrollView style={styles.detailsContainer} nestedScrollEnabled>
        {/* Action Header */}
        <View style={styles.actionHeader}>
          <View style={styles.actionInfo}>
            <Ionicons
              name={getActionTypeIcon(action.type)}
              size={24}
              color={getActionTypeColor(action.type)}
            />
            <View style={styles.actionTitleContainer}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>{action.title}</Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                {formatActionType(action.type)}
              </Text>
            </View>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(action.priority) }]}>
            <Ionicons name="flag-outline" size={12} color="#ffffff" />
            <Text style={styles.priorityText}>{action.priority}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {action.description}
          </Text>
        </View>

        {/* AI Analysis */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Analysis</Text>
          <View style={styles.analysisCard}>
            <View style={styles.confidenceRow}>
              <Text style={[styles.label, { color: colors.text }]}>Confidence Score</Text>
              <Text style={[styles.confidenceValue, { color: getActionTypeColor(action.type) }]}>
                {(action.confidence * 100).toFixed(0)}%
              </Text>
            </View>
            <Text style={[styles.reasoning, { color: colors.textSecondary }]}>
              {action.reasoning}
            </Text>
          </View>
        </View>

        {/* Type-specific Details */}
        {renderTypeSpecificDetails()}

        {/* Source Text */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Source Text</Text>
          <View style={[styles.sourceTextCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sourceText, { color: colors.textSecondary }]}>
              {action.source_text}
            </Text>
          </View>
        </View>

        {/* Timestamps */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Timeline</Text>
          <View style={styles.timestampRow}>
            <Text style={[styles.label, { color: colors.text }]}>Created</Text>
            <Text style={[styles.timestampValue, { color: colors.textSecondary }]}>
              {new Date(action.created_at).toLocaleString()}
            </Text>
          </View>
          <View style={styles.timestampRow}>
            <Text style={[styles.label, { color: colors.text }]}>Updated</Text>
            <Text style={[styles.timestampValue, { color: colors.textSecondary }]}>
              {new Date(action.updated_at).toLocaleString()}
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderTypeSpecificDetails = () => {
    switch (action.type) {
      case ActionType.SCHEDULED_EVENT:
        const scheduledAction = action as any;
        return (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Event Details</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <Text style={[styles.label, { color: colors.text }]}>Date</Text>
                <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                  {scheduledAction.event_details?.start_date || 'Not specified'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.label, { color: colors.text }]}>Time</Text>
                <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                  {scheduledAction.event_details?.start_time || 'Not specified'}
                </Text>
              </View>
              {scheduledAction.event_details?.duration_minutes && (
                <View style={styles.detailRow}>
                  <Text style={[styles.label, { color: colors.text }]}>Duration</Text>
                  <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                    {scheduledAction.event_details.duration_minutes} minutes
                  </Text>
                </View>
              )}
              {scheduledAction.event_details?.location && (
                <View style={styles.detailRow}>
                  <Text style={[styles.label, { color: colors.text }]}>Location</Text>
                  <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                    {scheduledAction.event_details.location}
                  </Text>
                </View>
              )}
            </View>
          </View>
        );

      case ActionType.RECURRING_EVENT:
        const recurringAction = action as any;
        return (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recurrence Details</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <Text style={[styles.label, { color: colors.text }]}>Pattern</Text>
                <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                  {recurringAction.recurrence?.pattern || 'Not specified'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.label, { color: colors.text }]}>Interval</Text>
                <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                  Every {recurringAction.recurrence?.interval || 1}
                </Text>
              </View>
            </View>
          </View>
        );

      case ActionType.EMAIL:
        const emailAction = action as any;
        return (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Email Details</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <Text style={[styles.label, { color: colors.text }]}>To</Text>
                <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                  {emailAction.email_details?.to?.join(', ') || 'Recipients TBD'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.label, { color: colors.text }]}>Subject</Text>
                <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                  {emailAction.email_details?.subject || 'No subject'}
                </Text>
              </View>
            </View>
          </View>
        );

      case ActionType.TASK:
        const taskAction = action as any;
        return (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Task Details</Text>
            <View style={styles.detailsGrid}>
              {taskAction.task_details?.due_date && (
                <View style={styles.detailRow}>
                  <Text style={[styles.label, { color: colors.text }]}>Due Date</Text>
                  <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                    {taskAction.task_details.due_date}
                  </Text>
                </View>
              )}
              {taskAction.task_details?.assignee && (
                <View style={styles.detailRow}>
                  <Text style={[styles.label, { color: colors.text }]}>Assignee</Text>
                  <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                    {taskAction.task_details.assignee}
                  </Text>
                </View>
              )}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: SCREEN_HEIGHT * 0.9,
      minHeight: SCREEN_HEIGHT * 0.6,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: 8,
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    tabContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 4,
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    inactiveTab: {
      backgroundColor: colors.surface,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
    },
    activeTabText: {
      color: '#ffffff',
    },
    inactiveTabText: {
      color: colors.textSecondary,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    detailsContainer: {
      flex: 1,
    },
    actionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
    },
    actionInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    actionTitleContainer: {
      marginLeft: 12,
      flex: 1,
    },
    actionTitle: {
      fontSize: 18,
      fontWeight: '600',
    },
    actionSubtitle: {
      fontSize: 14,
      marginTop: 2,
    },
    priorityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      gap: 4,
    },
    priorityText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#ffffff',
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
    },
    description: {
      fontSize: 14,
      lineHeight: 20,
    },
    analysisCard: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    confidenceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    confidenceValue: {
      fontSize: 16,
      fontWeight: '600',
    },
    reasoning: {
      fontSize: 14,
      lineHeight: 20,
      fontStyle: 'italic',
    },
    detailsGrid: {
      gap: 12,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
    },
    detailValue: {
      fontSize: 14,
      flex: 1,
      textAlign: 'right',
    },
    sourceTextCard: {
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
    },
    sourceText: {
      fontSize: 14,
      lineHeight: 20,
    },
    timestampRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    timestampValue: {
      fontSize: 14,
    },
    payloadContainer: {
      flex: 1,
      paddingVertical: 16,
    },
    payloadTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
    },
    payloadScroll: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    payloadText: {
      fontSize: 12,
      fontFamily: 'monospace',
      lineHeight: 16,
    },
    payloadActions: {
      flexDirection: 'row',
      gap: 12,
    },
    payloadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 8,
    },
    payloadButtonText: {
      fontSize: 14,
      fontWeight: '500',
    },
    scheduleContainer: {
      flex: 1,
      paddingVertical: 16,
    },
    scheduleForm: {
      gap: 16,
    },
    formGroup: {
      gap: 8,
    },
    input: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
    },
    scheduleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 8,
      gap: 8,
      marginTop: 16,
    },
    scheduleButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
    },
    footer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 12,
    },
    footerButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    denyButton: {
      backgroundColor: '#ef4444',
    },
    approveButton: {
      backgroundColor: '#10b981',
    },
    footerButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
    },
  });

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Action Details</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'details' ? styles.activeTab : styles.inactiveTab]}
              onPress={() => setActiveTab('details')}
            >
              <Text style={[styles.tabText, activeTab === 'details' ? styles.activeTabText : styles.inactiveTabText]}>
                Details
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'payload' ? styles.activeTab : styles.inactiveTab]}
              onPress={() => setActiveTab('payload')}
            >
              <Text style={[styles.tabText, activeTab === 'payload' ? styles.activeTabText : styles.inactiveTabText]}>
                Payload
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'schedule' ? styles.activeTab : styles.inactiveTab]}
              onPress={() => setActiveTab('schedule')}
            >
              <Text style={[styles.tabText, activeTab === 'schedule' ? styles.activeTabText : styles.inactiveTabText]}>
                Schedule
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {activeTab === 'details' && renderDetailsView()}
            {activeTab === 'payload' && renderPayloadView()}
            {activeTab === 'schedule' && renderScheduleView()}
          </View>

          {/* Footer Actions */}
          {action.status === ActionStatus.PENDING && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.footerButton, styles.denyButton]}
                onPress={() => {
                  onDeny(action, denyReason);
                  onClose();
                }}
              >
                <Text style={styles.footerButtonText}>Deny</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.footerButton, styles.approveButton]}
                onPress={() => {
                  onApprove(action, modifications);
                  onClose();
                }}
              >
                <Text style={styles.footerButtonText}>Approve</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}