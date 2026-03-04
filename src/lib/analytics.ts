import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { getDb } from '@/firebase/server';
import { unstable_noStore as noStore } from 'next/cache';

export type VisitStats = {
  day: number;
  week: number;
  year: number;
  total: number;
  sponsorClicks: {
      playerId: string;
      playerName: string;
      sponsorName: string;
      clicks: number;
  }[];
};

export async function getVisitStats(): Promise<VisitStats> {
  noStore();
  const db = getDb();
  if (!db) {
    return { day: 0, week: 0, year: 0, total: 0, sponsorClicks: [] };
  }

  const visitsCol = collection(db, 'visits');
  const clicksCol = collection(db, 'sponsor_clicks');

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const dayQuery = query(visitsCol, where('timestamp', '>=', oneDayAgo));
  const weekQuery = query(visitsCol, where('timestamp', '>=', oneWeekAgo));
  const yearQuery = query(visitsCol, where('timestamp', '>=', oneYearAgo));

  try {
    const [daySnapshot, weekSnapshot, yearSnapshot, totalSnapshot, clicksSnapshot] = await Promise.all([
      getDocs(dayQuery),
      getDocs(weekQuery),
      getDocs(yearQuery),
      getDocs(visitsCol),
      getDocs(clicksCol),
    ]);

    // Aggregate sponsor clicks
    const clickMap = new Map<string, { playerId: string, playerName: string, sponsorName: string, clicks: number }>();
    clicksSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const key = `${data.playerId}-${data.sponsorName}`;
        if (!clickMap.has(key)) {
            clickMap.set(key, { 
                playerId: data.playerId, 
                playerName: data.playerName, 
                sponsorName: data.sponsorName, 
                clicks: 0 
            });
        }
        clickMap.get(key)!.clicks += 1;
    });

    const sponsorStats = Array.from(clickMap.values()).sort((a,b) => b.clicks - a.clicks);

    return {
      day: daySnapshot.size,
      week: weekSnapshot.size,
      year: yearSnapshot.size,
      total: totalSnapshot.size,
      sponsorClicks: sponsorStats,
    };
  } catch (error) {
    console.error('Error fetching visit stats:', error);
    return { day: 0, week: 0, year: 0, total: 0, sponsorClicks: [] };
  }
}
