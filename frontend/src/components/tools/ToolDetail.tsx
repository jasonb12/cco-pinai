/**
 * Tool Detail Component - Detailed view with Settings/Triggers/Logs tabs
 * Based on PRD-UI.md specifications for Tools tab
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../contexts/ThemeContext';
import { Tool, ToolTrigger, ToolAction, ToolLog, ToolStatus, ToolCapability, TriggerType, LogLevel, LogStatus } from '../../types/tools';

interface ToolDetailProps {
  tool: Tool;
  isOpen: boolean;
  onClose: () => void;
  onSave: (tool: Tool) => void;
  onDelete: () => void;
  onTestConnection?: () => void;
}

export default function ToolDetail({
  tool,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onTestConnection
}: ToolDetailProps) {
  const colors = useThemeColors();
  const [activeTab, setActiveTab] = useState<'settings' | 'triggers' | 'logs'>('settings');
  const [editedTool, setEditedTool] = useState<Tool>(tool);
  const [hasChanges, setHasChanges] = useState(false);

  // Mock data for triggers and logs
  const mockTriggers: ToolTrigger[] = [
    {
      id: '1',
      name: 'Daily Sync',
      description: 'Sync data every day at 9 AM',
      type: TriggerType.SCHEDULE,
      condition: '0 9 * * *',
      isActive: true,
      config: { timezone: 'UTC', retryCount: 3 },
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      lastTriggered: new Date(Date.now() - 3600000).toISOString(),
      triggerCount: 45,
    },
    {
      id: '2',
      name: 'New Message Webhook',
      description: 'Trigger when new message received',
      type: TriggerType.WEBHOOK,
      condition: 'POST /webhook/message',
      isActive: true,
      config: { secret: 'hidden', validateSignature: true },
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      lastTriggered: new Date(Date.now() - 900000).toISOString(),
      triggerCount: 128,
    },
  ];

  const mockLogs: ToolLog[] = [
    {
      id: '1',
      toolId: tool.id,
      timestamp: new Date(Date.now() - 300000).toISOString(),
      level: LogLevel.INFO,
      message: 'Successfully processed 15 items',
      status: LogStatus.SUCCESS,
      executionTime: 2340,
      details: { itemsProcessed: 15, errors: 0 },
    },
    {
      id: '2',
      toolId: tool.id,
      timestamp: new Date(Date.now() - 900000).toISOString(),
      level: LogLevel.WARN,
      message: 'Rate limit approaching (85% of quota used)',
      status: LogStatus.SUCCESS,
      executionTime: 1200,
      details: { quotaUsed: 85, quotaLimit: 100 },
    },
    {
      id: '3',
      toolId: tool.id,
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      level: LogLevel.ERROR,
      message: 'Failed to connect to API endpoint',
      status: LogStatus.FAILURE,
      executionTime: 5000,
      details: { error: 'Connection timeout', endpoint: 'https://api.example.com' },
    },
  ];

  const handleSave = () => {
    onSave(editedTool);
    setHasChanges(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Tool',
      `Are you sure you want to delete "${tool.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  const updateTool = (updates: Partial<Tool>) => {
    setEditedTool({ ...editedTool, ...updates });
    setHasChanges(true);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getLogLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.DEBUG: return '#6b7280';
      case LogLevel.INFO: return '#3b82f6';
      case LogLevel.WARN: return '#f59e0b';
      case LogLevel.ERROR: return '#ef4444';
      case LogLevel.FATAL: return '#7c2d12';
      default: return colors.textSecondary;
    }
  };

  const getLogStatusColor = (status: LogStatus) => {
    switch (status) {
      case LogStatus.SUCCESS: return '#10b981';
      case LogStatus.FAILURE: return '#ef4444';
      case LogStatus.PENDING: return '#f59e0b';
      case LogStatus.TIMEOUT: return '#f97316';
      case LogStatus.CANCELLED: return '#6b7280';
      default: return colors.textSecondary;
    }
  };

  const renderSettingsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Basic Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Settings</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Tool Name</Text>
            <TextInput
              style={[styles.settingInput, { color: colors.text, borderColor: colors.border }]}
              value={editedTool.name}
              onChangeText={(text) => updateTool({ name: text })}
              placeholder="Enter tool name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Description</Text>
            <TextInput
              style={[styles.settingInput, styles.multilineInput, { color: colors.text, borderColor: colors.border }]}
              value={editedTool.description}
              onChangeText={(text) => updateTool({ description: text })}
              placeholder="Enter tool description"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Active</Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Enable or disable this tool
            </Text>
          </View>
          <Switch
            value={editedTool.isActive}
            onValueChange={(value) => updateTool({ isActive: value })}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={editedTool.isActive ? '#ffffff' : colors.textSecondary}
          />
        </View>
      </View>

      {/* Connection Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Connection</Text>
        
        <View style={styles.connectionStatus}>
          <View style={styles.connectionIndicator}>
            <View style={[
              styles.statusDot,
              { backgroundColor: editedTool.integration?.status === 'connected' ? '#10b981' : '#ef4444' }
            ]} />
            <Text style={[styles.connectionText, { color: colors.text }]}>
              {editedTool.integration?.status === 'connected' ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
          
          {onTestConnection && (
            <TouchableOpacity
              style={styles.testButton}
              onPress={onTestConnection}
              activeOpacity={0.8}
            >
              <Ionicons name="flash-outline" size={16} color={colors.primary} />
              <Text style={[styles.testButtonText, { color: colors.primary }]}>
                Test Connection
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {editedTool.integration && (
          <View style={styles.connectionDetails}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Provider:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {editedTool.integration.provider}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Type:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {editedTool.integration.type}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Last Sync:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {editedTool.integration.lastSync ? formatTimestamp(editedTool.integration.lastSync) : 'Never'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Usage Statistics */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Usage Statistics</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {editedTool.usageCount.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Uses
            </Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {editedTool.rating.toFixed(1)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Rating
            </Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {editedTool.lastUsed ? formatTimestamp(editedTool.lastUsed).split(',')[0] : 'Never'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Last Used
            </Text>
          </View>
        </View>
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>Danger Zone</Text>
        
        <TouchableOpacity
          style={styles.dangerButton}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
          <Text style={styles.dangerButtonText}>Delete Tool</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderTriggersTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Triggers</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => console.log('Add trigger')}
            activeOpacity={0.8}
          >
            <Ionicons name="add-outline" size={16} color={colors.primary} />
            <Text style={[styles.addButtonText, { color: colors.primary }]}>
              Add Trigger
            </Text>
          </TouchableOpacity>
        </View>

        {mockTriggers.map((trigger) => (
          <View key={trigger.id} style={styles.triggerCard}>
            <View style={styles.triggerHeader}>
              <View style={styles.triggerInfo}>
                <Text style={[styles.triggerName, { color: colors.text }]}>
                  {trigger.name}
                </Text>
                <Text style={[styles.triggerDescription, { color: colors.textSecondary }]}>
                  {trigger.description}
                </Text>
              </View>
              
              <Switch
                value={trigger.isActive}
                onValueChange={(value) => console.log('Toggle trigger', trigger.id, value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={trigger.isActive ? '#ffffff' : colors.textSecondary}
              />
            </View>

            <View style={styles.triggerDetails}>
              <View style={styles.triggerMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {trigger.type}
                  </Text>
                </View>
                
                <View style={styles.metaItem}>
                  <Ionicons name="play-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {trigger.triggerCount} times
                  </Text>
                </View>
                
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {trigger.lastTriggered ? formatTimestamp(trigger.lastTriggered).split(',')[0] : 'Never'}
                  </Text>
                </View>
              </View>

              <View style={styles.triggerActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => console.log('Edit trigger', trigger.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="create-outline" size={16} color={colors.text} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => console.log('Delete trigger', trigger.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderLogsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Activity Logs</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => console.log('Refresh logs')}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh-outline" size={16} color={colors.text} />
            <Text style={[styles.refreshButtonText, { color: colors.text }]}>
              Refresh
            </Text>
          </TouchableOpacity>
        </View>

        {mockLogs.map((log) => (
          <View key={log.id} style={styles.logCard}>
            <View style={styles.logHeader}>
              <View style={styles.logLevel}>
                <View style={[
                  styles.logLevelDot,
                  { backgroundColor: getLogLevelColor(log.level) }
                ]} />
                <Text style={[styles.logLevelText, { color: getLogLevelColor(log.level) }]}>
                  {log.level.toUpperCase()}
                </Text>
              </View>
              
              <View style={styles.logStatus}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: getLogStatusColor(log.status) }
                ]} />
                <Text style={[styles.logStatusText, { color: getLogStatusColor(log.status) }]}>
                  {log.status}
                </Text>
              </View>
              
              <Text style={[styles.logTimestamp, { color: colors.textSecondary }]}>
                {formatTimestamp(log.timestamp)}
              </Text>
            </View>

            <Text style={[styles.logMessage, { color: colors.text }]}>
              {log.message}
            </Text>

            <View style={styles.logMeta}>
              {log.executionTime && (
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {formatDuration(log.executionTime)}
                  </Text>
                </View>
              )}
              
              {log.details && (
                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => console.log('Show details', log.details)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="information-circle-outline" size={12} color={colors.primary} />
                  <Text style={[styles.detailsButtonText, { color: colors.primary }]}>
                    Details
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      backgroundColor: colors.background,
      borderRadius: 12,
      margin: 20,
      maxHeight: '90%',
      width: '90%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
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
    tabContent: {
      flex: 1,
      paddingHorizontal: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 16,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingInfo: {
      flex: 1,
    },
    settingLabel: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 14,
      marginBottom: 8,
    },
    settingInput: {
      fontSize: 16,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.surface,
    },
    multilineInput: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    connectionStatus: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      marginBottom: 16,
    },
    connectionIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    connectionText: {
      fontSize: 16,
      fontWeight: '500',
    },
    testButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.primary,
      gap: 4,
    },
    testButtonText: {
      fontSize: 14,
      fontWeight: '500',
    },
    connectionDetails: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 16,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    detailLabel: {
      fontSize: 14,
      fontWeight: '500',
    },
    detailValue: {
      fontSize: 14,
    },
    statsGrid: {
      flexDirection: 'row',
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      textAlign: 'center',
    },
    dangerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: '#ef4444',
      gap: 8,
    },
    dangerButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ef4444',
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.primary,
      gap: 4,
    },
    addButtonText: {
      fontSize: 14,
      fontWeight: '500',
    },
    triggerCard: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    triggerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    triggerInfo: {
      flex: 1,
    },
    triggerName: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    triggerDescription: {
      fontSize: 14,
      lineHeight: 20,
    },
    triggerDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    triggerMeta: {
      flexDirection: 'row',
      gap: 16,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontSize: 12,
    },
    triggerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: colors.background,
    },
    refreshButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },
    refreshButtonText: {
      fontSize: 14,
      fontWeight: '500',
    },
    logCard: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    logHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    logLevel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    logLevelDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    logLevelText: {
      fontSize: 10,
      fontWeight: '600',
    },
    logStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    logStatusText: {
      fontSize: 12,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    logTimestamp: {
      fontSize: 12,
    },
    logMessage: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 8,
    },
    logMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    detailsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    detailsButtonText: {
      fontSize: 12,
      fontWeight: '500',
    },
    actions: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 12,
    },
    actionButton2: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    saveButton: {
      backgroundColor: colors.primary,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: colors.text,
    },
    saveButtonText: {
      color: '#ffffff',
    },
  });

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{tool.name}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'settings' ? styles.activeTab : styles.inactiveTab]}
              onPress={() => setActiveTab('settings')}
            >
              <Text style={[styles.tabText, activeTab === 'settings' ? styles.activeTabText : styles.inactiveTabText]}>
                Settings
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'triggers' ? styles.activeTab : styles.inactiveTab]}
              onPress={() => setActiveTab('triggers')}
            >
              <Text style={[styles.tabText, activeTab === 'triggers' ? styles.activeTabText : styles.inactiveTabText]}>
                Triggers
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'logs' ? styles.activeTab : styles.inactiveTab]}
              onPress={() => setActiveTab('logs')}
            >
              <Text style={[styles.tabText, activeTab === 'logs' ? styles.activeTabText : styles.inactiveTabText]}>
                Logs
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {activeTab === 'settings' && renderSettingsTab()}
          {activeTab === 'triggers' && renderTriggersTab()}
          {activeTab === 'logs' && renderLogsTab()}

          {/* Actions */}
          {activeTab === 'settings' && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton2, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton2, styles.saveButton]}
                onPress={handleSave}
                disabled={!hasChanges}
              >
                <Text style={[styles.actionButtonText, styles.saveButtonText]}>
                  Save Changes
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
} 