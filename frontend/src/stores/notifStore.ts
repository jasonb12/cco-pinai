/**
 * Notification Store - Zustand
 * Based on PRD-UI.md specifications for approval queue and alerts
 */
import { create } from 'zustand';

export interface PendingAction {
  id: string;
  transcript_id: string;
  tool_type: 'calendar' | 'email' | 'task' | 'contact' | 'reminder' | 'custom';
  tool_name: string;
  payload: Record<string, any>;
  confidence: number;
  reasoning: string;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  title: string;
  description: string;
}

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  persistent?: boolean;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface NotifState {
  // State
  pendingActions: PendingAction[];
  alerts: Alert[];
  unreadCount: number;
  filter: 'all' | 'pending' | 'completed';
  
  // Actions
  setPendingActions: (actions: PendingAction[]) => void;
  addPendingAction: (action: PendingAction) => void;
  updateAction: (id: string, updates: Partial<PendingAction>) => void;
  removeAction: (id: string) => void;
  approveAction: (id: string) => void;
  denyAction: (id: string, reason?: string) => void;
  
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'read'>) => void;
  markAlertRead: (id: string) => void;
  removeAlert: (id: string) => void;
  clearAlerts: () => void;
  
  setFilter: (filter: 'all' | 'pending' | 'completed') => void;
  getFilteredActions: () => PendingAction[];
  refresh: () => Promise<void>;
}

export const notifStore = create<NotifState>((set, get) => ({
  // Initial state
  pendingActions: [],
  alerts: [],
  unreadCount: 0,
  filter: 'all',
  
  setPendingActions: (pendingActions) => set({ 
    pendingActions,
    unreadCount: pendingActions.filter(a => a.status === 'pending').length
  }),
  
  addPendingAction: (action) => set((state) => {
    const newActions = [...state.pendingActions, action];
    return {
      pendingActions: newActions,
      unreadCount: newActions.filter(a => a.status === 'pending').length
    };
  }),
  
  updateAction: (id, updates) => set((state) => {
    const updatedActions = state.pendingActions.map(action =>
      action.id === id ? { ...action, ...updates } : action
    );
    return {
      pendingActions: updatedActions,
      unreadCount: updatedActions.filter(a => a.status === 'pending').length
    };
  }),
  
  removeAction: (id) => set((state) => {
    const filteredActions = state.pendingActions.filter(action => action.id !== id);
    return {
      pendingActions: filteredActions,
      unreadCount: filteredActions.filter(a => a.status === 'pending').length
    };
  }),
  
  approveAction: (id) => {
    const { updateAction, addAlert } = get();
    updateAction(id, { status: 'approved' });
    addAlert({
      type: 'success',
      title: 'Action Approved',
      message: 'Action has been approved and will be executed.',
    });
  },
  
  denyAction: (id, reason) => {
    const { updateAction, addAlert } = get();
    updateAction(id, { status: 'denied' });
    addAlert({
      type: 'info',
      title: 'Action Denied',
      message: reason || 'Action has been denied.',
    });
  },
  
  addAlert: (alertData) => set((state) => {
    const alert: Alert = {
      ...alertData,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    return {
      alerts: [alert, ...state.alerts].slice(0, 50), // Keep max 50 alerts
    };
  }),
  
  markAlertRead: (id) => set((state) => ({
    alerts: state.alerts.map(alert =>
      alert.id === id ? { ...alert, read: true } : alert
    )
  })),
  
  removeAlert: (id) => set((state) => ({
    alerts: state.alerts.filter(alert => alert.id !== id)
  })),
  
  clearAlerts: () => set({ alerts: [] }),
  
  setFilter: (filter) => set({ filter }),
  
  getFilteredActions: () => {
    const { pendingActions, filter } = get();
    
    switch (filter) {
      case 'pending':
        return pendingActions.filter(action => action.status === 'pending');
      case 'completed':
        return pendingActions.filter(action => action.status !== 'pending');
      default:
        return pendingActions;
    }
  },
  
  refresh: async () => {
    // This would typically call the API to refresh pending actions
    // For now, it's a placeholder
    try {
      // const actions = await fetchPendingActions();
      // get().setPendingActions(actions);
    } catch (error) {
      get().addAlert({
        type: 'error',
        title: 'Refresh Failed',
        message: 'Failed to refresh pending actions.',
      });
    }
  },
}));

// Hook for easy consumption
export const useNotifStore = () => notifStore();