/**
 * Tools System Types - Comprehensive type definitions for tools and integrations
 * Based on PRD-UI.md specifications for Tools tab
 */

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string;
  color: string;
  version: string;
  status: ToolStatus;
  isActive: boolean;
  lastUsed?: string;
  usageCount: number;
  rating: number;
  tags: string[];
  
  // Configuration
  config: ToolConfig;
  
  // Integration details
  integration?: Integration;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  
  // Capabilities
  capabilities: ToolCapability[];
  
  // Pricing/Limits
  pricing?: ToolPricing;
  limits?: ToolLimits;
}

export enum ToolCategory {
  PRODUCTIVITY = 'productivity',
  COMMUNICATION = 'communication',
  ANALYTICS = 'analytics',
  AUTOMATION = 'automation',
  DEVELOPMENT = 'development',
  DESIGN = 'design',
  MARKETING = 'marketing',
  FINANCE = 'finance',
  CRM = 'crm',
  PROJECT_MANAGEMENT = 'project_management',
  AI_ML = 'ai_ml',
  CUSTOM = 'custom'
}

export enum ToolStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  ERROR = 'error',
  DEPRECATED = 'deprecated',
  MAINTENANCE = 'maintenance'
}

export enum ToolCapability {
  READ_DATA = 'read_data',
  WRITE_DATA = 'write_data',
  REAL_TIME = 'real_time',
  WEBHOOKS = 'webhooks',
  API_ACCESS = 'api_access',
  BATCH_PROCESSING = 'batch_processing',
  NOTIFICATIONS = 'notifications',
  FILE_UPLOAD = 'file_upload',
  SCHEDULING = 'scheduling',
  REPORTING = 'reporting'
}

export interface ToolConfig {
  settings: Record<string, any>;
  triggers: ToolTrigger[];
  actions: ToolAction[];
  permissions: ToolPermission[];
  customFields?: Record<string, any>;
}

export interface ToolTrigger {
  id: string;
  name: string;
  description: string;
  type: TriggerType;
  condition: string;
  isActive: boolean;
  config: Record<string, any>;
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
}

export enum TriggerType {
  SCHEDULE = 'schedule',
  WEBHOOK = 'webhook',
  EVENT = 'event',
  CONDITION = 'condition',
  MANUAL = 'manual'
}

export interface ToolAction {
  id: string;
  name: string;
  description: string;
  type: ActionType;
  config: Record<string, any>;
  isActive: boolean;
  executionCount: number;
  lastExecuted?: string;
  averageExecutionTime?: number;
}

export enum ActionType {
  HTTP_REQUEST = 'http_request',
  DATABASE_QUERY = 'database_query',
  FILE_OPERATION = 'file_operation',
  NOTIFICATION = 'notification',
  EMAIL = 'email',
  WEBHOOK = 'webhook',
  CUSTOM_SCRIPT = 'custom_script'
}

export interface ToolPermission {
  id: string;
  name: string;
  description: string;
  scope: PermissionScope;
  isGranted: boolean;
  grantedAt?: string;
  expiresAt?: string;
}

export enum PermissionScope {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin',
  EXECUTE = 'execute',
  CONFIGURE = 'configure'
}

export interface Integration {
  id: string;
  name: string;
  provider: string;
  type: IntegrationType;
  status: IntegrationStatus;
  connectionDetails: ConnectionDetails;
  authConfig: AuthConfig;
  syncConfig?: SyncConfig;
  webhookConfig?: WebhookConfig;
  createdAt: string;
  lastSync?: string;
  errorCount: number;
  successCount: number;
}

export enum IntegrationType {
  OAUTH = 'oauth',
  API_KEY = 'api_key',
  WEBHOOK = 'webhook',
  DATABASE = 'database',
  FILE_SYSTEM = 'file_system',
  CUSTOM = 'custom'
}

export enum IntegrationStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  PENDING = 'pending',
  ERROR = 'error',
  EXPIRED = 'expired',
  RATE_LIMITED = 'rate_limited'
}

export interface ConnectionDetails {
  endpoint?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  region?: string;
  environment?: string;
  customFields?: Record<string, any>;
}

export interface AuthConfig {
  type: AuthType;
  credentials: Record<string, any>;
  tokenExpiry?: string;
  refreshToken?: string;
  scopes?: string[];
  lastRefresh?: string;
}

export enum AuthType {
  OAUTH2 = 'oauth2',
  API_KEY = 'api_key',
  BEARER_TOKEN = 'bearer_token',
  BASIC_AUTH = 'basic_auth',
  CUSTOM = 'custom'
}

export interface SyncConfig {
  frequency: SyncFrequency;
  lastSync?: string;
  nextSync?: string;
  syncFields: string[];
  conflictResolution: ConflictResolution;
  isActive: boolean;
}

export enum SyncFrequency {
  REAL_TIME = 'real_time',
  EVERY_MINUTE = 'every_minute',
  EVERY_5_MINUTES = 'every_5_minutes',
  EVERY_15_MINUTES = 'every_15_minutes',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MANUAL = 'manual'
}

export enum ConflictResolution {
  OVERWRITE_LOCAL = 'overwrite_local',
  OVERWRITE_REMOTE = 'overwrite_remote',
  MERGE = 'merge',
  MANUAL = 'manual'
}

export interface WebhookConfig {
  url: string;
  secret?: string;
  events: string[];
  headers?: Record<string, string>;
  retryPolicy: RetryPolicy;
  isActive: boolean;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: BackoffStrategy;
  retryDelay: number;
}

export enum BackoffStrategy {
  FIXED = 'fixed',
  LINEAR = 'linear',
  EXPONENTIAL = 'exponential'
}

export interface ToolPricing {
  model: PricingModel;
  cost: number;
  currency: string;
  billingPeriod: BillingPeriod;
  freeUsage?: number;
  overageRate?: number;
}

export enum PricingModel {
  FREE = 'free',
  FLAT_RATE = 'flat_rate',
  PER_USE = 'per_use',
  TIERED = 'tiered',
  USAGE_BASED = 'usage_based'
}

export enum BillingPeriod {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  ONE_TIME = 'one_time',
  PER_USE = 'per_use'
}

export interface ToolLimits {
  maxRequests?: number;
  maxStorage?: number;
  maxUsers?: number;
  maxIntegrations?: number;
  rateLimits?: RateLimit[];
}

export interface RateLimit {
  type: RateLimitType;
  limit: number;
  window: number; // in seconds
  unit: RateLimitUnit;
}

export enum RateLimitType {
  REQUESTS = 'requests',
  BANDWIDTH = 'bandwidth',
  STORAGE = 'storage',
  EXECUTIONS = 'executions'
}

export enum RateLimitUnit {
  PER_SECOND = 'per_second',
  PER_MINUTE = 'per_minute',
  PER_HOUR = 'per_hour',
  PER_DAY = 'per_day'
}

export interface ToolLog {
  id: string;
  toolId: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  details?: Record<string, any>;
  executionTime?: number;
  status: LogStatus;
  userId?: string;
  actionId?: string;
  triggerId?: string;
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export enum LogStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PENDING = 'pending',
  TIMEOUT = 'timeout',
  CANCELLED = 'cancelled'
}

export interface ToolMetrics {
  toolId: string;
  period: MetricsPeriod;
  
  // Usage metrics
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  
  // Performance metrics
  uptime: number;
  errorRate: number;
  responseTime: number;
  throughput: number;
  
  // Cost metrics
  totalCost: number;
  costPerExecution: number;
  
  // Timestamps
  startDate: string;
  endDate: string;
  lastUpdated: string;
}

export enum MetricsPeriod {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year'
}

export interface IntegrationWizardStep {
  id: string;
  title: string;
  description: string;
  type: WizardStepType;
  isRequired: boolean;
  isCompleted: boolean;
  fields: WizardField[];
  validation?: WizardValidation;
  nextStep?: string;
  previousStep?: string;
}

export enum WizardStepType {
  PROVIDER_SELECTION = 'provider_selection',
  AUTHENTICATION = 'authentication',
  CONFIGURATION = 'configuration',
  PERMISSIONS = 'permissions',
  TESTING = 'testing',
  COMPLETION = 'completion'
}

export interface WizardField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  isRequired: boolean;
  placeholder?: string;
  helpText?: string;
  options?: WizardFieldOption[];
  validation?: FieldValidation;
  defaultValue?: any;
  isSecure?: boolean;
}

export enum FieldType {
  TEXT = 'text',
  PASSWORD = 'password',
  EMAIL = 'email',
  URL = 'url',
  NUMBER = 'number',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  DATE = 'date',
  TIME = 'time',
  DATETIME = 'datetime',
  FILE = 'file',
  TEXTAREA = 'textarea',
  JSON = 'json'
}

export interface WizardFieldOption {
  value: any;
  label: string;
  description?: string;
  icon?: string;
}

export interface FieldValidation {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  required?: boolean;
  customValidator?: string;
}

export interface WizardValidation {
  rules: ValidationRule[];
  errorMessage?: string;
}

export interface ValidationRule {
  field: string;
  condition: string;
  value: any;
  message: string;
}

export interface ToolSearchFilters {
  category?: ToolCategory;
  status?: ToolStatus;
  capabilities?: ToolCapability[];
  tags?: string[];
  rating?: number;
  priceRange?: [number, number];
  lastUsed?: string;
  query?: string;
}

export interface ToolSortOptions {
  field: ToolSortField;
  direction: SortDirection;
}

export enum ToolSortField {
  NAME = 'name',
  LAST_USED = 'lastUsed',
  USAGE_COUNT = 'usageCount',
  RATING = 'rating',
  CREATED_AT = 'createdAt',
  STATUS = 'status'
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
} 