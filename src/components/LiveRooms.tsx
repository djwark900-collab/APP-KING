import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { roomService, Room, Message } from '../services/roomService';
import { ICONS, THEME } from '../constants';

export const LiveRooms: React.FC = () => {
  const { profile } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = roomService.subscribeToRooms(setRooms);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (activeRoom) {
      const unsub = roomService.subscribeToMessages(activeRoom.id, setMessages);
      return () => unsub();
    } else {
      setMessages([]);
    }
  }, [activeRoom?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    try {
      const roomId = await roomService.createRoom(newRoomName.trim());
      setIsCreating(false);
      setNewRoomName('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleJoinRoom = async (room: Room) => {
    try {
      await roomService.joinRoom(room.id);
      setActiveRoom(room);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLeaveRoom = async () => {
    if (!activeRoom) return;
    try {
      await roomService.leaveRoom(activeRoom.id);
      setActiveRoom(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeRoom) return;
    try {
      await roomService.sendMessage(activeRoom.id, inputMessage);
      setInputMessage('');
    } catch (err: any) {
      console.error(err);
    }
  };

  if (activeRoom) {
    return (
      <div className="flex flex-col h-full bg-[#0F0F0F]">
        {/* Room Header */}
        <div className="p-4 bg-[#1A1A1A] border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={handleLeaveRoom} className="p-2 text-gray-400 hover:text-white transition-colors">
              <ICONS.Chevron className="w-6 h-6 rotate-180" />
            </button>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-tighter">{activeRoom.name}</h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-gray-500 font-bold uppercase">{activeRoom.participants?.length || 0} PARTICIPANTS</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-[#F2A900]/10 text-[#F2A900] rounded-lg flex items-center justify-center">
               <ICONS.Voice className="w-4 h-4" />
             </div>
             {profile?.uid === activeRoom.hostId && (
               <button 
                 onClick={async () => {
                   if (confirm("End this live session?")) {
                     await roomService.endRoom(activeRoom.id);
                     setActiveRoom(null);
                   }
                 }}
                 className="bg-red-600/20 text-red-500 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border border-red-600/20"
               >
                 END
               </button>
             )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.userId === profile?.uid ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{msg.userName}</span>
              </div>
              <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-bold ${
                msg.userId === profile?.uid 
                  ? 'bg-[#F2A900] text-black rounded-tr-none' 
                  : 'bg-white/5 text-white rounded-tl-none border border-white/5'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="p-4 bg-[#1A1A1A] border-t border-white/5">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder="BROADCAST MESSAGE..."
              className="flex-1 bg-black text-white text-xs p-3 rounded-xl border border-white/5 focus:border-[#F2A900] outline-none font-bold"
            />
            <button className="bg-[#F2A900] text-black p-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#F2A900]/20">
              <ICONS.Chevron className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0F0F0F]">
      <div className="p-6 pt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-white">LIVE ROOMS</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
              BROADCASTING TO BATTLEGROUND
            </p>
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-[#F2A900] text-black p-3 rounded-xl shadow-lg shadow-[#F2A900]/20 active:scale-95 transition-all"
          >
            <ICONS.Plus className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {isCreating && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#1A1A1A] border-2 border-[#F2A900] p-4 rounded-2xl shadow-2xl"
              >
                <h3 className="text-[10px] font-black text-[#F2A900] uppercase tracking-widest mb-4">INITIATE NEW CHANNEL</h3>
                <div className="flex flex-col gap-3">
                  <input 
                    type="text" 
                    autoFocus
                    value={newRoomName}
                    onChange={e => setNewRoomName(e.target.value)}
                    placeholder="CHANNEL FREQUENCY NAME..."
                    className="bg-black text-white p-4 rounded-xl border border-white/5 focus:border-[#F2A900] outline-none font-bold text-xs"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsCreating(false)}
                      className="flex-1 bg-white/5 text-white py-3 rounded-xl font-bold text-[10px] uppercase border border-white/5 hover:bg-white/10 transition-colors"
                    >
                      ABORT
                    </button>
                    <button 
                      onClick={handleCreateRoom}
                      className="flex-1 bg-[#F2A900] text-black py-3 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-[#F2A900]/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      OPEN FREQUENCY
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {rooms.length === 0 && !isCreating && (
            <div className="py-20 flex flex-col items-center justify-center text-center opacity-30">
              <ICONS.Live className="w-16 h-16 mb-4" />
              <p className="font-black italic uppercase tracking-tighter text-xl">NO ACTIVE FREQUENCIES</p>
              <p className="text-[10px] font-bold uppercase tracking-widest">START A NEW LIVE ROOM TO BROADCAST</p>
            </div>
          )}

          {rooms.map((room) => (
            <motion.button
              key={room.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => handleJoinRoom(room)}
              className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-5 flex items-center justify-between group hover:border-[#F2A900]/30 transition-all hover:bg-[#F2A900]/5 text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-black rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden">
                  <ICONS.Live className="w-6 h-6 text-[#F2A900]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-red-600/20 to-transparent flex items-end justify-center pb-2">
                    <span className="w-1 h-1 bg-red-600 rounded-full animate-ping" />
                  </div>
                </div>
                <div>
                  <h3 className="font-black italic uppercase text-lg leading-tight group-hover:text-[#F2A900] transition-colors">{room.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1.5 opacity-60">
                      <ICONS.Profile className="w-3 h-3" />
                      <span className="text-[9px] font-black uppercase truncate max-w-[80px]">{room.hostName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-red-500 font-bold text-[9px] uppercase">
                      <ICONS.Users className="w-3 h-3" />
                      <span>{room.participants?.length || 0} LIVE</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl border border-white/5 flex items-center justify-center bg-black group-hover:border-[#F2A900]/50 transition-colors">
                <ICONS.Chevron className="w-5 h-5 text-gray-600 group-hover:text-[#F2A900] transition-colors" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};
