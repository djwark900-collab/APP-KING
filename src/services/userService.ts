import { auth, db } from '../lib/firebase';
import { calculateLevel, calculateRoyalPass, LEVEL_REWARDS } from '../constants';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  serverTimestamp,
  increment,
  arrayUnion
} from 'firebase/firestore';

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

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const userService = {
  async createUserProfile(userId: string, email: string, displayName: string) {
    const path = `users/${userId}`;
    try {
      await setDoc(doc(db, 'users', userId), {
        uid: userId,
        email,
        displayName,
        score: 0,
        money: 0,
        level: 1,
        rpLevel: 1,
        selectedFrameId: 'none',
        selectedSkinId: 'default',
        ownedFrames: ['none'],
        ownedSkins: ['default'],
        claimedLevelRewards: [],
        claimedRpRewards: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  },

  async getUserProfile(userId: string) {
    const path = `users/${userId}`;
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      return snap.exists() ? snap.data() : null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
    }
  },

  async addBulkScore(userId: string, amount: number) {
    if (amount <= 0) return;
    const path = `users/${userId}`;
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (!snap.exists()) return;
      
      const data = snap.data();
      const newScore = (data.score || 0) + amount;
      const level = calculateLevel(newScore);
      const rp = calculateRoyalPass(newScore);

      const updateData: any = {
        score: newScore,
        level: level,
        rpLevel: rp.level,
        updatedAt: serverTimestamp(),
      };

      // Check for level rewards
      const claimed = data.claimedLevelRewards || [];
      let totalReward = 0;
      const newlyClaimed: number[] = [];

      Object.entries(LEVEL_REWARDS).forEach(([lvlStr, reward]) => {
        const lvl = parseInt(lvlStr);
        if (level >= lvl && !claimed.includes(lvl)) {
          totalReward += reward;
          newlyClaimed.push(lvl);
        }
      });

      if (totalReward > 0) {
        updateData.money = increment(totalReward);
        updateData.claimedLevelRewards = arrayUnion(...newlyClaimed);
      }

      await updateDoc(doc(db, 'users', userId), updateData);
    } catch (e: any) {
      if (e.message && e.message.includes('Quota limit exceeded')) {
        console.error("Firestore Daily Quota Reached. Progress will be local-only until reset.");
        throw new Error("QUOTA_EXCEEDED");
      }
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async incrementScore(userId: string) {
    // Legacy support, but we should use addBulkScore
    return this.addBulkScore(userId, 1);
  },

  async buyMultiplier(userId: string, multiplier: number, durationMinutes: number, goldCost: number) {
    const path = `users/${userId}`;
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (!snap.exists()) return;
      const data = snap.data();
      
      if ((data.money || 0) < goldCost) {
        throw new Error("Insufficient Gold! Exchange Chicken Dinners for Gold in the Shop.");
      }

      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + durationMinutes);
      
      await updateDoc(doc(db, 'users', userId), {
        money: increment(-goldCost),
        activeMultiplier: multiplier,
        multiplierExpiry: expiry,
        updatedAt: serverTimestamp(),
      });
    } catch (e: any) {
      if (e.message && e.message.includes("Insufficient")) throw e;
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async exchangeDinnersToMoney(userId: string, dinnerCost: number, moneyGain: number) {
    const path = `users/${userId}`;
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (!snap.exists()) return;
      const data = snap.data();
      
      if ((data.score || 0) < dinnerCost) {
        throw new Error("Insufficient Chicken Dinners! Keep tapping to earn more.");
      }

      const newScore = data.score - dinnerCost;
      const level = calculateLevel(newScore);
      const rp = calculateRoyalPass(newScore);

      await updateDoc(doc(db, 'users', userId), {
        score: newScore,
        money: increment(moneyGain),
        level: level,
        rpLevel: rp.level,
        updatedAt: serverTimestamp(),
      });
    } catch (e: any) {
      if (e.message && e.message.includes("Insufficient")) {
         throw e; // Pass through validation errors
      }
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async purchaseItem(userId: string, itemId: string, itemType: 'frame' | 'skin', goldCost: number) {
    const path = `users/${userId}`;
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (!snap.exists()) return;
      const data = snap.data();
      
      if ((data.money || 0) < goldCost) {
        throw new Error('Insufficient Gold!');
      }
      
      const updateObj: any = {
        money: increment(-goldCost),
        updatedAt: serverTimestamp(),
      };

      if (itemType === 'frame') {
        const owned = data.ownedFrames || ['none'];
        if (owned.includes(itemId)) throw new Error("Already owned");
        updateObj.ownedFrames = [...owned, itemId];
        updateObj.selectedFrameId = itemId;
      } else {
        const owned = data.ownedSkins || ['default'];
        if (owned.includes(itemId)) throw new Error("Already owned");
        updateObj.ownedSkins = [...owned, itemId];
        updateObj.selectedSkinId = itemId;
      }

      await updateDoc(doc(db, 'users', userId), updateObj);
    } catch (e: any) {
      if (e.message && (e.message.includes("Insufficient") || e.message.includes("owned"))) throw e;
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async selectItem(userId: string, itemId: string, itemType: 'frame' | 'skin') {
    const path = `users/${userId}`;
    try {
      await updateDoc(doc(db, 'users', userId), {
        [itemType === 'frame' ? 'selectedFrameId' : 'selectedSkinId']: itemId,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async claimRoyalPassReward(userId: string, level: number, reward: any) {
    const path = `users/${userId}`;
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (!snap.exists()) return;
      const data = snap.data();
      
      if (data.claimedRpRewards?.includes(level)) {
        throw new Error("Reward already claimed!");
      }

      const updates: any = {
        claimedRpRewards: arrayUnion(level),
        updatedAt: serverTimestamp(),
      };

      if (reward.type === 'money') {
        updates.money = increment(reward.value);
      } else if (reward.type === 'skin') {
        updates.ownedSkins = arrayUnion(reward.value);
      } else if (reward.type === 'frame') {
        updates.ownedFrames = arrayUnion(reward.value);
      }

      await updateDoc(doc(db, 'users', userId), updates);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async updateProfile(userId: string, data: { displayName?: string, photoURL?: string }) {
    const path = `users/${userId}`;
    try {
      await updateDoc(doc(db, 'users', userId), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async addFrame(frame: any) {
    try {
      await setDoc(doc(db, 'frames', frame.id), {
        ...frame,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'frames');
    }
  },

  async updateFrame(frameId: string, data: any) {
    try {
      await updateDoc(doc(db, 'frames', frameId), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `frames/${frameId}`);
    }
  },

  async deleteFrame(frameId: string) {
    try {
      // Note: In a real app we'd need to consider users who own this frame
      // For this tapper app, we just delete the meta definition
      await deleteDoc(doc(db, 'frames', frameId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `frames/${frameId}`);
    }
  },

  async addSkin(skin: any) {
    try {
      await setDoc(doc(db, 'skins', skin.id), {
        ...skin,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'skins');
    }
  },

  async updateSkin(skinId: string, data: any) {
    try {
      await updateDoc(doc(db, 'skins', skinId), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `skins/${skinId}`);
    }
  },

  async deleteSkin(skinId: string) {
    try {
      await deleteDoc(doc(db, 'skins', skinId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `skins/${skinId}`);
    }
  },

  // Royal Pass Rewards
  async getRpRewards() {
    try {
      const { getDocs } = await import('firebase/firestore');
      const q = query(collection(db, 'rp_rewards'), orderBy('level', 'asc'));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'rp_rewards');
      return [];
    }
  },

  async updateRpReward(level: string, data: any) {
    try {
      await setDoc(doc(db, 'rp_rewards', level), {
        ...data,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `rp_rewards/${level}`);
    }
  },

  async initRpRewards(rewards: any[]) {
    try {
      for (const reward of rewards) {
        await setDoc(doc(db, 'rp_rewards', reward.level.toString()), {
          ...reward,
          updatedAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.error("Failed to init RP rewards", e);
    }
  },

  // App Settings / Creator
  async getCreatorInfo() {
    const path = 'app_settings/creator';
    try {
      // Try fetching from server if possible, but handle offline gracefully
      const snap = await getDoc(doc(db, 'app_settings', 'creator'));
      if (snap.exists()) {
        return snap.data();
      }
      return { 
        name: 'TRA LEAGUE', 
        logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop' 
      };
    } catch (e: any) {
      console.warn("Creator info fetch failed, using fallback:", e.message);
      return { 
        name: 'TRA LEAGUE', 
        logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop' 
      };
    }
  },

  async updateCreatorInfo(data: { name: string, logo: string }) {
    try {
      await setDoc(doc(db, 'app_settings', 'creator'), {
        ...data,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'app_settings/creator');
    }
  }
};
