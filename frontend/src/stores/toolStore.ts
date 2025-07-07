/**
 * Tool Store - Zustand
 * Based on PRD-UI.md specifications for MCP tool management
 */
import { create } from 'zustand';

export interface MCPTool {
  id: string;
  name: string;
  version: string;
  type: 'calendar' | 'email' | 'task' | 'contact' | 'reminder' | 'custom';
  description: string;
  enabled: boolean;
  oauth_required: boolean;
  oauth_status: 'connected' | 'disconnected' | 'pending' | 'error';
  oauth_provider?: string;
  default_params: Record<string, any>;
  trigger_rules: TriggerRule[];
  last_execution?: string;
  execution_count: number;
  error_count: number;
}

export interface TriggerRule {
  id: string;
  type: 'regex' | 'vector_similarity' | 'geofence' | 'schedule';
  pattern: string;
  threshold?: number;
  enabled: boolean;
  description: string;
}

export interface ToolExecution {
  id: string;
  tool_name: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  duration_ms?: number;
  input_payload: Record<string, any>;
  output_payload?: Record<string, any>;
  error_message?: string;
}

interface ToolState {
  // State
  tools: MCPTool[];
  executions: ToolExecution[];
  selectedTool: MCPTool | null;
  isLoading: boolean;
  
  // Actions
  setTools: (tools: MCPTool[]) => void;
  addTool: (tool: MCPTool) => void;
  updateTool: (id: string, updates: Partial<MCPTool>) => void;
  removeTool: (id: string) => void;
  toggleTool: (id: string) => void;
  selectTool: (tool: MCPTool | null) => void;
  
  setExecutions: (executions: ToolExecution[]) => void;
  addExecution: (execution: ToolExecution) => void;
  
  updateToolConfig: (id: string, config: Partial<MCPTool>) => Promise<void>;
  testRunTool: (id: string, payload: Record<string, any>) => Promise<ToolExecution>;
  
  addTriggerRule: (toolId: string, rule: Omit<TriggerRule, 'id'>) => void;
  updateTriggerRule: (toolId: string, ruleId: string, updates: Partial<TriggerRule>) => void;
  removeTriggerRule: (toolId: string, ruleId: string) => void;
  
  connectOAuth: (toolId: string, provider: string) => Promise<void>;
  disconnectOAuth: (toolId: string) => Promise<void>;
  
  refresh: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const toolStore = create<ToolState>((set, get) => ({
  // Initial state
  tools: [],
  executions: [],
  selectedTool: null,
  isLoading: false,
  
  setTools: (tools) => set({ tools }),
  
  addTool: (tool) => set((state) => ({
    tools: [...state.tools, tool]
  })),
  
  updateTool: (id, updates) => set((state) => ({
    tools: state.tools.map(tool =>
      tool.id === id ? { ...tool, ...updates } : tool
    ),
    selectedTool: state.selectedTool?.id === id 
      ? { ...state.selectedTool, ...updates } 
      : state.selectedTool
  })),
  
  removeTool: (id) => set((state) => ({
    tools: state.tools.filter(tool => tool.id !== id),
    selectedTool: state.selectedTool?.id === id ? null : state.selectedTool
  })),
  
  toggleTool: (id) => set((state) => ({
    tools: state.tools.map(tool =>
      tool.id === id ? { ...tool, enabled: !tool.enabled } : tool
    )
  })),
  
  selectTool: (selectedTool) => set({ selectedTool }),
  
  setExecutions: (executions) => set({ executions }),
  
  addExecution: (execution) => set((state) => ({
    executions: [execution, ...state.executions].slice(0, 100) // Keep last 100
  })),
  
  updateToolConfig: async (id, config) => {
    const { updateTool, setLoading } = get();
    
    try {
      setLoading(true);
      
      // TODO: Call API to update tool config
      // await updateToolConfigAPI(id, config);
      
      updateTool(id, config);
      
    } catch (error) {
      console.error('Failed to update tool config:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  },
  
  testRunTool: async (id, payload) => {
    const { addExecution, setLoading } = get();
    
    try {
      setLoading(true);
      
      const execution: ToolExecution = {
        id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tool_name: id,
        status: 'pending',
        timestamp: new Date().toISOString(),
        input_payload: payload,
      };
      
      addExecution(execution);
      
      // TODO: Call actual API
      // const result = await testRunToolAPI(id, payload);
      
      // Mock execution
      setTimeout(() => {
        const completedExecution: ToolExecution = {
          ...execution,
          status: Math.random() > 0.2 ? 'success' : 'failed',
          duration_ms: Math.floor(Math.random() * 2000) + 500,
          output_payload: { result: 'Test execution completed' },
          error_message: Math.random() > 0.2 ? undefined : 'Mock error for testing',
        };
        
        addExecution(completedExecution);
      }, 1500);
      
      return execution;
      
    } catch (error) {
      console.error('Test run failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  },
  
  addTriggerRule: (toolId, ruleData) => set((state) => {
    const rule: TriggerRule = {
      ...ruleData,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    return {
      tools: state.tools.map(tool =>
        tool.id === toolId 
          ? { ...tool, trigger_rules: [...tool.trigger_rules, rule] }
          : tool
      )
    };
  }),
  
  updateTriggerRule: (toolId, ruleId, updates) => set((state) => ({
    tools: state.tools.map(tool =>
      tool.id === toolId
        ? {
            ...tool,
            trigger_rules: tool.trigger_rules.map(rule =>
              rule.id === ruleId ? { ...rule, ...updates } : rule
            )
          }
        : tool
    )
  })),
  
  removeTriggerRule: (toolId, ruleId) => set((state) => ({
    tools: state.tools.map(tool =>
      tool.id === toolId
        ? {
            ...tool,
            trigger_rules: tool.trigger_rules.filter(rule => rule.id !== ruleId)
          }
        : tool
    )
  })),
  
  connectOAuth: async (toolId, provider) => {
    const { updateTool, setLoading } = get();
    
    try {
      setLoading(true);
      updateTool(toolId, { oauth_status: 'pending' });
      
      // TODO: Implement OAuth flow
      // const authUrl = await initOAuthFlow(toolId, provider);
      // Open auth URL, handle callback, etc.
      
      // Mock success
      setTimeout(() => {
        updateTool(toolId, { 
          oauth_status: 'connected',
          oauth_provider: provider 
        });
      }, 2000);
      
    } catch (error) {
      updateTool(toolId, { oauth_status: 'error' });
      console.error('OAuth connection failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  },
  
  disconnectOAuth: async (toolId) => {
    const { updateTool, setLoading } = get();
    
    try {
      setLoading(true);
      
      // TODO: Call API to disconnect OAuth
      // await disconnectOAuthAPI(toolId);
      
      updateTool(toolId, { 
        oauth_status: 'disconnected',
        oauth_provider: undefined 
      });
      
    } catch (error) {
      console.error('OAuth disconnection failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  },
  
  refresh: async () => {
    const { setLoading, setTools, setExecutions } = get();
    
    try {
      setLoading(true);
      
      // TODO: Fetch from API
      // const [tools, executions] = await Promise.all([
      //   fetchToolsAPI(),
      //   fetchExecutionsAPI()
      // ]);
      
      // Mock data for now
      const mockTools: MCPTool[] = [
        {
          id: 'extract_actions',
          name: 'extract_actions',
          version: '1.0',
          type: 'custom',
          description: 'AI-powered action extraction from transcripts',
          enabled: true,
          oauth_required: false,
          oauth_status: 'disconnected',
          default_params: {},
          trigger_rules: [],
          execution_count: 42,
          error_count: 1,
        },
        {
          id: 'create_calendar_event',
          name: 'create_calendar_event',
          version: '1.0',
          type: 'calendar',
          description: 'Create calendar events',
          enabled: true,
          oauth_required: true,
          oauth_status: 'disconnected',
          oauth_provider: 'google',
          default_params: { calendar_id: 'primary' },
          trigger_rules: [
            {
              id: 'rule_1',
              type: 'regex',
              pattern: '(meeting|schedule|appointment)',
              enabled: true,
              description: 'Detect meeting-related keywords'
            }
          ],
          execution_count: 15,
          error_count: 0,
        },
      ];
      
      setTools(mockTools);
      
    } catch (error) {
      console.error('Failed to refresh tools:', error);
    } finally {
      setLoading(false);
    }
  },
  
  setLoading: (isLoading) => set({ isLoading }),
}));

// Hook for easy consumption
export const useToolStore = () => toolStore();