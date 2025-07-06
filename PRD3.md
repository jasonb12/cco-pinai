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
| **Auth‑svc** | User auth & JWT via Supabase Auth |
| **Ingestor‑svc** | Pull `/v1/transcripts`; raw ➜ S3; emit `new_doc` on **Supabase Realtime** |
| **Vectorizer‑λ** | Listen `new_doc`; 1536‑d embed; UPSERT → `supabase_vectors` |
| **ActionGraph** | Stateless **LangGraph**; gRPC; writes `proposed_actions` |
| **Gatekeeper** | RLS‑safe approval queue (`status=pending`) |
| **Executor** | Worker (`pg_cron`) pops approved; fires MCP adapters (GCal, Gmail, Slack…) |
| **Notification‑svc** | Supabase Realtime ➜ Expo push + in‑app |
| **Storage‑svc** | Supabase Storage buckets (audio, images, cards, docs) |
| **Scheduler (APScheduler)** | Persists cron specs in `schedules` |

### 4.2 Frontend Experience  

*React Native + Expo SDK ≥ 50*  

- Real‑time Chat with streaming AI.  
- Notification Tray (approvals & alerts).  
- Dashboard (metrics & next actions).  
- Calendar view (scheduled prompts).  
- Geofence awareness ("what happened last time here").  
- Offline‑first via `react‑query + MMKV`.

### 4.3 Theming & Dev Toolchain  

| Layer | Tool | Notes |
|-------|------|-------|
| Component lib | **Tamagui** or **React‑Native Paper** |
| Utility CSS | **Nativewind** (Tailwind RN tokens) |
| Theme engine | Tailwind tokens ➜ `ThemeProvider` (dark / light / brand) |
| Global State | **Zustand** |
| Navigation | **react‑navigation v7** |
| Animation | **react‑native‑reanimated v3** |
| Forms | **react‑hook‑form** |
| Testing | **Playwright + Jest + Testing‑Library** |
| OTA | **EAS Update** |
| CI/CD | **GitHub Actions** |

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
- **Vitest + Edge‑func smoke** – CI fixtures.  

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

## 11 Users & Stories  

| Priority | Story |
|----------|-------|
| P0 | View & query all transcripts |
| P0 | Approve / Deny `schedule_prompt` |
| P0 | See approved prompts on Calendar; pause/resume/cancel |
| P1 | Location trigger reminder |
| P1 | Expo push & in‑app toast |

---

## 12 Functional Spec  

* **Ingestion Daemon** – `/v1/transcripts?cursor=…`  
* **LangGraph** – `HumanApproval` node; tools: `schedule_prompt`, `send_email`, `create_ticket`.  
* **Scheduler** – APS job on approval; status tracked.  
* **Location Service** – Expo foreground → Supabase RPC.  
* **Notifications** – Supabase Realtime → Expo push via `expo‑server‑sdk‑python`.

---

## 13 Enhanced Features (Phase 2+)  

### Advanced Search & Filtering  
Participants • sentiment • duration • date • AI semantic queries.

### Full Workflow Engine  
Calendar creation • email drafting • document creation via MCP tools.

### Processing Architecture  
Immediate processing for simple actions • background batch for complex workflows.

---

**End of Document** 