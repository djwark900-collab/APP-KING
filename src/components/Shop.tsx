import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { SHORE_ITEMS, ICONS } from '../constants';
import { motion } from 'motion/react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const Shop: React.FC = () => {
  const { profile, user, pendingScore, forceSync, isSyncing, refreshProfile, frames, skins: contextSkins } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
  }, [user]);

  const handlePurchase = async (item: any, type: 'frame' | 'skin') => {
    if (!user) return;
    const ownedList = type === 'frame' ? profile?.ownedFrames : profile?.ownedSkins;

    if (ownedList?.includes(item.id)) {
       await userService.selectItem(user.uid, item.id, type);
       await refreshProfile();
       return;
    }
    
    if (profile?.money >= item.cost) {
      try {
        setIsLoading(true);
        await userService.purchaseItem(user.uid, item.id, type, item.cost);
        await refreshProfile();
      } catch (e: any) {
        alert(e.message);
      } finally {
        setIsLoading(false);
      }
    } else {
      alert("You need more gold! Complete level milestones to earn rewards.");
    }
  };

  const seedData = async () => {
    for (const f of SHORE_ITEMS.frames) await userService.addFrame(f);
    for (const s of SHORE_ITEMS.skins) await userService.addSkin(s);
  };

  // Merge context items with static items
  const allFrames = frames.length > 0 ? frames : SHORE_ITEMS.frames;
  const allSkins = contextSkins.length > 0 ? contextSkins : SHORE_ITEMS.skins;

  return (
    <div className="p-6 bg-[#0F0F0F] min-h-full">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <ICONS.Tapper className="w-12 h-12 text-[#F2A900] animate-spin" />
          <p className="text-[#F2A900] text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Scanning Armory...</p>
        </div>
      ) : (
        <>
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-black italic tracking-tighter transform -skew-x-12 mb-1 uppercase">Armory Shop</h2>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Upgrade your gear</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="bg-[#F2A900]/10 border border-[#F2A900]/30 rounded-lg px-3 py-1 flex items-center gap-2">
                <ICONS.Flame className="w-3 h-3 text-[#F2A900]" />
                <span className="text-[10px] font-black text-white italic">
                  {((profile?.score || 0) + pendingScore).toLocaleString()}
                </span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 flex items-center gap-2">
                <ICONS.Zap className="w-3 h-3 text-yellow-400" />
                <span className="text-[10px] font-black text-white italic">{profile?.money || 0}</span>
              </div>
              {frames.length === 0 && (
                <button onClick={seedData} className="text-[8px] bg-gray-900 p-1 rounded text-gray-600 font-bold uppercase mt-1">Init Shop</button>
              )}
            </div>
          </div>

          {/* Pending Score Save Button */}
          {pendingScore > 0 && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mb-8"
            >
              <button
                onClick={forceSync}
                disabled={isSyncing}
                className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-black uppercase italic tracking-tighter text-xs border-2 shadow-xl transition-all ${
                  isSyncing 
                    ? 'bg-gray-800 text-gray-500 border-gray-700' 
                    : 'bg-[#F2A900] text-black border-black hover:bg-white hover:-translate-y-1'
                }`}
              >
                {isSyncing ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                      <ICONS.Alert className="w-4 h-4" />
                    </motion.div>
                    Saving Combat Data...
                  </>
                ) : (
                  <>
                    <ICONS.Zap className="w-4 h-4" />
                    Save {pendingScore} Unsynced Progress
                  </>
                )}
              </button>
            </motion.div>
          )}

          <section className="mb-10 p-6 bg-[#111] border border-white/5 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#F2A900] opacity-5 blur-3xl -mr-12 -mt-12" />
            <h3 className="text-xs font-black text-[#F2A900] uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
              <div className="w-8 h-px bg-[#F2A900]/30" /> 
              <span className="flex items-center gap-2">
                <ICONS.Profile className="w-3.5 h-3.5" /> AVATAR FRAMES
              </span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {allFrames.map(frame => (
                <motion.div 
                  key={frame.id}
                  whileHover={{ scale: 1.02 }}
                  className={`p-4 rounded-2xl border-2 transition-all relative group ${
                    profile?.selectedFrameId === frame.id 
                      ? 'bg-[#F2A900]/5 border-[#F2A900] shadow-[0_0_15px_rgba(242,169,0,0.1)]' 
                      : 'bg-black border-[#222] hover:border-[#444]'
                  }`}
                >
                  <div className="aspect-square bg-[#0a0a0a] rounded-xl mb-3 flex items-center justify-center overflow-hidden border border-[#333] relative">
                    {frame.image ? (
                      <img src={frame.image} alt={frame.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                    ) : (
                      <ICONS.Profile className="w-10 h-10 text-gray-800" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 pointer-events-none" />
                  </div>
                  <h4 className="font-black text-[10px] mb-2 truncate uppercase italic tracking-tighter text-white/90" style={frame.color ? { color: frame.color } : {}}>{frame.name}</h4>
                  <button 
                    onClick={() => handlePurchase(frame, 'frame')}
                    className={`w-full py-2.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${
                      profile?.ownedFrames?.includes(frame.id)
                        ? profile?.selectedFrameId === frame.id 
                          ? 'bg-[#F2A900] text-black shadow-lg shadow-[#F2A900]/20' 
                          : 'bg-[#222] text-gray-400 hover:bg-[#333] hover:text-white'
                        : 'bg-white text-black hover:bg-[#F2A900] shadow-xl'
                    }`}
                  >
                    {profile?.ownedFrames?.includes(frame.id) 
                      ? profile?.selectedFrameId === frame.id ? 'ACTIVE' : 'EQUIP' 
                      : `${frame.cost} GOLD`}
                  </button>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="mb-10 p-6 bg-[#111] border border-white/5 rounded-3xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500 opacity-5 blur-3xl -mr-12 -mt-12" />
            <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
              <div className="w-8 h-px bg-blue-500/30" /> 
              <span className="flex items-center gap-2">
                <ICONS.Zap className="w-3.5 h-3.5" /> BATTLE BOOSTS
              </span>
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="bg-black/40 border-2 border-white/5 p-5 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 transition-all"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 relative">
                    <ICONS.Zap className="text-blue-400 w-8 h-8 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping opacity-20" />
                  </div>
                  <div>
                    <h4 className="font-black italic text-lg text-white leading-none mb-1 uppercase tracking-tighter">OVERDRIVE MULTIPLIER</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Double DP for 60 seconds</p>
                  </div>
                </div>
                <button 
                  onClick={async () => {
                    if (profile?.money >= 400) {
                      try {
                        await userService.buyMultiplier(user.uid, 2, 1, 400);
                      } catch (e: any) {
                        alert(e.message);
                      }
                    } else {
                      alert("Insufficient funds! Earn rewards in the field.");
                    }
                  }}
                  className="bg-blue-600 text-white font-black uppercase text-[10px] px-8 py-4 rounded-xl hover:bg-blue-500 shadow-xl shadow-blue-900/20 active:scale-95 transition-all"
                >
                  400 G
                </button>
              </motion.div>
            </div>
          </section>

          <section className="p-6 bg-[#111] border border-white/5 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#F2A900] opacity-5 blur-3xl -mr-12 -mt-12" />
            <h3 className="text-xs font-black text-[#F2A900] uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
              <div className="w-8 h-px bg-[#F2A900]/30" /> 
              <span className="flex items-center gap-2">
                <ICONS.Flame className="w-3.5 h-3.5" /> BATTLE SKINS
              </span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {allSkins.map(skin => {
                const SkinIcon = (ICONS as any)[skin.icon || 'Shield'] || ICONS.Tapper;
                const isSelected = profile?.selectedSkinId === skin.id;
                const isOwned = profile?.ownedSkins?.includes(skin.id);

                return (
                  <motion.div 
                    key={skin.id}
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 rounded-2xl border-2 transition-all group ${
                      isSelected 
                        ? 'bg-[#F2A900]/5 border-[#F2A900] shadow-[0_0_15px_rgba(242,169,0,0.1)]' 
                        : 'bg-black border-[#222] hover:border-[#444]'
                    }`}
                  >
                    <div className="aspect-square bg-[#0a0a0a] rounded-xl mb-3 flex items-center justify-center border border-[#333] overflow-hidden group-hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all">
                       {skin.image ? (
                          <img src={skin.image} alt="" className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                       ) : (
                          <SkinIcon className={`w-10 h-10 ${isSelected ? 'text-[#F2A900]' : 'text-gray-800'} transition-colors`} style={skin.color ? { color: skin.color } : {}} />
                       )}
                    </div>
                    <h4 className="font-black text-[10px] mb-2 truncate uppercase italic tracking-tighter text-white/90" style={skin.color ? { color: skin.color } : {}}>{skin.name}</h4>
                    <button 
                      onClick={() => handlePurchase(skin, 'skin')}
                      className={`w-full py-2.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${
                        isOwned
                          ? isSelected ? 'bg-[#F2A900] text-black shadow-lg shadow-[#F2A900]/20' : 'bg-[#222] text-gray-400 hover:bg-[#333] hover:text-white'
                          : 'bg-white text-black hover:bg-[#F2A900] shadow-xl'
                      }`}
                    >
                      {isOwned 
                        ? isSelected ? 'ACTIVE' : 'EQUIP' 
                        : `${skin.cost} GOLD`}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
};
