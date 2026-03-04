import { collection, getDocs } from 'firebase/firestore';
import { getDb } from '@/firebase/server';
import type { Partner } from './types';
import { unstable_noStore as noStore } from 'next/cache';

export async function getPartners(): Promise<Partner[]> {
  noStore();
  const db = getDb();
  if (!db) {
    return [];
  }
  try {
    const partnersCol = collection(db, 'partners');
    const snapshot = await getDocs(partnersCol);
    
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            id: doc.id, 
            name: String(data.name || ''),
            logoUrl: String(data.logoUrl || ''),
            category: String(data.category || 'other') as any,
            linkUrl: data.linkUrl ? String(data.linkUrl) : undefined,
            promoCode: data.promoCode ? String(data.promoCode) : undefined,
        } as Partner;
    });
  } catch (e) {
    console.error('Failed to fetch partners:', e);
    return [];
  }
}
