/**
 * Monitor Store - Zustand
 * Based on PRD-UI.md specifications for processing pipeline monitoring
 */
import { create } from 'zustand';

export interface ProcessingEvent {
  id: string;
  job_id: string;
  transcript_id?: string;
  action_id?: string;
  stage: 'ingested' | 'vectorized' | 'parsed' | 'proposed' | 'approved' | 'executed' | 'indexed' | 'failed';
  status: string;
  payload: Record<string, any>;
  error_message?: string;
  duration_ms?: number;
  created_at: string;
}

export interface ProcessingPipeline {
  transcript_id: string;
  meeting_title?: string;
  stages: ProcessingEvent[];
  current_stage: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  started_at: string;
  completed_at?: string;
  total_duration_ms?: number;
  user_id: string;
}

export type FilterStatus = 'all' | 'running' | 'completed' | 'failed' | 'pending';
export type FilterTool = 'all' | 'calendar' | 'email' | 'task' | 'custom';

interface MonitorState {
  // State
  events: ProcessingEvent[];
  pipelines: ProcessingPipeline[];
  selectedPipeline: ProcessingPipeline | null;
  selectedEvent: ProcessingEvent | null;
  
  // Filters
  statusFilter: FilterStatus;
  toolFilter: FilterTool;
  searchQuery: string;
  dateRange: {
    start?: string;
    end?: string;
  };
  
  // UI State
  isLoading: boolean;
  isRealtime: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // seconds
  
  // Actions
  setEvents: (events: ProcessingEvent[]) => void;
  addEvent: (event: ProcessingEvent) => void;
  updateEvent: (id: string, updates: Partial<ProcessingEvent>) => void;
  
  setPipelines: (pipelines: ProcessingPipeline[]) => void;
  addPipeline: (pipeline: ProcessingPipeline) => void;
  updatePipeline: (transcriptId: string, updates: Partial<ProcessingPipeline>) => void;
  
  selectPipeline: (pipeline: ProcessingPipeline | null) => void;
  selectEvent: (event: ProcessingEvent | null) => void;
  
  // Filters
  setStatusFilter: (filter: FilterStatus) => void;
  setToolFilter: (filter: FilterTool) => void;
  setSearchQuery: (query: string) => void;
  setDateRange: (range: { start?: string; end?: string }) => void;
  clearFilters: () => void;
  
  // Filtered data
  getFilteredEvents: () => ProcessingEvent[];
  getFilteredPipelines: () => ProcessingPipeline[];
  
  // Actions
  retryPipeline: (transcriptId: string) => Promise<void>;
  forceExecuteAction: (actionId: string) => Promise<void>;
  exportData: (format: 'csv' | 'json') => Promise<void>;
  
  // Real-time
  startRealtime: () => void;
  stopRealtime: () => void;
  setAutoRefresh: (enabled: boolean) => void;
  refresh: () => Promise<void>;
  
  setLoading: (loading: boolean) => void;
}

export const monitorStore = create<MonitorState>((set, get) => ({
  // Initial state
  events: [],
  pipelines: [],
  selectedPipeline: null,
  selectedEvent: null,
  
  statusFilter: 'all',
  toolFilter: 'all',
  searchQuery: '',
  dateRange: {},
  
  isLoading: false,
  isRealtime: false,
  autoRefresh: false,
  refreshInterval: 30,
  
  setEvents: (events) => set({ events }),
  
  addEvent: (event) => set((state) => ({
    events: [event, ...state.events].slice(0, 1000) // Keep last 1000 events
  })),
  
  updateEvent: (id, updates) => set((state) => ({
    events: state.events.map(event =>
      event.id === id ? { ...event, ...updates } : event
    )
  })),
  
  setPipelines: (pipelines) => set({ pipelines }),
  
  addPipeline: (pipeline) => set((state) => ({
    pipelines: [pipeline, ...state.pipelines]
  })),
  
  updatePipeline: (transcriptId, updates) => set((state) => ({
    pipelines: state.pipelines.map(pipeline =>
      pipeline.transcript_id === transcriptId ? { ...pipeline, ...updates } : pipeline
    ),
    selectedPipeline: state.selectedPipeline?.transcript_id === transcriptId
      ? { ...state.selectedPipeline, ...updates }
      : state.selectedPipeline
  })),
  
  selectPipeline: (selectedPipeline) => set({ selectedPipeline }),
  selectEvent: (selectedEvent) => set({ selectedEvent }),
  
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setToolFilter: (toolFilter) => set({ toolFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setDateRange: (dateRange) => set({ dateRange }),
  
  clearFilters: () => set({
    statusFilter: 'all',
    toolFilter: 'all',
    searchQuery: '',
    dateRange: {}
  }),
  
  getFilteredEvents: () => {
    const { events, statusFilter, toolFilter, searchQuery, dateRange } = get();
    
    return events.filter(event => {
      // Status filter
      if (statusFilter !== 'all' && event.status !== statusFilter) {
        return false;
      }
      
      // Tool filter (based on payload or action info)
      if (toolFilter !== 'all') {
        const toolType = event.payload?.tool_type;
        if (toolType !== toolFilter) return false;
      }
      
      // Search query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const searchableText = [
          event.stage,
          event.status,
          event.transcript_id,
          event.job_id,
          JSON.stringify(event.payload)
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchLower)) return false;
      }
      
      // Date range
      if (dateRange.start && event.created_at < dateRange.start) return false;
      if (dateRange.end && event.created_at > dateRange.end) return false;
      
      return true;
    });
  },
  
  getFilteredPipelines: () => {
    const { pipelines, statusFilter, searchQuery, dateRange } = get();
    
    return pipelines.filter(pipeline => {
      // Status filter
      if (statusFilter !== 'all' && pipeline.status !== statusFilter) {
        return false;
      }
      
      // Search query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const searchableText = [
          pipeline.meeting_title || '',
          pipeline.transcript_id,
          pipeline.status
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchLower)) return false;
      }
      
      // Date range
      if (dateRange.start && pipeline.started_at < dateRange.start) return false;
      if (dateRange.end && pipeline.started_at > dateRange.end) return false;
      
      return true;
    });
  },
  
  retryPipeline: async (transcriptId) => {
    const { updatePipeline, setLoading } = get();
    
    try {
      setLoading(true);
      
      // TODO: Call API to retry pipeline
      // await retryPipelineAPI(transcriptId);
      
      updatePipeline(transcriptId, {
        status: 'pending',
        current_stage: 'ingested'
      });
      
    } catch (error) {
      console.error('Failed to retry pipeline:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  },
  
  forceExecuteAction: async (actionId) => {
    const { setLoading } = get();
    
    try {
      setLoading(true);
      
      // TODO: Call API to force execute action
      // await forceExecuteActionAPI(actionId);
      
    } catch (error) {
      console.error('Failed to force execute action:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  },
  
  exportData: async (format) => {
    const { getFilteredEvents, getFilteredPipelines, setLoading } = get();
    
    try {
      setLoading(true);
      
      const events = getFilteredEvents();
      const pipelines = getFilteredPipelines();
      
      const data = { events, pipelines, exported_at: new Date().toISOString() };
      
      if (format === 'json') {
        // TODO: Implement JSON export
        console.log('JSON Export:', data);
      } else {
        // TODO: Implement CSV export
        console.log('CSV Export:', data);
      }
      
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  },
  
  startRealtime: () => {
    set({ isRealtime: true });
    
    // TODO: Setup WebSocket connection for real-time updates
    // const ws = new WebSocket('ws://localhost:8000/ws');
    // ws.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //   if (data.type === 'processing_log') {
    //     get().addEvent(data.event);
    //   }
    // };
  },
  
  stopRealtime: () => {
    set({ isRealtime: false });
    // TODO: Close WebSocket connection
  },
  
  setAutoRefresh: (autoRefresh) => {
    set({ autoRefresh });
    
    if (autoRefresh) {
      // TODO: Setup auto-refresh interval
      setInterval(() => {
        get().refresh();
      }, get().refreshInterval * 1000);
    }
  },
  
  refresh: async () => {
    const { setLoading, setEvents, setPipelines } = get();
    
    try {
      setLoading(true);
      
      // TODO: Fetch latest data from API
      // const [events, pipelines] = await Promise.all([
      //   fetchProcessingEventsAPI(),
      //   fetchPipelinesAPI()
      // ]);
      
      // Mock data for now
      const mockEvents: ProcessingEvent[] = [
        {
          id: '1',
          job_id: 'job_123',
          transcript_id: 'transcript_456',
          stage: 'completed',
          status: 'success',
          payload: { actions_extracted: 3 },
          duration_ms: 1500,
          created_at: new Date().toISOString(),
        }
      ];
      
      const mockPipelines: ProcessingPipeline[] = [
        {
          transcript_id: 'transcript_456',
          meeting_title: 'Team Standup',
          stages: mockEvents,
          current_stage: 'completed',
          status: 'completed',
          started_at: new Date(Date.now() - 10000).toISOString(),
          completed_at: new Date().toISOString(),
          total_duration_ms: 2500,
          user_id: 'user_123',
        }
      ];
      
      setEvents(mockEvents);
      setPipelines(mockPipelines);
      
    } catch (error) {
      console.error('Failed to refresh monitor data:', error);
    } finally {
      setLoading(false);
    }
  },
  
  setLoading: (isLoading) => set({ isLoading }),
}));

// Hook for easy consumption
export const useMonitorStore = () => monitorStore();