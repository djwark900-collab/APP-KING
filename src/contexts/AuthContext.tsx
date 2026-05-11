import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { userService } from '../services/userService';
import { SHORE_ITEMS } from '../constants';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  pendingScore: number;
  isSyncing: boolean;
  quotaExceeded: boolean;
  addScoreLocal: (amount: number) => void;
  forceSync: () => Promise<void>;
  frames: any[];
  skins: any[];
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null, 
  loading: true,
  pendingScore: 0,
  isSyncing: false,
  quotaExceeded: false,
  addScoreLocal: () => {},
  forceSync: async () => {},
  frames: [],
  skins: []
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [frames, setFrames] = useState<any[]>([]);
  const [skins, setSkins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Scoring Buffer State
  const [pendingScore, setPendingScore] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const pendingScoreRef = React.useRef(0);

  const lastTapRef = React.useRef<number>(0);
  const syncTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const addScoreLocal = (amount: number) => {
    setPendingScore(prev => prev + amount);
    pendingScoreRef.current += amount;
    lastTapRef.current = Date.now();

    // Auto-sync after 1 second of inactivity
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      forceSync();
    }, 1000);
  };

  const forceSync = async () => {
    if (!user || pendingScoreRef.current <= 0 || isSyncing || quotaExceeded) return;
    
    // Clear the inactivity timeout as we are syncing now
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    const amountToSync = pendingScoreRef.current;
    setIsSyncing(true);
    try {
      await userService.addBulkScore(user.uid, amountToSync);
      pendingScoreRef.current -= amountToSync;
      setPendingScore(prev => Math.max(0, prev - amountToSync));
    } catch (e: any) {
      if (e.message === "QUOTA_EXCEEDED") {
        setQuotaExceeded(true);
      }
      console.error("Sync failed:", e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Fetch custom frames from DB
    const unsubFrames = onSnapshot(collection(db, 'frames'), (snap) => {
      const dbFrames = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Merge with static frames, filter out duplicates by id
      const allFrames: any[] = [...SHORE_ITEMS.frames];
      dbFrames.forEach(df => {
        if (!allFrames.find(af => af.id === df.id)) {
          allFrames.push(df);
        }
      });
      setFrames(allFrames);
    }, (err) => {
      console.error("Frames fetch error:", err);
      setFrames(SHORE_ITEMS.frames);
    });

    const unsubSkins = onSnapshot(collection(db, 'skins'), (snap) => {
      const dbSkins = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const allSkins: any[] = [...SHORE_ITEMS.skins];
      dbSkins.forEach(ds => {
        if (!allSkins.find(as => as.id === ds.id)) {
          allSkins.push(ds);
        }
      });
      setSkins(allSkins);
    }, (err) => {
      console.error("Skins fetch error:", err);
      setSkins(SHORE_ITEMS.skins);
    });

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubFrames();
      unsubSkins();
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isCreating = false;
    if (user) {
      const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        if (doc.exists()) {
          setProfile(doc.data());
          setLoading(false);
        } else if (!isCreating) {
          isCreating = true;
          // If profile doesn't exist, create it
          userService.createUserProfile(user.uid, user.email || '', user.displayName || 'Survivor')
            .finally(() => {
              setLoading(false);
            });
        }
      }, (err) => {
        console.error("Profile sync error:", err);
        setLoading(false);
      });
      return unsubscribe;
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Periodic Sync
    const syncInterval = setInterval(() => {
      forceSync();
    }, 30000); // 30s auto-sync to be very conservative with quota

    return () => clearInterval(syncInterval);
  }, [user, isSyncing, quotaExceeded]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      pendingScore, 
      isSyncing, 
      quotaExceeded, 
      addScoreLocal, 
      forceSync,
      frames,
      skins
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
