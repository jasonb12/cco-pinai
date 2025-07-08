import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../contexts/ThemeContext';
import { notificationService, type ConnectionStatus } from '../services/notificationService';
import { mcpService, type MCPConnectionStatus } from '../services/mcp';

interface ConnectionStatusProps {
  onRetry?: () => void;
}

export default function ConnectionStatusIndicator({ onRetry }: ConnectionStatusProps) {
  const colors = useThemeColors();
  const [notificationStatus, setNotificationStatus] = useState<ConnectionStatus | null>(null);
  const [mcpStatus, setMcpStatus] = useState<MCPConnectionStatus | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Subscribe to notification service status
    const unsubscribeNotifications = notificationService.onConnectionChange((status) => {
      setNotificationStatus(status);
    });

    // Subscribe to MCP service status
    const unsubscribeMcp = mcpService.onStatusChange((status) => {
      setMcpStatus(status);
    });

    // Get initial status
    setNotificationStatus(notificationService.getConnectionStatus());
    setMcpStatus(mcpService.getConnectionStatus());

    return () => {
      unsubscribeNotifications();
      unsubscribeMcp();
    };
  }, []);

  useEffect(() => {
    const shouldShow = !notificationStatus?.backendAvailable || !mcpStatus?.backendAvailable;
    
    if (shouldShow !== isVisible) {
      setIsVisible(shouldShow);
      
      Animated.timing(fadeAnim, {
        toValue: shouldShow ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [notificationStatus, mcpStatus, isVisible, fadeAnim]);

  const handleRetry = () => {
    notificationService.retryConnection();
    mcpService.retryConnection();
    onRetry?.();
  };

  const getStatusMessage = () => {
    if (!notificationStatus || !mcpStatus) {
      return 'Checking connection...';
    }

    if (!notificationStatus.backendAvailable || !mcpStatus.backendAvailable) {
      return 'Some features are offline. Working to reconnect...';
    }

    if (notificationStatus.isReconnecting || mcpStatus.isReconnecting) {
      return 'Reconnecting...';
    }

    return 'Connected';
  };

  const getStatusColor = () => {
    if (!notificationStatus || !mcpStatus) {
      return colors.textSecondary;
    }

    if (!notificationStatus.backendAvailable || !mcpStatus.backendAvailable) {
      return '#f59e0b'; // Amber/warning color
    }

    if (notificationStatus.isReconnecting || mcpStatus.isReconnecting) {
      return colors.primary;
    }

    return colors.success;
  };

  const getStatusIcon = () => {
    if (!notificationStatus || !mcpStatus) {
      return 'sync-outline';
    }

    if (!notificationStatus.backendAvailable || !mcpStatus.backendAvailable) {
      return 'cloud-offline-outline';
    }

    if (notificationStatus.isReconnecting || mcpStatus.isReconnecting) {
      return 'sync-outline';
    }

    return 'cloud-done-outline';
  };

  if (!isVisible) {
    return null;
  }

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      margin: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: getStatusColor(),
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    statusText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      marginLeft: 8,
    },
    message: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    retryButtonText: {
      color: colors.onPrimary,
      fontSize: 12,
      fontWeight: '600',
    },
  });

  return (
    <Animated.View style={[{ opacity: fadeAnim }, dynamicStyles.container]}>
      <View style={dynamicStyles.header}>
        <Ionicons 
          name={getStatusIcon()} 
          size={20} 
          color={getStatusColor()} 
        />
        <Text style={dynamicStyles.statusText}>
          {getStatusMessage()}
        </Text>
      </View>
      
      {(!notificationStatus?.backendAvailable || !mcpStatus?.backendAvailable) && (
        <>
          <Text style={dynamicStyles.message}>
            Real-time features like notifications and transcript processing are temporarily unavailable. 
            Your work is still saved and will sync when the connection is restored.
          </Text>
          
          <TouchableOpacity 
            style={dynamicStyles.retryButton}
            onPress={handleRetry}
          >
            <Text style={dynamicStyles.retryButtonText}>
              Retry Connection
            </Text>
          </TouchableOpacity>
        </>
      )}
    </Animated.View>
  );
}

export { ConnectionStatusIndicator }; 