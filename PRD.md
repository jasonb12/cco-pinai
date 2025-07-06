# Product Requirements Document – CCOPINAI

## Product Vision

CCOPINAI is an AI-powered automation assistant that transforms continuous audio capture into intelligent, actionable insights. The system provides seamless, automatic processing of all content with zero manual intervention required.

## Sample use cases
- When I arrive at HQ, remind me that the last meeting was about the new product launch.  Here are the pictures you took, here are the docs you put in google drive.
- When someone outside my office says "I'll get that to you next tues", send a reminder out on monday saying "excited to see that tomorrow", then alert you when it's due."
- When someone inside my office says "I'll get that to you next tues", create a task in tasks.google.com, send a reminder out on monday saying "excited to see that tomorrow", then alert you when it's due."
- When I say I'll get that to you next tues, add a task to tasks.google.com.
- When I say let's go to dinner at 7pm tomorrow, Gotcha should check if that time is free and if not vibrate in my pocket warning me.  An alert should tell me that I'm busy and suggest a different time.  
- When someone says it's their birthday, add it to the calendar.
- When I meet someone and exchange names and business cards, the ai should create a contact, attach the business card, attach any emails, watch for incomming emails and link them to the contact via gmail search, etc..
- When I say "make sure that we have enough tokens at anthropic to do the tasks for next week" every friday.  make a schedule that MCP action every friday.
- Check the list of meetings in calendar and add them to our calendar with links to the summary of everything we have said to that customer.  When you sit down you know everything and have everything.  Push it all into a link and add it to odoo

## Core Product Requirements

### 🚨 CRITICAL: Automatic AI Processing Pipeline

**Fundamental Requirement**: ALL new content must be automatically processed through AI and stored in RAG database during background sync. Users should NEVER need to manually trigger AI processing.

**Processing Pipeline**:
1. **Background Sync** → Fetch new transcripts from Limitless into supabase.  This is done every 1-5 minutes.
2. **Automatic AI Processing** → Extract tasks, insights, sentiment, done by pg_cron
3. **RAG Database Population** → Store embeddings and searchable content in supabase.  This is done by Supabase Vectors https://supabase.com/docs/guides/ai.
4. **Approval Queue and Alerts** → The user can approve or deny the actions.  If they deny, the action is not taken.  If they approve, the action is taken.  The user can also see the approval queue and the alerts.
5. **Approval of Periodic Events** → chat or conversation requests for periodic events result in periodic prompts run on the database
5. **Ready for Queries** → Content immediately available for intelligent search

## Technical Architecture

### Backend Services
- **sample** description
- **sample** description
- **sample** description
- **sample** description
- **sample** description

### Frontend Experience
- **React Native/Expo** for cross-platform compatibility
- **Theme Management** - entire interface has theme mangement and is as Expo standard as possible.
- **Familiar Components** - use familiar components from the expo library and the react native library.
- **Real-time chat interface** with intelligent responses
- **Automatic content availability** - no manual processing buttons
- **Notifications with Approvals** - notifications for approval
- **Notification queue** - notifications for alerts
- **MCP tools** - MCP tools for the actions
- **Oauth setup** - oauth setup for the actions
- **Calendar** - calendar for actions
- **Dashboard** - dashboard for actions
- **Chat** - chat with ai
- **GeoFence** - know what you did last time you where here and what docs matter and who was here, what there names are and what they said. 

### Multimodality
- **Text** - text for the actions, MCP to google, mail, zoom, etc.
- **Voice** - voice for the actions, MCP to transcription of uploaded audio
- **Video** - video for the actions, MCP to transcription of uploaded video
- **Image** - image for the actions, MCP to camera real, camera, and local storage
- **File** - file for the actions, MCP to google, mail, zoom, etc.


### Database Schema
- **supabase** - supabase for the database
- **supabase vectors** - supabase vectors for the embeddings
- **supabase realtime** - supabase realtime for the realtime updates
- **supabase auth** - supabase auth for the authentication
- **supabase storage** - supabase storage for the storage
- **supabase functions** - supabase functions for the functions
- **supabase edge functions** - supabase edge functions for the edge functions
- **supabase pg_cron** - supabase pg_cron for the cron jobs
- **supabase migrations** - supabase migrations for the migrations
- **sample** description
- **sample** description
- **sample** description

## User Experience Requirements

### 🎯 Seamless Automation
- **Zero Manual Processing**: All content automatically processed
- **Immediate Availability**: New content ready for queries within minutes
- **Intelligent Responses**: AI provides contextual answers about user's actual data
- **Progressive Enhancement**: System works even during setup phases

### Performance Targets
- **Background Sync**: Every 1-5 minutes (configurable)
- **EVENT DRIVEN** - events are the triggers for the actions heavy use of supabase realtime
- **AI Processing**: Complete within 30 seconds of sync
- **Query Response**: <2 seconds for intelligent answers
- **Push Notifications** - push notifications for alerts

### Security & Privacy
- **sample** description
- **sample** description

## Success Metrics

### Core Functionality
- **sample** description
- **sample** description

### User Experience
- **Zero Manual Actions**: Users never need to click "process with AI"
- **Content Freshness**: New audio available for queries within 5 minutes
- **Query Success Rate**: >95% of user questions receive useful answers
- **System Reliability**: <1% error rate for background processing

## Implementation Phases

### Phase 1: Foundation ✅ COMPLETE
- Sample
- Sample

### Phase 2: Enhanced AI ✅ COMPLETE  
- Sample
- Sample

### Phase 3: Automatic Processing 🚨 CURRENT PRIORITY
- Sample
- Sample

### Phase 4: Advanced Features
- Sample
- Sample

## Technical Specifications

### Background Processing Pipeline
```
New Audio → Limitless Transcription → Background Sync → AI Processing with MCP tools → RAG Storage → Analytics Update → Ready for Queries
```

### AI Processing MCP Components
- **Sample**: sample
- **Sample**: sample
- **Sample**: sample

## Quality Assurance

### Automated Testing
- **Playwrite Vision**: Playwrite browser integration to test gui
- **Playwrite Regression**: Playwrite tests for the MCP tools and ui
- **Sample**: sample

This PRD defines a product that provides **truly intelligent automation** where users simply speak, and the system automatically makes all content searchable and actionable through natural language queries.

## 1 Problem
Teams generate mountains of spoken knowledge (meetings, ad‑oc calls) but lose action items. We need a system that listens, extracts intent, and reliably executes—*with human approval*.

## 2 Goals
| ID | Goal |
|----|------|
| G1 | Import all transcripts from Limitless.app API in near real‑time |
| G2 | Detect action triggers (text & geofence) with LangGraph + embeddings |
| G3 | Secure approval workflow before any MCP tool executes |
| G4 | Schedule prompts/tasks via APScheduler; allow cancel/monitor |
| G5 | Notify users on mobile (Expo push) & desktop |
| G6 | Provide a clean, responsive GUI with Chat, Dashboard, Calendar, CRUD screens |

## 4 Users & Stories
| Priority | Story |
|----------|-------|
| P0 | As a user, I see **all meeting transcripts** in Chat and can query them |
| P0 | When the agent proposes **`schedule_prompt`**, I get an **Allow / Deny** modal |
| P0 | Approved prompts land on my **Calendar**; I can **pause/resume/cancel** |
| P1 | Location trigger: "When I arrive at HQ, remind me to badge the server" |
| P1 | Notifications appear as Expo push & in‑app toast |

## 5 Functional Spec
* **Ingestion Daemon** pulls `/v1/transcripts?cursor=…`
* **LangGraph**  
  * `HumanApproval` node after each proposed MCP tool
  * Tool map: `schedule_prompt`, `send_email`, `create_ticket`
* **Scheduler**  
  * On approval: create APS job, store in Supabase table `schedules`
  * Monitor Edge Function marks `status` (running / failed)
* **Location Service**  
  * Expo foreground service posts lat/long → Supabase RPC → triggers workflow
* **Notifications**  
  * Supabase Realtime channel → Expo push via `expo-server-sdk-python`

## 7 Enhanced Features (Phase 2)

### 7.2 Advanced Search & Filtering  
* **Comprehensive Search System**: Text search through content + title, advanced filters (participants, duration, date range, sentiment), AI-powered semantic search ("find conversations about work projects")
* **Filter Categories**: Participants, meeting type, duration ranges, sentiment analysis, date ranges, processing status

### 7.5 Full Workflow Engine
* **Complete Approval System**: Full approval management screen with approve/deny actions and bulk operations
* **Real Action Execution**: Calendar creation, email drafting, document creation via MCP tools
* **External Integrations**: Google Calendar, Gmail, Slack, project management tools
* **Workflow Orchestration**: Complex multi-step workflows with conditional logic and rollback capabilities

### 7.6 Processing Architecture
* **Dual Processing Modes**: Immediate processing for simple actions, background batch for complex workflows
* **Real-time Notifications**: Expo push notifications for processing completion, approval requests, action results
* **Progress Tracking**: Visual indicators for processing status, workflow stages, completion rates

