import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useThemeColors } from '../contexts/ThemeContext';
import { notificationService } from '../services/notificationService';

interface NotificationBadgeProps {
  style?: any;
  maxCount?: number;
}

export default function NotificationBadge({ style, maxCount = 99 }: NotificationBadgeProps) {
  const colors = useThemeColors();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  // Animation values
  const scaleAnim = new Animated.Value(0);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    // Load initial count
    const initialCount = notificationService.getUnreadCount();
    setUnreadCount(initialCount);
    setIsVisible(initialCount > 0);

    // Subscribe to notification changes
    const unsubscribe = notificationService.onNotificationsChange(() => {
      const newCount = notificationService.getUnreadCount();
      const wasVisible = isVisible;
      
      setUnreadCount(newCount);
      setIsVisible(newCount > 0);

      // Animate badge appearance/disappearance
      if (newCount > 0 && !wasVisible) {
        // Badge appearing
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      } else if (newCount === 0 && wasVisible) {
        // Badge disappearing
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }

      // Pulse animation for new notifications
      if (newCount > unreadCount) {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    });

    // Initial animation if badge should be visible
    if (initialCount > 0) {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    return unsubscribe;
  }, [isVisible, unreadCount]);

  if (!isVisible) return null;

  const displayCount = unreadCount > maxCount ? `${maxCount}+` : unreadCount.toString();

  const dynamicStyles = StyleSheet.create({
    badge: {
      position: 'absolute',
      top: -6,
      right: -6,
      backgroundColor: '#ef4444',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
      borderWidth: 2,
      borderColor: colors.background,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    badgeText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '700',
      textAlign: 'center',
    },
  });

  return (
    <Animated.View
      style={[
        dynamicStyles.badge,
        style,
        {
          transform: [
            { scale: scaleAnim },
            { scale: pulseAnim },
          ],
        },
      ]}
    >
      <Text style={dynamicStyles.badgeText}>{displayCount}</Text>
    </Animated.View>
  );
} 