
import type { Timestamp } from 'firebase/firestore';

export type LeagueId = 'general' | 'premier' | 'first' | 'cricket' | 'senior' | 'youth' | 'women' | 'evening_omsk';

export type League = {
  id: LeagueId;
  name: string;
  enabled: boolean;
};

export type AllLeagueSettings = Record<LeagueId, Omit<League, 'id'>>;

export type ThemeSettings = {
  primary: string;
  accent: string;
  background: string;
  foreground: string;
  gold: string;
  silver: string;
  bronze: string;
  updatedAt?: any;
};

export type SponsorInfo = {
  name: string;
  logoUrl: string;
  link?: string;
  templateId?: 'default' | 'neon' | 'premium' | 'minimal' | 'banner';
};

export type PlayerProfile = {
  id: string;
  name: string;
  nickname: string;
  avatarUrl: string;
  bio: string;
  imageHint: string;
  backgroundUrl?: string;
  backgroundImageHint?: string;
  
  // Legacy single sponsor fields (for compatibility)
  sponsorName?: string;
  sponsorLogoUrl?: string;
  sponsorLink?: string;
  sponsorTemplateId?: 'default' | 'neon' | 'premium' | 'minimal' | 'banner';
  
  // Multi-sponsor support (Up to 3)
  sponsors?: SponsorInfo[];
  
  // Recruitment fields
  showSponsorCta?: boolean;
  sponsorCtaText?: string;
};

export type Player = PlayerProfile & {
  rank: number;
  points: number;
  basePoints: number;
  bonusPoints: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  avg: number;
  n180s: number;
  hiOut: number;
  bestLeg: number;
  
  // Aggregate bonus info
  totalPointsFor180s: number;
  totalPointsForHiOut: number;
  totalPointsForAvg: number;
  totalPointsForBestLeg: number;
  totalPointsFor9Darter: number;

  // Optional: Detailed bonus info for single-tournament view
  pointsFor180s?: number;
  is180BonusApplied?: boolean;
  pointsForHiOut?: number;
  isHiOutBonusApplied?: boolean;
  pointsForAvg?: number;
  isAvgBonusApplied?: boolean;
  pointsForBestLeg?: number;
  isBestLegBonusApplied?: boolean;
  pointsFor9Darter?: number;
  is9DarterBonusApplied?: boolean;
};


export type TournamentPlayerResult = {
  id: string;
  name: string;
  nickname: string;
  rank: number;
  points: number;
  basePoints: number;
  bonusPoints: number;
  
  // Detailed bonus info
  pointsFor180s: number;
  is180BonusApplied: boolean;
  pointsForHiOut: number;
  isHiOutBonusApplied: boolean;
  pointsForAvg: number;
  isAvgBonusApplied: boolean;
  pointsForBestLeg: number;
  isBestLegBonusApplied: boolean;
  pointsFor9Darter: number;
  is9DarterBonusApplied: boolean;

  avatarUrl: string;
  imageHint: string;
  avg: number;
  n180s: number;
  hiOut: number;
  bestLeg: number;
  nineDarters?: number;
};

export type Tournament = {
  id: string;
  name: string;
  date: Timestamp | string; // Legacy field (maps to eventDate)
  eventDate: Timestamp | string; // Actual date of the tournament
  parsedAt: Timestamp | string; // Date when data was scraped
  league: LeagueId;
  players: TournamentPlayerResult[];
};

export type ScoringSettings = {
  id?: LeagueId;
  pointsFor1st: number;
  pointsFor2nd: number;
  pointsFor3rd_4th: number;
  pointsFor5th_8th: number;
  pointsFor9th_16th: number;
  participationPoints: number;

  enable180Bonus: boolean;
  bonusPer180: number;

  enableHiOutBonus: boolean;
  hiOutThreshold: number;
  hiOutBonus: number;
  
  enableAvgBonus: boolean;
  avgThreshold: number;
  avgBonus: number;

  enableShortLegBonus: boolean;
  shortLegThreshold: number;
  shortLegBonus: number;

  enable9DarterBonus: boolean;
  bonusFor9Darter: number;

  includeInGeneral: boolean;
  pointValue: number;
};


export type PlayerTournamentHistory = {
  playerId: string;
  tournamentId: string;
  tournamentName: string;
  tournamentDate: Timestamp | string;
  playerRank: number;
  playerPoints: number;
  leagueName: string;
  // Stats added for badge validation
  hiOut?: number;
  n180s?: number;
  bestLeg?: number;
};

export type PartnerCategory = 'shop' | 'platform' | 'media' | 'other';

export type Partner = {
  id: string;
  name: string;
  logoUrl: string;
  category: PartnerCategory;
  linkUrl?: string;
  promoCode?: string;
};

export type SponsorshipSettings = {
    adminTelegramLink: string;
    groupTelegramLink: string;
    adminVkLink: string;
    groupVkLink: string;
    showGlobalSponsorCta: boolean;
};

export type SponsorClickStat = {
    playerId: string;
    playerName: string;
    sponsorName: string;
    timestamp: any;
};
