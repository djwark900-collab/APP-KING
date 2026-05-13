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
    <div className="p-6 bg-[#070707] min-h-full pb-32 font-mono selection:bg-[#F2A900] selection:text-black">
      {/* Background FX Layers */}
      <div className="fixed inset-0 bg-noise opacity-[0.02] pointer-events-none" />
      <div className="fixed inset-0 bg-scanline opacity-[0.04] pointer-events-none" />

      <div className="mb-10 flex items-end justify-between relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-[2px] w-8 bg-[#F2A900]" />
            <span className="text-[10px] font-black text-[#F2A900] uppercase tracking-[0.4em]">Section: Global_Intel</span>
          </div>
          <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">TOP SURVIVORS</h2>
          <div className="flex items-center gap-4 mt-2">
             <div className="flex items-center gap-2 bg-red-600/10 border border-red-600/20 px-2 py-0.5 rounded">
                <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">LIVE_FEED</span>
             </div>
             <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">RANKINGS REFRESH: 10_DAYS</p>
          </div>
        </div>
        
        <button 
          onClick={() => window.location.reload()}
          className="w-12 h-12 bg-black/80 border border-white/5 rounded-xl flex items-center justify-center text-[#F2A900] hover:border-[#F2A900]/30 hover:bg-white/5 transition-all shadow-xl backdrop-blur-md group active:scale-90"
        >
          <ICONS.Alert className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700" />
        </button>
      </div>

      <div className="space-y-4 mb-4 relative z-10">
        {pendingScore > 0 && (
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={forceSync}
            disabled={isSyncing}
            className="w-full h-16 bg-gradient-to-r from-[#F2A900]/20 to-transparent border-2 border-[#F2A900]/30 rounded-2xl flex items-center justify-center gap-4 font-black uppercase italic tracking-widest text-[10px] transition-all hover:border-[#F2A900] group shadow-2xl backdrop-blur-md"
          >
            {isSyncing ? (
              <span className="animate-pulse">ENCRYPTING_PROGRESS_DATA...</span>
            ) : (
              <>
                <ICONS.Zap className="w-4 h-4 text-[#F2A900] animate-bounce" />
                <span>SAVE {pendingScore} DINNERS TO LEADERBOARD</span>
              </>
            )}
          </motion.button>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-6">
            <div className="relative">
              <ICONS.Tapper className="animate-spin text-[#F2A900] w-12 h-12" />
              <div className="absolute inset-0 bg-[#F2A900] blur-2xl opacity-20" />
            </div>
            <p className="text-[10px] font-black italic text-[#F2A900] uppercase tracking-[0.4em] animate-pulse">SCANNING_SURVIVAL_RECORDS...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topSurvivors.slice(0, 10).map((survivor, index) => {
              const frame = getFrameById(survivor.selectedFrameId);
              const rankName = getRankName(survivor.level || 1);
              const isTop3 = index < 3;
              
              return (
                <motion.div 
                  key={survivor.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedUserId(survivor.id)}
                  className={`flex items-center gap-5 p-5 rounded-3xl border transition-all relative overflow-hidden group backdrop-blur-sm cursor-pointer ${
                    index === 0 
                      ? 'bg-[#1a1a1a]/80 border-[#F2A900] shadow-[0_0_30px_rgba(242,169,0,0.15)] ring-1 ring-[#F2A900]/20' 
                      : 'bg-[#111]/80 border-white/5 hover:border-white/20 shadow-xl'
                  } group active:scale-[0.98]`}
                >
                  <div className="absolute inset-0 bg-scanline opacity-[0.03] group-hover:opacity-[0.07] transition-opacity" />
                  
                  <div className={`w-10 h-10 flex items-center justify-center font-black italic text-2xl shrink-0 group-hover:scale-110 transition-transform ${
                    index === 0 ? 'text-[#F2A900] drop-shadow-[0_0_10px_rgba(242,169,0,0.8)]' : 
                    index === 1 ? 'text-gray-300 drop-shadow-[0_0_8px_rgba(200,200,200,0.5)]' : 
                    index === 2 ? 'text-amber-700' : 'text-white/10'
                  }`}>
                    {index + 1}
                  </div>
                  
                  {/* Profile Avatar with Frame */}
                  <div className="relative w-16 h-16 shrink-0">
                    <div className="absolute inset-0 bg-white/5 rounded-2xl animate-pulse group-hover:bg-[#F2A900]/10 transition-colors" />
                    {frame?.image && (
                      <div className="absolute inset-[-25%] pointer-events-none z-10 transition-transform group-hover:scale-105">
                        <img 
                          src={frame.image} 
                          alt="" 
                          className="w-full h-full object-contain mix-blend-screen brightness-125" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                    )}
                    <div className="w-full h-full rounded-2xl bg-black border border-white/10 flex items-center justify-center overflow-hidden relative shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                      {survivor.photoURL ? (
                        <img src={survivor.photoURL} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
                      ) : (
                        <ICONS.Profile className="w-8 h-8 text-white/5" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 relative">
                    <div className="flex flex-col mb-1">
                      <h4 className="font-black truncate text-lg uppercase italic tracking-tighter text-white group-hover:text-[#F2A900] transition-colors leading-none mb-1">
                        {survivor.displayName || 'SURVIVOR'}
                      </h4>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${index === 0 ? 'bg-[#F2A900]' : 'bg-gray-700'}`} />
                          <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest">
                            {rankName} • LVL {survivor.level || 1}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end gap-2 mb-0.5">
                      <span className={`text-2xl font-black italic leading-none tracking-tighter ${index === 0 ? 'text-[#F2A900] drop-shadow-xl' : 'text-white'}`}>
                        {survivor.wins?.toLocaleString() || survivor.score?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="text-[7px] font-black text-[#F2A900] uppercase tracking-[0.3em] italic brightness-75">DINNERS_SECURED</div>
                  </div>
                  
                  {index === 0 && (
                    <div className="absolute top-0 right-10 bottom-0 w-32 bg-gradient-to-r from-transparent via-[#F2A900]/5 to-transparent skew-x-[-45deg] pointer-events-none" />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedUserId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl overflow-y-auto"
          >
            <div className="min-h-screen flex flex-col">
              <div className="sticky top-0 z-[110] px-6 py-8 bg-black/20 backdrop-blur-md flex justify-between items-center border-b border-white/5">
                 <div className="flex items-center gap-3">
                    <div className="h-1 w-6 bg-red-600" />
                    <span className="text-[10px] font-black text-white italic uppercase tracking-[0.4em]">Section: Profile_Infiltration</span>
                 </div>
                <button 
                  onClick={() => setSelectedUserId(null)}
                  className="flex items-center gap-3 bg-white text-black px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 hover:bg-[#F2A900] shadow-2xl"
                >
                  <ICONS.Alert className="w-4 h-4 rotate-90" /> EXIT ENCRYPTED VIEW
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
