import { db, auth, isQuotaExceeded, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  getDoc,
  getDocs,
  where
} from 'firebase/firestore';

export interface Room {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  participants: string[];
  type: 'voice' | 'chat' | 'battle';
  status: 'live' | 'ended';
  createdAt: any;
  updatedAt: any;
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  type: 'text' | 'gift';
  giftId?: string;
  createdAt: any;
}

export const roomService = {
  async createRoom(name: string, type: 'voice' | 'chat' | 'battle' = 'chat') {
    if (isQuotaExceeded()) return null;
    const user = auth.currentUser;
    if (!user) throw new Error("Authentication required");

    const roomsRef = collection(db, 'rooms');
    try {
      const docRef = await addDoc(roomsRef, {
        name,
        hostId: user.uid,
        hostName: user.displayName || 'Anonymous Player',
        participants: [user.uid],
        type,
        status: 'live',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (e: any) {
      handleFirestoreError(e, OperationType.CREATE, 'rooms');
    }
  },

  async joinRoom(roomId: string) {
    if (isQuotaExceeded()) return;
    const user = auth.currentUser;
    if (!user) throw new Error("Authentication required");

    const roomRef = doc(db, 'rooms', roomId);
    try {
      await updateDoc(roomRef, {
        participants: arrayUnion(user.uid),
        updatedAt: serverTimestamp(),
      });
    } catch (e: any) {
      handleFirestoreError(e, OperationType.UPDATE, `rooms/${roomId}`);
    }
  },

  async leaveRoom(roomId: string) {
    if (isQuotaExceeded()) return;
    const user = auth.currentUser;
    if (!user) return;

    const roomRef = doc(db, 'rooms', roomId);
    try {
      await updateDoc(roomRef, {
        participants: arrayRemove(user.uid),
        updatedAt: serverTimestamp(),
      });
    } catch (e: any) {
      handleFirestoreError(e, OperationType.UPDATE, `rooms/${roomId}`);
    }
  },

  async sendMessage(roomId: string, text: string) {
    if (isQuotaExceeded() || !text.trim()) return;
    const user = auth.currentUser;
    if (!user) return;

    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    try {
      await addDoc(messagesRef, {
        userId: user.uid,
        userName: user.displayName || 'Anonymous Player',
        text: text.trim(),
        type: 'text',
        createdAt: serverTimestamp(),
      });
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, `rooms/${roomId}/messages`);
    }
  },

  async sendGift(roomId: string, giftId: string) {
    if (isQuotaExceeded()) return;
    const user = auth.currentUser;
    if (!user) throw new Error("Authentication required");

    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    try {
      await addDoc(messagesRef, {
        userId: user.uid,
        userName: user.displayName || 'Anonymous Player',
        text: `sent a gift: ${giftId}`,
        type: 'gift',
        giftId,
        createdAt: serverTimestamp(),
      });
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, `rooms/${roomId}/messages`);
    }
  },

  subscribeToRooms(callback: (rooms: Room[]) => void) {
    if (isQuotaExceeded()) return () => {};
    const q = query(
      collection(db, 'rooms'), 
      where('status', '==', 'live'),
      orderBy('createdAt', 'desc'), 
      limit(20) 
    );
    return onSnapshot(q, (snapshot) => {
      const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
      callback(rooms);
    }, (err: any) => {
      handleFirestoreError(err, OperationType.LIST, 'rooms');
    });
  },

  subscribeToMessages(roomId: string, callback: (messages: Message[]) => void) {
    if (isQuotaExceeded()) return () => {};
    const q = query(
      collection(db, 'rooms', roomId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      callback(messages);
    }, (err: any) => {
      handleFirestoreError(err, OperationType.LIST, `rooms/${roomId}/messages`);
    });
  },

  async endRoom(roomId: string) {
    if (isQuotaExceeded()) return;
    const user = auth.currentUser;
    if (!user) return;

    const roomRef = doc(db, 'rooms', roomId);
    try {
      const snap = await getDoc(roomRef);
      if (snap.exists() && snap.data().hostId === user.uid) {
        await deleteDoc(roomRef);
      }
    } catch (e: any) {
      handleFirestoreError(e, OperationType.DELETE, `rooms/${roomId}`);
    }
  }
};
