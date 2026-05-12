import { db, auth } from '../lib/firebase';
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
  createdAt: any;
}

export const roomService = {
  async createRoom(name: string, type: 'voice' | 'chat' | 'battle' = 'chat') {
    const user = auth.currentUser;
    if (!user) throw new Error("Authentication required");

    const roomsRef = collection(db, 'rooms');
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
  },

  async joinRoom(roomId: string) {
    const user = auth.currentUser;
    if (!user) throw new Error("Authentication required");

    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      participants: arrayUnion(user.uid),
      updatedAt: serverTimestamp(),
    });
  },

  async leaveRoom(roomId: string) {
    const user = auth.currentUser;
    if (!user) return;

    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      participants: arrayRemove(user.uid),
      updatedAt: serverTimestamp(),
    });

    // If host leaves and no one else is in, maybe end it? 
    // Simplified: check participants in UI or Cloud Functions.
  },

  async sendMessage(roomId: string, text: string) {
    const user = auth.currentUser;
    if (!user || !text.trim()) return;

    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    await addDoc(messagesRef, {
      userId: user.uid,
      userName: user.displayName || 'Anonymous Player',
      text: text.trim(),
      createdAt: serverTimestamp(),
    });
  },

  subscribeToRooms(callback: (rooms: Room[]) => void) {
    const q = query(
      collection(db, 'rooms'), 
      where('status', '==', 'live'),
      orderBy('createdAt', 'desc'), 
      limit(50)
    );
    return onSnapshot(q, (snapshot) => {
      const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
      callback(rooms);
    });
  },

  subscribeToMessages(roomId: string, callback: (messages: Message[]) => void) {
    const q = query(
      collection(db, 'rooms', roomId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      callback(messages);
    });
  },

  async endRoom(roomId: string) {
    const user = auth.currentUser;
    if (!user) return;

    const roomRef = doc(db, 'rooms', roomId);
    const snap = await getDoc(roomRef);
    if (snap.exists() && snap.data().hostId === user.uid) {
      await updateDoc(roomRef, {
        status: 'ended',
        updatedAt: serverTimestamp(),
      });
    }
  }
};
