import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, where, doc, getDoc, getDocs } from 'firebase/firestore';
import { ICONS, SHORE_ITEMS, LEVELS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { motion, AnimatePresence } from 'motion/react';
import { Profile } from './Profile';

export const Leaderboard: React.FC = () => {
  const { user, pendingScore, forceSync, isSyncing, quotaExceeded, frames, topSurvivors } = useAuth();
  const [loading, setLoading] = useState(!topSurvivors.length);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (topSurvivors.length > 0) {
      setLoading(false);
    }
  }, [topSurvivors]);

  const getFrameById = (id: string) => {
    return frames.find(f => f.id === id);
  };

  const getRankName = (lvl: number) => {
    return (LEVELS.findLast(l => lvl >= l.min) || LEVELS[0]).rank;
  };

  return (
    <div className="p-6 bg-[#0F0F0F] min-h-full pb-24">
      <div className="mb-8">
        <h2 className="text-3xl font-black italic tracking-tighter transform -skew-x-12 mb-1">TOP SURVIVORS</h2>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Global Rankings</p>
      </div>

      <div className="space-y-4 mb-4">
        {pendingScore > 0 && (
          <motion.button
            onClick={forceSync}
            disabled={isSyncing}
            className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-black uppercase italic tracking-tighter text-xs border-2 shadow-xl transition-all ${
              isSyncing 
                ? 'bg-gray-800 text-gray-500 border-gray-700' 
                : 'bg-[#F2A900] text-black border-black hover:bg-white'
            }`}
          >
            {isSyncing ? 'Syncing...' : `Save ${pendingScore} Dinners To Leaderboard`}
          </motion.button>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <ICONS.Tapper className="animate-spin text-[#F2A900] w-10 h-10" />
            <p className="text-[10px] font-black italic text-[#F2A900] uppercase tracking-[0.3em] animate-pulse">Calculating Ranks...</p>
          </div>
        ) : (
          topSurvivors.map((survivor, index) => {
            const frame = getFrameById(survivor.selectedFrameId);
            const rankName = getRankName(survivor.level || 1);
            return (
              <motion.div 
                key={survivor.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedUserId(survivor.id)}
                className={`flex items-center gap-4 p-4 rounded-xl border relative cursor-pointer active:scale-[0.98] transition-all hover:bg-white/5 ${
                  index === 0 ? 'bg-[#F2A900]/10 border-[#F2A900]' : 'bg-[#1A1A1A] border-[#333]'
                }`}
              >
                <div className={`w-8 h-8 flex items-center justify-center font-black italic text-xl shrink-0 ${
                  index === 0 ? 'text-[#F2A900]' : 'text-gray-500'
                }`}>
                  {index + 1}
                </div>
                
                {/* Profile Avatar with Frame */}
                <div className="relative w-12 h-12 shrink-0">
                  {frame?.image && (
                    <div className="absolute inset-[-15%] pointer-events-none z-10">
                      <img 
                        src={frame.image} 
                        alt="" 
                        className="w-full h-full object-contain mix-blend-screen opacity-90" 
                        referrerPolicy="no-referrer" 
                      />
                    </div>
                  )}
                  <div className="w-full h-full rounded-full bg-black border border-[#333] flex items-center justify-center overflow-hidden relative">
                    {survivor.photoURL ? (
                      <img src={survivor.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <ICONS.Profile className="w-6 h-6 text-gray-700" />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold truncate text-sm uppercase tracking-tight">{survivor.displayName || 'Unnamed Survivor'}</h4>
                  <div className="flex items-center gap-1">
                    <ICONS.Flame className="w-3 h-3 text-[#F2A900]" />
                    <span className="text-[9px] font-black uppercase text-[#F2A900] tracking-widest">
                      {rankName} • LVL {survivor.level || 1}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black text-white italic leading-none">{survivor.score?.toLocaleString() || 0}</div>
                  <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Dinners</div>
                </div>

                <div className="w-6 h-6 flex items-center justify-center text-gray-700">
                  <ICONS.Profile className="w-4 h-4 opacity-30" />
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {selectedUserId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md overflow-y-auto"
          >
            <div className="min-h-screen flex flex-col pt-12">
              <div className="px-6 flex justify-between items-center">
                <button 
                  onClick={() => setSelectedUserId(null)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 border border-white/10"
                >
                  <ICONS.Profile className="w-4 h-4" /> BACK TO ROSTER
                </button>
              </div>
              <div className="flex-1">
                <Profile targetUserId={selectedUserId} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
