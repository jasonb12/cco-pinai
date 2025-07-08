/**
 * Action Types for MCP Analysis System
 * Comprehensive type definitions for single, scheduled, and recurring events
 */

export enum ActionType {
  SINGLE_EVENT = 'single_event',
  SCHEDULED_EVENT = 'scheduled_event', 
  RECURRING_EVENT = 'recurring_event',
  TASK = 'task',
  EMAIL = 'email',
  CONTACT = 'contact',
  REMINDER = 'reminder',
  CALL = 'call',
  DOCUMENT = 'document',
  CUSTOM = 'custom'
}

export enum ActionStatus {
  PENDING = 'pending',
  APPROVED = 'approved', 
  DENIED = 'denied',
  EXECUTED = 'executed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum RecurrencePattern {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  WEEKDAYS = 'weekdays',
  CUSTOM = 'custom'
}

export interface BaseAction {
  id: string;
  type: ActionType;
  title: string;
  description: string;
  priority: Priority;
  confidence: number;
  reasoning: string;
  status: ActionStatus;
  created_at: string;
  updated_at: string;
  source_text: string;
  user_id: string;
  transcript_id?: string;
}

export interface SingleEventAction extends BaseAction {
  type: ActionType.SINGLE_EVENT;
  event_details: {
    title: string;
    description?: string;
    location?: string;
    duration_minutes?: number;
    attendees?: string[];
    notes?: string;
  };
}

export interface ScheduledEventAction extends BaseAction {
  type: ActionType.SCHEDULED_EVENT;
  event_details: {
    title: string;
    description?: string;
    location?: string;
    start_date: string; // ISO date string
    start_time: string; // HH:MM format
    end_date?: string;
    end_time?: string;
    duration_minutes?: number;
    attendees?: string[];
    notes?: string;
    timezone?: string;
  };
}

export interface RecurringEventAction extends BaseAction {
  type: ActionType.RECURRING_EVENT;
  event_details: {
    title: string;
    description?: string;
    location?: string;
    start_date: string;
    start_time: string;
    end_time?: string;
    duration_minutes?: number;
    attendees?: string[];
    notes?: string;
    timezone?: string;
  };
  recurrence: {
    pattern: RecurrencePattern;
    interval: number; // Every X days/weeks/months
    days_of_week?: number[]; // 0=Sunday, 1=Monday, etc.
    day_of_month?: number; // For monthly recurrence
    end_date?: string; // When to stop recurring
    occurrence_count?: number; // Alternative to end_date
  };
}

export interface TaskAction extends BaseAction {
  type: ActionType.TASK;
  task_details: {
    title: string;
    description?: string;
    due_date?: string;
    due_time?: string;
    assignee?: string;
    project?: string;
    tags?: string[];
    checklist?: string[];
  };
}

export interface EmailAction extends BaseAction {
  type: ActionType.EMAIL;
  email_details: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    attachments?: string[];
    send_at?: string; // For scheduled emails
    template?: string;
  };
}

export interface ContactAction extends BaseAction {
  type: ActionType.CONTACT;
  contact_details: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    title?: string;
    notes?: string;
    tags?: string[];
    source?: string;
  };
}

export interface ReminderAction extends BaseAction {
  type: ActionType.REMINDER;
  reminder_details: {
    title: string;
    description?: string;
    remind_at: string; // ISO datetime
    repeat?: RecurrencePattern;
    location?: string;
    action_required?: string;
  };
}

export interface CallAction extends BaseAction {
  type: ActionType.CALL;
  call_details: {
    contact_name: string;
    phone_number?: string;
    purpose: string;
    scheduled_time?: string;
    duration_minutes?: number;
    notes?: string;
    follow_up_required?: boolean;
  };
}

export interface DocumentAction extends BaseAction {
  type: ActionType.DOCUMENT;
  document_details: {
    title: string;
    type: 'create' | 'update' | 'review' | 'share';
    template?: string;
    content?: string;
    due_date?: string;
    collaborators?: string[];
    folder?: string;
  };
}

export interface CustomAction extends BaseAction {
  type: ActionType.CUSTOM;
  custom_details: {
    tool_name: string;
    action_name: string;
    parameters: Record<string, any>;
    webhook_url?: string;
    api_endpoint?: string;
  };
}

export type MCPAction = 
  | SingleEventAction
  | ScheduledEventAction  
  | RecurringEventAction
  | TaskAction
  | EmailAction
  | ContactAction
  | ReminderAction
  | CallAction
  | DocumentAction
  | CustomAction;

export interface MCPAnalysisResult {
  id: string;
  source_text: string;
  analysis_timestamp: string;
  processing_time_ms: number;
  overall_confidence: number;
  actions: MCPAction[];
  summary: string;
  key_insights: string[];
  sentiment?: {
    overall: 'positive' | 'neutral' | 'negative';
    score: number;
    emotions: string[];
  };
  entities?: {
    people: string[];
    organizations: string[];
    locations: string[];
    dates: string[];
    times: string[];
  };
}

export interface ApprovalRequest {
  id: string;
  action_id: string;
  action: MCPAction;
  requested_at: string;
  requested_by: string;
  urgency: Priority;
  auto_approve_at?: string; // Auto-approve after this time
  context: {
    source_analysis: string;
    related_actions?: string[];
    conflict_warnings?: string[];
    suggestions?: string[];
  };
}

export interface ApprovalResponse {
  request_id: string;
  action_id: string;
  decision: 'approved' | 'denied' | 'modified';
  decided_at: string;
  decided_by: string;
  modifications?: Partial<MCPAction>;
  notes?: string;
  execution_scheduled_for?: string;
}

export interface ExecutionResult {
  action_id: string;
  executed_at: string;
  status: 'success' | 'failed' | 'partial';
  result_data?: any;
  error_message?: string;
  external_id?: string; // ID in external system (Google Calendar, etc.)
  follow_up_actions?: string[];
}

// Utility types for UI components
export interface ActionGroup {
  date: string;
  actions: MCPAction[];
}

export interface ActionFilter {
  types?: ActionType[];
  statuses?: ActionStatus[];
  priorities?: Priority[];
  date_range?: {
    start: string;
    end: string;
  };
  search_query?: string;
}

export interface ActionStats {
  total_actions: number;
  pending_approvals: number;
  executed_today: number;
  failed_executions: number;
  by_type: Record<ActionType, number>;
  by_priority: Record<Priority, number>;
  average_confidence: number;
} 