/**
 * Add Integration FAB Component - Floating Action Button for adding new integrations
 * Based on PRD-UI.md specifications for Tools tab
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../contexts/ThemeContext';
import { ToolCategory } from '../../types/tools';

interface IntegrationOption {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string;
  color: string;
  isPopular: boolean;
  isNew: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
}

interface AddIntegrationFABProps {
  onAddIntegration: (integrationId: string) => void;
  onCustomIntegration?: () => void;
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left';
  size?: 'small' | 'medium' | 'large';
  showQuickActions?: boolean;
}

const integrationOptions: IntegrationOption[] = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team communication and collaboration',
    category: ToolCategory.COMMUNICATION,
    icon: 'chatbubble-ellipses-outline',
    color: '#4A154B',
    isPopular: true,
    isNew: false,
    difficulty: 'easy',
    estimatedTime: '2 min'
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Calendar events and scheduling',
    category: ToolCategory.PRODUCTIVITY,
    icon: 'calendar-outline',
    color: '#4285F4',
    isPopular: true,
    isNew: false,
    difficulty: 'easy',
    estimatedTime: '3 min'
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'All-in-one workspace for notes and docs',
    category: ToolCategory.PRODUCTIVITY,
    icon: 'document-text-outline',
    color: '#000000',
    isPopular: true,
    isNew: false,
    difficulty: 'medium',
    estimatedTime: '5 min'
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Code repository and version control',
    category: ToolCategory.DEVELOPMENT,
    icon: 'logo-github',
    color: '#181717',
    isPopular: true,
    isNew: false,
    difficulty: 'medium',
    estimatedTime: '4 min'
  },
  {
    id: 'trello',
    name: 'Trello',
    description: 'Project management and task tracking',
    category: ToolCategory.PROJECT_MANAGEMENT,
    icon: 'grid-outline',
    color: '#0079BF',
    isPopular: false,
    isNew: false,
    difficulty: 'easy',
    estimatedTime: '3 min'
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Customer relationship management',
    category: ToolCategory.CRM,
    icon: 'people-outline',
    color: '#00A1E0',
    isPopular: false,
    isNew: false,
    difficulty: 'hard',
    estimatedTime: '10 min'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'AI-powered text generation and analysis',
    category: ToolCategory.AI_ML,
    icon: 'sparkles-outline',
    color: '#412991',
    isPopular: true,
    isNew: true,
    difficulty: 'medium',
    estimatedTime: '5 min'
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Automation workflows and integrations',
    category: ToolCategory.AUTOMATION,
    icon: 'flash-outline',
    color: '#FF4A00',
    isPopular: false,
    isNew: false,
    difficulty: 'medium',
    estimatedTime: '6 min'
  },
];

export default function AddIntegrationFAB({
  onAddIntegration,
  onCustomIntegration,
  position = 'bottom-right',
  size = 'medium',
  showQuickActions = true
}: AddIntegrationFABProps) {
  const colors = useThemeColors();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | null>(null);
  
  const scaleAnim = new Animated.Value(1);
  const rotateAnim = new Animated.Value(0);

  const handlePress = () => {
    if (showQuickActions) {
      setIsExpanded(!isExpanded);
      
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: isExpanded ? 1 : 1.1,
          useNativeDriver: true,
        }),
        Animated.spring(rotateAnim, {
          toValue: isExpanded ? 0 : 1,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      setShowModal(true);
    }
  };

  const handleQuickAction = (action: string) => {
    setIsExpanded(false);
    
    if (action === 'browse') {
      setShowModal(true);
    } else if (action === 'custom') {
      onCustomIntegration?.();
    }
  };

  const handleIntegrationSelect = (integrationId: string) => {
    setShowModal(false);
    onAddIntegration(integrationId);
  };

  const getPositionStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      bottom: 20,
      zIndex: 1000,
    };

    switch (position) {
      case 'bottom-center':
        return { ...baseStyle, alignSelf: 'center' };
      case 'bottom-left':
        return { ...baseStyle, left: 20 };
      case 'bottom-right':
      default:
        return { ...baseStyle, right: 20 };
    }
  };

  const getFABSize = () => {
    switch (size) {
      case 'small': return 48;
      case 'large': return 72;
      case 'medium':
      default: return 56;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return 20;
      case 'large': return 32;
      case 'medium':
      default: return 24;
    }
  };

  const filteredIntegrations = selectedCategory
    ? integrationOptions.filter(option => option.category === selectedCategory)
    : integrationOptions;

  const popularIntegrations = integrationOptions.filter(option => option.isPopular);
  const newIntegrations = integrationOptions.filter(option => option.isNew);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const getDifficultyColor = (difficulty: IntegrationOption['difficulty']) => {
    switch (difficulty) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return colors.textSecondary;
    }
  };

  const renderIntegrationItem = (integration: IntegrationOption) => (
    <TouchableOpacity
      key={integration.id}
      style={styles.integrationItem}
      onPress={() => handleIntegrationSelect(integration.id)}
      activeOpacity={0.8}
    >
      <View style={[styles.integrationIcon, { backgroundColor: integration.color }]}>
        <Ionicons name={integration.icon as any} size={24} color="#ffffff" />
      </View>
      
      <View style={styles.integrationContent}>
        <View style={styles.integrationHeader}>
          <Text style={[styles.integrationName, { color: colors.text }]}>
            {integration.name}
          </Text>
          <View style={styles.integrationBadges}>
            {integration.isNew && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            )}
            {integration.isPopular && (
              <View style={styles.popularBadge}>
                <Ionicons name="star" size={10} color="#ffffff" />
              </View>
            )}
          </View>
        </View>
        
        <Text style={[styles.integrationDescription, { color: colors.textSecondary }]}>
          {integration.description}
        </Text>
        
        <View style={styles.integrationMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {integration.estimatedTime}
            </Text>
          </View>
          
          <View style={styles.metaItem}>
            <View style={[styles.difficultyDot, { backgroundColor: getDifficultyColor(integration.difficulty) }]} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {integration.difficulty}
            </Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name="folder-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {integration.category.replace('_', ' ')}
            </Text>
          </View>
        </View>
      </View>
      
      <Ionicons name="chevron-forward-outline" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    fabContainer: {
      ...getPositionStyle(),
    },
    fab: {
      width: getFABSize(),
      height: getFABSize(),
      borderRadius: getFABSize() / 2,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    quickActions: {
      position: 'absolute',
      bottom: getFABSize() + 16,
      right: 0,
      gap: 12,
    },
    quickAction: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 24,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
      gap: 8,
    },
    quickActionText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '85%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.surface,
    },
    categoryFilter: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    categoryFilterTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    categoryOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    categoryOption: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    activeCategoryOption: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryOptionText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.text,
      textTransform: 'capitalize',
    },
    activeCategoryOptionText: {
      color: '#ffffff',
    },
    modalBody: {
      flex: 1,
      paddingHorizontal: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    integrationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    integrationIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    integrationContent: {
      flex: 1,
    },
    integrationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    integrationName: {
      fontSize: 16,
      fontWeight: '600',
    },
    integrationBadges: {
      flexDirection: 'row',
      gap: 4,
    },
    newBadge: {
      backgroundColor: '#10b981',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    newBadgeText: {
      fontSize: 8,
      fontWeight: '700',
      color: '#ffffff',
    },
    popularBadge: {
      backgroundColor: '#f59e0b',
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
    },
    integrationDescription: {
      fontSize: 14,
      marginBottom: 8,
      lineHeight: 20,
    },
    integrationMeta: {
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
      textTransform: 'capitalize',
    },
    difficultyDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    customIntegration: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
      marginTop: 16,
      gap: 8,
    },
    customIntegrationText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
    },
  });

  return (
    <>
      <View style={styles.fabContainer}>
        {/* Quick Actions */}
        {showQuickActions && isExpanded && (
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => handleQuickAction('browse')}
              activeOpacity={0.8}
            >
              <Ionicons name="apps-outline" size={16} color={colors.text} />
              <Text style={styles.quickActionText}>Browse All</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => handleQuickAction('custom')}
              activeOpacity={0.8}
            >
              <Ionicons name="code-outline" size={16} color={colors.text} />
              <Text style={styles.quickActionText}>Custom</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main FAB */}
        <Animated.View
          style={[
            styles.fab,
            {
              transform: [
                { scale: scaleAnim },
                { rotate: spin },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.fab}
            onPress={handlePress}
            activeOpacity={0.8}
          >
            <Ionicons
              name="add-outline"
              size={getIconSize()}
              color="#ffffff"
            />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Integration Selection Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Integration</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <Ionicons name="close-outline" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Category Filter */}
            <View style={styles.categoryFilter}>
              <Text style={styles.categoryFilterTitle}>Filter by Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryOptions}>
                  <TouchableOpacity
                    style={[
                      styles.categoryOption,
                      !selectedCategory && styles.activeCategoryOption
                    ]}
                    onPress={() => setSelectedCategory(null)}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      !selectedCategory && styles.activeCategoryOptionText
                    ]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  
                  {Object.values(ToolCategory).map(category => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryOption,
                        selectedCategory === category && styles.activeCategoryOption
                      ]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                        selectedCategory === category && styles.activeCategoryOptionText
                      ]}>
                        {category.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Integration List */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Popular Integrations */}
              {!selectedCategory && popularIntegrations.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Popular Integrations</Text>
                  {popularIntegrations.map(renderIntegrationItem)}
                </View>
              )}

              {/* New Integrations */}
              {!selectedCategory && newIntegrations.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>New Integrations</Text>
                  {newIntegrations.map(renderIntegrationItem)}
                </View>
              )}

              {/* All Integrations */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {selectedCategory ? `${selectedCategory.replace('_', ' ')} Integrations` : 'All Integrations'}
                </Text>
                {filteredIntegrations.map(renderIntegrationItem)}
              </View>

              {/* Custom Integration */}
              <TouchableOpacity
                style={styles.customIntegration}
                onPress={() => {
                  setShowModal(false);
                  onCustomIntegration?.();
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="code-outline" size={20} color={colors.primary} />
                <Text style={styles.customIntegrationText}>
                  Create Custom Integration
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
} 