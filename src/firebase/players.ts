'use client';

import { doc, type Firestore } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { PlayerProfile } from '@/lib/types';

const PLAYERS_COLLECTION = 'players';

export function updatePlayerProfile(db: Firestore, player: PlayerProfile) {
  const { id, ...playerData } = player;
  const playerDocRef = doc(db, PLAYERS_COLLECTION, id);
  // We only update, never create a player profile from the player card UI
  updateDocumentNonBlocking(playerDocRef, playerData);
}
