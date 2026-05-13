import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { SHORE_ITEMS, ICONS } from '../constants';
import { motion } from 'motion/react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const Shop: React.FC<{ onNavigate?: (tab: 'home' | 'shop' | 'top' | 'profile' | 'settings') => void }> = ({ onNavigate }) => {
  const { profile, user, pendingScore, forceSync, isSyncing, refreshProfile, frames, skins: contextSkins } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'frames' | 'skins' | 'boosts'>('all');

  const handlePurchase = async (item: any, type: 'frame' | 'skin') => {
    if (!user) return;
    const ownedList = type === 'frame' ? profile?.ownedFrames : profile?.ownedSkins;

    if (ownedList?.includes(item.id)) {
       await userService.selectItem(user.uid, item.id, type);
       await refreshProfile();
       if (onNavigate) onNavigate('home');
       return;
    }
    
    if (profile?.money >= item.cost) {
      try {
        setIsLoading(true);
        await userService.purchaseItem(user.uid, item.id, type, item.cost);
        await refreshProfile();
        if (onNavigate) onNavigate('home');
      } catch (e: any) {
        alert(e.message);
      } finally {
        setIsLoading(false);
      }
    } else {
      alert("INSUFFICIENT FUNDS. TRANSMIT MORE DATA.");
    }
  };

  const allFrames = frames.length > 0 ? frames : SHORE_ITEMS.frames;
  const allSkins = contextSkins.length > 0 ? contextSkins : SHORE_ITEMS.skins;

  const CATEGORIES = [
    { id: 'all', name: 'ALL_GEAR', icon: ICONS.Tapper },
    { id: 'frames', name: 'FRAMES', icon: ICONS.Crown },
    { id: 'skins', name: 'EQUIPMENT', icon: ICONS.Shield },
    { id: 'boosts', name: 'STEROIDS', icon: ICONS.Zap }
  ];

  return (
    <div className="p-6 bg-[#0a0a0a] min-h-screen font-mono selection:bg-[#F2A900] selection:text-black">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#F2A900] opacity-[0.03] blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500 opacity-[0.02] blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-scanline opacity-[0.05]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto pb-40">
        {/* Header Section */}
        <header className="mb-10 pt-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black italic text-white tracking-tighter uppercase leading-none">THE_MARKET</h1>
            <div className="mt-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
              <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.3em]">SECURE CONNECTION ESTABLISHED</span>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3 backdrop-blur-xl">
             <ICONS.Zap className="w-4 h-4 text-yellow-400" />
             <span className="text-sm font-black italic text-white">{profile?.money?.toLocaleString() || 0} G</span>
          </div>
        </header>

        {/* Search & Categories (Aesthetic from image) */}
        <div className="mb-8 space-y-6">
          <div className="relative group">
            <ICONS.Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#F2A900] transition-colors" />
            <input 
              type="text" 
              placeholder="SEARCH_ARMORY..."
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-xs text-white uppercase font-black outline-none focus:border-[#F2A900]/30 transition-all placeholder:text-gray-700"
            />
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`shrink-0 px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${
                  activeCategory === cat.id 
                    ? 'bg-white text-black border-white' 
                    : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center">
            <ICONS.Tapper className="w-12 h-12 text-[#F2A900] animate-spin mb-4" />
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">DECRYPTING...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {/* Boosts (Special Layout) */}
            {(activeCategory === 'all' || activeCategory === 'boosts') && (
              <>
                <div className="col-span-2 mt-4 mb-2">
                  <span className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em]">STEROIDS_&_BOOSTS</span>
                </div>
                {[
                  { id: 'boost2', name: 'SPEED_OVERDRIVE', mult: 2, cost: 400, desc: '2X DINNERS (60S)' },
                  { id: 'boost4', name: 'ELITE_SCAN', mult: 4, cost: 1200, desc: '4X DINNERS (60S)' }
                ].map(boost => (
                  <motion.div 
                    key={boost.id}
                    whileHover={{ y: -4 }}
                    className="col-span-2 bg-gradient-to-br from-[#111] to-black border border-white/5 rounded-[2.5rem] p-6 flex items-center justify-between shadow-2xl relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-8 bg-blue-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-6 relative z-10">
                      <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-blue-500/40 transition-all">
                        <ICONS.Zap className={`w-8 h-8 ${boost.mult === 4 ? 'text-yellow-400' : 'text-blue-500'}`} />
                      </div>
                      <div>
                        <h3 className="font-black italic text-lg text-white uppercase leading-none mb-1">{boost.name}</h3>
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{boost.desc}</p>
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        if (profile?.money >= boost.cost) {
                          try {
                            await userService.buyMultiplier(user.uid, boost.mult, 1, boost.cost);
                            if (onNavigate) onNavigate('home');
                          } catch (e: any) { alert(e.message); }
                        } else { alert("INSUFFICIENT_FUNDS"); }
                      }}
                      className="bg-white text-black px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-yellow-400 transition-all active:scale-95"
                    >
                      {boost.cost} G
                    </button>
                  </motion.div>
                ))}
              </>
            )}

            {/* Frames Grid */}
            {(activeCategory === 'all' || activeCategory === 'frames') && (
              <>
                <div className="col-span-2 mt-10 mb-2">
                  <span className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em]">TACTICAL_FRAMES</span>
                </div>
                {allFrames.map(frame => {
                  const isOwned = profile?.ownedFrames?.includes(frame.id);
                  const isSelected = profile?.selectedFrameId === frame.id;
                  
                  return (
                    <motion.div 
                      key={frame.id}
                      whileHover={{ y: -8 }}
                      className="bg-[#111] border border-white/5 rounded-[2.5rem] p-4 flex flex-col items-center shadow-2xl relative overflow-hidden group"
                    >
                      <div className="absolute top-2 right-4 flex flex-col items-end">
                         <div className="px-2 py-1 bg-black/40 rounded-full border border-white/5">
                            <span className="text-[8px] font-black text-yellow-400">{frame.cost}G</span>
                         </div>
                      </div>
                      
                      <div className="w-full aspect-square relative mb-4 flex items-center justify-center">
                        <div className="absolute inset-4 bg-white/5 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                        {frame.image ? (
                          <img src={frame.image} alt="" className="w-3/4 h-3/4 object-cover rounded-3xl relative z-10 transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
                        ) : (
                          <ICONS.Profile className="w-1/2 h-1/2 text-white/5" />
                        )}
                      </div>

                      <div className="w-full px-2 text-center mb-4">
                        <h4 className="text-[11px] font-black italic text-white uppercase truncate">{frame.name}</h4>
                        <span className="text-[7px] font-black text-gray-600 uppercase tracking-widest">TACTICAL_SKIN</span>
                      </div>

                      <button 
                        onClick={() => handlePurchase(frame, 'frame')}
                        className={`w-full py-4 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest transition-all ${
                          isOwned 
                            ? isSelected ? 'bg-yellow-400 text-black' : 'bg-white/5 text-white/40 border border-white/5' 
                            : 'bg-white text-black hover:bg-yellow-400'
                        }`}
                      >
                        {isOwned ? (isSelected ? 'ACTIVE' : 'EQUIP') : 'ACQUIRE'}
                      </button>
                    </motion.div>
                  );
                })}
              </>
            )}

            {/* Skins Grid */}
            {(activeCategory === 'all' || activeCategory === 'skins') && (
              <>
                <div className="col-span-2 mt-10 mb-2">
                  <span className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em]">SURVIVAL_GEAR</span>
                </div>
                {allSkins.map(skin => {
                  const isOwned = profile?.ownedSkins?.includes(skin.id);
                  const isSelected = profile?.selectedSkinId === skin.id;
                  const SkinIcon = (ICONS as any)[skin.icon || 'Shield'] || ICONS.Shield;
                  
                  return (
                    <motion.div 
                      key={skin.id}
                      whileHover={{ y: -8 }}
                      className="bg-[#111] border border-white/5 rounded-[2.5rem] p-4 flex flex-col items-center shadow-2xl relative overflow-hidden group"
                    >
                      <div className="absolute top-2 right-4">
                         <div className="px-2 py-1 bg-black/40 rounded-full border border-white/5">
                            <span className="text-[8px] font-black text-red-500">{skin.cost}G</span>
                         </div>
                      </div>
                      
                      <div className="w-full aspect-square relative mb-4 flex items-center justify-center">
                        <div className="absolute inset-4 bg-red-600/5 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                        {skin.image ? (
                           <img src={skin.image} alt="" className="w-3/4 h-3/4 object-contain relative z-10 transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
                        ) : (
                          <SkinIcon className="w-1/2 h-1/2 text-white/10 group-hover:text-red-500 transition-colors" />
                        )}
                      </div>

                      <div className="w-full px-2 text-center mb-4">
                        <h4 className="text-[11px] font-black italic text-white uppercase truncate">{skin.name}</h4>
                        <span className="text-[7px] font-black text-gray-600 uppercase tracking-widest">TACTICAL_SKIN</span>
                      </div>

                      <button 
                        onClick={() => handlePurchase(skin, 'skin')}
                        className={`w-full py-4 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest transition-all ${
                          isOwned 
                            ? isSelected ? 'bg-red-600 text-white' : 'bg-white/5 text-white/40 border border-white/5' 
                            : 'bg-white text-black hover:bg-red-600'
                        }`}
                      >
                        {isOwned ? (isSelected ? 'ACTIVE' : 'EQUIP') : 'ACQUIRE'}
                      </button>
                    </motion.div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
