# Product Requirements Document – CCOPINAI

*Generated 2025-07-06*

---

## 1 Product Vision  
CCOPINAI automates continuous audio capture into actionable insights with **zero manual intervention**.

---

## 2 Sample Use‑Cases  

| Context | Automation |
|---------|------------|
| Arriving at HQ | "Last meeting was on product launch. Here are the photos and Drive docs." |
| Someone **outside** office: "I'll get that to you next Tuesday." | Send reminder Monday—"excited to see that tomorrow"—and alert when due. |
| Someone **inside** office says same | Create Google Tasks task, reminder Monday, alert on due date. |
| **Self‑promise** "I'll get that to you next Tues." | Auto‑task in Google Tasks. |
| "Dinner at 7 pm tomorrow." | Check calendar; vibrate if clash; suggest alternative. |
| Someone mentions their birthday | Add to Calendar. |
| Exchange business cards | Create contact; attach card + related emails; future emails auto‑linked. |
| Weekly token check | Friday cron: verify Anthropic token balance. |
| Meeting added | Push summary + links into Odoo CRM record. |

---

## 3 Core Product Requirements  

### 🚨 Automatic AI Processing Pipeline  
1. **Background Sync** – pull new transcripts (1‑5 min) from Limitless ➜ Supabase.  
2. **Automatic AI** – `pg_cron` triggers extraction of tasks/insights/sentiment.  
3. **RAG Population** – embeddings via Supabase Vectors.  
4. **Approval Queue** – user Approve/Deny; execution only on approve.  
5. **Periodic Events** – recurring prompts scheduled in DB.  
6. **Ready for Queries** – fresh content searchable in minutes.

Targets: Sync P95 ≤ 5 min • AI proc P95 ≤ 30 s • Query P99 ≤ 2 s.

---

## 4 Technical Architecture  

### 4.1 Backend Services  

| Service | Function |
|---------|----------|
| **Auth-svc** | User auth & JWT via Supabase Auth |
| **Ingestor-svc** | Pull `/v1/transcripts`; raw ➜ S3; emit `new_doc` on **Supabase Realtime** |
| **Vectorizer-λ** | Listen `new_doc`; 1536-d embed; UPSERT → `supabase_vectors` |
| **ActionGraph** | Stateless **LangGraph**; gRPC; writes `proposed_actions` |
| **Gatekeeper** | RLS-safe approval queue (`status=pending`) |
| **Executor** | Worker (`pg_cron`) pops approved; fires MCP adapters (GCal, Gmail, Slack…) |
| **Notification-svc** | Supabase Realtime ➜ Expo push + in-app |
| **Storage-svc** | Supabase Storage buckets (audio, images, cards, docs) |
| **Scheduler (APScheduler)** | Persists cron specs in `schedules` |

### 4.2 Frontend Experience  

*React Native + Expo SDK ≥ 50*  

- Real-time Chat with streaming AI.  
- Notification Tray (approvals & alerts).  
- Dashboard (metrics & next actions).  
- Calendar view (scheduled prompts).  
- Geofence awareness ("what happened last time here").  
- Offline-first via `react-query + MMKV`.

### 4.3 Theming & Dev Toolchain  

| Layer | Tool | Notes |
|-------|------|-------|
| Component lib | **Tamagui** | Modern React Native UI library with built-in theming |
| Utility CSS | **NativeWind** | Tailwind CSS for React Native |
| Theme engine | **Tamagui ThemeProvider** | Built-in dark/light/brand theme support |
| Global State | **Zustand** | Lightweight state management |
| Navigation | **react-navigation v7** | Standard React Native navigation |
| Animation | **react-native-reanimated v3** | High-performance animations |
| Forms | **react-hook-form** | Performant form handling |
| Testing | **Playwright + Jest + Testing-Library** | Comprehensive testing suite |
| OTA | **EAS Update** | Over-the-air updates |
| CI/CD | **GitHub Actions** | Automated deployment pipeline |

**Theme Implementation:**
- Custom brand themes (light/dark) with iOS-style color palette
- Automatic system theme detection
- Consistent design tokens across all components
- Performance-optimized styling with compile-time optimizations

### 4.4 Multimodality  

*Text • Voice • Video • Image • File* — each message tagged with conversation + geohash and routed through LangGraph tools.

### 4.5 Database Schema (Selected)  

```sql
create extension if not exists pgvector;
create extension if not exists postgis;

create table actions (
  id uuid primary key,
  transcript_id uuid references transcripts,
  tool text,
  payload jsonb,
  status text check (status in ('pending','approved','denied','done')),
  created_at timestamptz default now()
);

create table schedules (
  id uuid primary key,
  action_id uuid references actions,
  cron_text text,
  next_run timestamptz,
  enabled boolean default true
);

create table locations (
  user_id uuid,
  lat double precision,
  lon double precision,
  geohash9 text,
  ts timestamptz default now()
);
```

Supabase features: **Auth • Storage • Realtime • Edge Functions • pg_cron • Vectors • PostGIS**.

---

## 5 User Experience Requirements  

| Requirement | Target |
|-------------|--------|
| Zero manual AI clicks | 100 % |
| Content freshness | ≤ 5 min |
| Query success | ≥ 95 % |
| Push latency | ≤ 5 s |
| Reliability | ≥ 99 % successful executions |

### Security & Privacy  

- **Data Encryption** at rest & in transit (TLS, AES‑256).  
- **Zero‑copy E2EE** option for sensitive workspaces.  
- **Role‑Based Access (RLS)** on every table.  
- **SOC2‑A logging** – immutable audit trail.

---

## 6 Success Metrics  

| Domain | Metric | Target |
|--------|--------|--------|
| Ingestion | P95 delay | < 3 min |
| Executor | Success rate | > 99 % |
| UX | NPS | > 45 |

---

## 7 Implementation Phases  

| Phase | Status | Deliverables |
|-------|--------|--------------|
| Foundation | ✅ | Ingestor, raw store, RN scaffold, Supabase Auth |
| Enhanced AI | ✅ | LangGraph v1, embeddings, semantic chat |
| **Automatic Processing** | 🚨 | AI pipeline, Gatekeeper UI, Expo push approvals, MCP as primary action layer |
| Advanced Features | ⏳ | Advanced search, external integrations, OCR/vision pipeline, MCP one‑click install |

---

## 8 Technical Specifications  

```mermaid
graph TD
  A[New Audio] --> B[Limitless Transcription]
  B --> C[Background Sync]
  C --> D[AI Processing / LangGraph]
  D --> E[RAG Store (pgvector)]
  E --> F[Analytics]
  F --> G[Query API]
```

### AI Processing MCP Components  

| Node | Purpose |
|------|---------|
| **emb_extract** | Summarize; yield tags/tasks |
| **trig_eval** | Decide tool + schedule |
| **tool_call** | gRPC ➜ MCP adapter |

---

## 9 Quality Assurance  

- **Playwright Vision** – GUI smoke every PR.  
- **Playwright Regression** – MCP tool flows.  
- **Vitest + Edge-func smoke** – CI fixtures.  

---

## 10 Problem & Goals  

Teams drown in spoken knowledge but lose action items. CCOPINAI listens, extracts intent, and (with approval) executes.

| ID | Goal |
|----|------|
| G1 | Near‑real‑time transcript import |
| G2 | Trigger detection via LangGraph + embeddings |
| G3 | Secure approval workflow |
| G4 | APScheduler tasks with pause/resume |
| G5 | Push notifications (mobile + desktop) |
| G6 | Responsive GUI (Chat, Dashboard, Calendar) |

---

## Addendum – MCP Configuration & Processing Monitor

### 🔧 MCP Configuration

**Goal:** let power users graphically enable/disable tools, set defaults (e.g., "work" vs "personal" calendars), map trigger phrases, and run dry‑runs.

**Requirements**

| ID | Requirement |
|----|-------------|
| MCP‑1 | GUI lists all installed MCP tools with status (enabled/disabled, OAuth bound) |
| MCP‑2 | "Add Integration" wizard: choose provider ➜ OAuth ➜ scope selection |
| MCP‑3 | Per‑tool default parameters (e.g., default calendar ID, email signature) |
| MCP‑4 | Trigger rules table: regex / embedding similarity, geo‑fence, schedule |
| MCP‑5 | Test‑run button executes tool in sandbox, returns result payload |
| MCP‑6 | Versioning: track tool version & last successful exec |

### 📈 Processing Monitor

**Goal:** give visibility into each transcript's life‑cycle from ingestion to executed action.

Pipeline stages:

1. **Ingested** – raw asset stored  
2. **Vectorized** – embeddings done  
3. **Parsed** – tasks & entities extracted  
4. **Proposed** – actions queued (pending)  
5. **Approved** – user approved  
6. **Executed** – MCP call succeeded / failed  
7. **Indexed** – final RAG record live

**Requirements**

| ID | Requirement |
|----|-------------|
| MON‑1 | Real‑time table of items with stage badges & timestamps |
| MON‑2 | Filter by status, meeting ID, user, tool |
| MON‑3 | Retry / Force‑execute buttons (RLS‑guarded) |
| MON‑4 | Error detail modal: stacktrace, payload preview |
| MON‑5 | Websocket diff view auto‑refresh (<1 s push) |
| MON‑6 | Export CSV / JSON for audit |

### Backend Additions

| Service | Function |
|---------|----------|
| **ToolRegistry‑svc** | CRUD for MCP metadata, OAuth tokens, default params |
| **QueueMonitor‑svc** | Streams `actions` & `logs` tables via Supabase Realtime |
| **Log‑collector** | Edge Function writes per‑stage events into `processing_logs` (jsonb) |

### Database Extensions

```sql
create table mcp_tools (
  id uuid primary key,
  name text,
  version text,
  enabled boolean,
  oauth_provider text,
  default_params jsonb,
  updated_at timestamptz default now()
);

create table processing_logs (
  id bigint generated always as identity,
  transcript_id uuid,
  stage text,
  status text,
  payload jsonb,
  ts timestamptz default now(),
  primary key(id)
);
```

### UX KPIs (extended)

| Metric | Target |
|--------|--------|
| MCP config completion time | < 3 min |
| Monitor latency (event ➜ UI) | < 1 s |
| Action failure rate | < 0.5 % |

---

**End of Document**
