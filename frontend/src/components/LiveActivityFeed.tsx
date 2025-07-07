import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../contexts/ThemeContext';
import { notificationService, ActivityEvent } from '../services/notificationService';

interface LiveActivityFeedProps {
  style?: any;
  maxItems?: number;
  showHeader?: boolean;
  compact?: boolean;
}

export default function LiveActivityFeed({
  style,
  maxItems = 20,
  showHeader = true,
  compact = false,
}: LiveActivityFeedProps) {
  const colors = useThemeColors();
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Animation values for new items
  const newItemAnimations = useRef<Map<string, Animated.Value>>(new Map());
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Load initial data
    setActivities(notificationService.getActivityFeed().slice(0, maxItems));
    setIsConnected(notificationService.isConnectedToServer());

    // Subscribe to updates
    const unsubscribeActivity = notificationService.onActivityChange((newActivities) => {
      const limitedActivities = newActivities.slice(0, maxItems);
      
      // Animate new items
      limitedActivities.forEach((activity) => {
        if (!newItemAnimations.current.has(activity.id)) {
          const animValue = new Animated.Value(0);
          newItemAnimations.current.set(activity.id, animValue);
          
          Animated.timing(animValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        }
      });
      
      setActivities(limitedActivities);
      
      // Auto-scroll to top when new items arrive
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
    });

    const unsubscribeConnection = notificationService.onConnectionChange(setIsConnected);

    // Pulse animation for connection status
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    if (isConnected) {
      pulseAnimation.start();
    } else {
      pulseAnimation.stop();
      pulseAnim.setValue(1);
    }

    return () => {
      unsubscribeActivity();
      unsubscribeConnection();
      pulseAnimation.stop();
    };
  }, [maxItems, isConnected]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Refresh data
    setActivities(notificationService.getActivityFeed().slice(0, maxItems));
    setIsRefreshing(false);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getActivityIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'upload': return 'cloud-upload-outline';
      case 'processing': return 'sync-outline';
      case 'analysis': return 'analytics-outline';
      case 'action': return 'checkmark-circle-outline';
      case 'collaboration': return 'people-outline';
      case 'system': return 'settings-outline';
      default: return 'ellipse-outline';
    }
  };

  const getActivityColor = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'upload': return '#3b82f6';
      case 'processing': return '#f59e0b';
      case 'analysis': return '#10b981';
      case 'action': return '#6366f1';
      case 'collaboration': return '#8b5cf6';
      case 'system': return '#6b7280';
      default: return colors.primary;
    }
  };

  const simulateActivity = () => {
    const mockActivities = [
      {
        type: 'upload' as const,
        title: 'New Recording Uploaded',
        description: 'Meeting_2024_01_15.mp3 uploaded successfully',
        userName: 'You',
      },
      {
        type: 'processing' as const,
        title: 'Processing Audio',
        description: 'Transcribing audio using advanced AI models',
        userName: 'CCOPINAI System',
      },
      {
        type: 'analysis' as const,
        title: 'AI Analysis Complete',
        description: 'Found 5 action items and 3 key insights',
        userName: 'AI Assistant',
      },
      {
        type: 'action' as const,
        title: 'Task Created',
        description: 'Follow up with client by Friday',
        userName: 'You',
      },
      {
        type: 'collaboration' as const,
        title: 'Team Member Joined',
        description: 'Sarah joined the workspace',
        userName: 'Sarah Johnson',
      },
    ];

    const randomActivity = mockActivities[Math.floor(Math.random() * mockActivities.length)];
    
    notificationService.sendUserActivity({
      type: randomActivity.type,
      title: randomActivity.title,
      description: randomActivity.description,
      userName: randomActivity.userName,
    });
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginLeft: 8,
    },
    connectionIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.surface,
    },
    connectionDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    connectionText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: compact ? 12 : 20,
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: compact ? 12 : 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: compact ? 12 : 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    activityIconContainer: {
      width: compact ? 32 : 40,
      height: compact ? 32 : 40,
      borderRadius: compact ? 16 : 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    activityContent: {
      flex: 1,
    },
    activityTitle: {
      fontSize: compact ? 14 : 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    activityDescription: {
      fontSize: compact ? 12 : 14,
      color: colors.textSecondary,
      lineHeight: compact ? 16 : 20,
      marginBottom: 8,
    },
    activityMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    activityUser: {
      fontSize: 11,
      color: colors.textTertiary,
      fontWeight: '500',
    },
    activityTime: {
      fontSize: 11,
      color: colors.textTertiary,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    simulateButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    simulateButtonText: {
      color: colors.onPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    timeline: {
      position: 'absolute',
      left: compact ? 28 : 36,
      top: compact ? 44 : 56,
      bottom: 0,
      width: 2,
      backgroundColor: colors.border,
    },
    timelineDot: {
      position: 'absolute',
      left: compact ? 26 : 34,
      top: compact ? 14 : 18,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
  });

  return (
    <View style={[dynamicStyles.container, style]}>
      {showHeader && (
        <View style={dynamicStyles.header}>
          <View style={dynamicStyles.headerLeft}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Ionicons
                name="pulse-outline"
                size={20}
                color={colors.primary}
              />
            </Animated.View>
            <Text style={dynamicStyles.headerTitle}>Live Activity</Text>
          </View>
          <View style={dynamicStyles.connectionIndicator}>
            <View
              style={[
                dynamicStyles.connectionDot,
                { backgroundColor: isConnected ? '#10b981' : '#ef4444' },
              ]}
            />
            <Text style={dynamicStyles.connectionText}>
              {isConnected ? 'Live' : 'Offline'}
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={dynamicStyles.scrollView}
        contentContainerStyle={dynamicStyles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {activities.length > 0 ? (
          <View style={{ position: 'relative' }}>
            {activities.map((activity, index) => {
              const animValue = newItemAnimations.current.get(activity.id) || new Animated.Value(1);
              const activityColor = getActivityColor(activity.type);
              
              return (
                <Animated.View
                  key={activity.id}
                  style={{
                    opacity: animValue,
                    transform: [
                      {
                        translateY: animValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <View style={dynamicStyles.activityItem}>
                    <LinearGradient
                      colors={[activityColor + '20', activityColor + '10']}
                      style={dynamicStyles.activityIconContainer}
                    >
                      <Ionicons
                        name={getActivityIcon(activity.type)}
                        size={compact ? 16 : 20}
                        color={activityColor}
                      />
                    </LinearGradient>
                    <View style={dynamicStyles.activityContent}>
                      <Text style={dynamicStyles.activityTitle}>{activity.title}</Text>
                      <Text style={dynamicStyles.activityDescription}>
                        {activity.description}
                      </Text>
                      <View style={dynamicStyles.activityMeta}>
                        <Text style={dynamicStyles.activityUser}>{activity.userName}</Text>
                        <Text style={dynamicStyles.activityTime}>
                          {formatTimeAgo(activity.timestamp)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  {/* Timeline connector */}
                  {index < activities.length - 1 && (
                    <View style={dynamicStyles.timeline} />
                  )}
                  <View style={[dynamicStyles.timelineDot, { backgroundColor: activityColor }]} />
                </Animated.View>
              );
            })}
          </View>
        ) : (
          <View style={dynamicStyles.emptyState}>
            <Ionicons
              name="pulse-outline"
              size={48}
              color={colors.textTertiary}
              style={dynamicStyles.emptyIcon}
            />
            <Text style={dynamicStyles.emptyTitle}>No Activity Yet</Text>
            <Text style={dynamicStyles.emptySubtitle}>
              Start uploading audio or recording conversations to see live activity updates here.
            </Text>
            <TouchableOpacity
              style={dynamicStyles.simulateButton}
              onPress={simulateActivity}
            >
              <Text style={dynamicStyles.simulateButtonText}>Simulate Activity</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
} 