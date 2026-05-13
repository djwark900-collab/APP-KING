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

  const collectorFrames = allFrames.filter(f => ['frame1', 'frame2', 'frame3'].includes(f.id));
  const [selectedCollectorId, setSelectedCollectorId] = useState(collectorFrames[0]?.id || '');

  const handleBuyAllFrames = async () => {
    const toBuy = collectorFrames.filter(f => !profile?.ownedFrames?.includes(f.id));
    const totalCost = toBuy.reduce((sum, f) => sum + f.cost, 0);
    
    if (toBuy.length === 0) {
      alert("You already own all collector frames!");
      return;
    }

    if (profile?.money >= totalCost) {
      if (confirm(`Buy ${toBuy.length} frames for ${totalCost} gold?`)) {
        try {
          setIsLoading(true);
          for (const frame of toBuy) {
            await userService.purchaseItem(user.uid, frame.id, 'frame', frame.cost);
          }
          await refreshProfile();
          alert("All collector frames added to your armory!");
        } catch (e: any) {
          alert(e.message);
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      alert("Insufficient funds to buy all frames!");
    }
  };

  return (
    <div className="p-6 bg-[#070707] min-h-full font-mono selection:bg-[#F2A900] selection:text-black pb-32">
      {/* Background FX Layers */}
      <div className="fixed inset-0 bg-noise opacity-[0.02] pointer-events-none" />
      <div className="fixed inset-0 bg-scanline opacity-[0.04] pointer-events-none" />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="relative">
            <ICONS.Tapper className="w-16 h-16 text-[#F2A900] animate-spin" />
            <div className="absolute inset-0 bg-[#F2A900] blur-2xl opacity-20 animate-pulse" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-[#F2A900] text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">CONNECTING_TO_ARMORY_SERVER</p>
            <div className="w-32 h-0.5 bg-white/5 overflow-hidden">
               <motion.div animate={{ x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1/2 h-full bg-[#F2A900]" />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-12 flex justify-between items-start relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-[2px] w-8 bg-[#F2A900]" />
                <span className="text-[10px] font-black text-[#F2A900] uppercase tracking-[0.4em]">Section: Black Market</span>
              </div>
              <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">ARMORY SHOP</h2>
            </div>
            
            <div className="flex flex-col items-end gap-3 bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-2xl">
              <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/5 group transition-all hover:border-[#F2A900]/30">
                <div className="w-8 h-8 rounded-lg bg-[#F2A900]/10 flex items-center justify-center">
                  <ICONS.Flame className="w-4 h-4 text-[#F2A900]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">TOTAL_DINNERS</span>
                  <span className="text-sm font-black text-white italic leading-none">
                    {((profile?.score || 0) + pendingScore).toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/5 group transition-all hover:border-yellow-400/30">
                <div className="w-8 h-8 rounded-lg bg-yellow-400/10 flex items-center justify-center">
                  <ICONS.Zap className="w-4 h-4 text-yellow-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">AVAILABLE_GOLD</span>
                  <span className="text-sm font-black text-white italic leading-none">{profile?.money || 0}</span>
                </div>
              </div>
              
              {frames.length === 0 && (
                <button onClick={seedData} className="text-[8px] text-[#F2A900] font-black uppercase tracking-widest hover:underline mt-1">REBOOT_SHOP_SERVICES</button>
              )}
            </div>
          </div>

          {/* Featured Collector Series */}
          <section className="mb-12 relative z-10 group">
            <div className="absolute inset-0 bg-[#F2A900] opacity-[0.02] blur-[100px] pointer-events-none" />
            <div className="p-8 bg-[#111] border border-[#F2A900]/20 rounded-[2.5rem] relative overflow-hidden backdrop-blur-xl shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#F2A900] opacity-[0.03] blur-3xl -mr-32 -mt-32" />
              <div className="absolute top-6 left-6 flex items-center gap-2">
                <div className="w-2 h-2 bg-[#F2A900] rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-[#F2A900] uppercase tracking-[0.4em]">COLLECTOR_SERIES_DROP</span>
              </div>

              <div className="relative z-10 mt-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h3 className="text-3xl font-black italic text-white tracking-tighter uppercase leading-none mb-2">LIMITED EDITION</h3>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Exotic rarity tactical frames</p>
                  </div>
                  <button 
                    onClick={handleBuyAllFrames}
                    className="shrink-0 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-[#F2A900] hover:text-black hover:border-black transition-all shadow-xl active:scale-95"
                  >
                    ACQUIRE COMPLETE SERIES
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <select 
                      value={selectedCollectorId}
                      onChange={(e) => setSelectedCollectorId(e.target.value)}
                      className="w-full bg-black border border-white/10 p-5 rounded-2xl text-white font-black uppercase text-xs appearance-none focus:border-[#F2A900] outline-none transition-all cursor-pointer group-hover:border-white/20 shadow-inner"
                    >
                      {collectorFrames.map(f => (
                        <option key={f.id} value={f.id} className="bg-[#111] text-white">
                          {f.name} — {f.cost} G
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      <ICONS.Chevron className="w-5 h-5 rotate-90" />
                    </div>
                  </div>

                  {(() => {
                    const selectedFrame = collectorFrames.find(f => f.id === selectedCollectorId);
                    if (!selectedFrame) return null;
                    const isOwned = profile?.ownedFrames?.includes(selectedFrame.id);
                    const isSelected = profile?.selectedFrameId === selectedFrame.id;

                    return (
                      <motion.div 
                        key={selectedFrame.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-black/60 border border-white/5 p-5 rounded-2xl flex items-center justify-between gap-6 backdrop-blur-md"
                      >
                        <div className="flex items-center gap-5">
                          <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/5 shrink-0 bg-[#0a0a0a] relative group">
                            <img src={selectedFrame.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-scanline opacity-10" />
                          </div>
                          <div>
                            <div className="font-black text-white italic text-lg tracking-tighter uppercase leading-none mb-1">{selectedFrame.name}</div>
                            <div className="text-[8px] font-black text-[#F2A900] uppercase tracking-widest flex items-center gap-1">
                              <div className="w-1 h-1 bg-[#F2A900] rounded-full" /> RARITY: EXOTIC
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => handlePurchase(selectedFrame, 'frame')}
                          className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                            isOwned 
                              ? isSelected ? 'bg-[#F2A900] text-black shadow-[#F2A900]/20' : 'bg-white/5 text-white/40 border border-white/5' 
                              : 'bg-white text-black hover:bg-[#F2A900]'
                          }`}
                        >
                          {isOwned ? (isSelected ? 'ACTIVE' : 'EQUIP') : 'ACQUIRE'}
                        </button>
                      </motion.div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </section>

          {/* Pending Sync */}
          {pendingScore > 0 && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-12">
              <button
                onClick={forceSync}
                disabled={isSyncing}
                className="w-full h-20 bg-gradient-to-r from-red-600/20 to-[#F2A900]/20 border-2 border-[#F2A900]/30 rounded-3xl flex items-center justify-center gap-6 font-black uppercase italic tracking-widest text-xs transition-all hover:border-[#F2A900] group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-scanline opacity-[0.05]" />
                {isSyncing ? (
                  <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}>ENCRYPTING_PROGRESS_DATA...</motion.span>
                ) : (
                  <>
                    <div className="flex flex-col items-start leading-none gap-1">
                       <span className="text-[8px] text-[#F2A900] tracking-[0.4em] not-italic">SECURITY_SYNC_PENDING</span>
                       <span className="text-white text-xl">SAVE {pendingScore} UNSYNCED DINNERS</span>
                    </div>
                    <ICONS.Chevron className="w-6 h-6 text-[#F2A900] group-hover:translate-x-2 transition-transform" />
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* Main Shop Sections */}
          <div className="space-y-16 relative z-10">
            {/* Frames */}
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="h-1 w-8 bg-[#F2A900]" />
                <h3 className="text-sm font-black text-white italic uppercase tracking-[0.4em]">TACTICAL_FRAMES</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {allFrames.map(frame => (
                  <motion.div 
                    key={frame.id}
                    whileHover={{ y: -5 }}
                    className={`p-5 rounded-3xl border-2 transition-all relative group overflow-hidden shadow-2xl ${
                      profile?.selectedFrameId === frame.id 
                        ? 'bg-[#F2A900]/5 border-[#F2A900] shadow-[0_0_30px_rgba(242,169,0,0.1)]' 
                        : 'bg-[#111] border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="absolute inset-0 bg-scanline opacity-[0.03]" />
                    <div className="aspect-square bg-black rounded-2xl mb-5 flex items-center justify-center overflow-hidden border border-white/5 relative shadow-inner">
                      {frame.image ? (
                        <img src={frame.image} alt={frame.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                      ) : (
                        <ICONS.Profile className="w-12 h-12 text-white/5" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                    </div>
                    <h4 className="font-black text-xs mb-4 truncate uppercase italic tracking-tighter text-white" style={frame.color ? { color: frame.color } : {}}>{frame.name}</h4>
                    <button 
                      onClick={() => handlePurchase(frame, 'frame')}
                      className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        profile?.ownedFrames?.includes(frame.id)
                          ? profile?.selectedFrameId === frame.id 
                            ? 'bg-[#F2A900] text-black shadow-xl shadow-[#F2A900]/20' 
                            : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white border border-white/5'
                          : 'bg-white text-black hover:bg-[#F2A900] shadow-2xl'
                      }`}
                    >
                      {profile?.ownedFrames?.includes(frame.id) 
                        ? profile?.selectedFrameId === frame.id ? 'ACTIVE' : 'EQUIP' 
                        : `${frame.cost} G`}
                    </button>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Boosts */}
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="h-1 w-8 bg-blue-500" />
                <h3 className="text-sm font-black text-white italic uppercase tracking-[0.4em]">COMBAT_OVERDRIVE</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { mult: 2, cost: 400, color: 'blue' },
                  { mult: 4, cost: 1200, color: '#F2A900' }
                ].map((boost, idx) => (
                  <motion.div 
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    className="bg-[#111] border border-white/5 p-8 rounded-[2.5rem] flex items-center justify-between group hover:border-white/20 transition-all relative overflow-hidden shadow-2xl"
                  >
                    <div className="absolute inset-0 bg-scanline opacity-10" />
                    <div className="flex items-center gap-8 relative z-10">
                      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border-2 shadow-2xl relative ${boost.mult === 4 ? 'bg-[#F2A900]/10 border-[#F2A900]/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
                        <ICONS.Zap className={`w-10 h-10 drop-shadow-2xl ${boost.mult === 4 ? 'text-[#F2A900]' : 'text-blue-500'}`} />
                        <div className={`absolute -top-2 -right-2 font-black italic rounded-lg px-2 py-1 text-black text-xs ${boost.mult === 4 ? 'bg-[#F2A900]' : 'bg-blue-500'}`}>{boost.mult}X</div>
                      </div>
                      <div>
                        <h4 className="font-black italic text-2xl text-white leading-none mb-2 uppercase tracking-tighter">{boost.mult === 4 ? 'ELITE' : 'OVERDRIVE'} SCAN</h4>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">{boost.mult}X DINNER MULTIPLIER (60S)</p>
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        if (profile?.money >= boost.cost) {
                          try {
                            await userService.buyMultiplier(user.uid, boost.mult, 1, boost.cost);
                            alert(`${boost.mult}X Multiplier Engaged!`);
                          } catch (e: any) { alert(e.message); }
                        } else { alert("INSUFFICIENT_FUNDS"); }
                      }}
                      className={`h-20 px-10 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-2xl active:scale-95 ${boost.mult === 4 ? 'bg-[#F2A900] text-black hover:bg-white' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                    >
                      {boost.cost} G
                    </button>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Skins */}
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="h-1 w-8 bg-red-600" />
                <h3 className="text-sm font-black text-white italic uppercase tracking-[0.4em]">TACTICAL_SKINS</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {allSkins.map(skin => {
                  const SkinIcon = (ICONS as any)[skin.icon || 'Shield'] || ICONS.Tapper;
                  const isSelected = profile?.selectedSkinId === skin.id;
                  const isOwned = profile?.ownedSkins?.includes(skin.id);

                  return (
                    <motion.div 
                      key={skin.id}
                      whileHover={{ y: -5 }}
                      className={`p-5 rounded-3xl border-2 transition-all relative group overflow-hidden shadow-2xl ${
                        isSelected 
                          ? 'bg-red-600/5 border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.1)]' 
                          : 'bg-[#111] border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="absolute inset-0 bg-scanline opacity-10" />
                      <div className="aspect-square bg-black rounded-2xl mb-5 flex items-center justify-center border border-white/5 relative shadow-inner">
                         {skin.image ? (
                            <img src={skin.image} alt="" className="w-full h-full object-contain p-4 transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                         ) : (
                            <SkinIcon className={`w-12 h-12 transition-colors ${isSelected ? 'text-red-500 shadow-2xl' : 'text-white/5'}`} style={skin.color ? { color: skin.color } : {}} />
                         )}
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                      </div>
                      <h4 className="font-black text-xs mb-4 truncate uppercase italic tracking-tighter text-white" style={skin.color ? { color: skin.color } : {}}>{skin.name}</h4>
                      <button 
                        onClick={() => handlePurchase(skin, 'skin')}
                        className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          isOwned
                            ? isSelected ? 'bg-red-600 text-black shadow-xl shadow-red-600/20' : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white border border-white/5'
                            : 'bg-white text-black hover:bg-red-600 shadow-2xl'
                        }`}
                      >
                        {isOwned ? (isSelected ? 'ACTIVE' : 'EQUIP') : `${skin.cost} G`}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
};
