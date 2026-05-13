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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter transform -skew-x-12 mb-1">TOP SURVIVORS</h2>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Global Rankings • Daily Refresh</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group active:scale-90"
        >
          <ICONS.Alert className="w-5 h-5 text-[#F2A900] group-hover:rotate-180 transition-transform duration-500" />
        </button>
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
            <p className="text-[10px] font-black italic text-[#F2A900] uppercase tracking-[0.3em] animate-pulse">Scanning Survivors...</p>
          </div>
        ) : (
          topSurvivors.slice(0, 10).map((survivor, index) => {
            const frame = getFrameById(survivor.selectedFrameId);
            const rankName = getRankName(survivor.level || 1);
            return (
              <motion.div 
                key={survivor.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedUserId(survivor.id)}
                className={`flex items-center gap-4 p-4 rounded-2xl border relative cursor-pointer active:scale-[0.98] transition-all hover:bg-white/5 ${
                  index === 0 
                    ? 'bg-gradient-to-r from-[#F2A900]/20 to-transparent border-[#F2A900] shadow-[0_0_20px_rgba(242,169,0,0.1)]' 
                    : 'bg-[#1A1A1A] border-white/5'
                }`}
              >
                <div className={`w-8 h-8 flex items-center justify-center font-black italic text-xl shrink-0 ${
                  index === 0 ? 'text-[#F2A900]' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-700' : 'text-gray-500'
                }`}>
                  {index + 1}
                </div>
                
                {/* Profile Avatar with Frame */}
                <div className="relative w-14 h-14 shrink-0">
                  {frame?.image && (
                    <div className="absolute inset-[-20%] pointer-events-none z-10">
                      <img 
                        src={frame.image} 
                        alt="" 
                        className="w-full h-full object-contain mix-blend-screen opacity-90" 
                        referrerPolicy="no-referrer" 
                      />
                    </div>
                  )}
                  <div className="w-full h-full rounded-2xl bg-black border border-white/10 flex items-center justify-center overflow-hidden relative shadow-inner">
                    {survivor.photoURL ? (
                      <img src={survivor.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <ICONS.Profile className="w-7 h-7 text-gray-800" />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-black truncate text-sm uppercase italic tracking-tighter text-white">
                      {survivor.displayName || 'SURVIVOR'}
                    </h4>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-3 bg-[#F2A900] rounded-full" />
                      <span className="text-[8px] font-black uppercase text-gray-400">
                        {rankName} • LVL {survivor.level || 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-3 bg-red-600 rounded-full" />
                      <span className="text-[8px] font-black uppercase text-gray-400">
                        RP {survivor.rpLevel || 1}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 mb-0.5">
                    <span className="text-lg font-black text-white italic leading-none">{survivor.wins?.toLocaleString() || 0}</span>
                  </div>
                  <div className="text-[7px] font-black text-[#F2A900] uppercase tracking-[0.2em] italic">CHICKEN DINNERS</div>
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
