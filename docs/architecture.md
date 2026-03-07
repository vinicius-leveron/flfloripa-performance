# FLFloripa Performance — Fullstack Architecture Document

## 1. Introduction

This document outlines the complete fullstack architecture for the FLFloripa Performance Platform, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for a modern fullstack Next.js application where these concerns are increasingly intertwined.

### Starter Template or Existing Project

N/A — Greenfield project. The application will be built from scratch using `create-next-app` with the App Router and TypeScript template.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-07 | 0.1.0 | Initial architecture document | @architect (Aria) |

---

## 2. High Level Architecture

### Technical Summary

FLFloripa Performance is a monolithic fullstack web application built with Next.js 16+ (App Router) that serves as a performance management platform for the Fundação Logosófica de Florianópolis. The application consolidates social media metrics from TikTok, Instagram, and LinkedIn through their respective APIs, integrates Meta Marketing API for paid campaign tracking, and provides a conversion funnel from digital engagement to in-person visits. The backend leverages Next.js Route Handlers for API endpoints and Vercel Cron Functions for scheduled metric synchronization every 6 hours. PostgreSQL (hosted on Supabase) serves as the primary datastore with Prisma ORM for type-safe data access. The architecture prioritizes simplicity and usability for a non-technical team of 6-10 people, using shadcn/ui components and a responsive dashboard-first design.

### Platform and Infrastructure Choice

**Platform:** Vercel + Supabase
**Key Services:** Vercel (hosting, serverless functions, cron jobs), Supabase (PostgreSQL, connection pooling)
**Deployment Host and Regions:** Vercel — `us-east-1` (closest to Brazil with Supabase free tier)

**Rationale:**
- **Vercel**: Native Next.js host, zero-config deployment, built-in cron functions, generous free tier (100GB bandwidth, 100 hours serverless)
- **Supabase**: Managed PostgreSQL with free tier (500MB, 2 projects), connection pooling via PgBouncer, automatic backups
- **Alternative considered**: AWS (Lambda + RDS) — rejected due to operational complexity for a small non-technical team
- **Alternative considered**: Railway — viable but Vercel's native Next.js support is superior

### Repository Structure

**Structure:** Monorepo (single Next.js application)
**Monorepo Tool:** N/A — single `package.json`, no need for workspace tooling
**Package Organization:** Feature-based organization within `src/features/`

Since this is a single Next.js fullstack app (not a multi-package monorepo), all code lives in one project with feature-based folder structure. This avoids unnecessary complexity while maintaining clean separation of concerns.

### High Level Architecture Diagram

```mermaid
graph TB
    subgraph Users["Users (Browser)"]
        Web["Web App (Desktop/Mobile)"]
    end

    subgraph Vercel["Vercel Platform"]
        NextJS["Next.js 16+ App"]
        RSC["React Server Components"]
        RH["Route Handlers (API)"]
        Cron["Cron Functions (6h sync)"]
    end

    subgraph Supabase["Supabase"]
        PG["PostgreSQL"]
    end

    subgraph ExternalAPIs["External APIs"]
        MetaGraph["Meta Graph API (Instagram)"]
        MetaAds["Meta Marketing API (Ads)"]
        TikTok["TikTok Business API"]
        LinkedIn["LinkedIn Marketing API"]
    end

    Web --> NextJS
    NextJS --> RSC
    NextJS --> RH
    RH --> PG
    RSC --> PG
    Cron --> RH
    RH --> MetaGraph
    RH --> MetaAds
    RH --> TikTok
    RH --> LinkedIn
```

### Architectural Patterns

- **Monolithic Fullstack (Next.js):** Single deployable unit with frontend and backend co-located — _Rationale:_ Simplest architecture for a team with one developer, eliminates inter-service communication overhead
- **Feature-Based Organization:** Code organized by business domain (auth, dashboard, calendar, funnel, campaigns) rather than technical layer — _Rationale:_ Features are self-contained, easier to understand and maintain
- **Contract Pattern:** Features expose public APIs via `.contract.ts` files — _Rationale:_ Prevents cross-feature coupling, enables independent development and testing
- **Repository Pattern:** All database access isolated in repository classes — _Rationale:_ Single place to modify queries, easy to mock in tests, Prisma migration-safe
- **Service Pattern:** Business logic encapsulated in testable services — _Rationale:_ Keeps Route Handlers thin, enables unit testing without HTTP
- **Server Components First:** Default to RSC for data fetching, Client Components only for interactivity — _Rationale:_ Reduced client bundle, better initial load performance
- **Optimistic UI with React Query:** Server state managed by TanStack Query with optimistic updates — _Rationale:_ Perceived performance improvement, automatic cache invalidation

---

## 3. Tech Stack

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| Frontend Language | TypeScript | ^5.0.0 | Type safety across stack | Catches 60% of bugs at compile time |
| Frontend Framework | Next.js | ^16.0.0 | Fullstack React (App Router) | Native RSC, Route Handlers, Vercel-optimized |
| UI Components | shadcn/ui | latest | Accessible component library | Copy-paste components, fully customizable, Tailwind-native |
| Styling | Tailwind CSS | ^3.4.0 | Utility-first CSS | Rapid UI development, small bundle, responsive out of the box |
| State (Global) | Zustand | ^4.5.0 | Client-side UI state | Minimal API, no boilerplate, DevTools support |
| State (Server) | TanStack Query | ^5.0.0 | Server state & caching | Auto-refetch, optimistic updates, cache management |
| Forms | React Hook Form | ^7.50.0 | Form handling | Performant (uncontrolled), Zod integration |
| Validation | Zod | ^3.22.0 | Schema validation | Runtime + static types, API input validation |
| Charts | Recharts | ^2.12.0 | Dashboard visualizations | React-native, responsive, customizable |
| Database ORM | Prisma | ^5.9.0 | Type-safe data access | Auto-generated types, migrations, studio |
| Database | PostgreSQL | 15 | Primary datastore | Relational model fits the domain, Supabase-hosted |
| Auth | NextAuth.js | ^5.0.0 | Authentication | Credentials provider, session management, RBAC |
| Backend Framework | Next.js Route Handlers | ^16.0.0 | REST API endpoints | Co-located with frontend, type sharing |
| Background Jobs | Vercel Cron | native | Scheduled metric sync | Zero infrastructure, 1 cron/day free tier |
| Testing (Unit) | Vitest | ^1.2.0 | Unit & integration tests | Fast, ESM-native, Vite-compatible |
| Testing (E2E) | Playwright | ^1.41.0 | End-to-end testing | Cross-browser, auto-waiting, mobile emulation |
| API Mocking | MSW | ^2.1.0 | Mock external APIs | Intercepts at network level, works in tests and dev |
| PDF Generation | @react-pdf/renderer | ^3.4.0 | Report export | React-based PDF, server-side rendering |
| Linting | ESLint | ^8.0.0 | Code quality | Next.js plugin, TypeScript rules |
| Formatting | Prettier | ^3.0.0 | Code formatting | Consistent style |
| CI/CD | GitHub Actions | native | Automated testing & deploy | Free for public repos, Vercel integration |

---

## 4. Data Models

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ ContentCalendarEntry : creates
    User ||--o{ Lead : registers
    Channel ||--o{ Metric : has
    Channel ||--o{ Post : contains
    Channel ||--o{ ContentCalendarEntry : targets
    Campaign ||--o{ CampaignMetric : has
    Lead ||--o{ LeadEvent : has
    FunnelStage ||--o{ Lead : contains
    FunnelStage ||--o{ LeadEvent : from
    FunnelStage ||--o{ LeadEvent : to

    User {
        string id PK
        string email UK
        string name
        string passwordHash
        enum role "ADMIN | EDITOR | VIEWER"
        datetime createdAt
        datetime updatedAt
    }

    Channel {
        string id PK
        enum platform "INSTAGRAM | TIKTOK | LINKEDIN"
        string accountName
        string accountId
        string accessToken
        string refreshToken
        datetime tokenExpiresAt
        enum status "CONNECTED | DISCONNECTED | ERROR"
        string userId FK
        datetime lastSyncAt
        datetime createdAt
    }

    Post {
        string id PK
        string externalId
        string channelId FK
        string title
        string url
        datetime publishedAt
        json metrics "impressions, reach, likes, comments, shares, saves"
        datetime createdAt
    }

    Metric {
        string id PK
        string channelId FK
        date date
        int impressions
        int reach
        int engagement
        int profileVisits
        int linkClicks
        int followersCount
        datetime createdAt
    }

    Campaign {
        string id PK
        string metaCampaignId UK
        string channelId FK
        string name
        enum status "ACTIVE | PAUSED | COMPLETED"
        string objective
        float budget
        datetime startDate
        datetime endDate
        datetime createdAt
    }

    CampaignMetric {
        string id PK
        string campaignId FK
        date date
        float spend
        int impressions
        int clicks
        float cpm
        float cpc
        float ctr
        int conversions
        datetime createdAt
    }

    FunnelStage {
        string id PK
        string name
        int position
        string description
        enum source "AUTO | MANUAL"
        datetime createdAt
    }

    Lead {
        string id PK
        string name
        string email
        string phone
        string channelOrigin
        string currentStageId FK
        string registeredById FK
        string notes
        boolean isDeleted
        datetime createdAt
        datetime updatedAt
    }

    LeadEvent {
        string id PK
        string leadId FK
        string fromStageId FK
        string toStageId FK
        string notes
        string createdById FK
        datetime createdAt
    }

    ContentCalendarEntry {
        string id PK
        string title
        string description
        string channelId FK
        enum category "EDUCATIONAL | INSTITUTIONAL | INVITE | TESTIMONY"
        string assigneeId FK
        enum status "PLANNED | CREATED | PUBLISHED"
        date scheduledDate
        datetime createdAt
        datetime updatedAt
    }

    Alert {
        string id PK
        enum type "ENGAGEMENT_DROP | CAMPAIGN_UNDERPERFORM | CADENCE_MISS"
        string channelId FK
        string campaignId FK
        string message
        json data
        boolean isRead
        datetime createdAt
    }

    Report {
        string id PK
        enum type "WEEKLY | MONTHLY | CUSTOM"
        date periodStart
        date periodEnd
        string generatedById FK
        string fileUrl
        datetime createdAt
    }
```

### TypeScript Interfaces (Shared Types)

```typescript
// src/shared/types/models.ts

export type UserRole = 'ADMIN' | 'EDITOR' | 'VIEWER';
export type ChannelPlatform = 'INSTAGRAM' | 'TIKTOK' | 'LINKEDIN';
export type ChannelStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED';
export type ContentCategory = 'EDUCATIONAL' | 'INSTITUTIONAL' | 'INVITE' | 'TESTIMONY';
export type ContentStatus = 'PLANNED' | 'CREATED' | 'PUBLISHED';
export type FunnelSource = 'AUTO' | 'MANUAL';
export type AlertType = 'ENGAGEMENT_DROP' | 'CAMPAIGN_UNDERPERFORM' | 'CADENCE_MISS';
export type ReportType = 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Channel {
  id: string;
  platform: ChannelPlatform;
  accountName: string;
  accountId: string;
  status: ChannelStatus;
  lastSyncAt: Date | null;
  createdAt: Date;
}

export interface Metric {
  id: string;
  channelId: string;
  date: Date;
  impressions: number;
  reach: number;
  engagement: number;
  profileVisits: number;
  linkClicks: number;
  followersCount: number;
}

export interface FunnelStage {
  id: string;
  name: string;
  position: number;
  description: string;
  source: FunnelSource;
}

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  channelOrigin: string;
  currentStageId: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentCalendarEntry {
  id: string;
  title: string;
  description: string | null;
  channelId: string | null;
  category: ContentCategory;
  assigneeId: string | null;
  status: ContentStatus;
  scheduledDate: Date;
}

export interface Campaign {
  id: string;
  metaCampaignId: string;
  name: string;
  status: CampaignStatus;
  objective: string;
  budget: number;
  startDate: Date;
  endDate: Date | null;
}
```

---

## 5. API Specification

### REST API Routes

All API routes use Next.js Route Handlers under `src/app/api/`.

```
Authentication:
  POST   /api/auth/register          Register new user
  POST   /api/auth/login             Login with credentials
  POST   /api/auth/logout            Logout current user
  GET    /api/auth/session           Get current session

Users:
  GET    /api/users                  List users (ADMIN only)
  PATCH  /api/users/:id/role         Update user role (ADMIN only)

Channels:
  GET    /api/channels               List connected channels
  POST   /api/channels/connect       Initiate OAuth flow
  POST   /api/channels/callback      OAuth callback handler
  DELETE /api/channels/:id           Disconnect channel
  POST   /api/channels/:id/sync      Trigger manual sync

Metrics:
  GET    /api/metrics/dashboard      Aggregated dashboard metrics
  GET    /api/metrics/channel/:id    Metrics for specific channel
  GET    /api/metrics/trends         Trend comparison data

Funnel:
  GET    /api/funnel                 Funnel stages with counts
  GET    /api/funnel/conversion      Conversion rates between stages

Leads:
  GET    /api/leads                  List leads (paginated, filterable)
  POST   /api/leads                  Create new lead
  GET    /api/leads/:id              Get lead detail with events
  PATCH  /api/leads/:id              Update lead
  POST   /api/leads/:id/move         Move lead to different stage
  DELETE /api/leads/:id              Soft-delete lead (ADMIN only)

Calendar:
  GET    /api/calendar               List entries (date range)
  POST   /api/calendar               Create entry
  PATCH  /api/calendar/:id           Update entry
  DELETE /api/calendar/:id           Delete entry
  GET    /api/calendar/cadence       Cadence adherence metrics

Campaigns:
  GET    /api/campaigns              List campaigns
  GET    /api/campaigns/:id          Campaign detail with metrics
  GET    /api/campaigns/roi          ROI analysis data

Alerts:
  GET    /api/alerts                 List alerts (unread first)
  PATCH  /api/alerts/:id/read        Mark alert as read

Reports:
  POST   /api/reports/generate       Generate report (async)
  GET    /api/reports                List generated reports
  GET    /api/reports/:id/download   Download report PDF

Settings:
  GET    /api/settings/cadence       Get cadence goals
  PATCH  /api/settings/cadence       Update cadence goals
  GET    /api/settings/alerts        Get alert thresholds
  PATCH  /api/settings/alerts        Update alert thresholds

Cron (internal):
  POST   /api/cron/sync-metrics      Sync all channel metrics (Vercel Cron)
  POST   /api/cron/check-alerts      Check alert conditions (Vercel Cron)
```

### Standard API Response Format

```typescript
// Success
{
  data: T,
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }
}

// Error
{
  error: {
    code: string;           // e.g., "VALIDATION_ERROR", "NOT_FOUND"
    message: string;         // Human-readable message in pt-BR
    details?: Record<string, string[]>; // Field-level validation errors
    timestamp: string;
    requestId: string;
  }
}
```

---

## 6. External APIs

### Meta Graph API (Instagram)

- **Purpose:** Fetch Instagram Business account metrics and post insights
- **Documentation:** https://developers.facebook.com/docs/instagram-api
- **Base URL(s):** `https://graph.facebook.com/v21.0`
- **Authentication:** OAuth 2.0 via Facebook Login
- **Rate Limits:** 200 calls/hour per user token, 4800/day

**Key Endpoints Used:**
- `GET /{ig-user-id}/media` — List posts
- `GET /{ig-media-id}/insights` — Post-level metrics (impressions, reach, engagement)
- `GET /{ig-user-id}/insights` — Account-level metrics (profile views, website clicks)
- `GET /{ig-user-id}?fields=followers_count` — Follower count

**Required Permissions:** `instagram_basic`, `instagram_manage_insights`, `pages_show_list`, `pages_read_engagement`

### Meta Marketing API (Facebook/Instagram Ads)

- **Purpose:** Import paid campaign performance data
- **Documentation:** https://developers.facebook.com/docs/marketing-api
- **Base URL(s):** `https://graph.facebook.com/v21.0`
- **Authentication:** OAuth 2.0 (same token as Instagram if linked)
- **Rate Limits:** Tiered — Standard access: 300 calls/hour

**Key Endpoints Used:**
- `GET /act_{ad-account-id}/campaigns` — List campaigns with status
- `GET /{campaign-id}/insights` — Campaign metrics (spend, impressions, clicks, cpm, cpc, ctr)
- `GET /act_{ad-account-id}/adsets` — Ad set details

**Required Permissions:** `ads_read`

### TikTok Business API

- **Purpose:** Fetch TikTok account analytics and video metrics
- **Documentation:** https://developers.tiktok.com/doc/overview
- **Base URL(s):** `https://open.tiktokapis.com/v2`
- **Authentication:** OAuth 2.0
- **Rate Limits:** 100 requests/minute

**Key Endpoints Used:**
- `GET /video/list/` — List published videos
- `POST /research/user/info/` — Account metrics
- `POST /video/query/` — Video-level insights (views, likes, comments, shares)

**Required Scopes:** `user.info.basic`, `video.list`, `video.insights`

### LinkedIn Marketing API

- **Purpose:** Fetch LinkedIn Company Page analytics
- **Documentation:** https://learn.microsoft.com/en-us/linkedin/marketing/
- **Base URL(s):** `https://api.linkedin.com/rest`
- **Authentication:** OAuth 2.0 (3-legged)
- **Rate Limits:** 100 requests/day per member token

**Key Endpoints Used:**
- `GET /organizationalEntityShareStatistics` — Page post analytics
- `GET /organizationPageStatistics` — Page-level metrics (impressions, followers)
- `GET /shares?owners=urn:li:organization:{id}` — List posts

**Required Scopes:** `r_organization_social`, `r_organization_admin`, `rw_organization_admin`

**Integration Notes:** LinkedIn has the most restrictive rate limits (100/day). Metric sync should batch requests and cache aggressively. Consider syncing LinkedIn data less frequently (once/day vs. every 6h for others).

---

## 7. Core Workflows

### OAuth Channel Connection Flow

```mermaid
sequenceDiagram
    actor User
    participant App as Next.js App
    participant API as Route Handler
    participant DB as PostgreSQL
    participant Ext as External API (Meta/TikTok/LinkedIn)

    User->>App: Click "Connect Channel"
    App->>API: POST /api/channels/connect {platform}
    API->>API: Generate OAuth URL + state token
    API->>DB: Store state token
    API-->>App: Redirect URL
    App->>Ext: Redirect to OAuth consent
    User->>Ext: Authorize permissions
    Ext->>API: Callback with auth code
    API->>Ext: Exchange code for access_token
    Ext-->>API: access_token + refresh_token
    API->>DB: Save Channel (encrypted tokens)
    API->>API: Trigger initial sync
    API-->>App: Redirect to /settings/channels
    App-->>User: Show "Connected" status
```

### Metric Sync (Cron Job) Flow

```mermaid
sequenceDiagram
    participant Cron as Vercel Cron
    participant API as Sync Handler
    participant DB as PostgreSQL
    participant Meta as Meta API
    participant TikTok as TikTok API
    participant LinkedIn as LinkedIn API

    Cron->>API: POST /api/cron/sync-metrics
    API->>DB: Get all connected channels

    par Sync Instagram
        API->>Meta: GET /insights (last 7 days)
        Meta-->>API: Metrics data
        API->>DB: Upsert Metric records
    and Sync TikTok
        API->>TikTok: POST /video/query
        TikTok-->>API: Video metrics
        API->>DB: Upsert Metric records
    and Sync LinkedIn
        API->>LinkedIn: GET /organizationPageStatistics
        LinkedIn-->>API: Page metrics
        API->>DB: Upsert Metric records
    end

    API->>DB: Update Channel.lastSyncAt
    API->>API: Check alert conditions
    API->>DB: Create Alert records if thresholds exceeded
```

### Lead Registration Flow

```mermaid
sequenceDiagram
    actor Editor
    participant App as Next.js App
    participant API as Route Handler
    participant DB as PostgreSQL

    Editor->>App: Click "New Lead"
    App->>App: Show form (name, contact, origin, stage, notes)
    Editor->>App: Fill form & submit
    App->>API: POST /api/leads {name, email, channelOrigin, stageId, notes}
    API->>API: Validate with Zod schema
    API->>DB: Create Lead record
    API->>DB: Create LeadEvent (entry event)
    API-->>App: Lead created
    App-->>Editor: Show in leads table
```

---

## 8. Database Schema

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  EDITOR
  VIEWER
}

enum ChannelPlatform {
  INSTAGRAM
  TIKTOK
  LINKEDIN
}

enum ChannelStatus {
  CONNECTED
  DISCONNECTED
  ERROR
}

enum CampaignStatus {
  ACTIVE
  PAUSED
  COMPLETED
}

enum ContentCategory {
  EDUCATIONAL
  INSTITUTIONAL
  INVITE
  TESTIMONY
}

enum ContentStatus {
  PLANNED
  CREATED
  PUBLISHED
}

enum FunnelSource {
  AUTO
  MANUAL
}

enum AlertType {
  ENGAGEMENT_DROP
  CAMPAIGN_UNDERPERFORM
  CADENCE_MISS
}

enum ReportType {
  WEEKLY
  MONTHLY
  CUSTOM
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  passwordHash String   @map("password_hash")
  role         UserRole @default(VIEWER)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  channels        Channel[]
  calendarEntries ContentCalendarEntry[] @relation("assignee")
  registeredLeads Lead[]                @relation("registeredBy")
  leadEvents      LeadEvent[]           @relation("createdBy")
  reports         Report[]              @relation("generatedBy")

  @@map("users")
}

model Channel {
  id             String          @id @default(cuid())
  platform       ChannelPlatform
  accountName    String          @map("account_name")
  accountId      String          @map("account_id")
  accessToken    String          @map("access_token")
  refreshToken   String?         @map("refresh_token")
  tokenExpiresAt DateTime?       @map("token_expires_at")
  status         ChannelStatus   @default(CONNECTED)
  userId         String          @map("user_id")
  lastSyncAt     DateTime?       @map("last_sync_at")
  createdAt      DateTime        @default(now()) @map("created_at")

  user            User                   @relation(fields: [userId], references: [id])
  metrics         Metric[]
  posts           Post[]
  campaigns       Campaign[]
  calendarEntries ContentCalendarEntry[]
  alerts          Alert[]                @relation("channelAlerts")

  @@map("channels")
}

model Post {
  id          String   @id @default(cuid())
  externalId  String   @map("external_id")
  channelId   String   @map("channel_id")
  title       String?
  url         String?
  publishedAt DateTime @map("published_at")
  metrics     Json?
  createdAt   DateTime @default(now()) @map("created_at")

  channel Channel @relation(fields: [channelId], references: [id], onDelete: Cascade)

  @@unique([channelId, externalId])
  @@map("posts")
}

model Metric {
  id             String   @id @default(cuid())
  channelId      String   @map("channel_id")
  date           DateTime @db.Date
  impressions    Int      @default(0)
  reach          Int      @default(0)
  engagement     Int      @default(0)
  profileVisits  Int      @default(0) @map("profile_visits")
  linkClicks     Int      @default(0) @map("link_clicks")
  followersCount Int      @default(0) @map("followers_count")
  createdAt      DateTime @default(now()) @map("created_at")

  channel Channel @relation(fields: [channelId], references: [id], onDelete: Cascade)

  @@unique([channelId, date])
  @@index([channelId, date])
  @@map("metrics")
}

model Campaign {
  id               String         @id @default(cuid())
  metaCampaignId   String         @unique @map("meta_campaign_id")
  channelId        String         @map("channel_id")
  name             String
  status           CampaignStatus @default(ACTIVE)
  objective        String?
  budget           Float          @default(0)
  startDate        DateTime?      @map("start_date")
  endDate          DateTime?      @map("end_date")
  createdAt        DateTime       @default(now()) @map("created_at")

  channel Channel          @relation(fields: [channelId], references: [id], onDelete: Cascade)
  metrics CampaignMetric[]
  alerts  Alert[]          @relation("campaignAlerts")

  @@map("campaigns")
}

model CampaignMetric {
  id          String   @id @default(cuid())
  campaignId  String   @map("campaign_id")
  date        DateTime @db.Date
  spend       Float    @default(0)
  impressions Int      @default(0)
  clicks      Int      @default(0)
  cpm         Float    @default(0)
  cpc         Float    @default(0)
  ctr         Float    @default(0)
  conversions Int      @default(0)
  createdAt   DateTime @default(now()) @map("created_at")

  campaign Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)

  @@unique([campaignId, date])
  @@index([campaignId, date])
  @@map("campaign_metrics")
}

model FunnelStage {
  id          String       @id @default(cuid())
  name        String
  position    Int
  description String?
  source      FunnelSource @default(MANUAL)
  createdAt   DateTime     @default(now()) @map("created_at")

  leads      Lead[]
  eventsFrom LeadEvent[] @relation("fromStage")
  eventsTo   LeadEvent[] @relation("toStage")

  @@map("funnel_stages")
}

model Lead {
  id             String   @id @default(cuid())
  name           String
  email          String?
  phone          String?
  channelOrigin  String?  @map("channel_origin")
  currentStageId String   @map("current_stage_id")
  registeredById String   @map("registered_by_id")
  notes          String?
  isDeleted      Boolean  @default(false) @map("is_deleted")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  currentStage FunnelStage @relation(fields: [currentStageId], references: [id])
  registeredBy User        @relation("registeredBy", fields: [registeredById], references: [id])
  events       LeadEvent[]

  @@index([currentStageId])
  @@index([isDeleted])
  @@map("leads")
}

model LeadEvent {
  id          String   @id @default(cuid())
  leadId      String   @map("lead_id")
  fromStageId String   @map("from_stage_id")
  toStageId   String   @map("to_stage_id")
  notes       String?
  createdById String   @map("created_by_id")
  createdAt   DateTime @default(now()) @map("created_at")

  lead      Lead        @relation(fields: [leadId], references: [id], onDelete: Cascade)
  fromStage FunnelStage @relation("fromStage", fields: [fromStageId], references: [id])
  toStage   FunnelStage @relation("toStage", fields: [toStageId], references: [id])
  createdBy User        @relation("createdBy", fields: [createdById], references: [id])

  @@index([leadId])
  @@map("lead_events")
}

model ContentCalendarEntry {
  id            String          @id @default(cuid())
  title         String
  description   String?
  channelId     String?         @map("channel_id")
  category      ContentCategory
  assigneeId    String?         @map("assignee_id")
  status        ContentStatus   @default(PLANNED)
  scheduledDate DateTime        @db.Date @map("scheduled_date")
  createdAt     DateTime        @default(now()) @map("created_at")
  updatedAt     DateTime        @updatedAt @map("updated_at")

  channel  Channel? @relation(fields: [channelId], references: [id])
  assignee User?    @relation("assignee", fields: [assigneeId], references: [id])

  @@index([scheduledDate])
  @@index([channelId])
  @@map("content_calendar_entries")
}

model Alert {
  id         String    @id @default(cuid())
  type       AlertType
  channelId  String?   @map("channel_id")
  campaignId String?   @map("campaign_id")
  message    String
  data       Json?
  isRead     Boolean   @default(false) @map("is_read")
  createdAt  DateTime  @default(now()) @map("created_at")

  channel  Channel?  @relation("channelAlerts", fields: [channelId], references: [id])
  campaign Campaign? @relation("campaignAlerts", fields: [campaignId], references: [id])

  @@index([isRead])
  @@map("alerts")
}

model Report {
  id            String     @id @default(cuid())
  type          ReportType
  periodStart   DateTime   @db.Date @map("period_start")
  periodEnd     DateTime   @db.Date @map("period_end")
  generatedById String     @map("generated_by_id")
  fileUrl       String?    @map("file_url")
  createdAt     DateTime   @default(now()) @map("created_at")

  generatedBy User @relation("generatedBy", fields: [generatedById], references: [id])

  @@map("reports")
}

model CadenceGoal {
  id        String          @id @default(cuid())
  platform  ChannelPlatform
  postsPerWeek Int          @map("posts_per_week")
  updatedAt DateTime        @updatedAt @map("updated_at")

  @@unique([platform])
  @@map("cadence_goals")
}

model AlertThreshold {
  id             String @id @default(cuid())
  metricName     String @map("metric_name")
  dropPercentage Int    @map("drop_percentage")
  updatedAt      DateTime @updatedAt @map("updated_at")

  @@unique([metricName])
  @@map("alert_thresholds")
}
```

### Seed Data (Funnel Stages)

```typescript
// prisma/seed.ts
const stages = [
  { name: 'Alcance', position: 1, description: 'Impressões e views nas redes sociais', source: 'AUTO' },
  { name: 'Engajamento', position: 2, description: 'Likes, comentários, shares, saves', source: 'AUTO' },
  { name: 'Interesse', position: 3, description: 'Cliques em links, visitas ao perfil, DMs', source: 'AUTO' },
  { name: 'Consideração', position: 4, description: 'Cadastro em webinar ou conteúdo especial', source: 'MANUAL' },
  { name: 'Conversão', position: 5, description: 'Comparecimento à reunião presencial', source: 'MANUAL' },
  { name: 'Retenção', position: 6, description: 'Retorno e fidelização como membro', source: 'MANUAL' },
];
```

---

## 9. Frontend Architecture

### Component Architecture

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group (public)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/              # Protected route group
│   │   ├── layout.tsx            # Sidebar + Header layout
│   │   ├── dashboard/page.tsx    # Main dashboard
│   │   ├── channels/page.tsx     # Channel detail
│   │   ├── calendar/page.tsx     # Content calendar
│   │   ├── funnel/page.tsx       # Funnel visualization
│   │   ├── leads/
│   │   │   ├── page.tsx          # Leads list
│   │   │   └── [id]/page.tsx     # Lead detail
│   │   ├── campaigns/page.tsx    # Campaign list
│   │   ├── reports/page.tsx      # Reports
│   │   ├── alerts/page.tsx       # Alert history
│   │   └── settings/
│   │       ├── page.tsx          # General settings
│   │       ├── channels/page.tsx # Channel connections
│   │       └── alerts/page.tsx   # Alert thresholds
│   ├── api/                      # Route Handlers
│   │   ├── auth/
│   │   ├── channels/
│   │   ├── metrics/
│   │   ├── funnel/
│   │   ├── leads/
│   │   ├── calendar/
│   │   ├── campaigns/
│   │   ├── alerts/
│   │   ├── reports/
│   │   ├── settings/
│   │   └── cron/
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── features/                     # Feature-based modules
│   ├── auth/
│   │   ├── auth.contract.ts
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── repositories/
│   ├── dashboard/
│   │   ├── dashboard.contract.ts
│   │   ├── components/           # KPICard, TrendChart, ChannelComparison
│   │   ├── hooks/                # useDashboardMetrics, useTrends
│   │   └── services/
│   ├── calendar/
│   │   ├── calendar.contract.ts
│   │   ├── components/           # CalendarGrid, WeekView, EntryModal
│   │   ├── hooks/
│   │   └── services/
│   ├── funnel/
│   │   ├── funnel.contract.ts
│   │   ├── components/           # FunnelChart, ConversionRates
│   │   ├── hooks/
│   │   └── services/
│   ├── leads/
│   │   ├── leads.contract.ts
│   │   ├── components/           # LeadTable, LeadForm, LeadTimeline
│   │   ├── hooks/
│   │   └── services/
│   ├── campaigns/
│   │   ├── campaigns.contract.ts
│   │   ├── components/           # CampaignCard, ROIChart
│   │   ├── hooks/
│   │   └── services/
│   └── channels/
│       ├── channels.contract.ts
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── repositories/
├── shared/
│   ├── components/               # Button, Card, Dialog, Sidebar (shadcn/ui)
│   ├── hooks/                    # useAuth, useRole, useToast
│   ├── types/                    # Shared TypeScript types
│   ├── utils/                    # formatDate, formatNumber, cn()
│   └── events/                   # EventBus (if needed)
├── lib/
│   ├── prisma.ts                 # Prisma client singleton
│   ├── auth.ts                   # NextAuth configuration
│   ├── api-client.ts             # Fetch wrapper for client components
│   └── integrations/             # External API clients
│       ├── meta.ts               # Meta Graph + Marketing API
│       ├── tiktok.ts             # TikTok Business API
│       └── linkedin.ts           # LinkedIn Marketing API
└── config/
    └── env.ts                    # Typed env variables
```

### State Management Patterns

```typescript
// Global UI State (Zustand) — sidebar, theme, user preferences
import { create } from 'zustand';

interface UIStore {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  activePeriod: '7d' | '30d' | '90d' | 'custom';
  setActivePeriod: (period: UIStore['activePeriod']) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  activePeriod: '30d',
  setActivePeriod: (period) => set({ activePeriod: period }),
}));
```

```typescript
// Server State (React Query) — API data fetching
import { useQuery } from '@tanstack/react-query';
import { metricsService } from '@/features/dashboard/services/metrics.service';

export function useDashboardMetrics(period: string) {
  return useQuery({
    queryKey: ['dashboard-metrics', period],
    queryFn: () => metricsService.getDashboard(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}
```

### Routing Architecture

```typescript
// Protected route pattern using Server Components (Next.js 16+)
// src/app/(dashboard)/layout.tsx

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/shared/components/Sidebar';
import { Header } from '@/shared/components/Header';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="flex h-screen">
      <Sidebar user={session.user} />
      <div className="flex flex-1 flex-col">
        <Header user={session.user} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

### Frontend Services Layer

```typescript
// src/lib/api-client.ts — Fetch wrapper for client components

class ApiClient {
  private baseUrl = '/api';

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`, window.location.origin);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString());
    if (!res.ok) {
      const error = await res.json();
      throw new ApiError(error.error.code, error.error.message);
    }
    const json = await res.json();
    return json.data;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new ApiError(error.error.code, error.error.message);
    }
    const json = await res.json();
    return json.data;
  }

  // patch, delete similarly...
}

export const apiClient = new ApiClient();
```

---

## 10. Backend Architecture

### Route Handler Organization

```typescript
// src/app/api/metrics/dashboard/route.ts

import { auth } from '@/lib/auth';
import { metricsRepository } from '@/features/dashboard/repositories/metrics.repository';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Não autenticado', timestamp: new Date().toISOString(), requestId: crypto.randomUUID() } },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '30d';

  const metrics = await metricsRepository.getDashboardMetrics(period);
  return NextResponse.json({ data: metrics });
}
```

### Data Access Layer (Repository Pattern)

```typescript
// src/features/dashboard/repositories/metrics.repository.ts

import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';

export class MetricsRepository {
  async getDashboardMetrics(period: string) {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const since = subDays(new Date(), days);

    const metrics = await prisma.metric.groupBy({
      by: ['channelId'],
      where: { date: { gte: since } },
      _sum: {
        impressions: true,
        reach: true,
        engagement: true,
        profileVisits: true,
        linkClicks: true,
      },
      _max: { followersCount: true },
    });

    return metrics;
  }

  async getTrends(channelId: string, period: string) {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const since = subDays(new Date(), days);

    return prisma.metric.findMany({
      where: { channelId, date: { gte: since } },
      orderBy: { date: 'asc' },
    });
  }
}

export const metricsRepository = new MetricsRepository();
```

### Authentication Architecture

```mermaid
sequenceDiagram
    actor User
    participant Login as Login Page
    participant Auth as NextAuth.js
    participant DB as PostgreSQL

    User->>Login: Enter email + password
    Login->>Auth: signIn("credentials", {email, password})
    Auth->>DB: Find user by email
    DB-->>Auth: User record
    Auth->>Auth: bcrypt.compare(password, passwordHash)
    alt Password valid
        Auth->>Auth: Create JWT session
        Auth-->>Login: Session cookie set
        Login->>Login: redirect("/dashboard")
    else Password invalid
        Auth-->>Login: Error: "Credenciais inválidas"
    end
```

```typescript
// src/lib/auth.ts — NextAuth configuration

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role as string;
      session.user.id = token.id as string;
      return session;
    },
  },
});
```

---

## 11. Unified Project Structure

```
flfloripa-performance/
├── .github/
│   └── workflows/
│       └── ci.yaml                    # Lint, typecheck, test on PR
├── prisma/
│   ├── schema.prisma                  # Database schema
│   ├── seed.ts                        # Seed data (funnel stages)
│   └── migrations/                    # Auto-generated migrations
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── (auth)/                    # Public routes (login, register)
│   │   ├── (dashboard)/               # Protected routes (all features)
│   │   ├── api/                       # Route Handlers (REST API)
│   │   ├── layout.tsx                 # Root layout
│   │   └── globals.css
│   ├── features/                      # Feature-based modules
│   │   ├── auth/                      # Authentication
│   │   ├── dashboard/                 # Metrics dashboard
│   │   ├── calendar/                  # Content calendar
│   │   ├── funnel/                    # Conversion funnel
│   │   ├── leads/                     # Lead management
│   │   ├── campaigns/                 # Meta Ads campaigns
│   │   └── channels/                  # Channel connections
│   ├── shared/                        # Shared components, hooks, utils
│   ├── lib/                           # Prisma, auth, API clients, integrations
│   └── config/                        # Environment config
├── test/
│   ├── builders/                      # Test fixture builders
│   ├── mocks/                         # MSW handlers
│   └── e2e/                           # Playwright tests
├── public/                            # Static assets
├── docs/
│   ├── prd.md                         # Product Requirements Document
│   ├── architecture.md                # This document
│   └── stories/                       # Development stories
├── .env.example                       # Environment template
├── .gitignore
├── next.config.ts                     # Next.js configuration
├── tailwind.config.ts                 # Tailwind configuration
├── tsconfig.json                      # TypeScript configuration
├── vitest.config.ts                   # Vitest configuration
├── playwright.config.ts               # Playwright configuration
├── package.json
└── README.md
```

---

## 12. Development Workflow

### Prerequisites

```bash
node --version   # >= 18.0.0
npm --version    # >= 9.0.0
git --version    # >= 2.0.0
```

### Initial Setup

```bash
# Clone and install
git clone <repo-url> flfloripa-performance
cd flfloripa-performance
npm install

# Setup database
cp .env.example .env  # Fill in DATABASE_URL, NEXTAUTH_SECRET, etc.
npx prisma migrate dev
npx prisma db seed

# Start development
npm run dev           # http://localhost:3000
```

### Development Commands

```bash
# Start dev server
npm run dev

# Database
npx prisma migrate dev          # Create/apply migrations
npx prisma studio               # Visual database browser
npx prisma db seed               # Seed data

# Testing
npm run test                     # Vitest (unit + integration)
npm run test:e2e                 # Playwright (E2E)
npm run test:coverage            # Coverage report

# Quality
npm run lint                     # ESLint
npm run lint:fix                 # ESLint auto-fix
npm run typecheck                # TypeScript check
npm run format                   # Prettier

# Build
npm run build                    # Production build
npm run start                    # Start production server
```

### Environment Configuration

```bash
# .env.example

# Database (Supabase)
DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Meta (Instagram + Ads)
META_APP_ID=""
META_APP_SECRET=""

# TikTok
TIKTOK_CLIENT_KEY=""
TIKTOK_CLIENT_SECRET=""

# LinkedIn
LINKEDIN_CLIENT_ID=""
LINKEDIN_CLIENT_SECRET=""

# Vercel Cron (production only)
CRON_SECRET="shared-secret-for-cron-auth"
```

---

## 13. Deployment Architecture

### Deployment Strategy

**Frontend + Backend Deployment:**
- **Platform:** Vercel
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **CDN/Edge:** Vercel Edge Network (automatic, global)

**Database:**
- **Platform:** Supabase (managed PostgreSQL)
- **Connection:** Direct connection via PgBouncer pooler for serverless

**Cron Jobs:**
- **Platform:** Vercel Cron
- **Configuration:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-metrics",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/check-alerts",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| Development | `http://localhost:3000` | Local development |
| Preview | `https://flfloripa-*.vercel.app` | PR previews (auto-deploy) |
| Production | `https://flfloripa-performance.vercel.app` | Live environment |

---

## 14. Security and Performance

### Security Requirements

**Frontend Security:**
- CSP Headers: Strict Content-Security-Policy via `next.config.ts`
- XSS Prevention: React's default escaping + no `dangerouslySetInnerHTML`
- Secure Storage: Session cookies (httpOnly, secure, sameSite)

**Backend Security:**
- Input Validation: Zod schemas on every API route
- Rate Limiting: Vercel built-in rate limiting for API routes
- CORS Policy: Same-origin only (no CORS needed — frontend and API on same domain)

**Authentication Security:**
- Token Storage: JWT in httpOnly cookies (managed by NextAuth)
- Session Management: 24h session expiry, refresh on activity
- Password Policy: Minimum 8 characters, bcrypt with 12 rounds

**LGPD Compliance:**
- Lead data deletion endpoint (`DELETE /api/leads/:id` with hard-delete option for ADMIN)
- Access tokens encrypted at rest in database
- Audit trail via LeadEvent records

### Performance Optimization

**Frontend Performance:**
- Bundle Size Target: < 200KB initial JS (leveraging RSC for zero-JS pages)
- Loading Strategy: React Server Components for data-heavy pages, streaming with Suspense
- Caching Strategy: React Query with 5-minute stale time, ISR for static-like pages

**Backend Performance:**
- Response Time Target: < 500ms for API routes, < 3s for dashboard
- Database Optimization: Composite indexes on (channelId, date), connection pooling via Supabase PgBouncer
- Caching Strategy: Vercel Edge caching for static assets, React Query deduplication

---

## 15. Testing Strategy

### Testing Pyramid

```
          /\
         /E2E\           10% — Login flow, dashboard load, lead registration
        /------\
       /Integration\     20% — Service + Repository, API route handlers
      /------------\
     /  Unit Tests  \    70% — Services, utils, Zod schemas, formatters
    /----------------\
```

### Test Organization

```
test/
├── builders/
│   ├── user.builder.ts
│   ├── channel.builder.ts
│   ├── metric.builder.ts
│   └── lead.builder.ts
├── mocks/
│   ├── handlers/              # MSW handlers per external API
│   │   ├── meta.ts
│   │   ├── tiktok.ts
│   │   └── linkedin.ts
│   └── server.ts              # MSW server setup
└── e2e/
    ├── auth.spec.ts           # Login, register, logout
    ├── dashboard.spec.ts      # Dashboard loads with data
    └── leads.spec.ts          # CRUD leads
```

### Coverage Goals

```
- Business logic (services/utils): 90%+
- Repositories: 80%+
- Components: 60%+
- Overall: 70%+
```

---

## 16. Coding Standards

### Critical Fullstack Rules

- **Feature Isolation:** Features only expose via `.contract.ts` — import from `@/features/[name]` barrel only
- **Server vs Client:** Default to Server Components. Use `'use client'` only for interactive elements (forms, buttons with onClick, charts)
- **API Validation:** Every Route Handler validates input with Zod before processing
- **Error Responses:** All API errors use the standard `ApiError` format with pt-BR messages
- **No `any` Types:** Use `unknown` then narrow with Zod or type guards
- **Environment Variables:** Access only through `@/config/env.ts`, never `process.env` directly in feature code
- **Database Access:** Only through Repository classes, never raw Prisma calls in Route Handlers

### Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | — | `KPICard.tsx` |
| Hooks | `use` + camelCase | — | `useDashboardMetrics.ts` |
| Services | camelCase.service | camelCase.service | `metrics.service.ts` |
| Repositories | — | camelCase.repository | `metrics.repository.ts` |
| Contracts | camelCase.contract | — | `dashboard.contract.ts` |
| API Routes | — | kebab-case folders | `/api/sync-metrics` |
| DB Tables | — | snake_case | `content_calendar_entries` |
| Enums | SCREAMING_SNAKE | SCREAMING_SNAKE | `EDUCATIONAL` |

---

## 17. Error Handling Strategy

### Error Response Format

```typescript
// src/shared/types/api.ts

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
    timestamp: string;
    requestId: string;
  };
}

// Common error codes
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
```

### Backend Error Handler

```typescript
// src/lib/api-error.ts

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 500,
    public details?: Record<string, string[]>
  ) {
    super(message);
  }
}

export function handleApiError(error: unknown) {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, details: error.details, timestamp, requestId } },
      { status: error.status }
    );
  }

  console.error('Unhandled error:', error);
  return NextResponse.json(
    { error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor', timestamp, requestId } },
    { status: 500 }
  );
}
```

---

## 18. Monitoring and Observability

### Monitoring Stack

- **Frontend Monitoring:** Vercel Analytics (Web Vitals, page views) — free tier
- **Backend Monitoring:** Vercel Function logs + dashboard
- **Error Tracking:** Vercel Error tracking (built-in) — consider Sentry for production
- **Performance Monitoring:** Vercel Speed Insights (Core Web Vitals)

### Key Metrics

**Frontend Metrics:**
- Core Web Vitals (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- Dashboard load time (target: < 3s)
- Client-side JavaScript errors

**Backend Metrics:**
- API response times (target: < 500ms p95)
- Cron job success rate (target: > 99%)
- External API call latency and error rate
- Database query performance

---

**Generated by:** @architect (Aria) — Synkra AIOX v5.0.3
**Template Version:** fullstack-architecture-v2
