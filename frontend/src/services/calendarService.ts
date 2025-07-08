/**
 * Calendar Service - Advanced calendar management with AI features
 * Handles events, recurring patterns, reminders, and intelligent scheduling
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalendarEvent } from '../components/calendar/AgendaView';
import { notificationService, Notification } from './notificationService';

export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every N days/weeks/months/years
  daysOfWeek?: number[]; // For weekly: [0,1,2,3,4,5,6] (Sun-Sat)
  dayOfMonth?: number; // For monthly: 1-31
  endDate?: string; // ISO date string
  occurrences?: number; // Number of occurrences
}

export interface EventReminder {
  id: string;
  eventId: string;
  type: 'notification' | 'email' | 'sms';
  minutesBefore: number;
  message?: string;
  isActive: boolean;
}

export interface AIEventSuggestion {
  id: string;
  title: string;
  description: string;
  suggestedTime: string;
  duration: number; // minutes
  type: CalendarEvent['type'];
  priority: CalendarEvent['priority'];
  confidence: number; // 0-1
  source: 'transcript' | 'pattern' | 'email' | 'context';
  sourceId?: string;
  context?: string;
}

export interface CalendarStats {
  totalEvents: number;
  upcomingEvents: number;
  overdueEvents: number;
  completedEvents: number;
  aiGeneratedEvents: number;
  averageEventDuration: number;
  busyHours: { hour: number; count: number }[];
  productivityScore: number;
}

class CalendarService {
  private static instance: CalendarService;
  private events: CalendarEvent[] = [];
  private reminders: EventReminder[] = [];
  private suggestions: AIEventSuggestion[] = [];
  private listeners: ((events: CalendarEvent[]) => void)[] = [];

  private constructor() {
    this.loadEvents();
    this.scheduleReminderChecks();
  }

  public static getInstance(): CalendarService {
    if (!CalendarService.instance) {
      CalendarService.instance = new CalendarService();
    }
    return CalendarService.instance;
  }

  // Event Management
  public async createEvent(eventData: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const event: CalendarEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: eventData.title || 'Untitled Event',
      description: eventData.description || '',
      start_time: eventData.start_time || new Date().toISOString(),
      end_time: eventData.end_time || new Date(Date.now() + 3600000).toISOString(),
      location: eventData.location || '',
      attendees: eventData.attendees || [],
      type: eventData.type || 'event',
      priority: eventData.priority || 'medium',
      status: eventData.status || 'scheduled',
      all_day: eventData.all_day || false,
      recurring: eventData.recurring || false,
      source: eventData.source || 'manual',
      color: eventData.color || this.getEventTypeColor(eventData.type || 'event'),
      ...eventData,
    };

    this.events.push(event);
    await this.saveEvents();
    this.notifyListeners();

    // Schedule reminders if any
    // Note: reminders are handled separately through createReminder method

    return event;
  }

  public async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    const index = this.events.findIndex(e => e.id === eventId);
    if (index === -1) return null;

    this.events[index] = { ...this.events[index], ...updates };
    await this.saveEvents();
    this.notifyListeners();

    return this.events[index];
  }

  public async deleteEvent(eventId: string): Promise<boolean> {
    const index = this.events.findIndex(e => e.id === eventId);
    if (index === -1) return false;

    this.events.splice(index, 1);
    await this.saveEvents();
    this.notifyListeners();

    // Remove associated reminders
    this.reminders = this.reminders.filter(r => r.eventId !== eventId);
    await this.saveReminders();

    return true;
  }

  public getEvents(): CalendarEvent[] {
    return [...this.events];
  }

  public getEvent(eventId: string): CalendarEvent | null {
    return this.events.find(e => e.id === eventId) || null;
  }

  // Recurring Events
  public async createRecurringEvent(
    eventData: Partial<CalendarEvent>,
    pattern: RecurringPattern
  ): Promise<CalendarEvent[]> {
    const baseEvent = await this.createEvent(eventData);
    const recurringEvents = this.generateRecurringEvents(baseEvent, pattern);

    // Save all recurring events
    this.events.push(...recurringEvents);
    await this.saveEvents();
    this.notifyListeners();

    return [baseEvent, ...recurringEvents];
  }

  private generateRecurringEvents(baseEvent: CalendarEvent, pattern: RecurringPattern): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const startDate = new Date(baseEvent.start_time);
    const endDate = new Date(baseEvent.end_time);
    const duration = endDate.getTime() - startDate.getTime();
    
    let currentDate = new Date(startDate);
    let occurrenceCount = 0;
    const maxOccurrences = pattern.occurrences || 100;
    const endLimit = pattern.endDate ? new Date(pattern.endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    while (occurrenceCount < maxOccurrences && currentDate < endLimit) {
      // Calculate next occurrence
      switch (pattern.type) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + pattern.interval);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (7 * pattern.interval));
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + pattern.interval);
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + pattern.interval);
          break;
      }

      if (currentDate < endLimit) {
        const recurringEvent: CalendarEvent = {
          ...baseEvent,
          id: `${baseEvent.id}_recurring_${occurrenceCount}`,
          start_time: currentDate.toISOString(),
          end_time: new Date(currentDate.getTime() + duration).toISOString(),
          recurring: true,
          source: 'recurring',
        };

        events.push(recurringEvent);
        occurrenceCount++;
      }
    }

    return events;
  }

  // Event Reminders
  public async createReminder(reminder: Omit<EventReminder, 'id'>): Promise<EventReminder> {
    const newReminder: EventReminder = {
      id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...reminder,
    };

    this.reminders.push(newReminder);
    await this.saveReminders();
    this.scheduleReminder(newReminder);

    return newReminder;
  }

  private scheduleReminder(reminder: EventReminder): void {
    const event = this.getEvent(reminder.eventId);
    if (!event || !reminder.isActive) return;

    const eventTime = new Date(event.start_time);
    const reminderTime = new Date(eventTime.getTime() - (reminder.minutesBefore * 60 * 1000));
    const now = new Date();

    if (reminderTime > now) {
      const timeUntilReminder = reminderTime.getTime() - now.getTime();
      
      setTimeout(() => {
        this.triggerReminder(reminder, event);
      }, timeUntilReminder);
    }
  }

  private triggerReminder(reminder: EventReminder, event: CalendarEvent): void {
    const message = reminder.message || `Reminder: ${event.title} starts in ${reminder.minutesBefore} minutes`;
    
    switch (reminder.type) {
      case 'notification':
        const notification: Notification = {
          id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'action_item_created',
          title: 'Event Reminder',
          message,
          data: { eventId: event.id },
          timestamp: new Date(),
          read: false,
          priority: 'medium',
        };
        // Use private method to add notification directly
        (notificationService as any).addNotification(notification);
        break;
      case 'email':
        // Implement email reminder
        console.log('Email reminder:', message);
        break;
      case 'sms':
        // Implement SMS reminder
        console.log('SMS reminder:', message);
        break;
    }
  }

  private scheduleReminderChecks(): void {
    // Check for upcoming reminders every minute
    setInterval(() => {
      this.checkUpcomingReminders();
    }, 60000);
  }

  private checkUpcomingReminders(): void {
    const now = new Date();
    
    this.reminders.forEach(reminder => {
      if (!reminder.isActive) return;
      
      const event = this.getEvent(reminder.eventId);
      if (!event) return;

      const eventTime = new Date(event.start_time);
      const reminderTime = new Date(eventTime.getTime() - (reminder.minutesBefore * 60 * 1000));
      
      // Check if reminder time is within the next minute
      if (reminderTime <= now && reminderTime > new Date(now.getTime() - 60000)) {
        this.triggerReminder(reminder, event);
      }
    });
  }

  // AI Event Suggestions
  public async generateEventSuggestions(
    transcriptContent?: string,
    context?: string
  ): Promise<AIEventSuggestion[]> {
    const suggestions: AIEventSuggestion[] = [];

    // Analyze transcript for potential events
    if (transcriptContent) {
      const transcriptSuggestions = this.analyzeTranscriptForEvents(transcriptContent);
      suggestions.push(...transcriptSuggestions);
    }

    // Generate pattern-based suggestions
    const patternSuggestions = this.generatePatternBasedSuggestions();
    suggestions.push(...patternSuggestions);

    // Store suggestions
    this.suggestions = suggestions;
    await this.saveSuggestions();

    return suggestions;
  }

  private analyzeTranscriptForEvents(transcript: string): AIEventSuggestion[] {
    const suggestions: AIEventSuggestion[] = [];
    
    // Simple keyword-based analysis (in production, use AI/ML)
    const patterns = [
      { keywords: ['meeting', 'meet', 'discuss'], type: 'meeting' as const, priority: 'high' as const },
      { keywords: ['call', 'phone', 'zoom'], type: 'call' as const, priority: 'medium' as const },
      { keywords: ['deadline', 'due', 'submit'], type: 'task' as const, priority: 'urgent' as const },
      { keywords: ['reminder', 'remember', 'don\'t forget'], type: 'reminder' as const, priority: 'medium' as const },
    ];

    patterns.forEach(pattern => {
      const matches = pattern.keywords.filter(keyword => 
        transcript.toLowerCase().includes(keyword)
      );

      if (matches.length > 0) {
        const suggestion: AIEventSuggestion = {
          id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: `${pattern.type.charAt(0).toUpperCase() + pattern.type.slice(1)} - AI Suggested`,
          description: `Suggested based on transcript content: "${matches.join(', ')}"`,
          suggestedTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          duration: pattern.type === 'meeting' ? 60 : 30,
          type: pattern.type,
          priority: pattern.priority,
          confidence: matches.length * 0.3,
          source: 'transcript',
          context: transcript.substring(0, 200),
        };

        suggestions.push(suggestion);
      }
    });

    return suggestions;
  }

  private generatePatternBasedSuggestions(): AIEventSuggestion[] {
    const suggestions: AIEventSuggestion[] = [];
    
    // Analyze user's event patterns
    const now = new Date();
    const recentEvents = this.events.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    });

    // Find common meeting times
    const meetingTimes = recentEvents
      .filter(e => e.type === 'meeting')
      .map(e => new Date(e.start_time).getHours());

    if (meetingTimes.length > 0) {
      const mostCommonHour = this.getMostFrequent(meetingTimes);
      
      const suggestion: AIEventSuggestion = {
        id: `pattern_suggestion_${Date.now()}`,
        title: 'Weekly Team Meeting',
        description: `Based on your pattern, you often have meetings at ${mostCommonHour}:00`,
        suggestedTime: this.getNextWeekdayAt(mostCommonHour),
        duration: 60,
        type: 'meeting',
        priority: 'medium',
        confidence: 0.7,
        source: 'pattern',
        context: 'Based on your meeting history',
      };

      suggestions.push(suggestion);
    }

    return suggestions;
  }

  public async acceptSuggestion(suggestionId: string): Promise<CalendarEvent | null> {
    const suggestion = this.suggestions.find(s => s.id === suggestionId);
    if (!suggestion) return null;

    const event = await this.createEvent({
      title: suggestion.title,
      description: suggestion.description,
      start_time: suggestion.suggestedTime,
      end_time: new Date(new Date(suggestion.suggestedTime).getTime() + suggestion.duration * 60000).toISOString(),
      type: suggestion.type,
      priority: suggestion.priority,
      source: 'ai_generated',
    });

    // Remove accepted suggestion
    this.suggestions = this.suggestions.filter(s => s.id !== suggestionId);
    await this.saveSuggestions();

    return event;
  }

  public async dismissSuggestion(suggestionId: string): Promise<boolean> {
    const index = this.suggestions.findIndex(s => s.id === suggestionId);
    if (index === -1) return false;

    this.suggestions.splice(index, 1);
    await this.saveSuggestions();
    
    return true;
  }

  // Calendar Analytics
  public getCalendarStats(): CalendarStats {
    const now = new Date();
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const totalEvents = this.events.length;
    const upcomingEvents = this.events.filter(e => new Date(e.start_time) > now).length;
    const overdueEvents = this.events.filter(e => 
      new Date(e.end_time) < now && e.status === 'scheduled'
    ).length;
    const completedEvents = this.events.filter(e => e.status === 'completed').length;
    const aiGeneratedEvents = this.events.filter(e => e.source === 'ai_generated').length;
    
    const durations = this.events.map(e => {
      const start = new Date(e.start_time);
      const end = new Date(e.end_time);
      return end.getTime() - start.getTime();
    });
    
    const averageEventDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length / 60000 // Convert to minutes
      : 0;

    // Calculate busy hours
    const busyHours = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: this.events.filter(e => new Date(e.start_time).getHours() === hour).length
    }));

    // Simple productivity score (0-100)
    const productivityScore = Math.min(100, Math.round(
      (completedEvents / Math.max(totalEvents, 1)) * 100
    ));

    return {
      totalEvents,
      upcomingEvents,
      overdueEvents,
      completedEvents,
      aiGeneratedEvents,
      averageEventDuration,
      busyHours,
      productivityScore,
    };
  }

  // Utility Methods
  private getEventTypeColor(type: CalendarEvent['type']): string {
    switch (type) {
      case 'meeting': return '#3b82f6';
      case 'task': return '#f59e0b';
      case 'reminder': return '#ef4444';
      case 'call': return '#10b981';
      case 'event': return '#8b5cf6';
      default: return '#6b7280';
    }
  }

  private getMostFrequent(arr: number[]): number {
    return arr.sort((a, b) =>
      arr.filter(v => v === a).length - arr.filter(v => v === b).length
    ).pop() || 0;
  }

  private getNextWeekdayAt(hour: number): string {
    const now = new Date();
    const nextWeekday = new Date(now);
    nextWeekday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7)); // Next Monday
    nextWeekday.setHours(hour, 0, 0, 0);
    return nextWeekday.toISOString();
  }

  // Event Listeners
  public onEventsChange(listener: (events: CalendarEvent[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.events));
  }

  // Persistence
  private async saveEvents(): Promise<void> {
    try {
      await AsyncStorage.setItem('calendar_events', JSON.stringify(this.events));
    } catch (error) {
      console.error('Failed to save events:', error);
    }
  }

  private async loadEvents(): Promise<void> {
    try {
      const eventsData = await AsyncStorage.getItem('calendar_events');
      if (eventsData) {
        this.events = JSON.parse(eventsData);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  }

  private async saveReminders(): Promise<void> {
    try {
      await AsyncStorage.setItem('calendar_reminders', JSON.stringify(this.reminders));
    } catch (error) {
      console.error('Failed to save reminders:', error);
    }
  }

  private async saveSuggestions(): Promise<void> {
    try {
      await AsyncStorage.setItem('calendar_suggestions', JSON.stringify(this.suggestions));
    } catch (error) {
      console.error('Failed to save suggestions:', error);
    }
  }
}

// Export singleton instance
export const calendarService = CalendarService.getInstance();
export default calendarService; 