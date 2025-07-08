import { authService } from './authService';

export interface Notification {
  id: string;
  type: 'connection_error' | 'websocket_offline' | 'backend_unavailable' | 'transcript_uploaded' | 'transcript_processed' | 'ai_analysis_complete' | 'action_item_created' | 'user_joined' | 'comment_added' | 'system_update';
  title: string;
  message: string;
  data?: any;
  userId?: string;
  workspaceId?: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  actionText?: string;
}

export interface ActivityEvent {
  id: string;
  type: 'upload' | 'processing' | 'analysis' | 'action' | 'collaboration' | 'system';
  title: string;
  description: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: Date;
  metadata?: any;
  workspaceId?: string;
}

export interface ConnectionStatus {
  isConnected: boolean;
  isReconnecting: boolean;
  lastError?: string;
  lastConnectedAt?: Date;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  backendAvailable: boolean;
}

class NotificationService {
  private static instance: NotificationService;
  private ws: WebSocket | null = null;
  private notifications: Notification[] = [];
  private activityFeed: ActivityEvent[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];
  private activityListeners: ((activities: ActivityEvent[]) => void)[] = [];
  private connectionListeners: ((status: ConnectionStatus) => void)[] = [];
  private connectionStatus: ConnectionStatus = {
    isConnected: false,
    isReconnecting: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    backendAvailable: false,
  };
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectDelay = 1000;
  private backendHealthChecked = false;

  private constructor() {
    this.checkBackendHealth();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:8000/health', {
        method: 'GET',
        timeout: 5000,
      } as RequestInit);
      
      if (response.ok) {
        this.connectionStatus.backendAvailable = true;
        this.connectionStatus.lastError = undefined;
        this.backendHealthChecked = true;
        this.initializeWebSocket();
        return true;
      }
    } catch (error) {
      this.connectionStatus.backendAvailable = false;
      this.connectionStatus.lastError = 'Backend service is not available';
      this.backendHealthChecked = true;
      
      // Show user-friendly notification about backend being offline
      this.addOfflineNotification();
      this.notifyConnectionChange();
      
      // Retry health check less frequently when backend is down
      setTimeout(() => this.checkBackendHealth(), 10000);
      return false;
    }
    return false;
  }

  private addOfflineNotification() {
    const notification: Notification = {
      id: `offline_${Date.now()}`,
      type: 'backend_unavailable',
      title: 'Real-time Features Offline',
      message: 'Some features may be limited while we reconnect to the server. Your work is still saved.',
      timestamp: new Date(),
      read: false,
      priority: 'medium',
    };
    
    this.addNotification(notification);
  }

  private async initializeWebSocket() {
    if (!this.connectionStatus.backendAvailable) {
      return;
    }

    try {
      // Wait for auth to be ready
      const user = authService.getCurrentUser();
      if (!user) {
        // Retry after auth is available
        setTimeout(() => this.initializeWebSocket(), 1000);
        return;
      }

      this.connectionStatus.isReconnecting = true;
      this.notifyConnectionChange();

      const wsUrl = 'ws://localhost:8000/ws';
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('🔌 Notification WebSocket connected');
        this.connectionStatus.isConnected = true;
        this.connectionStatus.isReconnecting = false;
        this.connectionStatus.reconnectAttempts = 0;
        this.connectionStatus.lastConnectedAt = new Date();
        this.connectionStatus.lastError = undefined;
        this.notifyConnectionChange();
        
        // Remove offline notification if it exists
        this.removeOfflineNotifications();
        
        // Send authentication
        this.sendMessage({
          type: 'auth',
          token: authService.getCurrentSession()?.access_token,
          userId: user.id,
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('🔌 Notification WebSocket disconnected');
        this.connectionStatus.isConnected = false;
        this.connectionStatus.isReconnecting = false;
        this.notifyConnectionChange();
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.warn('WebSocket error:', error);
        this.connectionStatus.lastError = 'WebSocket connection failed';
      };

    } catch (error) {
      console.error('Error initializing WebSocket:', error);
      this.connectionStatus.lastError = 'Failed to initialize WebSocket';
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.connectionStatus.reconnectAttempts < this.connectionStatus.maxReconnectAttempts) {
      this.connectionStatus.reconnectAttempts++;
      this.connectionStatus.isReconnecting = true;
      this.notifyConnectionChange();
      
      const delay = Math.min(this.reconnectDelay * Math.pow(2, this.connectionStatus.reconnectAttempts - 1), 30000);
      
      console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.connectionStatus.reconnectAttempts})`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.checkBackendHealth();
      }, delay);
    } else {
      console.warn('❌ Max reconnection attempts reached');
      this.connectionStatus.isReconnecting = false;
      this.connectionStatus.lastError = 'Maximum reconnection attempts reached';
      this.notifyConnectionChange();
      
      // Add notification about connection failure
      const notification: Notification = {
        id: `connection_failed_${Date.now()}`,
        type: 'connection_error',
        title: 'Connection Failed',
        message: 'Unable to connect to real-time services. Some features may be limited.',
        timestamp: new Date(),
        read: false,
        priority: 'low',
      };
      
      this.addNotification(notification);
    }
  }

  private removeOfflineNotifications() {
    this.notifications = this.notifications.filter(n => 
      n.type !== 'backend_unavailable' && n.type !== 'connection_error' && n.type !== 'websocket_offline'
    );
    this.notifyListeners();
  }

  private sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private handleWebSocketMessage(data: any) {
    switch (data.type) {
      case 'notification':
        this.addNotification(data.notification);
        break;
      case 'activity':
        this.addActivity(data.activity);
        break;
      case 'transcript_status':
        this.handleTranscriptStatus(data);
        break;
      case 'ai_analysis_complete':
        this.handleAIAnalysisComplete(data);
        break;
      case 'user_activity':
        this.handleUserActivity(data);
        break;
      case 'system_message':
        this.handleSystemMessage(data);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  private handleTranscriptStatus(data: any) {
    const notification: Notification = {
      id: `transcript_${data.transcriptId}_${Date.now()}`,
      type: 'transcript_processed',
      title: 'Transcript Processing Update',
      message: `Your transcript "${data.filename}" is now ${data.status}`,
      data: { transcriptId: data.transcriptId, status: data.status },
      timestamp: new Date(),
      read: false,
      priority: 'medium',
      actionUrl: `/transcripts/${data.transcriptId}`,
      actionText: 'View Transcript',
    };

    this.addNotification(notification);

    // Add to activity feed
    const activity: ActivityEvent = {
      id: `activity_${Date.now()}`,
      type: 'processing',
      title: 'Transcript Processed',
      description: `"${data.filename}" has been processed and is ready for analysis`,
      userId: data.userId || 'system',
      userName: 'CCOPINAI System',
      timestamp: new Date(),
      metadata: { transcriptId: data.transcriptId, status: data.status },
    };

    this.addActivity(activity);
  }

  private handleAIAnalysisComplete(data: any) {
    const notification: Notification = {
      id: `ai_analysis_${data.transcriptId}_${Date.now()}`,
      type: 'ai_analysis_complete',
      title: 'AI Analysis Complete',
      message: `AI has analyzed your transcript and found ${data.insights?.actionItems?.length || 0} action items`,
      data: data.insights,
      timestamp: new Date(),
      read: false,
      priority: 'high',
      actionUrl: `/transcripts/${data.transcriptId}/insights`,
      actionText: 'View Insights',
    };

    this.addNotification(notification);

    // Add to activity feed
    const activity: ActivityEvent = {
      id: `activity_ai_${Date.now()}`,
      type: 'analysis',
      title: 'AI Analysis Complete',
      description: `Smart insights generated with ${data.insights?.actionItems?.length || 0} action items identified`,
      userId: data.userId || 'ai',
      userName: 'AI Assistant',
      timestamp: new Date(),
      metadata: data.insights,
    };

    this.addActivity(activity);
  }

  private handleUserActivity(data: any) {
    const activity: ActivityEvent = {
      id: `user_activity_${Date.now()}`,
      type: 'collaboration',
      title: data.title,
      description: data.description,
      userId: data.userId,
      userName: data.userName,
      userAvatar: data.userAvatar,
      timestamp: new Date(data.timestamp),
      metadata: data.metadata,
      workspaceId: data.workspaceId,
    };

    this.addActivity(activity);
  }

  private handleSystemMessage(data: any) {
    const notification: Notification = {
      id: `system_${Date.now()}`,
      type: 'system_update',
      title: data.title,
      message: data.message,
      timestamp: new Date(),
      read: false,
      priority: data.priority || 'low',
    };

    this.addNotification(notification);
  }

  private addNotification(notification: Notification) {
    this.notifications.unshift(notification);
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    this.notifyListeners();
    this.showPushNotification(notification);
  }

  private addActivity(activity: ActivityEvent) {
    this.activityFeed.unshift(activity);
    
    // Keep only last 50 activities
    if (this.activityFeed.length > 50) {
      this.activityFeed = this.activityFeed.slice(0, 50);
    }

    this.notifyActivityListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  private notifyActivityListeners() {
    this.activityListeners.forEach(listener => listener([...this.activityFeed]));
  }

  private notifyConnectionChange() {
    this.connectionListeners.forEach(listener => listener({...this.connectionStatus}));
  }

  private async showPushNotification(notification: Notification) {
    // Only show high priority notifications as push notifications
    if (notification.priority === 'high' || notification.priority === 'urgent') {
      try {
        // Check if notifications are supported and permitted
        if ('Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/icon.png',
              badge: '/icon.png',
              tag: notification.id,
            });
          } else if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              new Notification(notification.title, {
                body: notification.message,
                icon: '/icon.png',
                badge: '/icon.png',
                tag: notification.id,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error showing push notification:', error);
      }
    }
  }

  // Public API
  public getNotifications(): Notification[] {
    return [...this.notifications];
  }

  public getActivityFeed(): ActivityEvent[] {
    return [...this.activityFeed];
  }

  public getConnectionStatus(): ConnectionStatus {
    return {...this.connectionStatus};
  }

  public getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  public markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  public markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.notifyListeners();
  }

  public deleteNotification(notificationId: string) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.notifyListeners();
  }

  public clearAll() {
    this.notifications = [];
    this.notifyListeners();
  }

  public isConnectedToServer(): boolean {
    return this.connectionStatus.isConnected;
  }

  public isBackendAvailable(): boolean {
    return this.connectionStatus.backendAvailable;
  }

  public retryConnection() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.connectionStatus.reconnectAttempts = 0;
    this.checkBackendHealth();
  }

  public onNotificationsChange(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public onActivityChange(listener: (activities: ActivityEvent[]) => void) {
    this.activityListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.activityListeners.indexOf(listener);
      if (index > -1) {
        this.activityListeners.splice(index, 1);
      }
    };
  }

  public onConnectionChange(listener: (status: ConnectionStatus) => void) {
    this.connectionListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.connectionListeners.indexOf(listener);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  // Send custom notifications
  public sendTranscriptUpload(transcriptId: string, filename: string) {
    if (this.connectionStatus.isConnected) {
      this.sendMessage({
        type: 'transcript_upload',
        transcriptId,
        filename,
        userId: authService.getCurrentUser()?.id,
      });
    }
  }

  public sendUserActivity(activity: Partial<ActivityEvent>) {
    const user = authService.getCurrentUser();
    if (!user || !this.connectionStatus.isConnected) return;

    this.sendMessage({
      type: 'user_activity',
      ...activity,
      userId: user.id,
      userName: user.name || user.email,
      userAvatar: user.avatar_url,
      timestamp: new Date().toISOString(),
    });
  }

  public disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
export default notificationService; 