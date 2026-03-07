

import { collection, doc, getDoc, getDocs, setDoc, writeBatch, type Firestore } from 'firebase/firestore';
import { getDb } from '@/firebase/server';
import type { PlayerProfile, SponsorInfo } from './types';
import { unstable_noStore as noStore } from 'next/cache';

/**
 * Sanitizes player profile to remove non-serializable Firestore objects.
 */
function sanitizeProfile(data: any): PlayerProfile {
    try {
        return {
          id: String(data.id || ''),
          name: String(data.name || ''),
          nickname: String(data.nickname || 'Новичок'),
          avatarUrl: String(data.avatarUrl || ''),
          bio: String(data.bio || ''),
          imageHint: String(data.imageHint || 'person portrait'),
          backgroundUrl: data.backgroundUrl ? String(data.backgroundUrl) : undefined,
          backgroundImageHint: data.backgroundImageHint ? String(data.backgroundImageHint) : undefined,
          sponsors: Array.isArray(data.sponsors) ? data.sponsors.map((s: any) => ({
              name: String(s.name || ''),
              logoUrl: String(s.logoUrl || ''),
              link: s.link ? String(s.link) : undefined,
              templateId: s.templateId as any
          })) : [],
          showSponsorCta: data.showSponsorCta !== false,
          sponsorCtaText: data.sponsorCtaText ? String(data.sponsorCtaText) : undefined,
          sponsorName: data.sponsorName ? String(data.sponsorName) : undefined,
          sponsorLogoUrl: data.sponsorLogoUrl ? String(data.sponsorLogoUrl) : undefined,
          sponsorLink: data.sponsorLink ? String(data.sponsorLink) : undefined,
          sponsorTemplateId: data.sponsorTemplateId as any,
        };
    } catch (e) {
        console.error('Error sanitizing player profile:', e);
        return {
            id: String(data.id || 'unknown'),
            name: 'Error Loading',
            nickname: 'Error',
            avatarUrl: '',
            bio: '',
            imageHint: 'person portrait'
        };
    }
}

export async function getPlayerProfiles(): Promise<PlayerProfile[]> {
  noStore();
  const db = getDb();
  if (!db) {
    return [];
  }
  try {
    const playersCol = collection(db, 'players');
    const playerSnapshot = await getDocs(playersCol);
    // Removed the filter for 'deleted' flag, as we are now using hard deletes.
    return playerSnapshot.docs
        .map(doc => sanitizeProfile({ ...doc.data(), id: doc.id }));
  } catch (e) {
    console.error('Failed to fetch player profiles:', e);
    return [];
  }
}

export async function getPlayerProfileById(id: string): Promise<PlayerProfile | undefined> {
  noStore();
  const db = getDb();
  if (!db) {
    return undefined;
  }
  try {
    const playerDocRef = doc(db, 'players', id);
    const playerSnap = await getDoc(playerDocRef);
    
    if (playerSnap.exists()) {
      // Removed the check for 'deleted' flag. If doc exists, we return it.
      return sanitizeProfile({ ...playerSnap.data(), id: playerSnap.id });
    }
  } catch (e) {
    console.error(`Failed to fetch player profile ${id}:`, e);
  }
  return undefined;
}

export async function updatePlayerProfiles(players: PlayerProfile[]): Promise<void> {
  const db = getDb();
  if (!db) {
    throw new Error(`Ошибка Firestore: не удалось подключиться к базе данных.`);
  }
  try {
    const batch = writeBatch(db);
    players.forEach(player => {
      const playerDocRef = doc(db, 'players', player.id);
      batch.set(playerDocRef, player, { merge: true });
    });
    await batch.commit();
  } catch (e) {
    console.error('Failed to update player profiles:', e);
    throw new Error(`Ошибка Firestore при обновлении профилей игроков: ${e instanceof Error ? e.message : e}`);
  }
}

export async function clearAllPlayerProfiles(): Promise<void> {
  const db = getDb();
  if (!db) {
    throw new Error("Database not available. Cannot clear player profiles.");
  }
  try {
    const playersCol = collection(db, 'players');
    const snapshot = await getDocs(playersCol);
    if (snapshot.empty) return;
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
  } catch (e) {
    console.error('Failed to clear player profiles:', e);
    throw e;
  }
}

    

    
