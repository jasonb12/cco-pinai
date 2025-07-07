import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../contexts/ThemeContext';
import { notificationService, Notification, ActivityEvent } from '../services/notificationService';

interface NotificationPanelProps {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ visible, onClose }: NotificationPanelProps) {
  const colors = useThemeColors();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'notifications' | 'activity'>('notifications');
  const [isConnected, setIsConnected] = useState(false);
  
  // Animation values
  const slideAnim = new Animated.Value(0);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      // Load initial data
      setNotifications(notificationService.getNotifications());
      setActivities(notificationService.getActivityFeed());
      setIsConnected(notificationService.isConnectedToServer());

      // Animate in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Subscribe to updates
      const unsubscribeNotifications = notificationService.onNotificationsChange(setNotifications);
      const unsubscribeActivity = notificationService.onActivityChange(setActivities);
      const unsubscribeConnection = notificationService.onConnectionChange(setIsConnected);

      return () => {
        unsubscribeNotifications();
        unsubscribeActivity();
        unsubscribeConnection();
      };
    } else {
      // Reset animation values
      slideAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleNotificationPress = (notification: Notification) => {
    notificationService.markAsRead(notification.id);
    
    if (notification.actionUrl) {
      // Navigate to the action URL
      console.log('Navigate to:', notification.actionUrl);
    }
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
  };

  const handleClearAll = () => {
    notificationService.clearAll();
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

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'transcript_uploaded': return 'cloud-upload-outline';
      case 'transcript_processed': return 'checkmark-circle-outline';
      case 'ai_analysis_complete': return 'analytics-outline';
      case 'action_item_created': return 'list-outline';
      case 'user_joined': return 'person-add-outline';
      case 'comment_added': return 'chatbubble-outline';
      case 'system_update': return 'information-circle-outline';
      default: return 'notifications-outline';
    }
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

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return colors.primary;
      case 'low': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const dynamicStyles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    panel: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: Dimensions.get('window').height * 0.8,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 12,
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
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerButton: {
      padding: 8,
    },
    connectionStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 8,
      backgroundColor: isConnected ? '#10b981' : '#ef4444',
    },
    connectionText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '500',
      marginLeft: 6,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      marginTop: 16,
      borderRadius: 8,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 6,
      alignItems: 'center',
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    activeTabText: {
      color: colors.onPrimary,
    },
    content: {
      flex: 1,
      padding: 20,
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
    },
    notificationItem: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    unreadNotification: {
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    notificationIcon: {
      marginRight: 12,
      marginTop: 2,
    },
    notificationContent: {
      flex: 1,
    },
    notificationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    notificationMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    notificationFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12,
    },
    notificationTime: {
      fontSize: 12,
      color: colors.textTertiary,
    },
    actionButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    actionButtonText: {
      color: colors.onPrimary,
      fontSize: 12,
      fontWeight: '600',
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    activityIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    activityContent: {
      flex: 1,
    },
    activityTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    activityDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    activityMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    activityUser: {
      fontSize: 11,
      color: colors.textTertiary,
      marginRight: 8,
    },
    activityTime: {
      fontSize: 11,
      color: colors.textTertiary,
    },
  });

  const slideTransform = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[dynamicStyles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={{ flex: 1 }} onPress={handleClose} />
        <Animated.View
          style={[
            dynamicStyles.panel,
            {
              transform: [{ translateY: slideTransform }],
            },
          ]}
        >
          {/* Connection Status */}
          <View style={dynamicStyles.connectionStatus}>
            <Ionicons
              name={isConnected ? 'wifi' : 'wifi-off'}
              size={12}
              color="white"
            />
            <Text style={dynamicStyles.connectionText}>
              {isConnected ? 'Connected to server' : 'Disconnected from server'}
            </Text>
          </View>

          {/* Header */}
          <View style={dynamicStyles.header}>
            <Text style={dynamicStyles.headerTitle}>Notifications</Text>
            <View style={dynamicStyles.headerActions}>
              <TouchableOpacity style={dynamicStyles.headerButton} onPress={handleMarkAllRead}>
                <Ionicons name="checkmark-done-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={dynamicStyles.headerButton} onPress={handleClearAll}>
                <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={dynamicStyles.headerButton} onPress={handleClose}>
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tabs */}
          <View style={dynamicStyles.tabContainer}>
            <TouchableOpacity
              style={[
                dynamicStyles.tab,
                activeTab === 'notifications' && dynamicStyles.activeTab,
              ]}
              onPress={() => setActiveTab('notifications')}
            >
              <Text
                style={[
                  dynamicStyles.tabText,
                  activeTab === 'notifications' && dynamicStyles.activeTabText,
                ]}
              >
                Notifications ({notifications.filter(n => !n.read).length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                dynamicStyles.tab,
                activeTab === 'activity' && dynamicStyles.activeTab,
              ]}
              onPress={() => setActiveTab('activity')}
            >
              <Text
                style={[
                  dynamicStyles.tabText,
                  activeTab === 'activity' && dynamicStyles.activeTabText,
                ]}
              >
                Activity
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={dynamicStyles.content} showsVerticalScrollIndicator={false}>
            {activeTab === 'notifications' ? (
              notifications.length > 0 ? (
                notifications.map((notification) => (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      dynamicStyles.notificationItem,
                      !notification.read && dynamicStyles.unreadNotification,
                    ]}
                    onPress={() => handleNotificationPress(notification)}
                  >
                    <View style={dynamicStyles.notificationHeader}>
                      <Ionicons
                        name={getNotificationIcon(notification.type)}
                        size={20}
                        color={getPriorityColor(notification.priority)}
                        style={dynamicStyles.notificationIcon}
                      />
                      <View style={dynamicStyles.notificationContent}>
                        <Text style={dynamicStyles.notificationTitle}>
                          {notification.title}
                        </Text>
                        <Text style={dynamicStyles.notificationMessage}>
                          {notification.message}
                        </Text>
                      </View>
                    </View>
                    <View style={dynamicStyles.notificationFooter}>
                      <Text style={dynamicStyles.notificationTime}>
                        {formatTimeAgo(notification.timestamp)}
                      </Text>
                      {notification.actionText && (
                        <TouchableOpacity style={dynamicStyles.actionButton}>
                          <Text style={dynamicStyles.actionButtonText}>
                            {notification.actionText}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={dynamicStyles.emptyState}>
                  <Ionicons
                    name="notifications-outline"
                    size={48}
                    color={colors.textTertiary}
                    style={dynamicStyles.emptyIcon}
                  />
                  <Text style={dynamicStyles.emptyTitle}>No Notifications</Text>
                  <Text style={dynamicStyles.emptySubtitle}>
                    You're all caught up! Notifications will appear here when you have new activity.
                  </Text>
                </View>
              )
            ) : (
              activities.length > 0 ? (
                activities.map((activity) => (
                  <View key={activity.id} style={dynamicStyles.activityItem}>
                    <View style={dynamicStyles.activityIconContainer}>
                      <Ionicons
                        name={getActivityIcon(activity.type)}
                        size={16}
                        color={colors.primary}
                      />
                    </View>
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
                ))
              ) : (
                <View style={dynamicStyles.emptyState}>
                  <Ionicons
                    name="pulse-outline"
                    size={48}
                    color={colors.textTertiary}
                    style={dynamicStyles.emptyIcon}
                  />
                  <Text style={dynamicStyles.emptyTitle}>No Activity</Text>
                  <Text style={dynamicStyles.emptySubtitle}>
                    Activity from your team and AI processing will appear here.
                  </Text>
                </View>
              )
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
} 