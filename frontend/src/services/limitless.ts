import { supabase } from '../config/supabase';
import { authService } from './authService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export interface LimitlessLifelog {
  id: string;
  title: string;
  content: string;
  markdown: string;
  created_at: string;
  updated_at: string;
  audio_url?: string;
  transcript_text?: string;
}

export interface LimitlessSettings {
  apiKey: string;
  isConnected: boolean;
  lastSync?: string;
  syncEnabled: boolean;
  timezone: string;
}

export interface LimitlessSyncProgress {
  type: 'batch_processed' | 'error' | 'completed';
  date?: string;
  batch_size?: number;
  batch_synced?: number;
  total_synced?: number;
  cursor?: string;
  has_more?: boolean;
  error?: string;
}

export interface LimitlessSyncResult {
  success: boolean;
  message: string;
  synced_count?: number;
  errors?: string[];
}

class LimitlessService {
  private static instance: LimitlessService;
  
  private constructor() {}

  public static getInstance(): LimitlessService {
    if (!LimitlessService.instance) {
      LimitlessService.instance = new LimitlessService();
    }
    return LimitlessService.instance;
  }

  // Settings Management
  async saveApiKey(apiKey: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to save API key');
    }

    try {
      // Save to user metadata or a settings table
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          setting_key: 'limitless_api_key',
          setting_value: apiKey,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error saving Limitless API key:', error);
      throw new Error('Failed to save API key');
    }
  }

  async getApiKey(): Promise<string | null> {
    const user = authService.getCurrentUser();
    if (!user) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('setting_value')
        .eq('user_id', user.id)
        .eq('setting_key', 'limitless_api_key')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      return data?.setting_value || null;
    } catch (error) {
      console.error('Error getting Limitless API key:', error);
      return null;
    }
  }

  async removeApiKey(): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', user.id)
        .eq('setting_key', 'limitless_api_key');

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error removing Limitless API key:', error);
      throw new Error('Failed to remove API key');
    }
  }

  async getSettings(): Promise<LimitlessSettings> {
    const apiKey = await this.getApiKey();
    
    return {
      apiKey: apiKey || '',
      isConnected: !!apiKey,
      syncEnabled: !!apiKey,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    };
  }

  async updateSettings(settings: Partial<LimitlessSettings>): Promise<void> {
    if (settings.apiKey !== undefined) {
      if (settings.apiKey) {
        await this.saveApiKey(settings.apiKey);
      } else {
        await this.removeApiKey();
      }
    }

    // Save other settings
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated');
    }

    const settingsToSave = Object.entries(settings)
      .filter(([key, value]) => key !== 'apiKey' && value !== undefined)
      .map(([key, value]) => ({
        user_id: user.id,
        setting_key: `limitless_${key}`,
        setting_value: JSON.stringify(value),
        updated_at: new Date().toISOString(),
      }));

    if (settingsToSave.length > 0) {
      const { error } = await supabase
        .from('user_settings')
        .upsert(settingsToSave);

      if (error) {
        throw error;
      }
    }
  }

  // Connection Testing
  async testConnection(apiKey?: string): Promise<{ success: boolean; message: string }> {
    try {
      const keyToTest = apiKey || await this.getApiKey();
      
      if (!keyToTest) {
        return {
          success: false,
          message: 'No API key provided',
        };
      }

      // Test connection by fetching recent lifelogs
      const response = await fetch(`${API_BASE_URL}/limitless/lifelogs/recent?limit=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': keyToTest,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: `Successfully connected! Found ${data.lifelogs?.length || 0} recent entries.`,
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.detail || `Connection failed: ${response.status}`,
        };
      }
    } catch (error) {
      console.error('Error testing Limitless connection:', error);
      return {
        success: false,
        message: 'Connection test failed. Please check your internet connection and API key.',
      };
    }
  }

  // Data Fetching
  async getRecentLifelogs(limit: number = 10): Promise<LimitlessLifelog[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/limitless/lifelogs/recent?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch lifelogs: ${response.status}`);
      }

      const data = await response.json();
      return data.lifelogs || [];
    } catch (error) {
      console.error('Error fetching recent lifelogs:', error);
      throw error;
    }
  }

  async getLifelogsByDate(date: string, timezone: string = 'UTC'): Promise<LimitlessLifelog[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/limitless/lifelogs/by-date`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date, timezone }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch lifelogs: ${response.status}`);
      }

      const data = await response.json();
      return data.lifelogs || [];
    } catch (error) {
      console.error('Error fetching lifelogs by date:', error);
      throw error;
    }
  }

  async getLifelogsByRange(
    startTime: string, 
    endTime: string, 
    timezone: string = 'UTC'
  ): Promise<LimitlessLifelog[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/limitless/lifelogs/by-range`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ start_time: startTime, end_time: endTime, timezone }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch lifelogs: ${response.status}`);
      }

      const data = await response.json();
      return data.lifelogs || [];
    } catch (error) {
      console.error('Error fetching lifelogs by range:', error);
      throw error;
    }
  }

  // Sync Functionality
  async syncToTranscripts(): Promise<LimitlessSyncResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/limitless/sync-to-transcripts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Sync failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message,
        synced_count: data.synced_count,
      };
    } catch (error) {
      console.error('Error syncing to transcripts:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Sync failed',
      };
    }
  }

  async performIncrementalSync(userId: string): Promise<LimitlessSyncResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/limitless/sync/incremental?user_id=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Incremental sync failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message,
        synced_count: data.total_synced,
        errors: data.errors,
      };
    } catch (error) {
      console.error('Error performing incremental sync:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Incremental sync failed',
      };
    }
  }

  // Subscribe to sync progress via WebSocket
  subscribeToSyncProgress(callback: (progress: LimitlessSyncProgress) => void): () => void {
    // This would integrate with the existing WebSocket system
    // For now, we'll return a no-op unsubscribe function
    console.log('Sync progress subscription not implemented yet');
    return () => {};
  }

  // Utility Methods
  async isConnected(): Promise<boolean> {
    const settings = await this.getSettings();
    if (!settings.isConnected) {
      return false;
    }

    const testResult = await this.testConnection();
    return testResult.success;
  }

  async getConnectionStatus(): Promise<{ connected: boolean; message: string }> {
    const settings = await this.getSettings();
    
    if (!settings.apiKey) {
      return {
        connected: false,
        message: 'No API key configured',
      };
    }

    const testResult = await this.testConnection();
    return {
      connected: testResult.success,
      message: testResult.message,
    };
  }
}

// Export singleton instance
export const limitlessService = LimitlessService.getInstance();
export default limitlessService; 