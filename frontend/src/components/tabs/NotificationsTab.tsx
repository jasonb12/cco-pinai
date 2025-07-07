/**
 * Notifications Tab - Approval Queue Implementation
 * Based on PRD-UI.md specifications
 */
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import {
  View,
  Text,
  Button,
  Card,
  XStack,
  YStack,
  Badge,
  Separator,
  Sheet,
  ScrollView,
} from '@tamagui/core';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import stores and components
import { useNotifStore, PendingAction, Alert } from '../../stores/notifStore';
import { useThemeStore } from '../../stores/themeStore';
import ApprovalCard from '../approval/ApprovalCard';
import AlertCard from '../approval/AlertCard';
import FilterBar from '../approval/FilterBar';
import ApprovalDetailDrawer from '../approval/ApprovalDetailDrawer';

export default function NotificationsTab() {
  const {
    pendingActions,
    alerts,
    filter,
    getFilteredActions,
    setFilter,
    refresh,
    markAlertRead,
    removeAlert,
    clearAlerts,
  } = useNotifStore();
  
  const { activeTheme } = useThemeStore();
  
  const [selectedAction, setSelectedAction] = useState<PendingAction | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'approvals' | 'alerts'>('approvals');
  
  const filteredActions = getFilteredActions();
  const unreadAlerts = alerts.filter(alert => !alert.read);
  
  useEffect(() => {
    refresh();
  }, []);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };
  
  const handleActionPress = (action: PendingAction) => {
    setSelectedAction(action);
    setShowDetailDrawer(true);
  };
  
  const handleAlertPress = (alert: Alert) => {
    markAlertRead(alert.id);
    if (alert.action) {
      alert.action.onPress();
    }
  };
  
  const renderApprovalItem = ({ item }: { item: PendingAction }) => (
    <ApprovalCard
      action={item}
      onPress={() => handleActionPress(item)}
      onApprove={() => console.log('Approve', item.id)}
      onDeny={() => console.log('Deny', item.id)}
    />
  );
  
  const renderAlertItem = ({ item }: { item: Alert }) => (
    <AlertCard
      alert={item}
      onPress={() => handleAlertPress(item)}
      onDismiss={() => removeAlert(item.id)}
    />
  );
  
  const backgroundColor = activeTheme === 'dark' ? '#000000' : '#ffffff';
  const surfaceColor = activeTheme === 'dark' ? '#1c1c1e' : '#f8f9fa';
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      <YStack flex={1} backgroundColor={backgroundColor}>
        {/* Header */}
        <XStack
          padding="$4"
          alignItems="center"
          justifyContent="space-between"
          backgroundColor={surfaceColor}
          borderBottomWidth={1}
          borderBottomColor={activeTheme === 'dark' ? '#38383a' : '#dee2e6'}
        >
          <Text fontSize="$6" fontWeight="600" color="$color">
            Notifications
          </Text>
          
          <XStack gap="$2">
            {unreadAlerts.length > 0 && (
              <Button
                size="$3"
                variant="outlined"
                onPress={clearAlerts}
                icon={<Ionicons name="trash-outline" size={16} />}
              >
                Clear
              </Button>
            )}
            
            <Button
              size="$3"
              variant="outlined"
              onPress={handleRefresh}
              icon={<Ionicons name="refresh-outline" size={16} />}
            >
              Refresh
            </Button>
          </XStack>
        </XStack>
        
        {/* Tab Switcher */}
        <XStack
          padding="$3"
          gap="$2"
          backgroundColor={surfaceColor}
        >
          <Button
            flex={1}
            size="$3"
            variant={activeTab === 'approvals' ? 'outlined' : 'ghost'}
            backgroundColor={activeTab === 'approvals' ? '$blue2' : 'transparent'}
            onPress={() => setActiveTab('approvals')}
          >
            <XStack alignItems="center" gap="$2">
              <Text>Approvals</Text>
              {filteredActions.length > 0 && (
                <Badge backgroundColor="$blue10" color="white" size="$1">
                  {filteredActions.length}
                </Badge>
              )}
            </XStack>
          </Button>
          
          <Button
            flex={1}
            size="$3"
            variant={activeTab === 'alerts' ? 'outlined' : 'ghost'}
            backgroundColor={activeTab === 'alerts' ? '$blue2' : 'transparent'}
            onPress={() => setActiveTab('alerts')}
          >
            <XStack alignItems="center" gap="$2">
              <Text>Alerts</Text>
              {unreadAlerts.length > 0 && (
                <Badge backgroundColor="$red10" color="white" size="$1">
                  {unreadAlerts.length}
                </Badge>
              )}
            </XStack>
          </Button>
        </XStack>
        
        {/* Filter Bar (only for approvals) */}
        {activeTab === 'approvals' && (
          <FilterBar
            currentFilter={filter}
            onFilterChange={setFilter}
            backgroundColor={surfaceColor}
          />
        )}
        
        {/* Content */}
        <View flex={1}>
          {activeTab === 'approvals' ? (
            filteredActions.length > 0 ? (
              <FlatList
                data={filteredActions}
                renderItem={renderApprovalItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                ItemSeparatorComponent={() => <View height="$3" />}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor={activeTheme === 'dark' ? '#ffffff' : '#000000'}
                  />
                }
              />
            ) : (
              <YStack
                flex={1}
                alignItems="center"
                justifyContent="center"
                padding="$6"
                gap="$4"
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={64}
                  color={activeTheme === 'dark' ? '#8e8e93' : '#6c757d'}
                />
                <Text
                  fontSize="$5"
                  fontWeight="500"
                  color="$color11"
                  textAlign="center"
                >
                  No pending approvals
                </Text>
                <Text
                  fontSize="$3"
                  color="$color11"
                  textAlign="center"
                  opacity={0.7}
                >
                  All actions have been reviewed
                </Text>
              </YStack>
            )
          ) : (
            alerts.length > 0 ? (
              <FlatList
                data={alerts}
                renderItem={renderAlertItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                ItemSeparatorComponent={() => <View height="$3" />}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor={activeTheme === 'dark' ? '#ffffff' : '#000000'}
                  />
                }
              />
            ) : (
              <YStack
                flex={1}
                alignItems="center"
                justifyContent="center"
                padding="$6"
                gap="$4"
              >
                <Ionicons
                  name="notifications-off-outline"
                  size={64}
                  color={activeTheme === 'dark' ? '#8e8e93' : '#6c757d'}
                />
                <Text
                  fontSize="$5"
                  fontWeight="500"
                  color="$color11"
                  textAlign="center"
                >
                  No alerts
                </Text>
                <Text
                  fontSize="$3"
                  color="$color11"
                  textAlign="center"
                  opacity={0.7}
                >
                  You're all caught up
                </Text>
              </YStack>
            )
          )}
        </View>
        
        {/* Approval Detail Drawer */}
        <ApprovalDetailDrawer
          action={selectedAction}
          isOpen={showDetailDrawer}
          onClose={() => {
            setShowDetailDrawer(false);
            setSelectedAction(null);
          }}
        />
      </YStack>
    </SafeAreaView>
  );
}