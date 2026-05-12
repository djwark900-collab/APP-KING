import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot, collection, getDocs, getDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { userService } from '../services/userService';
import { roomService } from '../services/roomService';
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
  topSurvivors: any[];
  rooms: any[];
  quotaExceeded: boolean;
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
  rpRewards: [],
  topSurvivors: [],
  rooms: [],
  quotaExceeded: false
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(() => {
    const cached = localStorage.getItem('cache_profile');
    return cached ? JSON.parse(cached) : null;
  });
  const [frames, setFrames] = useState<any[]>(() => {
    const cached = localStorage.getItem('cache_frames');
    return cached ? JSON.parse(cached) : [];
  });
  const [skins, setSkins] = useState<any[]>(() => {
    const cached = localStorage.getItem('cache_skins');
    return cached ? JSON.parse(cached) : [];
  });
  const [rpRewards, setRpRewards] = useState<any[]>(() => {
    const cached = localStorage.getItem('cache_rpRewards');
    return cached ? JSON.parse(cached) : [];
  });
  const [topSurvivors, setTopSurvivors] = useState<any[]>(() => {
    const cached = localStorage.getItem('cache_leaderboard');
    return cached ? JSON.parse(cached) : [];
  });
  const [rooms, setRooms] = useState<any[]>(() => {
    const cached = localStorage.getItem('cache_rooms');
    return cached ? JSON.parse(cached) : [];
  });
  const [quotaExceeded, setQuotaExceeded] = useState(() => {
    const lastError = localStorage.getItem('quota_error_time');
    if (!lastError) return false;
    const lastErrorTime = parseInt(lastError);
    // Quota resets daily; if 12h passed or it's a new day, we can try again
    if (Date.now() - lastErrorTime > 12 * 60 * 60 * 1000) {
      localStorage.removeItem('quota_error_time');
      return false;
    }
    return true;
  });
  const [loading, setLoading] = useState(true);
  
  const handleQuotaError = () => {
    setQuotaExceeded(true);
    localStorage.setItem('quota_error_time', Date.now().toString());
  };

  const lastLeaderboardFetchRef = React.useRef<number>(0);
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
    localStorage.setItem('cache_profile', JSON.stringify({
      ...oldProfile,
      score: newScore,
      level: calculateLevel(newScore),
      rpLevel: rp.level
    }));

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
      // Use cached/default values immediately if quota is exceeded
      if (quotaExceeded) {
        if (!frames.length) setFrames(SHORE_ITEMS.frames);
        if (!skins.length) setSkins(SHORE_ITEMS.skins);
        if (!rpRewards.length) setRpRewards(ROYAL_PASS_REWARDS);
        return;
      }

      try {
        const [framesSnap, skinsSnap, rpSnap] = await Promise.all([
          getDocs(collection(db, 'frames')),
          getDocs(collection(db, 'skins')),
          getDocs(collection(db, 'rp_rewards'))
        ]);
        
        setQuotaExceeded(false);
        localStorage.removeItem('quota_error_time');

        const dbFrames = framesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const allFrames: any[] = [...SHORE_ITEMS.frames];
        dbFrames.forEach(df => {
          if (!allFrames.find(af => af.id === df.id)) allFrames.push(df);
        });
        setFrames(allFrames);
        localStorage.setItem('cache_frames', JSON.stringify(allFrames));

        const dbSkins = skinsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const allSkins: any[] = [...SHORE_ITEMS.skins];
        dbSkins.forEach(ds => {
          if (!allSkins.find(as => as.id === ds.id)) allSkins.push(ds);
        });
        setSkins(allSkins);
        localStorage.setItem('cache_skins', JSON.stringify(allSkins));

        if (!rpSnap.empty) {
          const rewards = rpSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setRpRewards(rewards);
          localStorage.setItem('cache_rpRewards', JSON.stringify(rewards));
        } else {
          setRpRewards(ROYAL_PASS_REWARDS);
          localStorage.setItem('cache_rpRewards', JSON.stringify(ROYAL_PASS_REWARDS));
        }
      } catch (err: any) {
        console.warn("Assets fetch failed (quota?), using defaults:", err);
        if (err.message?.includes("quota") || err.code === "resource-exhausted") {
          handleQuotaError();
        }
        setFrames(SHORE_ITEMS.frames);
        setSkins(SHORE_ITEMS.skins);
        setRpRewards(ROYAL_PASS_REWARDS);
      }
    };

    const fetchLeaderboard = async () => {
      // Block if quota exceeded or we already have recent data
      if (quotaExceeded || (Date.now() - lastLeaderboardFetchRef.current < 30 * 60 * 1000 && topSurvivors.length > 0)) return;

      try {
        const survivors = await userService.getLeaderboard(20);
        if (survivors && survivors.length > 0) {
          setTopSurvivors(survivors);
          localStorage.setItem('cache_leaderboard', JSON.stringify(survivors));
        }
        lastLeaderboardFetchRef.current = Date.now();
      } catch (err: any) {
        if (err.message?.includes("quota") || err.code === "resource-exhausted") {
          handleQuotaError();
        }
      }
    };

    fetchAssets();
    fetchLeaderboard();
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
        if (isCreatingRef.current || quotaExceeded) {
          if (!profile) setLoading(false);
          return;
        }
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            const data = snap.data();
            setProfile(data);
            localStorage.setItem('cache_profile', JSON.stringify(data));
          } else if (!isCreatingRef.current) {
            isCreatingRef.current = true;
            try {
              await userService.createUserProfile(user.uid, user.email || '', user.displayName || 'Survivor');
              const newSnap = await getDoc(doc(db, 'users', user.uid));
              if (newSnap.exists()) {
                const data = newSnap.data();
                setProfile(data);
                localStorage.setItem('cache_profile', JSON.stringify(data));
              }
            } catch (createErr) {
              console.error("Profile creation failed:", createErr);
              isCreatingRef.current = false; // Allow retry on next mount/trigger
            }
          }
        } catch (err: any) {
          console.warn("Profile fetch failed:", err);
          if (err.message?.includes("quota") || err.code === "resource-exhausted") {
             handleQuotaError();
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

  // Removed redundant leaderboard fetch on score change to save quota

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
        const data = snap.data();
        setProfile(data);
        localStorage.setItem('cache_profile', JSON.stringify(data));
      }
    } catch (err) {
      console.warn("Manual profile refresh failed:", err);
    }
  };

  useEffect(() => {
    // Only subscribe to rooms if user is logged in and quota is healthy
    if (!user || quotaExceeded) {
      if (!user) setRooms([]);
      return;
    }

    try {
      const q = query(
        collection(db, 'rooms'), 
        where('status', '==', 'live'),
        orderBy('createdAt', 'desc'), 
        limit(20) // Reduced from 50 to 20 to save quota
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const liveRooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRooms(liveRooms);
        localStorage.setItem('cache_rooms', JSON.stringify(liveRooms));
      }, (err: any) => {
        if (err.message?.includes("quota") || err.code === "resource-exhausted") {
          handleQuotaError();
        }
      });

      return unsubscribe;
    } catch (err) {
      console.warn("Room subscription failed:", err);
    }
  }, [user]);

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
      rpRewards,
      topSurvivors,
      rooms,
      quotaExceeded
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
