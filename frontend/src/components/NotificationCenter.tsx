/**
 * Notification Center - Comprehensive notification management
 * Handles calendar reminders, AI suggestions, system updates, and user activity
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../contexts/ThemeContext';
import { notificationService, Notification, ActivityEvent } from '../services/notificationService';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const colors = useThemeColors();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'notifications' | 'activity'>('notifications');
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      loadActivities();
    }
  }, [isOpen]);

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribeNotifications = notificationService.onNotificationsChange((newNotifications) => {
      setNotifications(newNotifications);
    });

    const unsubscribeActivities = notificationService.onActivityChange((newActivities) => {
      setActivities(newActivities);
    });

    return () => {
      unsubscribeNotifications();
      unsubscribeActivities();
    };
  }, []);

  const loadNotifications = () => {
    const allNotifications = notificationService.getNotifications();
    setNotifications(allNotifications);
  };

  const loadActivities = () => {
    const allActivities = notificationService.getActivityFeed();
    setActivities(allActivities);
  };

  const handleMarkAsRead = (notificationId: string) => {
    notificationService.markAsRead(notificationId);
  };

  const handleDeleteNotification = (notificationId: string) => {
    notificationService.deleteNotification(notificationId);
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => notificationService.clearAll()
        },
      ]
    );
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;
    
    switch (filter) {
      case 'unread':
        filtered = notifications.filter(n => !n.read);
        break;
      case 'high':
        filtered = notifications.filter(n => n.priority === 'high' || n.priority === 'urgent');
        break;
      default:
        filtered = notifications;
    }
    
    return filtered;
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'transcript_uploaded': return 'cloud-upload-outline';
      case 'transcript_processed': return 'checkmark-circle-outline';
      case 'ai_analysis_complete': return 'bulb-outline';
      case 'action_item_created': return 'alarm-outline';
      case 'user_joined': return 'person-add-outline';
      case 'comment_added': return 'chatbubble-outline';
      case 'system_update': return 'information-circle-outline';
      default: return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: Notification['type'], priority: Notification['priority']) => {
    if (priority === 'urgent') return '#dc2626';
    if (priority === 'high') return '#ea580c';
    
    switch (type) {
      case 'transcript_uploaded': return '#3b82f6';
      case 'transcript_processed': return '#10b981';
      case 'ai_analysis_complete': return '#8b5cf6';
      case 'action_item_created': return '#f59e0b';
      case 'user_joined': return '#06b6d4';
      case 'comment_added': return '#84cc16';
      case 'system_update': return '#6b7280';
      default: return colors.primary;
    }
  };

  const getActivityIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'upload': return 'cloud-upload-outline';
      case 'processing': return 'cog-outline';
      case 'analysis': return 'analytics-outline';
      case 'action': return 'flash-outline';
      case 'collaboration': return 'people-outline';
      case 'system': return 'settings-outline';
      default: return 'pulse-outline';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = getFilteredNotifications();

  const styles = StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '90%',
      minHeight: '60%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
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
      gap: 12,
    },
    headerButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    closeButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    tabContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    activeTab: {
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    activeTabText: {
      color: colors.primary,
      fontWeight: '600',
    },
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 8,
    },
    filterButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    activeFilter: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    activeFilterText: {
      color: '#ffffff',
    },
    content: {
      flex: 1,
      maxHeight: 400,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
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
      lineHeight: 20,
    },
    notificationsList: {
      padding: 16,
    },
    notificationItem: {
      flexDirection: 'row',
      padding: 16,
      backgroundColor: colors.background,
      borderRadius: 12,
      marginBottom: 8,
      borderLeftWidth: 4,
    },
    unreadNotification: {
      backgroundColor: `${colors.primary}08`,
    },
    notificationIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    notificationContent: {
      flex: 1,
    },
    notificationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    notificationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      marginRight: 8,
    },
    notificationTime: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    notificationMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 8,
    },
    notificationActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: colors.primary,
    },
    actionButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#ffffff',
    },
    secondaryActionButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryActionButtonText: {
      color: colors.textSecondary,
    },
    priorityBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: colors.surface,
    },
    priorityText: {
      fontSize: 10,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    activityItem: {
      flexDirection: 'row',
      padding: 16,
      backgroundColor: colors.background,
      borderRadius: 12,
      marginBottom: 8,
    },
    activityIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      backgroundColor: colors.surface,
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
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: 4,
    },
    activityMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    activityUser: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '500',
    },
    activityTime: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modal}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </Text>
            <View style={styles.headerActions}>
              {activeTab === 'notifications' && (
                <>
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={handleMarkAllAsRead}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="checkmark-done-outline" size={20} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={handleClearAll}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.text} />
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close-outline" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'notifications' && styles.activeTab]}
              onPress={() => setActiveTab('notifications')}
            >
              <Text style={[styles.tabText, activeTab === 'notifications' && styles.activeTabText]}>
                Notifications
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
              onPress={() => setActiveTab('activity')}
            >
              <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>
                Activity
              </Text>
            </TouchableOpacity>
          </View>

          {/* Filter (Notifications only) */}
          {activeTab === 'notifications' && (
            <View style={styles.filterContainer}>
              {['all', 'unread', 'high'].map((filterType) => (
                <TouchableOpacity
                  key={filterType}
                  style={[
                    styles.filterButton,
                    filter === filterType && styles.activeFilter,
                  ]}
                  onPress={() => setFilter(filterType as any)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      filter === filterType && styles.activeFilterText,
                    ]}
                  >
                    {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {activeTab === 'notifications' ? (
              filteredNotifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="notifications-outline" size={48} color={colors.textSecondary} />
                  </View>
                  <Text style={styles.emptyTitle}>No notifications</Text>
                  <Text style={styles.emptySubtitle}>
                    {filter === 'unread' ? 'All caught up!' : 'Notifications will appear here when you have updates.'}
                  </Text>
                </View>
              ) : (
                <View style={styles.notificationsList}>
                  {filteredNotifications.map((notification) => {
                    const iconColor = getNotificationColor(notification.type, notification.priority);
                    
                    return (
                      <TouchableOpacity
                        key={notification.id}
                        style={[
                          styles.notificationItem,
                          !notification.read && styles.unreadNotification,
                          { borderLeftColor: iconColor },
                        ]}
                        onPress={() => handleMarkAsRead(notification.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.notificationIcon, { backgroundColor: `${iconColor}20` }]}>
                          <Ionicons
                            name={getNotificationIcon(notification.type)}
                            size={20}
                            color={iconColor}
                          />
                        </View>
                        
                        <View style={styles.notificationContent}>
                          <View style={styles.notificationHeader}>
                            <Text style={styles.notificationTitle}>{notification.title}</Text>
                            <Text style={styles.notificationTime}>
                              {formatTimeAgo(notification.timestamp)}
                            </Text>
                          </View>
                          
                          <Text style={styles.notificationMessage}>{notification.message}</Text>
                          
                          {(notification.actionUrl || notification.actionText) && (
                            <View style={styles.notificationActions}>
                              <TouchableOpacity style={styles.actionButton}>
                                <Text style={styles.actionButtonText}>
                                  {notification.actionText || 'View'}
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.actionButton, styles.secondaryActionButton]}
                                onPress={() => handleDeleteNotification(notification.id)}
                              >
                                <Text style={[styles.actionButtonText, styles.secondaryActionButtonText]}>
                                  Dismiss
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>

                        {(notification.priority === 'high' || notification.priority === 'urgent') && (
                          <View style={[styles.priorityBadge, { borderColor: iconColor }]}>
                            <Text style={[styles.priorityText, { color: iconColor }]}>
                              {notification.priority}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )
            ) : (
              activities.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="pulse-outline" size={48} color={colors.textSecondary} />
                  </View>
                  <Text style={styles.emptyTitle}>No recent activity</Text>
                  <Text style={styles.emptySubtitle}>
                    User activity and system events will appear here.
                  </Text>
                </View>
              ) : (
                <View style={styles.notificationsList}>
                  {activities.map((activity) => (
                    <View key={activity.id} style={styles.activityItem}>
                      <View style={styles.activityIcon}>
                        <Ionicons
                          name={getActivityIcon(activity.type)}
                          size={16}
                          color={colors.primary}
                        />
                      </View>
                      
                      <View style={styles.activityContent}>
                        <Text style={styles.activityTitle}>{activity.title}</Text>
                        <Text style={styles.activityDescription}>{activity.description}</Text>
                        <View style={styles.activityMeta}>
                          <Text style={styles.activityUser}>{activity.userName}</Text>
                          <Text style={styles.activityTime}>
                            {formatTimeAgo(activity.timestamp)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
} 