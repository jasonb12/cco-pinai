/**
 * Tools Tab - Complete tools and integrations management interface
 * Based on PRD-UI.md specifications
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../contexts/ThemeContext';
import { Tool, ToolCategory, ToolStatus, ToolCapability, IntegrationType, IntegrationStatus, AuthType, PricingModel, BillingPeriod } from '../../types/tools';
import ToolList from '../tools/ToolList';
import ToolDetail from '../tools/ToolDetail';
import AddIntegrationFAB from '../tools/AddIntegrationFAB';
import IntegrationWizard from '../tools/IntegrationWizard';

// Mock tools data
const mockTools: Tool[] = [
  {
    id: '1',
    name: 'Slack Integration',
    description: 'Connect with Slack for team communication and notifications',
    category: ToolCategory.COMMUNICATION,
    icon: 'https://example.com/slack-icon.png',
    color: '#4A154B',
    version: '2.1.0',
    status: ToolStatus.ACTIVE,
    isActive: true,
    lastUsed: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    usageCount: 1247,
    rating: 4.8,
    tags: ['messaging', 'notifications', 'team'],
    config: {
      settings: { webhookUrl: 'https://hooks.slack.com/...' },
      triggers: [],
      actions: [],
      permissions: [],
    },
    integration: {
      id: 'slack-1',
      name: 'Slack Workspace',
      provider: 'Slack',
      type: IntegrationType.OAUTH,
      status: IntegrationStatus.CONNECTED,
      connectionDetails: { customFields: { workspace: 'my-team' } },
      authConfig: { type: AuthType.OAUTH2, credentials: {}, scopes: ['chat:write', 'channels:read'] },
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      lastSync: new Date(Date.now() - 1800000).toISOString(),
      errorCount: 0,
      successCount: 1247,
    },
    capabilities: [ToolCapability.READ_DATA, ToolCapability.WRITE_DATA, ToolCapability.WEBHOOKS, ToolCapability.REAL_TIME],
    pricing: { model: PricingModel.FREE, cost: 0, currency: 'USD', billingPeriod: BillingPeriod.MONTHLY },
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    createdBy: 'user-1',
  },
  {
    id: '2',
    name: 'Google Calendar',
    description: 'Sync calendar events and manage scheduling across platforms',
    category: ToolCategory.PRODUCTIVITY,
    icon: 'https://example.com/gcal-icon.png',
    color: '#4285F4',
    version: '1.5.2',
    status: ToolStatus.ACTIVE,
    isActive: true,
    lastUsed: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    usageCount: 892,
    rating: 4.6,
    tags: ['calendar', 'scheduling', 'productivity'],
    config: {
      settings: { calendarId: 'primary', syncDirection: 'bidirectional' },
      triggers: [],
      actions: [],
      permissions: [],
    },
    integration: {
      id: 'gcal-1',
      name: 'Google Calendar',
      provider: 'Google',
      type: IntegrationType.OAUTH,
      status: IntegrationStatus.CONNECTED,
      connectionDetails: { customFields: { email: 'user@example.com' } },
      authConfig: { type: AuthType.OAUTH2, credentials: {}, scopes: ['calendar.events', 'calendar.readonly'] },
      createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
      lastSync: new Date(Date.now() - 900000).toISOString(),
      errorCount: 2,
      successCount: 890,
    },
    capabilities: [ToolCapability.READ_DATA, ToolCapability.WRITE_DATA, ToolCapability.SCHEDULING],
    pricing: { model: PricingModel.FREE, cost: 0, currency: 'USD', billingPeriod: BillingPeriod.MONTHLY },
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    createdBy: 'user-1',
  },
  {
    id: '3',
    name: 'GitHub Repository',
    description: 'Monitor code repositories, issues, and pull requests',
    category: ToolCategory.DEVELOPMENT,
    icon: 'https://example.com/github-icon.png',
    color: '#181717',
    version: '3.0.1',
    status: ToolStatus.ACTIVE,
    isActive: false,
    lastUsed: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    usageCount: 456,
    rating: 4.9,
    tags: ['git', 'development', 'ci/cd'],
    config: {
      settings: { repository: 'user/repo', branch: 'main' },
      triggers: [],
      actions: [],
      permissions: [],
    },
    integration: {
      id: 'github-1',
      name: 'GitHub',
      provider: 'GitHub',
      type: IntegrationType.API_KEY,
      status: IntegrationStatus.CONNECTED,
      connectionDetails: { username: 'developer' },
      authConfig: { type: AuthType.API_KEY, credentials: { token: 'ghp_...' } },
      createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
      lastSync: new Date(Date.now() - 86400000).toISOString(),
      errorCount: 5,
      successCount: 451,
    },
    capabilities: [ToolCapability.READ_DATA, ToolCapability.WEBHOOKS, ToolCapability.API_ACCESS],
    pricing: { model: PricingModel.FREE, cost: 0, currency: 'USD', billingPeriod: BillingPeriod.MONTHLY },
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdBy: 'user-1',
  },
  {
    id: '4',
    name: 'OpenAI Assistant',
    description: 'AI-powered text generation and analysis for enhanced productivity',
    category: ToolCategory.AI_ML,
    icon: 'https://example.com/openai-icon.png',
    color: '#412991',
    version: '1.2.0',
    status: ToolStatus.PENDING,
    isActive: false,
    lastUsed: undefined,
    usageCount: 0,
    rating: 0,
    tags: ['ai', 'gpt', 'text-generation'],
    config: {
      settings: { model: 'gpt-4', maxTokens: 2000 },
      triggers: [],
      actions: [],
      permissions: [],
    },
    integration: {
      id: 'openai-1',
      name: 'OpenAI',
      provider: 'OpenAI',
      type: IntegrationType.API_KEY,
      status: IntegrationStatus.PENDING,
      connectionDetails: {},
      authConfig: { type: AuthType.API_KEY, credentials: {} },
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      lastSync: undefined,
      errorCount: 0,
      successCount: 0,
    },
    capabilities: [ToolCapability.API_ACCESS, ToolCapability.BATCH_PROCESSING],
    pricing: { model: PricingModel.USAGE_BASED, cost: 0.002, currency: 'USD', billingPeriod: BillingPeriod.PER_USE },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    createdBy: 'user-1',
  },
  {
    id: '5',
    name: 'Notion Database',
    description: 'Sync and manage content with Notion databases and pages',
    category: ToolCategory.PRODUCTIVITY,
    icon: 'https://example.com/notion-icon.png',
    color: '#000000',
    version: '2.3.1',
    status: ToolStatus.ERROR,
    isActive: true,
    lastUsed: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
    usageCount: 234,
    rating: 4.2,
    tags: ['notes', 'database', 'collaboration'],
    config: {
      settings: { databaseId: 'abc123', pageLimit: 100 },
      triggers: [],
      actions: [],
      permissions: [],
    },
    integration: {
      id: 'notion-1',
      name: 'Notion Workspace',
      provider: 'Notion',
      type: IntegrationType.OAUTH,
      status: IntegrationStatus.ERROR,
      connectionDetails: { customFields: { workspace: 'My Workspace' } },
      authConfig: { type: AuthType.OAUTH2, credentials: {}, tokenExpiry: new Date(Date.now() - 3600000).toISOString() },
      createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
      lastSync: new Date(Date.now() - 21600000).toISOString(),
      errorCount: 12,
      successCount: 222,
    },
    capabilities: [ToolCapability.READ_DATA, ToolCapability.WRITE_DATA, ToolCapability.FILE_UPLOAD],
    pricing: { model: PricingModel.FREE, cost: 0, currency: 'USD', billingPeriod: BillingPeriod.MONTHLY },
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 14400000).toISOString(),
    createdBy: 'user-1',
  },
];

export default function ToolsTab() {
  const colors = useThemeColors();
  const [tools, setTools] = useState<Tool[]>(mockTools);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [showToolDetail, setShowToolDetail] = useState(false);
  const [showIntegrationWizard, setShowIntegrationWizard] = useState(false);
  const [wizardIntegrationId, setWizardIntegrationId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const handleToolPress = (tool: Tool) => {
    setSelectedTool(tool);
    setShowToolDetail(true);
  };

  const handleToolToggle = (toolId: string) => {
    setTools(prev => prev.map(tool => 
      tool.id === toolId 
        ? { ...tool, isActive: !tool.isActive, updatedAt: new Date().toISOString() }
        : tool
    ));
  };

  const handleToolSettings = (tool: Tool) => {
    setSelectedTool(tool);
    setShowToolDetail(true);
  };

  const handleToolDelete = (toolId: string) => {
    Alert.alert(
      'Delete Tool',
      'Are you sure you want to delete this tool? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setTools(prev => prev.filter(tool => tool.id !== toolId));
          },
        },
      ]
    );
  };

  const handleAddIntegration = (integrationId: string) => {
    setWizardIntegrationId(integrationId);
    setShowIntegrationWizard(true);
  };

  const handleCustomIntegration = () => {
    setWizardIntegrationId(undefined);
    setShowIntegrationWizard(true);
  };

  const handleToolSave = (updatedTool: Tool) => {
    setTools(prev => prev.map(tool => 
      tool.id === updatedTool.id ? updatedTool : tool
    ));
    setShowToolDetail(false);
  };

  const handleToolDetailDelete = () => {
    if (selectedTool) {
      setTools(prev => prev.filter(tool => tool.id !== selectedTool.id));
      setShowToolDetail(false);
    }
  };

  const handleTestConnection = () => {
    Alert.alert(
      'Test Connection',
      'Connection test successful! All systems are working properly.',
      [{ text: 'OK' }]
    );
  };

  const handleWizardComplete = (integrationData: any) => {
    // Create new tool from integration data
    const newTool: Tool = {
      id: Date.now().toString(),
      name: integrationData.name || `${integrationData.provider} Integration`,
      description: integrationData.description || `Integration with ${integrationData.provider}`,
      category: getToolCategory(integrationData.provider),
      icon: getToolIcon(integrationData.provider),
      color: getToolColor(integrationData.provider),
      version: '1.0.0',
      status: ToolStatus.ACTIVE,
      isActive: true,
      lastUsed: undefined,
      usageCount: 0,
      rating: 0,
      tags: [integrationData.provider.toLowerCase()],
      config: {
        settings: integrationData,
        triggers: [],
        actions: [],
        permissions: [],
      },
      integration: {
        id: `${integrationData.provider.toLowerCase()}-${Date.now()}`,
        name: integrationData.name,
        provider: integrationData.provider,
        type: integrationData.type || IntegrationType.API_KEY,
        status: IntegrationStatus.CONNECTED,
        connectionDetails: {},
        authConfig: {
          type: integrationData.authType || AuthType.API_KEY,
          credentials: { apiKey: integrationData.apiKey },
        },
        createdAt: new Date().toISOString(),
        lastSync: undefined,
        errorCount: 0,
        successCount: 0,
      },
      capabilities: getToolCapabilities(integrationData.provider),
      pricing: { model: PricingModel.FREE, cost: 0, currency: 'USD', billingPeriod: BillingPeriod.MONTHLY },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'user-1',
    };

    setTools(prev => [...prev, newTool]);
  };

  const handleRefresh = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  // Helper functions
  const getToolCategory = (provider: string): ToolCategory => {
    switch (provider.toLowerCase()) {
      case 'slack': return ToolCategory.COMMUNICATION;
      case 'google': return ToolCategory.PRODUCTIVITY;
      case 'github': return ToolCategory.DEVELOPMENT;
      case 'notion': return ToolCategory.PRODUCTIVITY;
      case 'openai': return ToolCategory.AI_ML;
      default: return ToolCategory.CUSTOM;
    }
  };

  const getToolIcon = (provider: string): string => {
    return `https://example.com/${provider.toLowerCase()}-icon.png`;
  };

  const getToolColor = (provider: string): string => {
    switch (provider.toLowerCase()) {
      case 'slack': return '#4A154B';
      case 'google': return '#4285F4';
      case 'github': return '#181717';
      case 'notion': return '#000000';
      case 'openai': return '#412991';
      default: return '#6b7280';
    }
  };

  const getToolCapabilities = (provider: string): ToolCapability[] => {
    switch (provider.toLowerCase()) {
      case 'slack': return [ToolCapability.READ_DATA, ToolCapability.WRITE_DATA, ToolCapability.WEBHOOKS];
      case 'google': return [ToolCapability.READ_DATA, ToolCapability.WRITE_DATA, ToolCapability.SCHEDULING];
      case 'github': return [ToolCapability.READ_DATA, ToolCapability.WEBHOOKS, ToolCapability.API_ACCESS];
      case 'notion': return [ToolCapability.READ_DATA, ToolCapability.WRITE_DATA, ToolCapability.FILE_UPLOAD];
      case 'openai': return [ToolCapability.API_ACCESS, ToolCapability.BATCH_PROCESSING];
      default: return [ToolCapability.API_ACCESS];
    }
  };

  const getToolsStatistics = () => {
    const activeTools = tools.filter(tool => tool.isActive).length;
    const connectedTools = tools.filter(tool => tool.integration?.status === IntegrationStatus.CONNECTED).length;
    const errorTools = tools.filter(tool => tool.status === ToolStatus.ERROR).length;
    const totalUsage = tools.reduce((sum, tool) => sum + tool.usageCount, 0);

    return { activeTools, connectedTools, errorTools, totalUsage };
  };

  const stats = getToolsStatistics();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flex: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 12,
    },
    headerButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    statsBar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    statItem: {
      alignItems: 'center',
      gap: 4,
    },
    statNumber: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    statLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '500',
      textTransform: 'uppercase',
    },
    toolListContainer: {
      flex: 1,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Tools</Text>
          <Text style={styles.subtitle}>
            {stats.activeTools} active • {stats.connectedTools} connected • {stats.errorTools} errors
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => console.log('Search tools')}
            activeOpacity={0.7}
          >
            <Ionicons name="search-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => console.log('Tools settings')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleRefresh}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{tools.length}</Text>
          <Text style={styles.statLabel}>Total Tools</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>
            {stats.activeTools}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#3b82f6' }]}>
            {stats.connectedTools}
          </Text>
          <Text style={styles.statLabel}>Connected</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#ef4444' }]}>
            {stats.errorTools}
          </Text>
          <Text style={styles.statLabel}>Errors</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#f59e0b' }]}>
            {stats.totalUsage.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Total Usage</Text>
        </View>
      </View>

      {/* Tool List */}
      <View style={styles.toolListContainer}>
        <ToolList
          tools={tools}
          onToolPress={handleToolPress}
          onToolToggle={handleToolToggle}
          onToolSettings={handleToolSettings}
          onToolDelete={handleToolDelete}
          onRefresh={handleRefresh}
          loading={loading}
        />
      </View>

      {/* Add Integration FAB */}
      <AddIntegrationFAB
        onAddIntegration={handleAddIntegration}
        onCustomIntegration={handleCustomIntegration}
        position="bottom-right"
        size="medium"
        showQuickActions={true}
      />

      {/* Tool Detail Modal */}
      {selectedTool && (
        <ToolDetail
          tool={selectedTool}
          isOpen={showToolDetail}
          onClose={() => setShowToolDetail(false)}
          onSave={handleToolSave}
          onDelete={handleToolDetailDelete}
          onTestConnection={handleTestConnection}
        />
      )}

      {/* Integration Wizard */}
      <IntegrationWizard
        isOpen={showIntegrationWizard}
        onClose={() => setShowIntegrationWizard(false)}
        onComplete={handleWizardComplete}
        integrationId={wizardIntegrationId}
      />
    </View>
  );
}