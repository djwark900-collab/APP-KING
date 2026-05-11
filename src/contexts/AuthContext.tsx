import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot, collection, getDocs, getDoc } from 'firebase/firestore';
import { userService } from '../services/userService';
import { SHORE_ITEMS, ROYAL_PASS_REWARDS, calculateLevel, calculateRoyalPass } from '../constants';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  pendingScore: number;
  isSyncing: boolean;
  addScoreLocal: (amount: number) => void;
  forceSync: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  frames: any[];
  skins: any[];
  rpRewards: any[];
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null, 
  loading: true,
  pendingScore: 0,
  isSyncing: false,
  addScoreLocal: () => {},
  forceSync: async () => {},
  refreshProfile: async () => {},
  frames: [],
  skins: [],
  rpRewards: []
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [frames, setFrames] = useState<any[]>([]);
  const [skins, setSkins] = useState<any[]>([]);
  const [rpRewards, setRpRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Scoring Buffer State
  const [pendingScore, setPendingScore] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
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
    if (!user || !profile || pendingScoreRef.current <= 0 || isSyncing) return;
    
    // Clear the inactivity timeout as we are syncing now
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    const amountToSync = pendingScoreRef.current;
    
    // Optimistic profile update (local)
    const oldProfile = profile;
    const newScore = (oldProfile.score || 0) + amountToSync;
    const rp = calculateRoyalPass(newScore);
    setProfile({
      ...oldProfile,
      score: newScore,
      level: calculateLevel(newScore),
      rpLevel: rp.level
    });

    setIsSyncing(true);
    try {
      await userService.addBulkScore(user.uid, oldProfile?.score || 0, amountToSync);
      pendingScoreRef.current -= amountToSync;
      setPendingScore(prev => Math.max(0, prev - amountToSync));
    } catch (e: any) {
      console.warn("Sync failed:", e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Fetch static items once on mount instead of using real-time listeners
    const fetchAssets = async () => {
      try {
        const [framesSnap, skinsSnap, rpSnap] = await Promise.all([
          getDocs(collection(db, 'frames')),
          getDocs(collection(db, 'skins')),
          getDocs(collection(db, 'rp_rewards'))
        ]);

        const dbFrames = framesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const allFrames: any[] = [...SHORE_ITEMS.frames];
        dbFrames.forEach(df => {
          if (!allFrames.find(af => af.id === df.id)) allFrames.push(df);
        });
        setFrames(allFrames);

        const dbSkins = skinsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const allSkins: any[] = [...SHORE_ITEMS.skins];
        dbSkins.forEach(ds => {
          if (!allSkins.find(as => as.id === ds.id)) allSkins.push(ds);
        });
        setSkins(allSkins);

        if (!rpSnap.empty) {
          setRpRewards(rpSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } else {
          setRpRewards(ROYAL_PASS_REWARDS);
        }
      } catch (err) {
        console.warn("Assets fetch failed (quota?), using defaults:", err);
        setFrames(SHORE_ITEMS.frames);
        setSkins(SHORE_ITEMS.skins);
        setRpRewards(ROYAL_PASS_REWARDS);
      }
    };

    fetchAssets();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return unsubscribe;
  }, []);

  const isCreatingRef = React.useRef(false);
  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            setProfile(snap.data());
          } else if (!isCreatingRef.current) {
            isCreatingRef.current = true;
            try {
              await userService.createUserProfile(user.uid, user.email || '', user.displayName || 'Survivor');
              const newSnap = await getDoc(doc(db, 'users', user.uid));
              if (newSnap.exists()) {
                setProfile(newSnap.data());
              }
            } catch (createErr) {
              console.error("Profile creation failed:", createErr);
              isCreatingRef.current = false; // Allow retry on next mount/trigger
            }
          }
        } catch (err: any) {
          console.warn("Profile fetch failed:", err);
          if (err.message?.includes("quota")) {
             // Handle quota exceeded?
          }
        } finally {
          setLoading(false);
        }
      };
      
      fetchProfile();
    } else {
      setLoading(false);
      setProfile(null);
    }
  }, [user]);

    // Periodic Sync & Visibility Change Sync
    useEffect(() => {
      if (!user) return;

      const syncInterval = setInterval(() => {
        forceSync();
      }, 30000); // 30s auto-sync

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          forceSync();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', forceSync);

      return () => {
        clearInterval(syncInterval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', forceSync);
      };
    }, [user, isSyncing]);

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        setProfile(snap.data());
      }
    } catch (err) {
      console.warn("Manual profile refresh failed:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      pendingScore, 
      isSyncing, 
      addScoreLocal, 
      forceSync,
      refreshProfile,
      frames,
      skins,
      rpRewards
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
