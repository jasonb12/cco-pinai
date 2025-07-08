/**
 * Google Calendar Integration Service
 * Handles Google Calendar API calls, synchronization, and state management
 */
import { supabase } from '../config/supabase';
import { authService } from './authService';

export interface CalendarEvent {
  id: string;
  google_event_id?: string;
  limitless_id?: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  timezone: string;
  location?: string;
  attendees: string[];
  source: 'ccopinai' | 'google' | 'limitless';
  sync_status: 'pending' | 'synced' | 'conflict' | 'error' | 'deleted';
  sync_error?: string;
  status: 'tentative' | 'confirmed' | 'cancelled';
  visibility: 'default' | 'public' | 'private' | 'confidential';
  color_id?: string;
  recurring_event_id?: string;
  recurrence: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CalendarTask {
  id: string;
  calendar_event_id?: string;
  google_task_id?: string;
  limitless_id?: string;
  title: string;
  description?: string;
  due_date?: string;
  completed: boolean;
  completed_at?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  source: 'ccopinai' | 'google' | 'limitless';
  sync_status: 'pending' | 'synced' | 'conflict' | 'error';
  sync_error?: string;
  parent_task_id?: string;
  position?: number;
  notes?: string;
  links: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CalendarConflict {
  id: string;
  calendar_event_id: string;
  conflict_type: 'time_overlap' | 'data_mismatch' | 'duplicate_event' | 'permission_denied';
  local_data: Record<string, any>;
  remote_data: Record<string, any>;
  resolution?: 'use_local' | 'use_remote' | 'merge' | 'manual' | 'ignore';
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarSyncState {
  provider: string;
  calendar_id: string;
  last_sync_at?: string;
  next_sync_token?: string;
  full_sync_completed: boolean;
  incremental_sync_enabled: boolean;
  sync_interval_minutes: number;
  last_error?: string;
  error_count: number;
  last_successful_sync_at?: string;
  events_imported: number;
  events_exported: number;
  conflicts_detected: number;
}

export interface CalendarConnectionStatus {
  connected: boolean;
  provider?: string;
  connected_at?: string;
  token_expires_at?: string;
  sync_stats?: CalendarSyncState;
}

export interface CalendarSyncResult {
  success: boolean;
  message: string;
  results: {
    google: {
      imported: number;
      exported: number;
      errors: string[];
    };
    limitless: {
      imported: number;
      exported: number;
      errors: string[];
    };
    conflicts: CalendarConflict[];
  };
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day?: boolean;
  location?: string;
  attendees?: string[];
  timezone?: string;
  recurrence?: string[];
  color_id?: string;
  visibility?: string;
  metadata?: Record<string, any>;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  all_day?: boolean;
  location?: string;
  attendees?: string[];
  timezone?: string;
  recurrence?: string[];
  color_id?: string;
  visibility?: string;
  metadata?: Record<string, any>;
}

class GoogleCalendarService {
  private baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

  /**
   * Check if backend is available
   */
  private async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get authentication headers
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await authService.getAccessToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  /**
   * Make authenticated API request
   */
  private async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const isHealthy = await this.checkBackendHealth();
      if (!isHealthy) {
        return {
          success: false,
          error: 'Backend service is currently unavailable. Please try again later.',
        };
      }

      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/calendar${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        return {
          success: false,
          error: errorData.detail || `HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // OAuth and Connection Management

  /**
   * Initiate Google Calendar OAuth flow
   */
  async initiateGoogleOAuth(state?: string): Promise<{ success: boolean; authUrl?: string; error?: string }> {
    try {
      const params = new URLSearchParams();
      if (state) params.append('state', state);

      const result = await this.apiRequest<{ auth_url: string }>(`/auth/google?${params.toString()}`);
      
      if (result.success && result.data) {
        return { success: true, authUrl: result.data.auth_url };
      }

      return { success: false, error: result.error };
    } catch (error) {
      console.error('Failed to initiate Google OAuth:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate OAuth',
      };
    }
  }

  /**
   * Connect Google Calendar with authorization code
   */
  async connectGoogleCalendar(authCode: string): Promise<{ success: boolean; error?: string }> {
    const result = await this.apiRequest('/connect/google', {
      method: 'POST',
      body: JSON.stringify({ auth_code: authCode }),
    });

    return {
      success: result.success,
      error: result.error,
    };
  }

  /**
   * Disconnect Google Calendar
   */
  async disconnectGoogleCalendar(): Promise<{ success: boolean; error?: string }> {
    const result = await this.apiRequest('/disconnect/google', {
      method: 'DELETE',
    });

    return {
      success: result.success,
      error: result.error,
    };
  }

  /**
   * Get calendar connection status
   */
  async getConnectionStatus(): Promise<{ success: boolean; data?: CalendarConnectionStatus; error?: string }> {
    const result = await this.apiRequest<CalendarConnectionStatus>('/connection/status');
    return result;
  }

  // Synchronization

  /**
   * Trigger manual calendar synchronization
   */
  async syncCalendar(forceFullSync: boolean = false): Promise<{ success: boolean; data?: CalendarSyncResult; error?: string }> {
    const result = await this.apiRequest<CalendarSyncResult>('/sync', {
      method: 'POST',
      body: JSON.stringify({ force_full_sync: forceFullSync }),
    });

    return result;
  }

  /**
   * Get synchronization status
   */
  async getSyncStatus(): Promise<{ success: boolean; data?: { sync_states: CalendarSyncState[] }; error?: string }> {
    const result = await this.apiRequest<{ sync_states: CalendarSyncState[] }>('/sync/status');
    return result;
  }

  // Event Management

  /**
   * Get calendar events
   */
  async getEvents(
    startDate?: Date,
    endDate?: Date,
    sources?: string[]
  ): Promise<{ success: boolean; data?: { events: CalendarEvent[]; count: number }; error?: string }> {
    const params = new URLSearchParams();
    
    if (startDate) {
      params.append('start_date', startDate.toISOString());
    }
    if (endDate) {
      params.append('end_date', endDate.toISOString());
    }
    if (sources && sources.length > 0) {
      sources.forEach(source => params.append('sources', source));
    }

    const endpoint = `/events${params.toString() ? `?${params.toString()}` : ''}`;
    const result = await this.apiRequest<{ events: CalendarEvent[]; count: number }>(endpoint);
    return result;
  }

  /**
   * Get a specific event
   */
  async getEvent(eventId: string): Promise<{ success: boolean; data?: CalendarEvent; error?: string }> {
    const result = await this.apiRequest<CalendarEvent>(`/events/${eventId}`);
    return result;
  }

  /**
   * Create a new calendar event
   */
  async createEvent(eventData: CreateEventRequest): Promise<{ success: boolean; data?: { event_id: string; google_sync: any }; error?: string }> {
    const result = await this.apiRequest<{ event_id: string; google_sync: any }>('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });

    return result;
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(eventId: string, eventData: UpdateEventRequest): Promise<{ success: boolean; data?: { event_id: string; google_sync: any }; error?: string }> {
    const result = await this.apiRequest<{ event_id: string; google_sync: any }>(`/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });

    return result;
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
    const result = await this.apiRequest(`/events/${eventId}`, {
      method: 'DELETE',
    });

    return {
      success: result.success,
      error: result.error,
    };
  }

  // Task Management

  /**
   * Get calendar tasks
   */
  async getTasks(
    completed?: boolean,
    dueDateStart?: Date,
    dueDateEnd?: Date
  ): Promise<{ success: boolean; data?: { tasks: CalendarTask[]; count: number }; error?: string }> {
    const params = new URLSearchParams();
    
    if (completed !== undefined) {
      params.append('completed', completed.toString());
    }
    if (dueDateStart) {
      params.append('due_date_start', dueDateStart.toISOString());
    }
    if (dueDateEnd) {
      params.append('due_date_end', dueDateEnd.toISOString());
    }

    const endpoint = `/tasks${params.toString() ? `?${params.toString()}` : ''}`;
    const result = await this.apiRequest<{ tasks: CalendarTask[]; count: number }>(endpoint);
    return result;
  }

  /**
   * Create a new task
   */
  async createTask(
    title: string,
    description?: string,
    dueDate?: Date,
    priority: string = 'normal',
    calendarEventId?: string
  ): Promise<{ success: boolean; data?: { task_id: string }; error?: string }> {
    const result = await this.apiRequest<{ task_id: string }>('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title,
        description: description || '',
        due_date: dueDate?.toISOString(),
        priority,
        calendar_event_id: calendarEventId,
      }),
    });

    return result;
  }

  /**
   * Update a task
   */
  async updateTask(
    taskId: string,
    updates: {
      title?: string;
      description?: string;
      dueDate?: Date;
      completed?: boolean;
      priority?: string;
    }
  ): Promise<{ success: boolean; data?: { task_id: string }; error?: string }> {
    const body: any = {};
    
    if (updates.title !== undefined) body.title = updates.title;
    if (updates.description !== undefined) body.description = updates.description;
    if (updates.dueDate !== undefined) body.due_date = updates.dueDate.toISOString();
    if (updates.completed !== undefined) body.completed = updates.completed;
    if (updates.priority !== undefined) body.priority = updates.priority;

    const result = await this.apiRequest<{ task_id: string }>(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    return result;
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<{ success: boolean; error?: string }> {
    const result = await this.apiRequest(`/tasks/${taskId}`, {
      method: 'DELETE',
    });

    return {
      success: result.success,
      error: result.error,
    };
  }

  // Conflict Resolution

  /**
   * Get calendar conflicts
   */
  async getConflicts(resolved?: boolean): Promise<{ success: boolean; data?: { conflicts: CalendarConflict[]; count: number }; error?: string }> {
    const params = new URLSearchParams();
    
    if (resolved !== undefined) {
      params.append('resolved', resolved.toString());
    }

    const endpoint = `/conflicts${params.toString() ? `?${params.toString()}` : ''}`;
    const result = await this.apiRequest<{ conflicts: CalendarConflict[]; count: number }>(endpoint);
    return result;
  }

  /**
   * Resolve a calendar conflict
   */
  async resolveConflict(
    conflictId: string,
    resolution: string,
    notes?: string
  ): Promise<{ success: boolean; data?: { conflict_id: string; resolution: string }; error?: string }> {
    const result = await this.apiRequest<{ conflict_id: string; resolution: string }>(`/conflicts/${conflictId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({
        resolution,
        notes: notes || '',
      }),
    });

    return result;
  }

  // Utility Methods

  /**
   * Get events for a specific date range (commonly used for calendar views)
   */
  async getEventsForDateRange(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    const result = await this.getEvents(startDate, endDate);
    return result.success && result.data ? result.data.events : [];
  }

  /**
   * Get today's events
   */
  async getTodaysEvents(): Promise<CalendarEvent[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    return this.getEventsForDateRange(startOfDay, endOfDay);
  }

  /**
   * Get this week's events
   */
  async getWeekEvents(): Promise<CalendarEvent[]> {
    const today = new Date();
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 7);
    
    return this.getEventsForDateRange(startOfWeek, endOfWeek);
  }

  /**
   * Get this month's events
   */
  async getMonthEvents(): Promise<CalendarEvent[]> {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    return this.getEventsForDateRange(startOfMonth, endOfMonth);
  }

  /**
   * Check if a user has Google Calendar connected
   */
  async isGoogleCalendarConnected(): Promise<boolean> {
    const result = await this.getConnectionStatus();
    return result.success && result.data ? result.data.connected : false;
  }

  /**
   * Get sync statistics
   */
  async getSyncStatistics(): Promise<CalendarSyncState | null> {
    const result = await this.getConnectionStatus();
    if (result.success && result.data && result.data.sync_stats) {
      return result.data.sync_stats;
    }
    return null;
  }

  /**
   * Format event for display
   */
  formatEventForDisplay(event: CalendarEvent): {
    title: string;
    time: string;
    duration: string;
    source: string;
    status: string;
  } {
    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);
    
    let timeStr = '';
    if (event.all_day) {
      timeStr = 'All day';
    } else {
      timeStr = `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
    let durationStr = '';
    if (duration < 60) {
      durationStr = `${duration}m`;
    } else {
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      durationStr = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }

    return {
      title: event.title,
      time: timeStr,
      duration: durationStr,
      source: event.source,
      status: event.sync_status,
    };
  }
}

// Create and export singleton instance
export const googleCalendarService = new GoogleCalendarService();
export default googleCalendarService; 