'use client';

import {
  collection,
  doc,
  type Firestore,
} from 'firebase/firestore';
import { 
    addDocumentNonBlocking, 
    updateDocumentNonBlocking, 
    deleteDocumentNonBlocking 
} from '@/firebase';
import type { Partner } from '@/lib/types';

const PARTNERS_COLLECTION = 'partners';

export function addPartner(db: Firestore, partner: Omit<Partner, 'id'>) {
  const partnersCol = collection(db, PARTNERS_COLLECTION);
  addDocumentNonBlocking(partnersCol, partner);
}

export function updatePartner(db: Firestore, partner: Partner) {
  const { id, ...partnerData } = partner;
  const partnerDocRef = doc(db, PARTNERS_COLLECTION, id);
  updateDocumentNonBlocking(partnerDocRef, partnerData);
}

export function deletePartner(db: Firestore, id: string) {
  const partnerDocRef = doc(db, PARTNERS_COLLECTION, id);
  deleteDocumentNonBlocking(partnerDocRef);
}
