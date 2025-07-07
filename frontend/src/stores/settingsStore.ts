/**
 * Settings Store - Zustand
 * Based on PRD-UI.md specifications for app settings and integrations
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Integration {
  id: string;
  name: string;
  type: 'oauth' | 'api_key' | 'webhook';
  provider: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  connected_at?: string;
  last_sync?: string;
  config: Record<string, any>;
  scopes?: string[];
  error_message?: string;
}

export interface NotificationSettings {
  push_enabled: boolean;
  email_enabled: boolean;
  approval_notifications: boolean;
  sync_notifications: boolean;
  error_notifications: boolean;
  daily_summary: boolean;
  quiet_hours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
}

export interface PrivacySettings {
  data_retention_days: number;
  auto_delete_processed: boolean;
  share_analytics: boolean;
  location_tracking: boolean;
  audio_encryption: boolean;
}

export interface FeatureFlags {
  beta_features: boolean;
  advanced_ai: boolean;
  location_triggers: boolean;
  custom_integrations: boolean;
  experimental_ui: boolean;
}

interface SettingsState {
  // State
  integrations: Integration[];
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  featureFlags: FeatureFlags;
  
  // App settings
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  
  // Performance settings
  sync_frequency: number; // minutes
  auto_process: boolean;
  batch_size: number;
  
  // UI preferences
  compact_mode: boolean;
  show_confidence_scores: boolean;
  default_view: 'chat' | 'dashboard' | 'notifications';
  
  isLoading: boolean;
  
  // Actions
  setIntegrations: (integrations: Integration[]) => void;
  addIntegration: (integration: Integration) => void;
  updateIntegration: (id: string, updates: Partial<Integration>) => void;
  removeIntegration: (id: string) => void;
  
  updateNotifications: (updates: Partial<NotificationSettings>) => void;
  updatePrivacy: (updates: Partial<PrivacySettings>) => void;
  updateFeatureFlags: (updates: Partial<FeatureFlags>) => void;
  
  updateAppSettings: (updates: {
    language?: string;
    timezone?: string;
    dateFormat?: string;
    currency?: string;
  }) => void;
  
  updatePerformanceSettings: (updates: {
    sync_frequency?: number;
    auto_process?: boolean;
    batch_size?: number;
  }) => void;
  
  updateUIPreferences: (updates: {
    compact_mode?: boolean;
    show_confidence_scores?: boolean;
    default_view?: 'chat' | 'dashboard' | 'notifications';
  }) => void;
  
  // Integration actions
  connectOAuth: (integrationId: string) => Promise<void>;
  disconnectIntegration: (integrationId: string) => Promise<void>;
  testIntegration: (integrationId: string) => Promise<boolean>;
  
  // Data management
  exportData: () => Promise<void>;
  deleteAllData: () => Promise<void>;
  
  // Sync actions
  syncSettings: () => Promise<void>;
  resetSettings: () => void;
  setLoading: (loading: boolean) => void;
}

const defaultNotifications: NotificationSettings = {
  push_enabled: true,
  email_enabled: true,
  approval_notifications: true,
  sync_notifications: false,
  error_notifications: true,
  daily_summary: true,
  quiet_hours: {
    enabled: true,
    start: '22:00',
    end: '08:00',
  },
};

const defaultPrivacy: PrivacySettings = {
  data_retention_days: 90,
  auto_delete_processed: false,
  share_analytics: false,
  location_tracking: true,
  audio_encryption: true,
};

const defaultFeatureFlags: FeatureFlags = {
  beta_features: false,
  advanced_ai: true,
  location_triggers: false,
  custom_integrations: false,
  experimental_ui: false,
};

export const settingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      integrations: [],
      notifications: defaultNotifications,
      privacy: defaultPrivacy,
      featureFlags: defaultFeatureFlags,
      
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dateFormat: 'MM/dd/yyyy',
      currency: 'USD',
      
      sync_frequency: 30,
      auto_process: true,
      batch_size: 10,
      
      compact_mode: false,
      show_confidence_scores: true,
      default_view: 'dashboard',
      
      isLoading: false,
      
      setIntegrations: (integrations) => set({ integrations }),
      
      addIntegration: (integration) => set((state) => ({
        integrations: [...state.integrations, integration]
      })),
      
      updateIntegration: (id, updates) => set((state) => ({
        integrations: state.integrations.map(integration =>
          integration.id === id ? { ...integration, ...updates } : integration
        )
      })),
      
      removeIntegration: (id) => set((state) => ({
        integrations: state.integrations.filter(integration => integration.id !== id)
      })),
      
      updateNotifications: (updates) => set((state) => ({
        notifications: { ...state.notifications, ...updates }
      })),
      
      updatePrivacy: (updates) => set((state) => ({
        privacy: { ...state.privacy, ...updates }
      })),
      
      updateFeatureFlags: (updates) => set((state) => ({
        featureFlags: { ...state.featureFlags, ...updates }
      })),
      
      updateAppSettings: (updates) => set(updates),
      
      updatePerformanceSettings: (updates) => set(updates),
      
      updateUIPreferences: (updates) => set(updates),
      
      connectOAuth: async (integrationId) => {
        const { updateIntegration, setLoading } = get();
        
        try {
          setLoading(true);
          updateIntegration(integrationId, { status: 'pending' });
          
          // TODO: Implement OAuth flow
          // const authUrl = await initiateOAuthFlow(integrationId);
          // Handle OAuth callback, etc.
          
          // Mock success
          setTimeout(() => {
            updateIntegration(integrationId, {
              status: 'connected',
              connected_at: new Date().toISOString(),
            });
          }, 2000);
          
        } catch (error) {
          updateIntegration(integrationId, {
            status: 'error',
            error_message: error instanceof Error ? error.message : 'Connection failed',
          });
          throw error;
        } finally {
          setLoading(false);
        }
      },
      
      disconnectIntegration: async (integrationId) => {
        const { updateIntegration, setLoading } = get();
        
        try {
          setLoading(true);
          
          // TODO: Call API to disconnect
          // await disconnectIntegrationAPI(integrationId);
          
          updateIntegration(integrationId, {
            status: 'disconnected',
            connected_at: undefined,
            last_sync: undefined,
            error_message: undefined,
          });
          
        } catch (error) {
          console.error('Failed to disconnect integration:', error);
          throw error;
        } finally {
          setLoading(false);
        }
      },
      
      testIntegration: async (integrationId) => {
        const { updateIntegration, setLoading } = get();
        
        try {
          setLoading(true);
          
          // TODO: Call API to test integration
          // const result = await testIntegrationAPI(integrationId);
          
          // Mock test
          const success = Math.random() > 0.3;
          
          if (success) {
            updateIntegration(integrationId, {
              status: 'connected',
              last_sync: new Date().toISOString(),
              error_message: undefined,
            });
          } else {
            updateIntegration(integrationId, {
              status: 'error',
              error_message: 'Test connection failed',
            });
          }
          
          return success;
          
        } catch (error) {
          updateIntegration(integrationId, {
            status: 'error',
            error_message: error instanceof Error ? error.message : 'Test failed',
          });
          return false;
        } finally {
          setLoading(false);
        }
      },
      
      exportData: async () => {
        const { setLoading } = get();
        
        try {
          setLoading(true);
          
          // TODO: Implement data export
          const data = {
            settings: get(),
            exported_at: new Date().toISOString(),
          };
          
          console.log('Exporting data:', data);
          
        } catch (error) {
          console.error('Failed to export data:', error);
          throw error;
        } finally {
          setLoading(false);
        }
      },
      
      deleteAllData: async () => {
        const { setLoading, resetSettings } = get();
        
        try {
          setLoading(true);
          
          // TODO: Call API to delete all user data
          // await deleteAllUserDataAPI();
          
          resetSettings();
          
        } catch (error) {
          console.error('Failed to delete data:', error);
          throw error;
        } finally {
          setLoading(false);
        }
      },
      
      syncSettings: async () => {
        const { setLoading } = get();
        
        try {
          setLoading(true);
          
          // TODO: Sync settings with server
          // const serverSettings = await fetchSettingsAPI();
          // Apply server settings if newer
          
        } catch (error) {
          console.error('Failed to sync settings:', error);
          throw error;
        } finally {
          setLoading(false);
        }
      },
      
      resetSettings: () => set({
        integrations: [],
        notifications: defaultNotifications,
        privacy: defaultPrivacy,
        featureFlags: defaultFeatureFlags,
        language: 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dateFormat: 'MM/dd/yyyy',
        currency: 'USD',
        sync_frequency: 30,
        auto_process: true,
        batch_size: 10,
        compact_mode: false,
        show_confidence_scores: true,
        default_view: 'dashboard',
      }),
      
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({
        notifications: state.notifications,
        privacy: state.privacy,
        featureFlags: state.featureFlags,
        language: state.language,
        timezone: state.timezone,
        dateFormat: state.dateFormat,
        currency: state.currency,
        sync_frequency: state.sync_frequency,
        auto_process: state.auto_process,
        batch_size: state.batch_size,
        compact_mode: state.compact_mode,
        show_confidence_scores: state.show_confidence_scores,
        default_view: state.default_view,
      }),
    }
  )
);

// Hook for easy consumption
export const useSettingsStore = () => settingsStore();