/**
 * Approval Card Component - Accept/Deny swipe actions
 * Based on PRD-UI.md specifications for approval queue
 */
import React, { useState } from 'react';
import {
  Card,
  XStack,
  YStack,
  Text,
  Button,
  Badge,
  View,
  Progress,
} from '@tamagui/core';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  interpolateColor,
} from 'react-native-reanimated';

import { PendingAction } from '../../stores/notifStore';
import { useThemeStore } from '../../stores/themeStore';

interface ApprovalCardProps {
  action: PendingAction;
  onPress: () => void;
  onApprove: () => void;
  onDeny: () => void;
}

const AnimatedCard = Animated.createAnimatedComponent(Card);

export default function ApprovalCard({
  action,
  onPress,
  onApprove,
  onDeny,
}: ApprovalCardProps) {
  const { activeTheme } = useThemeStore();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  
  const SWIPE_THRESHOLD = 80;
  
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
    },
    onEnd: (event) => {
      const shouldApprove = translateX.value > SWIPE_THRESHOLD;
      const shouldDeny = translateX.value < -SWIPE_THRESHOLD;
      
      if (shouldApprove) {
        translateX.value = withSpring(300);
        opacity.value = withSpring(0);
        runOnJS(onApprove)();
      } else if (shouldDeny) {
        translateX.value = withSpring(-300);
        opacity.value = withSpring(0);
        runOnJS(onDeny)();
      } else {
        translateX.value = withSpring(0);
      }
    },
  });
  
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));
  
  const backgroundStyle = useAnimatedStyle(() => {
    const approveColor = activeTheme === 'dark' ? '#30D158' : '#34C759';
    const denyColor = activeTheme === 'dark' ? '#FF453A' : '#FF3B30';
    const neutralColor = activeTheme === 'dark' ? '#1c1c1e' : '#f8f9fa';
    
    const backgroundColor = interpolateColor(
      translateX.value,
      [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
      [denyColor, neutralColor, approveColor]
    );
    
    return { backgroundColor };
  });
  
  const getToolIcon = (toolType: string) => {
    switch (toolType) {
      case 'calendar':
        return 'calendar-outline';
      case 'email':
        return 'mail-outline';
      case 'task':
        return 'checkbox-outline';
      case 'contact':
        return 'person-outline';
      case 'reminder':
        return 'alarm-outline';
      default:
        return 'build-outline';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return activeTheme === 'dark' ? '#FF9F0A' : '#FF9500';
      case 'approved':
        return activeTheme === 'dark' ? '#30D158' : '#34C759';
      case 'denied':
        return activeTheme === 'dark' ? '#FF453A' : '#FF3B30';
      default:
        return activeTheme === 'dark' ? '#8e8e93' : '#6c757d';
    }
  };
  
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };
  
  return (
    <View>
      {/* Swipe background */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
          },
          backgroundStyle,
        ]}
      >
        {/* Approve background */}
        <View
          position="absolute"
          right="$4"
          alignItems="center"
          gap="$1"
        >
          <Ionicons name="checkmark-circle" size={24} color="white" />
          <Text color="white" fontSize="$2" fontWeight="600">
            Approve
          </Text>
        </View>
        
        {/* Deny background */}
        <View
          position="absolute"
          left="$4"
          alignItems="center"
          gap="$1"
        >
          <Ionicons name="close-circle" size={24} color="white" />
          <Text color="white" fontSize="$2" fontWeight="600">
            Deny
          </Text>
        </View>
      </Animated.View>
      
      {/* Main card */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <AnimatedCard
          style={cardStyle}
          elevate
          backgroundColor={activeTheme === 'dark' ? '#1c1c1e' : '#ffffff'}
          borderColor={activeTheme === 'dark' ? '#38383a' : '#dee2e6'}
          borderWidth={1}
          borderRadius="$4"
          padding="$4"
          pressStyle={{ scale: 0.98 }}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <YStack gap="$3">
            {/* Header */}
            <XStack alignItems="center" justifyContent="space-between">
              <XStack alignItems="center" gap="$3" flex={1}>
                <View
                  backgroundColor={`$${action.tool_type}3`}
                  padding="$2"
                  borderRadius="$3"
                >
                  <Ionicons
                    name={getToolIcon(action.tool_type) as any}
                    size={20}
                    color={getStatusColor(action.status)}
                  />
                </View>
                
                <YStack flex={1} gap="$1">
                  <Text
                    fontSize="$4"
                    fontWeight="600"
                    color="$color"
                    numberOfLines={1}
                  >
                    {action.title}
                  </Text>
                  
                  <XStack alignItems="center" gap="$2">
                    <Text
                      fontSize="$2"
                      color="$color11"
                      textTransform="capitalize"
                    >
                      {action.tool_type}
                    </Text>
                    <Text fontSize="$2" color="$color11">
                      •
                    </Text>
                    <Text fontSize="$2" color="$color11">
                      {formatTimeAgo(action.created_at)}
                    </Text>
                  </XStack>
                </YStack>
              </XStack>
              
              <XStack alignItems="center" gap="$2">
                <Badge
                  backgroundColor={getStatusColor(action.status)}
                  color="white"
                  size="$1"
                  textTransform="capitalize"
                >
                  {action.status}
                </Badge>
                
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={activeTheme === 'dark' ? '#8e8e93' : '#6c757d'}
                />
              </XStack>
            </XStack>
            
            {/* Description */}
            <Text
              fontSize="$3"
              color="$color11"
              numberOfLines={isExpanded ? undefined : 2}
            >
              {action.description}
            </Text>
            
            {/* Confidence Score */}
            <XStack alignItems="center" gap="$2">
              <Text fontSize="$2" color="$color11">
                Confidence:
              </Text>
              <Progress
                value={action.confidence * 100}
                max={100}
                flex={1}
                backgroundColor={activeTheme === 'dark' ? '#2c2c2e' : '#e9ecef'}
              >
                <Progress.Indicator
                  animation="quick"
                  backgroundColor={
                    action.confidence > 0.8
                      ? '$green10'
                      : action.confidence > 0.6
                      ? '$yellow10'
                      : '$red10'
                  }
                />
              </Progress>
              <Text fontSize="$2" color="$color11" minWidth={40}>
                {Math.round(action.confidence * 100)}%
              </Text>
            </XStack>
            
            {/* Expanded Content */}
            {isExpanded && (
              <YStack gap="$3" marginTop="$2">
                {/* Reasoning */}
                {action.reasoning && (
                  <YStack gap="$1">
                    <Text fontSize="$3" fontWeight="500" color="$color">
                      AI Reasoning:
                    </Text>
                    <Text fontSize="$3" color="$color11">
                      {action.reasoning}
                    </Text>
                  </YStack>
                )}
                
                {/* Action Buttons */}
                {action.status === 'pending' && (
                  <XStack gap="$3" marginTop="$2">
                    <Button
                      flex={1}
                      theme="red"
                      variant="outlined"
                      onPress={onDeny}
                      icon={<Ionicons name="close" size={16} />}
                    >
                      Deny
                    </Button>
                    
                    <Button
                      flex={1}
                      theme="green"
                      onPress={onApprove}
                      icon={<Ionicons name="checkmark" size={16} />}
                    >
                      Approve
                    </Button>
                  </XStack>
                )}
                
                {/* Detail Button */}
                <Button
                  variant="outlined"
                  size="$3"
                  onPress={onPress}
                  icon={<Ionicons name="information-circle-outline" size={16} />}
                >
                  View Details
                </Button>
              </YStack>
            )}
          </YStack>
        </AnimatedCard>
      </PanGestureHandler>
    </View>
  );
}