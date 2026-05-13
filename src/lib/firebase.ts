import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

export function isQuotaExceeded() {
  if (typeof window === 'undefined') return false;
  const lastError = localStorage.getItem('quota_error_time');
  if (!lastError) return false;
  const lastErrorTime = parseInt(lastError);
  
  const lastErrorDate = new Date(lastErrorTime);
  const now = new Date();
  
  // Reset if more than 2 hours passed OR if a new UTC day started
  const h2passed = (now.getTime() - lastErrorTime > 2 * 60 * 60 * 1000);
  const newDayStarted = now.getUTCDate() !== lastErrorDate.getUTCDate();
  
  if (h2passed || newDayStarted) {
    localStorage.removeItem('quota_error_time');
    return false;
  }
  return true;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const err = error as any;
  const isQuota = err?.message?.toLowerCase().includes("quota") || 
                  err?.code === "resource-exhausted" || 
                  err?.message?.includes("Quota exceeded");
  
  const isUnavailable = err?.code === "unavailable" || err?.message?.includes("offline");

  if ((isQuota || isUnavailable) && typeof window !== 'undefined') {
    localStorage.setItem('quota_error_time', Date.now().toString());
  }
  
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  
  if (isQuota || isUnavailable) {
    console.warn(`Firestore ${isUnavailable ? 'Connection' : 'Quota'} issue. Service will be limited until reset.`);
  } else {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  }
  
  throw new Error(JSON.stringify(errInfo));
}

// Validation connection to Firestore on boot
async function validateConnection() {
  if (typeof window === 'undefined') return;
  try {
    // Attempt a low-cost read from a non-existent doc to check connectivity
    await getDocFromServer(doc(db, '_internal_', 'health'));
  } catch (error: any) {
    if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
      console.warn("Firestore connection unavailable at boot.");
      localStorage.setItem('quota_error_time', Date.now().toString());
    }
  }
}

validateConnection();
