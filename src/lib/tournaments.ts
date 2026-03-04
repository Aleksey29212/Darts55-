
import { collection, doc, getDocs, deleteDoc, writeBatch, Timestamp, getDoc } from 'firebase/firestore';
import { getDb } from '@/firebase/server';
import type { Tournament, TournamentPlayerResult } from './types';
import { unstable_noStore as noStore } from 'next/cache';

/**
 * Очищает данные игрока от несериализуемых объектов Firestore (Timestamp и т.д.)
 */
function sanitizePlayer(p: any): TournamentPlayerResult {
    return {
        id: String(p.id || ''),
        name: String(p.name || ''),
        nickname: String(p.nickname || 'Новичок'),
        rank: Number(p.rank || 0),
        points: Number(p.points || 0),
        basePoints: Number(p.basePoints || 0),
        bonusPoints: Number(p.bonusPoints || 0),
        pointsFor180s: Number(p.pointsFor180s || 0),
        is180BonusApplied: Boolean(p.is180BonusApplied),
        pointsForHiOut: Number(p.pointsForHiOut || 0),
        isHiOutBonusApplied: Boolean(p.isHiOutBonusApplied),
        pointsForAvg: Number(p.pointsForAvg || 0),
        isAvgBonusApplied: Boolean(p.isAvgBonusApplied),
        pointsForBestLeg: Number(p.pointsForBestLeg || 0),
        isBestLegBonusApplied: Boolean(p.isBestLegBonusApplied),
        pointsFor9Darter: Number(p.pointsFor9Darter || 0),
        is9DarterBonusApplied: Boolean(p.is9DarterBonusApplied),
        avatarUrl: String(p.avatarUrl || ''),
        imageHint: String(p.imageHint || 'person portrait'),
        avg: Number(p.avg || 0),
        n180s: Number(p.n180s || 0),
        hiOut: Number(p.hiOut || 0),
        bestLeg: Number(p.bestLeg || 0),
        nineDarters: Number(p.nineDarters || 0),
    };
}

// Helper to safely convert various date formats to a JS Date object
function valueToDate(value: any): Date {
    if (value instanceof Timestamp) {
        return value.toDate();
    }
    if (value instanceof Date) {
        return value;
    }
    // Handle Firestore-like object that might not be a Timestamp instance
    if (typeof value === 'object' && value !== null && 'seconds' in value && 'nanoseconds' in value) {
        return new Timestamp(value.seconds, value.nanoseconds).toDate();
    }
    // Handle string or number
    if (typeof value === 'string' || typeof value === 'number') {
        const d = new Date(value);
        if (!isNaN(d.getTime())) {
            return d;
        }
    }
    // Fallback for invalid or unexpected types
    return new Date();
}

export async function getTournaments(): Promise<Tournament[]> {
  noStore();
  const db = getDb();
  if (!db) {
    return [];
  }
  try {
    const tournamentsCol = collection(db, 'tournaments');
    const tournamentSnapshot = await getDocs(tournamentsCol);
    
    return tournamentSnapshot.docs.map(doc => {
      const data = doc.data();
      const eventDate = valueToDate(data.eventDate || data.date);
      const parsedAt = valueToDate(data.parsedAt);

      return { 
          id: doc.id, 
          name: String(data.name || ''),
          league: String(data.league || 'general') as any,
          date: eventDate.toISOString(),
          eventDate: eventDate.toISOString(),
          parsedAt: parsedAt.toISOString(),
          players: Array.isArray(data.players) ? data.players.map((p: any) => sanitizePlayer(p)) : [],
      } as Tournament;
    });
  } catch (e) {
    console.error('Failed to fetch tournaments:', e);
    return [];
  }
}

export async function addTournaments(newTournaments: Omit<Tournament, 'id'>[]): Promise<string[]> {
    if (!newTournaments || newTournaments.length === 0) return [];
    
    const db = getDb();
    if (!db) {
      throw new Error("Database not available. Cannot add tournaments.");
    }

    try {
        const batch = writeBatch(db);
        const actuallyAddedIds: string[] = [];

        for (const newT of newTournaments) {
            const docId = (newT as Tournament).id;
            const docRef = doc(db, 'tournaments', docId);

            const eventDateValue = newT.eventDate || newT.date || new Date();
            const parsedAtValue = newT.parsedAt || new Date();

            const dataToSet = { 
                ...newT, 
                eventDate: Timestamp.fromDate(valueToDate(eventDateValue)),
                parsedAt: Timestamp.fromDate(valueToDate(parsedAtValue)),
                date: Timestamp.fromDate(valueToDate(eventDateValue))
            };
            
            delete (dataToSet as any).id;
            batch.set(docRef, dataToSet);
            actuallyAddedIds.push(docId);
        }
        
        await batch.commit();
        return actuallyAddedIds;
    } catch (e) {
        console.error('Failed to add tournaments:', e);
        throw e;
    }
}

export async function getTournamentById(id: string): Promise<Tournament | undefined> {
    noStore();
    const db = getDb();
    if (!db) {
        return undefined;
    }
    try {
        const tournamentDocRef = doc(db, 'tournaments', id);
        const docSnap = await getDoc(tournamentDocRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const eventDate = valueToDate(data.eventDate || data.date);
            const parsedAt = valueToDate(data.parsedAt);

            return { 
                id: docSnap.id, 
                name: String(data.name || ''),
                league: String(data.league || 'general') as any,
                date: eventDate.toISOString(),
                eventDate: eventDate.toISOString(),
                parsedAt: parsedAt.toISOString(),
                players: Array.isArray(data.players) ? data.players.map((p: any) => sanitizePlayer(p)) : [],
            } as Tournament;
        }
    } catch (e) {
        console.error(`Failed to fetch tournament ${id}:`, e);
    }
    return undefined;
}

export async function deleteTournamentById(id: string): Promise<void> {
    const db = getDb();
    if (!db) {
        throw new Error("Database not available. Cannot delete tournament.");
    }
    try {
        const tournamentDocRef = doc(db, 'tournaments', id);
        await deleteDoc(tournamentDocRef);
    } catch (e) {
        console.error(`Failed to delete tournament ${id}:`, e);
        throw e;
    }
}

export async function clearAllTournamentData(): Promise<void> {
    const db = getDb();
    if (!db) {
        throw new Error("Database not available. Cannot clear tournaments.");
    }
    try {
        const tournamentsCol = collection(db, 'tournaments');
        const snapshot = await getDocs(tournamentsCol);
        if (snapshot.empty) return;
        
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    } catch (e) {
        console.error('Failed to clear all tournaments:', e);
        throw e;
    }
}
