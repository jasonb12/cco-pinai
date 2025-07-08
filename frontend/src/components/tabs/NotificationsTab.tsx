/**
 * Notifications Tab - Comprehensive notification management interface
 * Integrates with NotificationCenter and provides system-wide notification access
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../contexts/ThemeContext';
import { notificationService, Notification } from '../../services/notificationService';
import NotificationCenter from '../NotificationCenter';

export default function NotificationsTab() {
  const colors = useThemeColors();
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Subscribe to notification updates
    const unsubscribeNotifications = notificationService.onNotificationsChange((notifications) => {
      const unread = notifications.filter(n => !n.read).length;
      setUnreadCount(unread);
      setRecentNotifications(notifications.slice(0, 5)); // Show recent 5
    });

    const unsubscribeConnection = notificationService.onConnectionChange((connected) => {
      setIsConnected(connected);
    });

    // Initial load
    const notifications = notificationService.getNotifications();
    setUnreadCount(notifications.filter(n => !n.read).length);
    setRecentNotifications(notifications.slice(0, 5));
    setIsConnected(notificationService.isConnectedToServer());

    return () => {
      unsubscribeNotifications();
      unsubscribeConnection();
    };
  }, []);

  const handleOpenNotificationCenter = () => {
    setShowNotificationCenter(true);
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
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

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.surface,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    headerButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    openCenterButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    openCenterButtonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '600',
    },
    statusBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statusItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    connectedText: {
      color: colors.primary,
    },
    unreadBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    unreadText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '600',
    },
    content: {
      flex: 1,
    },
    quickActions: {
      backgroundColor: colors.surface,
      margin: 16,
      borderRadius: 12,
      padding: 16,
    },
    quickActionsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    actionGrid: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionIcon: {
      marginBottom: 8,
    },
    actionText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    recentSection: {
      backgroundColor: colors.surface,
      margin: 16,
      marginTop: 0,
      borderRadius: 12,
      padding: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    viewAllButton: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
    },
    notificationItem: {
      flexDirection: 'row',
      padding: 12,
      backgroundColor: colors.background,
      borderRadius: 8,
      marginBottom: 8,
      borderLeftWidth: 3,
    },
    unreadNotification: {
      backgroundColor: `${colors.primary}08`,
    },
    notificationIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    notificationContent: {
      flex: 1,
    },
    notificationTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    notificationMessage: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    notificationTime: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 4,
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
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Notifications</Text>
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleMarkAllAsRead}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark-done-outline" size={20} color={colors.text} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.openCenterButton}
              onPress={handleOpenNotificationCenter}
              activeOpacity={0.8}
            >
              <Ionicons name="list-outline" size={16} color="#ffffff" />
              <Text style={styles.openCenterButtonText}>View All</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statusBar}>
          <View style={styles.statusItem}>
            <Ionicons 
              name={isConnected ? 'wifi-outline' : 'cloud-offline-outline'} 
              size={16} 
              color={isConnected ? colors.primary : colors.textSecondary} 
            />
            <Text style={[styles.statusText, isConnected && styles.connectedText]}>
              {isConnected ? 'Connected' : 'Offline'}
            </Text>
          </View>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unreadCount} unread</Text>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleOpenNotificationCenter}
              activeOpacity={0.7}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="notifications-outline" size={24} color={colors.primary} />
              </View>
              <Text style={styles.actionText}>All Notifications</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => console.log('Settings')}
              activeOpacity={0.7}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="settings-outline" size={24} color={colors.primary} />
              </View>
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Notifications */}
        <View style={styles.recentSection}>
          <View style={[styles.sectionTitle, { flexDirection: 'row' }]}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={handleOpenNotificationCenter}>
              <Text style={styles.viewAllButton}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentNotifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="notifications-outline" size={48} color={colors.textSecondary} />
              </View>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySubtitle}>
                Notifications about your transcripts, AI analysis, and system updates will appear here.
              </Text>
            </View>
          ) : (
            recentNotifications.map((notification) => {
              const iconColor = notification.priority === 'urgent' ? '#dc2626' : 
                              notification.priority === 'high' ? '#ea580c' : colors.primary;
              
              return (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    !notification.read && styles.unreadNotification,
                    { borderLeftColor: iconColor },
                  ]}
                  onPress={() => notificationService.markAsRead(notification.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.notificationIcon, { backgroundColor: `${iconColor}20` }]}>
                    <Ionicons
                      name={getNotificationIcon(notification.type)}
                      size={16}
                      color={iconColor}
                    />
                  </View>
                  
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationMessage} numberOfLines={2}>
                      {notification.message}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {formatTimeAgo(notification.timestamp)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Notification Center Modal */}
      <NotificationCenter
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
      />
    </View>
  );
}