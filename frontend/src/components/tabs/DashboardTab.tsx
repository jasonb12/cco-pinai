/**
 * Dashboard Tab - Main dashboard with KPIs, quick actions, and recent activity
 * Based on PRD-UI.md specifications
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { motion } from 'framer-motion';
import { useThemeColors } from '../../contexts/ThemeContext';
import { ActionType, ActionStatus } from '../../types/actions';
import KPICard, { KPIData } from '../dashboard/KPICard';
import QuickActions, { QuickAction } from '../dashboard/QuickActions';
import RecentActivity, { ActivityItem } from '../dashboard/RecentActivity';
import AnimatedPage from '../AnimatedPage';
import AnimatedView from '../AnimatedView';
import { listVariants, listItemVariants, buttonVariants } from '../../utils/animations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mock data for demonstration
const mockKPIData: KPIData[] = [
  {
    id: 'freshness',
    title: 'Data Freshness',
    value: '2.3h',
    subtitle: 'Last transcript processed',
    icon: 'refresh-outline',
    color: '#10b981',
    trend: {
      direction: 'down',
      percentage: 15,
      period: 'vs yesterday',
    },
  },
  {
    id: 'pending_approvals',
    title: 'Pending Approvals',
    value: 7,
    subtitle: 'Actions awaiting review',
    icon: 'time-outline',
    color: '#f59e0b',
    trend: {
      direction: 'up',
      percentage: 12,
      period: 'vs yesterday',
    },
  },
  {
    id: 'tasks_due',
    title: 'Tasks Due Today',
    value: 3,
    subtitle: 'Scheduled for completion',
    icon: 'checkmark-circle-outline',
    color: '#ef4444',
    trend: {
      direction: 'stable',
      percentage: 0,
      period: 'vs yesterday',
    },
  },
  {
    id: 'processing_rate',
    title: 'Processing Rate',
    value: '94.2%',
    subtitle: 'Success rate this week',
    icon: 'analytics-outline',
    color: '#3b82f6',
    trend: {
      direction: 'up',
      percentage: 2.1,
      period: 'vs last week',
    },
  },
];

const mockQuickActions: QuickAction[] = [
  {
    id: 'new_transcript',
    title: 'Process Text',
    icon: 'document-text-outline',
    color: '#3b82f6',
    onPress: () => console.log('Process text'),
  },
  {
    id: 'review_approvals',
    title: 'Review Approvals',
    icon: 'checkmark-done-outline',
    color: '#f59e0b',
    badge: 7,
    onPress: () => console.log('Review approvals'),
  },
  {
    id: 'view_calendar',
    title: 'View Calendar',
    icon: 'calendar-outline',
    color: '#8b5cf6',
    onPress: () => console.log('View calendar'),
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: 'settings-outline',
    color: '#6b7280',
    onPress: () => console.log('Settings'),
  },
];

const mockRecentActivity: ActivityItem[] = [
  {
    id: '1',
    type: 'action_approved',
    title: 'Team Meeting Approved',
    description: 'Meeting with Sarah scheduled for Jan 15 at 2:00 PM',
    timestamp: new Date(Date.now() - 300000).toISOString(), // 5 mins ago
    actionType: ActionType.SCHEDULED_EVENT,
    user: 'You',
  },
  {
    id: '2',
    type: 'action_executed',
    title: 'Email Sent Successfully',
    description: 'Follow-up email sent to client@company.com',
    timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
    actionType: ActionType.EMAIL,
    user: 'System',
  },
  {
    id: '3',
    type: 'action_denied',
    title: 'Task Creation Denied',
    description: 'Marketing budget review task was denied due to insufficient details',
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    actionType: ActionType.TASK,
    user: 'You',
  },
  {
    id: '4',
    type: 'system_event',
    title: 'Weekly Standup Created',
    description: 'Recurring meeting set up for every Monday at 9:00 AM',
    timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    actionType: ActionType.RECURRING_EVENT,
    user: 'System',
  },
  {
    id: '5',
    type: 'user_action',
    title: 'Transcript Processed',
    description: 'New audio transcript analyzed and 5 actions extracted',
    timestamp: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
    user: 'System',
  },
];

export default function DashboardTab() {
  const colors = useThemeColors();
  const [refreshing, setRefreshing] = useState(false);
  const [kpiData, setKpiData] = useState<KPIData[]>(mockKPIData);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>(mockRecentActivity);

  const handleRefresh = async () => {
    setRefreshing(true);
    
    // Simulate API call to refresh data
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update KPI data with slight variations
    setKpiData(prev => prev.map(kpi => ({
      ...kpi,
      value: kpi.id === 'pending_approvals' ? Math.floor(Math.random() * 10) + 1 : kpi.value,
      trend: kpi.trend ? {
        ...kpi.trend,
        percentage: Math.random() * 20,
        direction: Math.random() > 0.5 ? 'up' : 'down',
      } : undefined,
    })));
    
    setRefreshing(false);
  };

  const handleKPIPress = (kpiId: string) => {
    console.log('KPI pressed:', kpiId);
    // Navigate to detailed view or perform action
  };

  const handleViewAllActivity = () => {
    console.log('View all activity');
    // Navigate to full activity log
  };

  const renderKPIGrid = () => (
    <AnimatedView
      variants={listVariants}
      initial="initial"
      animate="animate"
      style={styles.kpiGrid}
    >
      {kpiData.map((kpi, index) => (
        <AnimatedView
          key={kpi.id}
          variants={listItemVariants}
          style={[
            styles.kpiItem,
            { width: (SCREEN_WIDTH - 48) / 2 }
          ]}
        >
          <KPICard
            data={{
              ...kpi,
              onPress: () => handleKPIPress(kpi.id),
            }}
            size="medium"
          />
        </AnimatedView>
      ))}
    </AnimatedView>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flex: 1,
    },
    greeting: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    title: {
      fontSize: 24,
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
    scrollContent: {
      paddingBottom: 100,
    },
    section: {
      marginBottom: 20,
    },
    sectionPadding: {
      paddingHorizontal: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
      paddingHorizontal: 20,
    },
    kpiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      paddingHorizontal: 20,
    },
    kpiItem: {
      // Width set dynamically in renderKPIGrid
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginHorizontal: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statItem: {
      alignItems: 'center',
      gap: 4,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
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
    emptyDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <AnimatedPage>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.title}>Dashboard</Text>
          </View>
          <View style={styles.headerActions}>
            <AnimatedView
              variants={buttonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
            >
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleRefresh}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh-outline" size={20} color={colors.text} />
              </TouchableOpacity>
            </AnimatedView>
            <AnimatedView
              variants={buttonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
            >
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => console.log('Notifications')}
                activeOpacity={0.7}
              >
                <Ionicons name="notifications-outline" size={20} color={colors.text} />
              </TouchableOpacity>
            </AnimatedView>
          </View>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* KPI Cards */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            {renderKPIGrid()}
          </View>

          {/* Quick Actions */}
          <View style={[styles.section, styles.sectionPadding]}>
            <QuickActions
              actions={mockQuickActions}
              title="Quick Actions"
              horizontal={true}
            />
          </View>

          {/* Recent Activity */}
          <View style={[styles.section, styles.sectionPadding]}>
            <RecentActivity
              activities={recentActivity}
              title="Recent Activity"
              maxItems={5}
              showViewAll={true}
              onViewAll={handleViewAllActivity}
            />
          </View>
        </ScrollView>
      </View>
    </AnimatedPage>
  );
}