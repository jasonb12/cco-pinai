/**
 * Tool Card Component - Individual tool display with metadata and actions
 * Based on PRD-UI.md specifications for Tools tab
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../contexts/ThemeContext';
import { Tool, ToolStatus, ToolCategory } from '../../types/tools';

interface ToolCardProps {
  tool: Tool;
  onPress: () => void;
  onToggleActive?: () => void;
  onSettings?: () => void;
  onDelete?: () => void;
  compact?: boolean;
  showActions?: boolean;
}

export default function ToolCard({
  tool,
  onPress,
  onToggleActive,
  onSettings,
  onDelete,
  compact = false,
  showActions = true
}: ToolCardProps) {
  const colors = useThemeColors();

  const getStatusColor = (status: ToolStatus) => {
    switch (status) {
      case ToolStatus.ACTIVE: return '#10b981';
      case ToolStatus.INACTIVE: return '#6b7280';
      case ToolStatus.PENDING: return '#f59e0b';
      case ToolStatus.ERROR: return '#ef4444';
      case ToolStatus.DEPRECATED: return '#f97316';
      case ToolStatus.MAINTENANCE: return '#8b5cf6';
      default: return colors.textSecondary;
    }
  };

  const getCategoryIcon = (category: ToolCategory) => {
    switch (category) {
      case ToolCategory.PRODUCTIVITY: return 'briefcase-outline';
      case ToolCategory.COMMUNICATION: return 'chatbubble-outline';
      case ToolCategory.ANALYTICS: return 'analytics-outline';
      case ToolCategory.AUTOMATION: return 'cog-outline';
      case ToolCategory.DEVELOPMENT: return 'code-outline';
      case ToolCategory.DESIGN: return 'brush-outline';
      case ToolCategory.MARKETING: return 'megaphone-outline';
      case ToolCategory.FINANCE: return 'card-outline';
      case ToolCategory.CRM: return 'people-outline';
      case ToolCategory.PROJECT_MANAGEMENT: return 'folder-outline';
      case ToolCategory.AI_ML: return 'sparkles-outline';
      case ToolCategory.CUSTOM: return 'extension-puzzle-outline';
      default: return 'apps-outline';
    }
  };

  const formatLastUsed = (lastUsed?: string) => {
    if (!lastUsed) return 'Never used';
    
    const date = new Date(lastUsed);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const formatUsageCount = (count: number) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const renderRatingStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={12} color="#f59e0b" />
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={12} color="#f59e0b" />
      );
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={12} color="#d1d5db" />
      );
    }
    
    return stars;
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: compact ? 8 : 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
      overflow: 'hidden',
    },
    content: {
      padding: compact ? 12 : 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: compact ? 8 : 12,
    },
    iconContainer: {
      width: compact ? 40 : 48,
      height: compact ? 40 : 48,
      borderRadius: compact ? 8 : 12,
      backgroundColor: tool.color || colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    icon: {
      width: compact ? 20 : 24,
      height: compact ? 20 : 24,
    },
    headerContent: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    title: {
      fontSize: compact ? 14 : 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    version: {
      fontSize: compact ? 10 : 12,
      color: colors.textSecondary,
      backgroundColor: colors.border,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 8,
    },
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 2,
    },
    categoryText: {
      fontSize: compact ? 10 : 12,
      color: colors.textSecondary,
      textTransform: 'capitalize',
    },
    statusIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusText: {
      fontSize: compact ? 10 : 12,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    description: {
      fontSize: compact ? 12 : 14,
      color: colors.textSecondary,
      lineHeight: compact ? 16 : 20,
      marginBottom: compact ? 8 : 12,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginBottom: compact ? 8 : 12,
    },
    tag: {
      backgroundColor: colors.border,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    tagText: {
      fontSize: compact ? 8 : 10,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    metricsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: compact ? 8 : 12,
    },
    metricsLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    metric: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metricText: {
      fontSize: compact ? 10 : 12,
      color: colors.textSecondary,
    },
    rating: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    ratingText: {
      fontSize: compact ? 10 : 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    lastUsed: {
      fontSize: compact ? 10 : 12,
      color: colors.textSecondary,
      textAlign: 'right',
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: compact ? 8 : 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      gap: 4,
    },
    primaryAction: {
      backgroundColor: colors.primary,
    },
    secondaryAction: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dangerAction: {
      backgroundColor: '#ef4444',
    },
    actionText: {
      fontSize: compact ? 10 : 12,
      fontWeight: '500',
    },
    primaryActionText: {
      color: '#ffffff',
    },
    secondaryActionText: {
      color: colors.text,
    },
    dangerActionText: {
      color: '#ffffff',
    },
    toggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    activeIndicator: {
      width: compact ? 8 : 10,
      height: compact ? 8 : 10,
      borderRadius: compact ? 4 : 5,
      backgroundColor: '#10b981',
    },
    inactiveIndicator: {
      width: compact ? 8 : 10,
      height: compact ? 8 : 10,
      borderRadius: compact ? 4 : 5,
      backgroundColor: '#6b7280',
    },
    toggleText: {
      fontSize: compact ? 10 : 12,
      fontWeight: '500',
      color: colors.text,
    },
    capabilitiesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginBottom: compact ? 6 : 8,
    },
    capability: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: `${colors.primary}20`,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 3,
    },
    capabilityText: {
      fontSize: compact ? 8 : 9,
      color: colors.primary,
      fontWeight: '500',
      textTransform: 'uppercase',
    },
    pricingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    pricingText: {
      fontSize: compact ? 10 : 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    freeLabel: {
      backgroundColor: '#10b981',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    freeLabelText: {
      fontSize: compact ? 8 : 10,
      color: '#ffffff',
      fontWeight: '600',
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            {tool.icon ? (
              <Image source={{ uri: tool.icon }} style={styles.icon} />
            ) : (
              <Ionicons
                name={getCategoryIcon(tool.category)}
                size={compact ? 20 : 24}
                color="#ffffff"
              />
            )}
          </View>
          
          <View style={styles.headerContent}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {tool.name}
              </Text>
              <Text style={styles.version}>v{tool.version}</Text>
            </View>
            
            <View style={styles.categoryRow}>
              <Ionicons
                name={getCategoryIcon(tool.category)}
                size={compact ? 10 : 12}
                color={colors.textSecondary}
              />
              <Text style={styles.categoryText}>
                {tool.category.replace('_', ' ')}
              </Text>
            </View>
            
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(tool.status) }]} />
              <Text style={[styles.statusText, { color: getStatusColor(tool.status) }]}>
                {tool.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description} numberOfLines={compact ? 2 : 3}>
          {tool.description}
        </Text>

        {/* Tags */}
        {tool.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tool.tags.slice(0, compact ? 3 : 5).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {tool.tags.length > (compact ? 3 : 5) && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>+{tool.tags.length - (compact ? 3 : 5)}</Text>
              </View>
            )}
          </View>
        )}

        {/* Capabilities */}
        {!compact && tool.capabilities.length > 0 && (
          <View style={styles.capabilitiesContainer}>
            {tool.capabilities.slice(0, 4).map((capability, index) => (
              <View key={index} style={styles.capability}>
                <Ionicons name="checkmark-outline" size={8} color={colors.primary} />
                <Text style={styles.capabilityText}>
                  {capability.replace('_', ' ')}
                </Text>
              </View>
            ))}
            {tool.capabilities.length > 4 && (
              <View style={styles.capability}>
                <Text style={styles.capabilityText}>+{tool.capabilities.length - 4}</Text>
              </View>
            )}
          </View>
        )}

        {/* Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricsLeft}>
            <View style={styles.metric}>
              <Ionicons name="play-outline" size={compact ? 10 : 12} color={colors.textSecondary} />
              <Text style={styles.metricText}>
                {formatUsageCount(tool.usageCount)} uses
              </Text>
            </View>
            
            <View style={styles.rating}>
              {renderRatingStars(tool.rating)}
              <Text style={styles.ratingText}>
                {tool.rating.toFixed(1)}
              </Text>
            </View>
          </View>
          
          <Text style={styles.lastUsed}>
            {formatLastUsed(tool.lastUsed)}
          </Text>
        </View>

        {/* Pricing */}
        {tool.pricing && (
          <View style={styles.pricingContainer}>
            {tool.pricing.model === 'free' ? (
              <View style={styles.freeLabel}>
                <Text style={styles.freeLabelText}>FREE</Text>
              </View>
            ) : (
              <>
                <Ionicons name="card-outline" size={compact ? 10 : 12} color={colors.textSecondary} />
                <Text style={styles.pricingText}>
                  ${tool.pricing.cost}/{tool.pricing.billingPeriod}
                </Text>
              </>
            )}
          </View>
        )}

        {/* Actions */}
        {showActions && (
          <View style={styles.actions}>
            <View style={styles.toggleContainer}>
              <View style={tool.isActive ? styles.activeIndicator : styles.inactiveIndicator} />
              <Text style={styles.toggleText}>
                {tool.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {onToggleActive && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryAction]}
                  onPress={onToggleActive}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={tool.isActive ? 'pause-outline' : 'play-outline'}
                    size={compact ? 10 : 12}
                    color="#ffffff"
                  />
                  <Text style={[styles.actionText, styles.primaryActionText]}>
                    {tool.isActive ? 'Pause' : 'Activate'}
                  </Text>
                </TouchableOpacity>
              )}
              
              {onSettings && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryAction]}
                  onPress={onSettings}
                  activeOpacity={0.8}
                >
                  <Ionicons name="settings-outline" size={compact ? 10 : 12} color={colors.text} />
                  <Text style={[styles.actionText, styles.secondaryActionText]}>
                    Settings
                  </Text>
                </TouchableOpacity>
              )}
              
              {onDelete && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.dangerAction]}
                  onPress={onDelete}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={compact ? 10 : 12} color="#ffffff" />
                  <Text style={[styles.actionText, styles.dangerActionText]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
} 