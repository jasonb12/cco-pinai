/**
 * Approval Detail Drawer - Bottom sheet with action details
 * Based on PRD-UI.md specifications
 */
import React, { useState } from 'react';
import {
  Sheet,
  XStack,
  YStack,
  Text,
  Button,
  ScrollView,
  Separator,
  View,
  Input,
  TextArea,
} from '@tamagui/core';
import { Ionicons } from '@expo/vector-icons';

import { PendingAction, useNotifStore } from '../../stores/notifStore';
import { useThemeStore } from '../../stores/themeStore';

interface ApprovalDetailDrawerProps {
  action: PendingAction | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ApprovalDetailDrawer({
  action,
  isOpen,
  onClose,
}: ApprovalDetailDrawerProps) {
  const { approveAction, denyAction } = useNotifStore();
  const { activeTheme } = useThemeStore();
  
  const [denyReason, setDenyReason] = useState('');
  const [showDenyForm, setShowDenyForm] = useState(false);
  
  if (!action) return null;
  
  const handleApprove = () => {
    approveAction(action.id);
    onClose();
  };
  
  const handleDeny = () => {
    if (showDenyForm && denyReason.trim()) {
      denyAction(action.id, denyReason);
      setDenyReason('');
      setShowDenyForm(false);
      onClose();
    } else {
      setShowDenyForm(true);
    }
  };
  
  const handleSchedule = () => {
    // TODO: Implement scheduling functionality
    console.log('Schedule action:', action.id);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
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
  
  return (
    <Sheet
      open={isOpen}
      onOpenChange={onClose}
      snapPoints={[85]}
      position={85}
      dismissOnSnapToBottom
    >
      <Sheet.Overlay />
      <Sheet.Frame
        backgroundColor={activeTheme === 'dark' ? '#1c1c1e' : '#ffffff'}
        borderTopLeftRadius="$6"
        borderTopRightRadius="$6"
      >
        <Sheet.Handle
          backgroundColor={activeTheme === 'dark' ? '#48484a' : '#c7c7cc'}
        />
        
        <YStack flex={1}>
          {/* Header */}
          <XStack
            alignItems="center"
            justifyContent="space-between"
            padding="$4"
            borderBottomWidth={1}
            borderBottomColor={activeTheme === 'dark' ? '#38383a' : '#dee2e6'}
          >
            <XStack alignItems="center" gap="$3" flex={1}>
              <View
                backgroundColor={`$${action.tool_type}3`}
                padding="$3"
                borderRadius="$4"
              >
                <Ionicons
                  name={getToolIcon(action.tool_type) as any}
                  size={24}
                  color={activeTheme === 'dark' ? '#ffffff' : '#000000'}
                />
              </View>
              
              <YStack flex={1}>
                <Text fontSize="$5" fontWeight="600" color="$color">
                  {action.title}
                </Text>
                <Text fontSize="$3" color="$color11" textTransform="capitalize">
                  {action.tool_type} • {action.tool_name}
                </Text>
              </YStack>
            </XStack>
            
            <Button
              size="$3"
              variant="ghost"
              circular
              onPress={onClose}
              icon={<Ionicons name="close" size={20} />}
            />
          </XStack>
          
          {/* Content */}
          <ScrollView flex={1} showsVerticalScrollIndicator={false}>
            <YStack padding="$4" gap="$4">
              {/* Description */}
              <YStack gap="$2">
                <Text fontSize="$4" fontWeight="500" color="$color">
                  Description
                </Text>
                <Text fontSize="$3" color="$color11" lineHeight="$2">
                  {action.description}
                </Text>
              </YStack>
              
              <Separator borderColor={activeTheme === 'dark' ? '#38383a' : '#dee2e6'} />
              
              {/* AI Analysis */}
              <YStack gap="$3">
                <Text fontSize="$4" fontWeight="500" color="$color">
                  AI Analysis
                </Text>
                
                <XStack alignItems="center" justifyContent="space-between">
                  <Text fontSize="$3" color="$color11">
                    Confidence Score
                  </Text>
                  <Text fontSize="$3" fontWeight="600" color="$color">
                    {Math.round(action.confidence * 100)}%
                  </Text>
                </XStack>
                
                {action.reasoning && (
                  <YStack gap="$2">
                    <Text fontSize="$3" color="$color11">
                      Reasoning
                    </Text>
                    <Text fontSize="$3" color="$color11" lineHeight="$2">
                      {action.reasoning}
                    </Text>
                  </YStack>
                )}
              </YStack>
              
              <Separator borderColor={activeTheme === 'dark' ? '#38383a' : '#dee2e6'} />
              
              {/* Payload Details */}
              <YStack gap="$3">
                <Text fontSize="$4" fontWeight="500" color="$color">
                  Action Details
                </Text>
                
                {Object.entries(action.payload).map(([key, value]) => (
                  <XStack key={key} alignItems="flex-start" justifyContent="space-between">
                    <Text fontSize="$3" color="$color11" flex={1} textTransform="capitalize">
                      {key.replace(/_/g, ' ')}
                    </Text>
                    <Text fontSize="$3" color="$color" flex={2} textAlign="right">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </Text>
                  </XStack>
                ))}
              </YStack>
              
              <Separator borderColor={activeTheme === 'dark' ? '#38383a' : '#dee2e6'} />
              
              {/* Metadata */}
              <YStack gap="$3">
                <Text fontSize="$4" fontWeight="500" color="$color">
                  Metadata
                </Text>
                
                <XStack alignItems="center" justifyContent="space-between">
                  <Text fontSize="$3" color="$color11">
                    Created
                  </Text>
                  <Text fontSize="$3" color="$color">
                    {formatDate(action.created_at)}
                  </Text>
                </XStack>
                
                <XStack alignItems="center" justifyContent="space-between">
                  <Text fontSize="$3" color="$color11">
                    Transcript ID
                  </Text>
                  <Text fontSize="$3" color="$color" fontFamily="$mono">
                    {action.transcript_id.slice(0, 8)}...
                  </Text>
                </XStack>
                
                <XStack alignItems="center" justifyContent="space-between">
                  <Text fontSize="$3" color="$color11">
                    Status
                  </Text>
                  <Text fontSize="$3" color="$color" textTransform="capitalize">
                    {action.status}
                  </Text>
                </XStack>
              </YStack>
              
              {/* Deny Form */}
              {showDenyForm && (
                <>
                  <Separator borderColor={activeTheme === 'dark' ? '#38383a' : '#dee2e6'} />
                  
                  <YStack gap="$3">
                    <Text fontSize="$4" fontWeight="500" color="$color">
                      Reason for Denial
                    </Text>
                    
                    <TextArea
                      value={denyReason}
                      onChangeText={setDenyReason}
                      placeholder="Please provide a reason for denying this action..."
                      minHeight={80}
                      borderColor={activeTheme === 'dark' ? '#38383a' : '#dee2e6'}
                    />
                  </YStack>
                </>
              )}
            </YStack>
          </ScrollView>
          
          {/* Action Buttons */}
          {action.status === 'pending' && (
            <YStack
              padding="$4"
              gap="$3"
              borderTopWidth={1}
              borderTopColor={activeTheme === 'dark' ? '#38383a' : '#dee2e6'}
              backgroundColor={activeTheme === 'dark' ? '#1c1c1e' : '#ffffff'}
            >
              {showDenyForm ? (
                <XStack gap="$3">
                  <Button
                    flex={1}
                    variant="outlined"
                    onPress={() => {
                      setShowDenyForm(false);
                      setDenyReason('');
                    }}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    flex={1}
                    theme="red"
                    onPress={handleDeny}
                    disabled={!denyReason.trim()}
                    icon={<Ionicons name="close" size={16} />}
                  >
                    Deny with Reason
                  </Button>
                </XStack>
              ) : (
                <>
                  <XStack gap="$3">
                    <Button
                      flex={1}
                      theme="red"
                      variant="outlined"
                      onPress={handleDeny}
                      icon={<Ionicons name="close" size={16} />}
                    >
                      Deny
                    </Button>
                    
                    <Button
                      flex={1}
                      theme="green"
                      onPress={handleApprove}
                      icon={<Ionicons name="checkmark" size={16} />}
                    >
                      Approve
                    </Button>
                  </XStack>
                  
                  <Button
                    variant="outlined"
                    onPress={handleSchedule}
                    icon={<Ionicons name="time-outline" size={16} />}
                  >
                    Schedule for Later
                  </Button>
                </>
              )}
            </YStack>
          )}
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}