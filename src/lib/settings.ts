import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from '@/firebase/server';
import type { ScoringSettings, AllLeagueSettings, LeagueId, SponsorshipSettings, ThemeSettings } from './types';
import { unstable_noStore as noStore } from 'next/cache';
import defaultScoringSettingsData from './scoring-settings.json';

export const defaultAllLeagueSettings: AllLeagueSettings = {
    general: { enabled: true, name: 'Общий рейтинг' },
    premier: { enabled: false, name: 'Премьер-лига' },
    first: { enabled: false, name: 'Первая лига' },
    cricket: { enabled: false, name: 'Крикет' },
    senior: { enabled: false, name: 'Сеньоры' },
    youth: { enabled: false, name: 'Юниоры' },
    women: { enabled: false, name: 'Женская лига' },
    evening_omsk: { enabled: false, name: 'Вечерний Омск' },
};

export const DEFAULT_THEME: ThemeSettings = {
  background: '230 15% 5%',
  foreground: '210 20% 98%',
  primary: '15 85% 55%',
  accent: '35 95% 50%',
  gold: '45 93% 48%',
  silver: '220 13% 75%',
  bronze: '28 65% 55%',
};

function sanitizeScoring(id: string, data: any): ScoringSettings {
    const defaults = (defaultScoringSettingsData as any)[id] || (defaultScoringSettingsData as any).general;
    const d = data || {};
    
    return {
        id: id as LeagueId,
        pointsFor1st: Number(d.pointsFor1st ?? defaults.pointsFor1st),
        pointsFor2nd: Number(d.pointsFor2nd ?? defaults.pointsFor2nd),
        pointsFor3rd_4th: Number(d.pointsFor3rd_4th ?? defaults.pointsFor3rd_4th),
        pointsFor5th_8th: Number(d.pointsFor5th_8th ?? defaults.pointsFor5th_8th),
        pointsFor9th_16th: Number(d.pointsFor9th_16th ?? defaults.pointsFor9th_16th),
        participationPoints: Number(d.participationPoints ?? defaults.participationPoints),
        enable180Bonus: Boolean(d.enable180Bonus ?? defaults.enable180Bonus),
        bonusPer180: Number(d.bonusPer180 ?? defaults.bonusPer180),
        enableHiOutBonus: Boolean(d.enableHiOutBonus ?? defaults.enableHiOutBonus),
        hiOutThreshold: Number(d.hiOutThreshold ?? defaults.hiOutThreshold),
        hiOutBonus: Number(d.hiOutBonus ?? defaults.hiOutBonus),
        enableAvgBonus: Boolean(d.enableAvgBonus ?? defaults.enableAvgBonus),
        avgThreshold: Number(d.avgThreshold ?? defaults.avgThreshold),
        avgBonus: Number(d.avgBonus ?? defaults.avgBonus),
        enableShortLegBonus: Boolean(d.enableShortLegBonus ?? defaults.enableShortLegBonus),
        shortLegThreshold: Number(d.shortLegThreshold ?? defaults.shortLegThreshold),
        shortLegBonus: Number(d.shortLegBonus ?? defaults.shortLegBonus),
        enable9DarterBonus: Boolean(d.enable9DarterBonus ?? defaults.enable9DarterBonus),
        bonusFor9Darter: Number(d.bonusFor9Darter ?? defaults.bonusFor9Darter),
        includeInGeneral: Boolean(d.includeInGeneral ?? defaults.includeInGeneral),
        pointValue: Number(d.pointValue ?? defaults.pointValue),
    };
}

export async function getAllScoringSettings(): Promise<Record<LeagueId, ScoringSettings>> {
  noStore();
  const db = getDb();
  if (!db) {
      return defaultScoringSettingsData as any;
  }
  try {
    const settingsCol = collection(db, 'scoring_configurations');
    const snapshot = await getDocs(settingsCol);
    
    const allDefaults: Record<LeagueId, ScoringSettings> = defaultScoringSettingsData as any;
    const fromDb: Partial<Record<LeagueId, ScoringSettings>> = {};
    
    if (!snapshot.empty) {
      snapshot.docs.forEach(doc => {
          fromDb[doc.id as LeagueId] = sanitizeScoring(doc.id, doc.data());
      });
    }

    return {
      general: fromDb.general || sanitizeScoring('general', allDefaults.general),
      premier: fromDb.premier || sanitizeScoring('premier', allDefaults.premier),
      first: fromDb.first || sanitizeScoring('first', allDefaults.first),
      cricket: fromDb.cricket || sanitizeScoring('cricket', allDefaults.cricket),
      senior: fromDb.senior || sanitizeScoring('senior', allDefaults.senior),
      youth: fromDb.youth || sanitizeScoring('youth', allDefaults.youth),
      women: fromDb.women || sanitizeScoring('women', allDefaults.women),
      evening_omsk: fromDb.evening_omsk || sanitizeScoring('evening_omsk', allDefaults.evening_omsk),
    };
  } catch (e) {
    console.error('Error fetching scoring settings, using defaults:', e);
    return defaultScoringSettingsData as any;
  }
}

export async function getScoringSettings(leagueId: LeagueId): Promise<ScoringSettings> {
  noStore();
  const db = getDb();
  if (!db) {
    const defaults = (defaultScoringSettingsData as any)[leagueId] || (defaultScoringSettingsData as any).general;
    return sanitizeScoring(leagueId, defaults);
  }
  try {
    const docRef = doc(db, 'scoring_configurations', leagueId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return sanitizeScoring(leagueId, docSnap.data());
    }
  } catch (e) {
    console.error(`Error fetching scoring for ${leagueId}:`, e);
  }
  
  const defaults = (defaultScoringSettingsData as any)[leagueId] || (defaultScoringSettingsData as any).general;
  return sanitizeScoring(leagueId, defaults);
}

export async function updateScoringSettings(leagueId: LeagueId, settings: ScoringSettings): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Database not available.");
  const docRef = doc(db, 'scoring_configurations', leagueId);
  const { id, ...dataToSet } = settings as any;
  await setDoc(docRef, dataToSet);
}

export async function getLeagueSettings(): Promise<AllLeagueSettings> {
    noStore();
    const db = getDb();
    if (!db) {
        return defaultAllLeagueSettings;
    }
    try {
        const docRef = doc(db, 'app_settings', 'leagues');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const sanitized: any = {};
            Object.keys(defaultAllLeagueSettings).forEach(key => {
                if (data[key]) {
                    sanitized[key] = {
                        enabled: Boolean(data[key].enabled),
                        name: String(data[key].name || '')
                    };
                } else {
                    sanitized[key] = (defaultAllLeagueSettings as any)[key];
                }
            });
            return sanitized as AllLeagueSettings;
        }
    } catch (e) {
        console.error('Error fetching league settings:', e);
    }
    return defaultAllLeagueSettings;
}

export async function updateLeagueSettings(settings: AllLeagueSettings): Promise<void> {
    const db = getDb();
    if (!db) throw new Error("Database not available.");
    const docRef = doc(db, 'app_settings', 'leagues');
    await setDoc(docRef, settings);
}

export async function getBackgroundUrl(): Promise<string> {
    noStore();
    const db = getDb();
    if (!db) {
        return '';
    }
    try {
        const docRef = doc(db, 'app_settings', 'background');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Return only string URL to ensure serializability
            return String(data.url || '');
        }
    } catch (e) {
        console.error('Error fetching background URL:', e);
    }
    return '';
}

export async function updateBackgroundUrl(url: string): Promise<void> {
    const db = getDb();
    if (!db) throw new Error("Database not available.");
    const docRef = doc(db, 'app_settings', 'background');
    await setDoc(docRef, { url, updatedAt: serverTimestamp() });
}

export async function getThemeSettings(): Promise<ThemeSettings> {
    noStore();
    const db = getDb();
    if (!db) {
        return DEFAULT_THEME;
    }
    try {
        const docRef = doc(db, 'app_settings', 'theme');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Map explicitly to strings to remove non-serializable Firestore Timestamps
            return {
                primary: String(data.primary || DEFAULT_THEME.primary),
                accent: String(data.accent || DEFAULT_THEME.accent),
                background: String(data.background || DEFAULT_THEME.background),
                foreground: String(data.foreground || DEFAULT_THEME.foreground),
                gold: String(data.gold || DEFAULT_THEME.gold),
                silver: String(data.silver || DEFAULT_THEME.silver),
                bronze: String(data.bronze || DEFAULT_THEME.bronze),
            } as ThemeSettings;
        }
    } catch (e) {
        console.error('Error fetching theme settings:', e);
    }
    return DEFAULT_THEME;
}

export async function updateThemeSettings(theme: ThemeSettings | null): Promise<void> {
    const db = getDb();
    if (!db) throw new Error("Database not available.");
    const docRef = doc(db, 'app_settings', 'theme');
    if (!theme) {
        await setDoc(docRef, { ...DEFAULT_THEME, updatedAt: serverTimestamp() });
    } else {
        const cleanTheme = {
            primary: String(theme.primary),
            accent: String(theme.accent),
            background: String(theme.background),
            foreground: String(theme.foreground),
            gold: String(theme.gold),
            silver: String(theme.silver),
            bronze: String(theme.bronze),
        };
        await setDoc(docRef, { ...cleanTheme, updatedAt: serverTimestamp() });
    }
}

export async function getSponsorshipSettings(): Promise<SponsorshipSettings> {
    noStore();
    const defaultVk = 'https://vk.com/dartbrig';
    const defaultTg = 'https://t.me/+guTrCGUrh4gxNGZi';

    const db = getDb();
    if (!db) {
        return {
            adminTelegramLink: defaultTg,
            groupTelegramLink: defaultTg,
            adminVkLink: defaultVk,
            groupVkLink: defaultVk,
            showGlobalSponsorCta: true
        };
    }

    try {
        const docRef = doc(db, 'app_settings', 'sponsorship');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                adminTelegramLink: String(data.adminTelegramLink || defaultTg),
                groupTelegramLink: String(data.groupTelegramLink || defaultTg),
                adminVkLink: String(data.adminVkLink || defaultVk),
                groupVkLink: String(data.groupVkLink || defaultVk),
                showGlobalSponsorCta: data.showGlobalSponsorCta !== false
            };
        }
    } catch (e) {
        console.error('Error fetching sponsorship settings:', e);
    }

    return {
        adminTelegramLink: defaultTg,
        groupTelegramLink: defaultTg,
        adminVkLink: defaultVk,
        groupVkLink: defaultVk,
        showGlobalSponsorCta: true
    };
}

export async function updateSponsorshipSettings(settings: SponsorshipSettings): Promise<void> {
    const db = getDb();
    if (!db) throw new Error("Database not available.");
    const docRef = doc(db, 'app_settings', 'sponsorship');
    await setDoc(docRef, settings);
}
