/**
 * MCP Analysis Engine
 * Comprehensive text analysis system that generates actionable items
 */
import { 
  MCPAction, 
  MCPAnalysisResult, 
  ActionType, 
  Priority, 
  ActionStatus,
  SingleEventAction,
  ScheduledEventAction,
  RecurringEventAction,
  TaskAction,
  EmailAction,
  ContactAction,
  ReminderAction,
  CallAction,
  RecurrencePattern
} from '../types/actions';

export class MCPAnalysisEngine {
  private static instance: MCPAnalysisEngine;
  
  public static getInstance(): MCPAnalysisEngine {
    if (!MCPAnalysisEngine.instance) {
      MCPAnalysisEngine.instance = new MCPAnalysisEngine();
    }
    return MCPAnalysisEngine.instance;
  }

  /**
   * Main analysis method that processes text and generates actions
   */
  public async analyzeText(
    text: string, 
    userId: string, 
    transcriptId?: string
  ): Promise<MCPAnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Extract entities and context
      const entities = this.extractEntities(text);
      const sentiment = this.analyzeSentiment(text);
      const keyInsights = this.extractKeyInsights(text);
      
      // Generate actions based on different patterns
      const actions: MCPAction[] = [];
      
      // Analyze for different action types
      actions.push(...this.detectSingleEvents(text, userId, transcriptId, entities));
      actions.push(...this.detectScheduledEvents(text, userId, transcriptId, entities));
      actions.push(...this.detectRecurringEvents(text, userId, transcriptId, entities));
      actions.push(...this.detectTasks(text, userId, transcriptId, entities));
      actions.push(...this.detectEmails(text, userId, transcriptId, entities));
      actions.push(...this.detectContacts(text, userId, transcriptId, entities));
      actions.push(...this.detectReminders(text, userId, transcriptId, entities));
      actions.push(...this.detectCalls(text, userId, transcriptId, entities));
      
      const processingTime = Date.now() - startTime;
      const overallConfidence = actions.length > 0 ? 
        actions.reduce((sum, action) => sum + action.confidence, 0) / actions.length : 0;

      const result: MCPAnalysisResult = {
        id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source_text: text,
        analysis_timestamp: new Date().toISOString(),
        processing_time_ms: processingTime,
        overall_confidence: overallConfidence,
        actions,
        summary: this.generateSummary(text, actions),
        key_insights: keyInsights,
        sentiment,
        entities
      };

      return result;
    } catch (error) {
      console.error('MCP Analysis error:', error);
      throw new Error(`Analysis failed: ${error}`);
    }
  }

  /**
   * Detect single events (immediate, one-time actions)
   */
  private detectSingleEvents(
    text: string, 
    userId: string, 
    transcriptId?: string,
    entities?: any
  ): SingleEventAction[] {
    const actions: SingleEventAction[] = [];
    const lowerText = text.toLowerCase();
    
    // Patterns for immediate actions
    const immediatePatterns = [
      /\b(right now|immediately|asap|urgent|quick)\b.*\b(call|meeting|chat|discuss)\b/gi,
      /\b(need to|should|must)\s+(call|meet|discuss|talk)\b/gi,
      /\b(quick|brief|short)\s+(meeting|call|chat|discussion)\b/gi
    ];

    immediatePatterns.forEach((pattern, index) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach((match, matchIndex) => {
          const action: SingleEventAction = {
            id: `single_${Date.now()}_${index}_${matchIndex}`,
            type: ActionType.SINGLE_EVENT,
            title: this.extractEventTitle(match),
            description: `Immediate action detected: ${match}`,
            priority: this.determinePriority(match),
            confidence: this.calculateConfidence(match, pattern),
            reasoning: `Detected immediate action pattern: "${pattern.source}"`,
            status: ActionStatus.PENDING,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            source_text: text,
            user_id: userId,
            transcript_id: transcriptId,
            event_details: {
              title: this.extractEventTitle(match),
              description: match,
              duration_minutes: this.estimateDuration(match),
              attendees: this.extractAttendees(match, entities),
              location: this.extractLocation(match, entities)
            }
          };
          actions.push(action);
        });
      }
    });

    return actions;
  }

  /**
   * Detect scheduled events (specific date/time mentions)
   */
  private detectScheduledEvents(
    text: string, 
    userId: string, 
    transcriptId?: string,
    entities?: any
  ): ScheduledEventAction[] {
    const actions: ScheduledEventAction[] = [];
    
    // Patterns for scheduled events
    const scheduledPatterns = [
      /\b(tomorrow|next week|next month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b.*\b(meeting|call|appointment|session)\b/gi,
      /\b(schedule|book|set up|arrange)\s+.*\b(meeting|call|appointment)\b.*\b(for|on|at)\s+([^.]+)/gi,
      /\b(meet|call|discuss)\b.*\b(on|at)\s+([\w\s,]+)\b/gi,
      /\b(\d{1,2})(am|pm|:\d{2})\b.*\b(meeting|call|appointment)\b/gi
    ];

    scheduledPatterns.forEach((pattern, index) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach((match, matchIndex) => {
          const dateTime = this.extractDateTime(match);
          
          const action: ScheduledEventAction = {
            id: `scheduled_${Date.now()}_${index}_${matchIndex}`,
            type: ActionType.SCHEDULED_EVENT,
            title: this.extractEventTitle(match),
            description: `Scheduled event detected: ${match}`,
            priority: this.determinePriority(match),
            confidence: this.calculateConfidence(match, pattern),
            reasoning: `Detected scheduled event pattern with date/time reference`,
            status: ActionStatus.PENDING,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            source_text: text,
            user_id: userId,
            transcript_id: transcriptId,
            event_details: {
              title: this.extractEventTitle(match),
              description: match,
              start_date: dateTime.date,
              start_time: dateTime.time,
              duration_minutes: this.estimateDuration(match),
              attendees: this.extractAttendees(match, entities),
              location: this.extractLocation(match, entities),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
          };
          actions.push(action);
        });
      }
    });

    return actions;
  }

  /**
   * Detect recurring events (regular/repeated meetings)
   */
  private detectRecurringEvents(
    text: string, 
    userId: string, 
    transcriptId?: string,
    entities?: any
  ): RecurringEventAction[] {
    const actions: RecurringEventAction[] = [];
    
    // Patterns for recurring events
    const recurringPatterns = [
      /\b(weekly|daily|monthly|every week|every day|every month)\s+.*\b(meeting|call|standup|sync|review)\b/gi,
      /\b(regular|recurring|repeated)\s+.*\b(meeting|call|session)\b/gi,
      /\b(every)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b.*\b(meeting|call)\b/gi,
      /\b(standup|daily standup|weekly sync|monthly review)\b/gi
    ];

    recurringPatterns.forEach((pattern, index) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach((match, matchIndex) => {
          const recurrence = this.extractRecurrencePattern(match);
          const dateTime = this.extractDateTime(match);
          
          const action: RecurringEventAction = {
            id: `recurring_${Date.now()}_${index}_${matchIndex}`,
            type: ActionType.RECURRING_EVENT,
            title: this.extractEventTitle(match),
            description: `Recurring event detected: ${match}`,
            priority: this.determinePriority(match),
            confidence: this.calculateConfidence(match, pattern),
            reasoning: `Detected recurring event pattern: "${recurrence.pattern}"`,
            status: ActionStatus.PENDING,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            source_text: text,
            user_id: userId,
            transcript_id: transcriptId,
            event_details: {
              title: this.extractEventTitle(match),
              description: match,
              start_date: dateTime.date || this.getNextBusinessDay(),
              start_time: dateTime.time || '09:00',
              duration_minutes: this.estimateDuration(match),
              attendees: this.extractAttendees(match, entities),
              location: this.extractLocation(match, entities),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            recurrence
          };
          actions.push(action);
        });
      }
    });

    return actions;
  }

  /**
   * Detect tasks and to-dos
   */
  private detectTasks(
    text: string, 
    userId: string, 
    transcriptId?: string,
    entities?: any
  ): TaskAction[] {
    const actions: TaskAction[] = [];
    
    const taskPatterns = [
      /\b(need to|should|must|have to|todo|task)\s+([^.!?]+)/gi,
      /\b(action item|follow up|follow-up)\s*:?\s*([^.!?]+)/gi,
      /\b(remember to|don't forget to)\s+([^.!?]+)/gi
    ];

    taskPatterns.forEach((pattern, index) => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach((match, matchIndex) => {
        const taskDescription = match[2] || match[1];
        
        const action: TaskAction = {
          id: `task_${Date.now()}_${index}_${matchIndex}`,
          type: ActionType.TASK,
          title: this.extractTaskTitle(taskDescription),
          description: `Task detected: ${taskDescription}`,
          priority: this.determinePriority(taskDescription),
          confidence: this.calculateConfidence(match[0], pattern),
          reasoning: `Detected task pattern: "${pattern.source}"`,
          status: ActionStatus.PENDING,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          source_text: text,
          user_id: userId,
          transcript_id: transcriptId,
          task_details: {
            title: this.extractTaskTitle(taskDescription),
            description: taskDescription,
            due_date: this.extractDueDate(taskDescription),
            assignee: this.extractAssignee(taskDescription, entities),
            tags: this.extractTags(taskDescription)
          }
        };
        actions.push(action);
      });
    });

    return actions;
  }

  /**
   * Detect email communications
   */
  private detectEmails(
    text: string, 
    userId: string, 
    transcriptId?: string,
    entities?: any
  ): EmailAction[] {
    const actions: EmailAction[] = [];
    
    const emailPatterns = [
      /\b(send|email|write to|contact)\s+.*\b(email|message)\b/gi,
      /\b(follow up|follow-up)\s+.*\b(email|message)\b/gi,
      /\b(email|send)\s+([^.!?]+)\s+(about|regarding)\s+([^.!?]+)/gi
    ];

    emailPatterns.forEach((pattern, index) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach((match, matchIndex) => {
          const action: EmailAction = {
            id: `email_${Date.now()}_${index}_${matchIndex}`,
            type: ActionType.EMAIL,
            title: this.extractEmailSubject(match),
            description: `Email communication detected: ${match}`,
            priority: this.determinePriority(match),
            confidence: this.calculateConfidence(match, pattern),
            reasoning: `Detected email communication pattern`,
            status: ActionStatus.PENDING,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            source_text: text,
            user_id: userId,
            transcript_id: transcriptId,
            email_details: {
              to: this.extractEmailRecipients(match, entities),
              subject: this.extractEmailSubject(match),
              body: this.generateEmailBody(match),
              send_at: this.extractSendTime(match)
            }
          };
          actions.push(action);
        });
      }
    });

    return actions;
  }

  /**
   * Detect contact creation/updates
   */
  private detectContacts(
    text: string, 
    userId: string, 
    transcriptId?: string,
    entities?: any
  ): ContactAction[] {
    const actions: ContactAction[] = [];
    
    const contactPatterns = [
      /\b(add|create|save)\s+.*\b(contact|person)\b/gi,
      /\b(business card|card|contact info)\b/gi,
      /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\s+.*\b(email|phone|contact)\b/gi
    ];

    contactPatterns.forEach((pattern, index) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach((match, matchIndex) => {
          const action: ContactAction = {
            id: `contact_${Date.now()}_${index}_${matchIndex}`,
            type: ActionType.CONTACT,
            title: this.extractContactName(match),
            description: `Contact management detected: ${match}`,
            priority: Priority.MEDIUM,
            confidence: this.calculateConfidence(match, pattern),
            reasoning: `Detected contact management pattern`,
            status: ActionStatus.PENDING,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            source_text: text,
            user_id: userId,
            transcript_id: transcriptId,
            contact_details: {
              name: this.extractContactName(match),
              email: this.extractContactEmail(match),
              phone: this.extractContactPhone(match),
              company: this.extractContactCompany(match, entities),
              notes: match
            }
          };
          actions.push(action);
        });
      }
    });

    return actions;
  }

  /**
   * Detect reminders
   */
  private detectReminders(
    text: string, 
    userId: string, 
    transcriptId?: string,
    entities?: any
  ): ReminderAction[] {
    const actions: ReminderAction[] = [];
    
    const reminderPatterns = [
      /\b(remind|reminder|alert)\s+.*\b(about|to|for)\s+([^.!?]+)/gi,
      /\b(don't forget|remember)\s+([^.!?]+)/gi,
      /\b(deadline|due)\s+.*\b(remind|alert)\b/gi
    ];

    reminderPatterns.forEach((pattern, index) => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach((match, matchIndex) => {
        const reminderText = match[3] || match[2] || match[1];
        
        const action: ReminderAction = {
          id: `reminder_${Date.now()}_${index}_${matchIndex}`,
          type: ActionType.REMINDER,
          title: this.extractReminderTitle(reminderText),
          description: `Reminder detected: ${reminderText}`,
          priority: this.determinePriority(reminderText),
          confidence: this.calculateConfidence(match[0], pattern),
          reasoning: `Detected reminder pattern`,
          status: ActionStatus.PENDING,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          source_text: text,
          user_id: userId,
          transcript_id: transcriptId,
          reminder_details: {
            title: this.extractReminderTitle(reminderText),
            description: reminderText,
            remind_at: this.extractReminderTime(reminderText),
            repeat: this.extractReminderRepeat(reminderText)
          }
        };
        actions.push(action);
      });
    });

    return actions;
  }

  /**
   * Detect phone calls
   */
  private detectCalls(
    text: string, 
    userId: string, 
    transcriptId?: string,
    entities?: any
  ): CallAction[] {
    const actions: CallAction[] = [];
    
    const callPatterns = [
      /\b(call|phone|ring)\s+([^.!?]+)/gi,
      /\b(give.*call|make.*call)\s+([^.!?]+)/gi,
      /\b(follow up|follow-up)\s+.*\b(call|phone)\b/gi
    ];

    callPatterns.forEach((pattern, index) => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach((match, matchIndex) => {
        const callText = match[2] || match[1];
        
        const action: CallAction = {
          id: `call_${Date.now()}_${index}_${matchIndex}`,
          type: ActionType.CALL,
          title: this.extractCallTitle(callText),
          description: `Phone call detected: ${callText}`,
          priority: this.determinePriority(callText),
          confidence: this.calculateConfidence(match[0], pattern),
          reasoning: `Detected phone call pattern`,
          status: ActionStatus.PENDING,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          source_text: text,
          user_id: userId,
          transcript_id: transcriptId,
          call_details: {
            contact_name: this.extractCallContact(callText),
            purpose: callText,
            scheduled_time: this.extractCallTime(callText),
            duration_minutes: this.estimateCallDuration(callText)
          }
        };
        actions.push(action);
      });
    });

    return actions;
  }

  // Helper methods for extraction and analysis
  
  private extractEntities(text: string) {
    // Simple entity extraction - in production, use NLP libraries
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phoneRegex = /\b\d{3}-\d{3}-\d{4}\b|\b\(\d{3}\)\s*\d{3}-\d{4}\b/g;
    const dateRegex = /\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/g;
    const timeRegex = /\b\d{1,2}:\d{2}\s*(AM|PM|am|pm)?\b/g;
    
    return {
      people: this.extractPeople(text),
      organizations: this.extractOrganizations(text),
      locations: this.extractLocations(text),
      dates: text.match(dateRegex) || [],
      times: text.match(timeRegex) || [],
      emails: text.match(emailRegex) || [],
      phones: text.match(phoneRegex) || []
    };
  }

  private extractPeople(text: string): string[] {
    // Simple name extraction - look for capitalized words
    const nameRegex = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;
    return text.match(nameRegex) || [];
  }

  private extractOrganizations(text: string): string[] {
    // Common organization patterns
    const orgPatterns = [
      /\b[A-Z][a-z]+\s+(Inc|LLC|Corp|Company|Ltd)\b/g,
      /\b(Apple|Google|Microsoft|Amazon|Meta|Tesla)\b/g
    ];
    
    const orgs: string[] = [];
    orgPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) orgs.push(...matches);
    });
    return orgs;
  }

  private extractLocations(text: string): string[] {
    // Simple location extraction
    const locationPatterns = [
      /\b(at|in|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,
      /\b(office|building|room|conference room)\s+([A-Z0-9][a-zA-Z0-9\s]*)\b/g
    ];
    
    const locations: string[] = [];
    locationPatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        if (match[2]) locations.push(match[2]);
      });
    });
    return locations;
  }

  private analyzeSentiment(text: string) {
    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'success', 'positive', 'excited'];
    const negativeWords = ['bad', 'terrible', 'awful', 'sad', 'problem', 'issue', 'concern', 'worried'];
    
    const words = text.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    let overall: 'positive' | 'neutral' | 'negative' = 'neutral';
    let score = 0;
    
    if (positiveCount > negativeCount) {
      overall = 'positive';
      score = Math.min(0.9, 0.5 + (positiveCount - negativeCount) * 0.1);
    } else if (negativeCount > positiveCount) {
      overall = 'negative';
      score = Math.max(-0.9, -0.5 - (negativeCount - positiveCount) * 0.1);
    }
    
    return {
      overall,
      score,
      emotions: overall === 'positive' ? ['optimistic', 'confident'] : 
               overall === 'negative' ? ['concerned', 'cautious'] : ['neutral']
    };
  }

  private extractKeyInsights(text: string): string[] {
    const insights: string[] = [];
    const wordCount = text.split(/\s+/).length;
    
    insights.push(`Analysis of ${wordCount} words`);
    
    if (text.toLowerCase().includes('decision')) {
      insights.push('Decision points identified');
    }
    
    if (text.toLowerCase().includes('deadline') || text.toLowerCase().includes('due')) {
      insights.push('Time-sensitive items detected');
    }
    
    if (text.toLowerCase().includes('meeting') || text.toLowerCase().includes('call')) {
      insights.push('Communication events identified');
    }
    
    return insights;
  }

  private generateSummary(text: string, actions: MCPAction[]): string {
    const wordCount = text.split(/\s+/).length;
    const actionCount = actions.length;
    const actionTypes = [...new Set(actions.map(a => a.type))];
    
    return `Analyzed ${wordCount} words and identified ${actionCount} actionable items across ${actionTypes.length} categories: ${actionTypes.join(', ')}.`;
  }

  // Extraction helper methods
  private extractEventTitle(text: string): string {
    // Extract meaningful title from text
    const words = text.split(/\s+/).slice(0, 6); // First 6 words
    return words.join(' ').replace(/[^\w\s]/g, '').trim() || 'Event';
  }

  private extractDateTime(text: string): { date: string; time: string } {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Simple date/time extraction
    if (text.toLowerCase().includes('tomorrow')) {
      return {
        date: tomorrow.toISOString().split('T')[0],
        time: '09:00'
      };
    }
    
    if (text.toLowerCase().includes('next week')) {
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      return {
        date: nextWeek.toISOString().split('T')[0],
        time: '09:00'
      };
    }
    
    // Extract time if present
    const timeMatch = text.match(/\b(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm)\b/);
    const time = timeMatch ? `${timeMatch[1].padStart(2, '0')}:${(timeMatch[2] || '00').padStart(2, '0')}` : '09:00';
    
    return {
      date: today.toISOString().split('T')[0],
      time
    };
  }

  private extractRecurrencePattern(text: string): any {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('daily') || lowerText.includes('every day')) {
      return { pattern: RecurrencePattern.DAILY, interval: 1 };
    }
    
    if (lowerText.includes('weekly') || lowerText.includes('every week')) {
      return { pattern: RecurrencePattern.WEEKLY, interval: 1 };
    }
    
    if (lowerText.includes('monthly') || lowerText.includes('every month')) {
      return { pattern: RecurrencePattern.MONTHLY, interval: 1 };
    }
    
    if (lowerText.includes('weekday') || lowerText.includes('monday') && lowerText.includes('friday')) {
      return { pattern: RecurrencePattern.WEEKDAYS, interval: 1 };
    }
    
    return { pattern: RecurrencePattern.WEEKLY, interval: 1 };
  }

  private determinePriority(text: string): Priority {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('urgent') || lowerText.includes('asap') || lowerText.includes('critical')) {
      return Priority.URGENT;
    }
    
    if (lowerText.includes('important') || lowerText.includes('high') || lowerText.includes('priority')) {
      return Priority.HIGH;
    }
    
    if (lowerText.includes('low') || lowerText.includes('when you can') || lowerText.includes('sometime')) {
      return Priority.LOW;
    }
    
    return Priority.MEDIUM;
  }

  private calculateConfidence(match: string, pattern: RegExp): number {
    // Simple confidence calculation based on pattern strength and context
    let confidence = 0.5;
    
    // Boost confidence for specific keywords
    const strongKeywords = ['schedule', 'meeting', 'call', 'appointment', 'deadline'];
    const hasStrongKeywords = strongKeywords.some(keyword => 
      match.toLowerCase().includes(keyword)
    );
    
    if (hasStrongKeywords) confidence += 0.2;
    
    // Boost confidence for time/date mentions
    if (/\b(tomorrow|next|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}:\d{2})\b/i.test(match)) {
      confidence += 0.15;
    }
    
    // Boost confidence for person mentions
    if (/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(match)) {
      confidence += 0.1;
    }
    
    return Math.min(0.95, confidence);
  }

  private estimateDuration(text: string): number {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('quick') || lowerText.includes('brief')) return 15;
    if (lowerText.includes('hour') || lowerText.includes('1 hour')) return 60;
    if (lowerText.includes('30 min') || lowerText.includes('half hour')) return 30;
    if (lowerText.includes('standup') || lowerText.includes('daily')) return 15;
    
    return 30; // Default 30 minutes
  }

  private extractAttendees(text: string, entities?: any): string[] {
    const attendees: string[] = [];
    
    if (entities?.people) {
      attendees.push(...entities.people);
    }
    
    // Look for email addresses
    if (entities?.emails) {
      attendees.push(...entities.emails);
    }
    
    return [...new Set(attendees)]; // Remove duplicates
  }

  private extractLocation(text: string, entities?: any): string | undefined {
    if (entities?.locations && entities.locations.length > 0) {
      return entities.locations[0];
    }
    
    // Look for common location patterns
    const locationMatch = text.match(/\b(room|office|building|zoom|teams|meet)\s+([A-Z0-9][a-zA-Z0-9\s]*)/i);
    return locationMatch ? locationMatch[0] : undefined;
  }

  private getNextBusinessDay(): string {
    const today = new Date();
    const nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 1);
    
    // If it's Friday, move to Monday
    if (nextDay.getDay() === 6) { // Saturday
      nextDay.setDate(nextDay.getDate() + 2);
    } else if (nextDay.getDay() === 0) { // Sunday
      nextDay.setDate(nextDay.getDate() + 1);
    }
    
    return nextDay.toISOString().split('T')[0];
  }

  // Additional helper methods for specific action types
  private extractTaskTitle(text: string): string {
    return text.split(/\s+/).slice(0, 5).join(' ').replace(/[^\w\s]/g, '').trim() || 'Task';
  }

  private extractDueDate(text: string): string | undefined {
    const dateMatch = text.match(/\b(by|due|before)\s+([^.!?]+)/i);
    if (dateMatch) {
      // Simple date parsing - in production use a proper date parser
      const dateText = dateMatch[2].toLowerCase();
      if (dateText.includes('tomorrow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
      }
    }
    return undefined;
  }

  private extractAssignee(text: string, entities?: any): string | undefined {
    if (entities?.people && entities.people.length > 0) {
      return entities.people[0];
    }
    return undefined;
  }

  private extractTags(text: string): string[] {
    const tags: string[] = [];
    
    if (text.toLowerCase().includes('urgent')) tags.push('urgent');
    if (text.toLowerCase().includes('project')) tags.push('project');
    if (text.toLowerCase().includes('meeting')) tags.push('meeting');
    
    return tags;
  }

  private extractEmailSubject(text: string): string {
    return `Re: ${this.extractEventTitle(text)}`;
  }

  private extractEmailRecipients(text: string, entities?: any): string[] {
    if (entities?.emails) {
      return entities.emails;
    }
    return [];
  }

  private generateEmailBody(text: string): string {
    return `Hi,\n\nRegarding our discussion: ${text}\n\nBest regards`;
  }

  private extractSendTime(text: string): string | undefined {
    // Look for scheduled send times
    if (text.toLowerCase().includes('tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow.toISOString();
    }
    return undefined;
  }

  private extractContactName(text: string): string {
    const nameMatch = text.match(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/);
    return nameMatch ? nameMatch[0] : 'Contact';
  }

  private extractContactEmail(text: string): string | undefined {
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    return emailMatch ? emailMatch[0] : undefined;
  }

  private extractContactPhone(text: string): string | undefined {
    const phoneMatch = text.match(/\b\d{3}-\d{3}-\d{4}\b|\b\(\d{3}\)\s*\d{3}-\d{4}\b/);
    return phoneMatch ? phoneMatch[0] : undefined;
  }

  private extractContactCompany(text: string, entities?: any): string | undefined {
    if (entities?.organizations && entities.organizations.length > 0) {
      return entities.organizations[0];
    }
    return undefined;
  }

  private extractReminderTitle(text: string): string {
    return `Reminder: ${this.extractEventTitle(text)}`;
  }

  private extractReminderTime(text: string): string {
    // Default to 1 hour from now
    const reminderTime = new Date();
    reminderTime.setHours(reminderTime.getHours() + 1);
    return reminderTime.toISOString();
  }

  private extractReminderRepeat(text: string): RecurrencePattern | undefined {
    if (text.toLowerCase().includes('daily')) return RecurrencePattern.DAILY;
    if (text.toLowerCase().includes('weekly')) return RecurrencePattern.WEEKLY;
    return undefined;
  }

  private extractCallTitle(text: string): string {
    return `Call: ${this.extractEventTitle(text)}`;
  }

  private extractCallContact(text: string): string {
    const nameMatch = text.match(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/);
    return nameMatch ? nameMatch[0] : 'Contact';
  }

  private extractCallTime(text: string): string | undefined {
    const timeMatch = text.match(/\b(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm)\b/);
    if (timeMatch) {
      const today = new Date();
      const hour = parseInt(timeMatch[1]);
      const minute = parseInt(timeMatch[2] || '0');
      const isPM = timeMatch[3]?.toLowerCase().includes('p');
      
      today.setHours(isPM && hour !== 12 ? hour + 12 : hour, minute, 0, 0);
      return today.toISOString();
    }
    return undefined;
  }

  private estimateCallDuration(text: string): number {
    if (text.toLowerCase().includes('quick')) return 10;
    if (text.toLowerCase().includes('brief')) return 15;
    return 30; // Default 30 minutes
  }
} 