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
