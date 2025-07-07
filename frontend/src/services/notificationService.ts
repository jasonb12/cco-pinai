import { authService } from './authService';

export interface Notification {
  id: string;
  type: 'transcript_uploaded' | 'transcript_processed' | 'ai_analysis_complete' | 'action_item_created' | 'user_joined' | 'comment_added' | 'system_update';
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

class NotificationService {
  private static instance: NotificationService;
  private ws: WebSocket | null = null;
  private notifications: Notification[] = [];
  private activityFeed: ActivityEvent[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];
  private activityListeners: ((activities: ActivityEvent[]) => void)[] = [];
  private connectionListeners: ((connected: boolean) => void)[] = [];
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  private constructor() {
    this.initializeWebSocket();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async initializeWebSocket() {
    try {
      // Wait for auth to be ready
      const user = authService.getCurrentUser();
      if (!user) {
        // Retry after auth is available
        setTimeout(() => this.initializeWebSocket(), 1000);
        return;
      }

      const wsUrl = 'ws://localhost:8000/ws';
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('🔌 Notification WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyConnectionChange();
        
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
        this.isConnected = false;
        this.notifyConnectionChange();
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Error initializing WebSocket:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.initializeWebSocket();
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
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
    this.connectionListeners.forEach(listener => listener(this.isConnected));
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
    return this.isConnected;
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

  public onConnectionChange(listener: (connected: boolean) => void) {
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
    this.sendMessage({
      type: 'transcript_upload',
      transcriptId,
      filename,
      userId: authService.getCurrentUser()?.id,
    });
  }

  public sendUserActivity(activity: Partial<ActivityEvent>) {
    const user = authService.getCurrentUser();
    if (!user) return;

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
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
export default notificationService; 