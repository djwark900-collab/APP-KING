import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { ICONS, THEME, SHORE_ITEMS, calculateLevel, calculateRoyalPass, LEVELS } from '../constants';

export const Home: React.FC<{ onNavigate?: (tab: 'home' | 'shop' | 'top' | 'profile' | 'settings' | 'admin' | 'rp') => void }> = ({ onNavigate }) => {
  const { profile, user, pendingScore, isSyncing, addScoreLocal, forceSync } = useAuth();
  const [taps, setTaps] = useState<{ id: number; x: number; y: number; rotate: number }[]>([]);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; vx: number; vy: number }[]>([]);
  const [shockwaves, setShockwaves] = useState<{ id: number; x: number; y: number }[]>([]);
  
  const level = profile?.level || calculateLevel(profile?.score || 0);
  const rpLevel = profile?.rpLevel || calculateRoyalPass(profile?.score || 0).level;
  const isBoostActive = profile?.multiplierExpiry?.toDate() > new Date();
  const multiplier = isBoostActive ? (profile?.activeMultiplier || 2) : 1;

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (!user) return;
    setSessionTaps(prev => prev + 1);
    
    // UI Feedback Coordinate Logic
    const clientX = 'touches' in e ? (e as any).touches[0].clientX : (e as any).clientX;
    const clientY = 'touches' in e ? (e as any).touches[0].clientY : (e as any).clientY;
    
    // Create +1 indicator
    const tapId = Date.now();
    setTaps(prev => [...prev, { id: tapId, x: clientX, y: clientY, rotate: Math.random() * 40 - 20 }]);
    setTimeout(() => setTaps(prev => prev.filter(t => t.id !== tapId)), 800);

    // Create Shockwave
    const shockId = Date.now() + 1;
    setShockwaves(prev => [...prev, { id: shockId, x: clientX, y: clientY }]);
    setTimeout(() => setShockwaves(prev => prev.filter(s => s.id !== shockId)), 500);

    // Create Particles
    const newParticles = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i + 10,
      x: clientX,
      y: clientY,
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.5) * 15 - 5
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id))), 1000);

    // Local Update (Immediate UI response via context)
    addScoreLocal(multiplier);
  };

  const currentSkinId = profile?.selectedSkinId || 'default';
  const currentSkin = (SHORE_ITEMS.skins as any[]).find(s => s.id === currentSkinId) || SHORE_ITEMS.skins[0];
  const SkinIcon = (ICONS as any)[currentSkin.icon || 'Shield'] || ICONS.Tapper;
  const rpProgress = calculateRoyalPass(profile?.score || 0).progress;
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isRPModalOpen, setIsRPModalOpen] = useState(false);
  const [rpTab, setRpTab] = useState<'rewards' | 'missions'>('rewards');
  const [sessionTaps, setSessionTaps] = useState(0);
  const [claimingMissions, setClaimingMissions] = useState<string[]>([]);
  const [claimingRp, setClaimingRp] = useState<number[]>([]);

  const MISSIONS = [
    { id: 'm1', goal: 7, reward: 200, label: 'QUICK_STRIKE' },
    { id: 'm2', goal: 100, reward: 250, label: 'STEADY_FIRE' },
    { id: 'm3', goal: 200, reward: 300, label: 'ELITE_COMMANDER' }
  ];

  useEffect(() => {
    if (!isBoostActive || !profile?.multiplierExpiry) {
      setTimeLeft(0);
      return;
    }

    const interval = setInterval(() => {
      const expiry = profile?.multiplierExpiry?.toDate();
      if (!expiry) {
        setTimeLeft(0);
        clearInterval(interval);
        return;
      }
      const remaining = expiry.getTime() - new Date().getTime();
      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [profile?.multiplierExpiry, isBoostActive]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / 1000 / 60) % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const [prevLevel, setPrevLevel] = useState(level);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [creator, setCreator] = useState<{name: string, logo: string} | null>(null);
  const [appConfig, setAppConfig] = useState<{ homeBackground?: string }>({});

  useEffect(() => {
    userService.getCreatorInfo().then(info => {
      if (info) setCreator({ name: info.name || '', logo: info.logo || '' });
    });
    userService.getAppConfig().then(config => {
      if (config) setAppConfig(config);
    });
  }, []);

  useEffect(() => {
    if (level > prevLevel) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
      setPrevLevel(level);
    }
  }, [level, prevLevel]);

  const currentLevelRank = LEVELS.findLast(l => level >= l.min) || LEVELS[0];
  const { topSurvivors, rpRewards } = useAuth();
  const topPlayer = topSurvivors?.[0];

  const handleClaimMission = async (mId: string, reward: number) => {
    if (!user || claimingMissions.includes(mId)) return;
    if (profile?.claimedMissions?.includes(mId)) return;
    
    setClaimingMissions(prev => [...prev, mId]);
    try {
      await userService.addBulkScore(user.uid, profile?.score || 0, reward);
      const updatedClaimed = [...(profile?.claimedMissions || []), mId];
      await userService.updateProfile(user.uid, { claimedMissions: updatedClaimed });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setClaimingMissions(prev => prev.filter(id => id !== mId));
    }
  };

  const handleClaimRpReward = async (level: number, reward: any) => {
    if (!user || claimingRp.includes(level)) return;
    if (profile?.claimedRpRewards?.includes(level)) return;

    setClaimingRp(prev => [...prev, level]);
    try {
      await userService.claimRoyalPassReward(user.uid, level, reward);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setClaimingRp(prev => prev.filter(l => l !== level));
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 relative overflow-hidden bg-cover bg-center font-mono selection:bg-[#F2A900] selection:text-black"
         style={{ backgroundImage: `linear-gradient(rgba(7,7,7,0.85), rgba(7,7,7,1)), url('${appConfig.homeBackground || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80'}')` }}>
      
      {/* Background FX Layers */}
      <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none mix-blend-overlay" />
      <div className="absolute inset-0 bg-scanline opacity-[0.05] pointer-events-none" />
      
      {/* Tactical Grid Overlay with Flicker */}
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none animate-[flicker_8s_infinite]" 
           style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(242,169,0,0.4) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      
      {/* Dynamic Vignette */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />

      {/* Radar Scanning Line */}
      <motion.div 
        animate={{ top: ['-10%', '110%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#F2A900]/10 to-transparent z-0 pointer-events-none"
      />

      {/* Level Up Notification */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none px-4"
          >
            <div className="bg-black/95 border-y border-[#F2A900] w-full py-16 flex flex-col items-center backdrop-blur-2xl relative overflow-hidden">
               <div className="absolute inset-0 bg-[#F2A900]/5 animate-pulse" />
               <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#F2A900] to-transparent" />
               <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#F2A900] to-transparent" />
               
               <motion.div 
                 animate={{ opacity: [0.3, 1, 0.3] }}
                 transition={{ duration: 1.5, repeat: Infinity }}
                 className="text-[#F2A900] text-[8px] font-black tracking-[0.8em] mb-6 uppercase"
               >
                 AUTHORIZED PERSONNEL ONLY
               </motion.div>
               <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white drop-shadow-[0_0_40px_rgba(242,169,0,0.6)]">PROMOTED</h1>
               <div className="flex items-center gap-6 mt-6">
                 <div className="h-[2px] w-16 bg-gradient-to-r from-transparent to-[#F2A900]/40" />
                 <p className="text-2xl font-black text-[#F2A900] uppercase italic tracking-widest">LVL {level}</p>
                 <div className="h-[2px] w-16 bg-gradient-to-l from-transparent to-[#F2A900]/40" />
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD: Left - Rank (Compact) */}
      <div className="absolute top-16 left-4 z-20 flex flex-col gap-2 scale-90 origin-top-left">
        {topPlayer && (
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="group flex items-center gap-2.5 bg-black/40 border border-white/5 rounded-lg p-2 backdrop-blur-md shadow-xl"
          >
            <div className="relative">
              <div className="w-7 h-7 rounded-lg bg-black border border-white/10 overflow-hidden">
                {topPlayer.photoURL ? (
                  <img src={topPlayer.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <ICONS.Profile className="w-3 h-3 text-[#F2A900] mx-auto mt-2" />
                )}
              </div>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full flex items-center justify-center border border-black animate-pulse">
                 <span className="text-[5px] font-black text-white">#1</span>
              </div>
            </div>
            <div className="flex flex-col items-start leading-none pr-2 border-r border-white/10">
              <span className="text-[5px] font-black text-red-500 uppercase tracking-widest mb-0.5">TOP_DOG</span>
              <span className="text-[9px] font-black italic text-white uppercase truncate max-w-[60px]">
                {topPlayer.displayName || 'SURVIVOR'}
              </span>
            </div>
            <div className="flex flex-col items-start leading-none">
              <span className="text-[9px] font-black text-[#F2A900] italic">
                {topPlayer.score?.toLocaleString()}
              </span>
              <span className="text-[5px] font-black text-gray-400 uppercase tracking-widest">DINNERS</span>
            </div>
          </motion.div>
        )}

        {onNavigate && (
          <div className="flex flex-col gap-2">
            <motion.button 
              whileHover={{ x: 3 }}
              onClick={() => onNavigate('shop')}
              className="group flex items-center gap-2 bg-black/40 border border-white/5 rounded-lg p-2 backdrop-blur-md shadow-xl hover:border-yellow-400/30 transition-all w-fit"
            >
              <ICONS.Zap className="w-3 h-3 text-yellow-400" />
              <span className="text-[8px] font-black italic text-white uppercase">SHOP</span>
            </motion.button>

            <motion.button 
              whileHover={{ x: 3 }}
              onClick={() => onNavigate('top')}
              className="group flex items-center gap-2 bg-black/40 border border-white/5 rounded-lg p-2 backdrop-blur-md shadow-xl hover:border-[#F2A900]/30 transition-all w-fit"
            >
              <ICONS.Trophy className="w-3 h-3 text-[#F2A900]" />
              <span className="text-[8px] font-black italic text-white uppercase">RECORDS</span>
            </motion.button>
          </div>
        )}
      </div>

      {/* HUD: Economy (Top Row) */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-30">
        <div className="bg-black/60 border border-white/10 rounded-full p-1.5 px-4 flex items-center gap-3 backdrop-blur-xl shadow-2xl">
          <ICONS.Zap className="w-3 h-3 text-yellow-400 animate-pulse" />
          <motion.span 
            key={profile?.money}
            className="text-xs font-black italic text-white"
          >
            {profile?.money?.toLocaleString() || 0} G
          </motion.span>
        </div>

        {isBoostActive && (
          <motion.div 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-red-600/20 border border-red-600/30 rounded-lg p-1 px-3 backdrop-blur-sm flex items-center gap-2 scale-75"
          >
            <ICONS.Zap className="w-2.5 h-2.5 text-red-500 animate-bounce" />
            <span className="text-[8px] font-black italic text-red-500 leading-none">{multiplier}X</span>
            <span className="text-[7px] font-mono text-white/50">{formatTime(timeLeft)}</span>
          </motion.div>
        )}
      </div>

      {/* Center HUD: Season Progress */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[70%] z-10 px-4">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsRPModalOpen(true)}
          className="w-full bg-black/20 border border-white/5 rounded-full p-2 px-4 backdrop-blur-md relative overflow-hidden group"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ICONS.Crown className="w-3 h-3 text-[#F2A900]" />
              <span className="text-[8px] font-black italic text-white whitespace-nowrap uppercase">ROYAL_PASS</span>
            </div>
            <div className="flex-1 h-1 bg-black/50 rounded-full overflow-hidden border border-white/5 relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${rpProgress}%` }}
                className="h-full bg-[#F2A900]" 
              />
            </div>
            <span className="text-[8px] font-black italic text-[#F2A900]">{rpProgress}%</span>
          </div>
        </motion.button>
      </div>

      {/* Gameplay Core */}
      <div className="flex-1 flex flex-col items-center justify-center relative w-full pt-16">
        {/* Score Readout (Minimal) */}
        <div className="absolute top-4 flex flex-col items-center">
          <motion.h1 
            key={profile?.score}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="text-6xl font-black text-white italic tracking-tighter drop-shadow-2xl"
          >
            {((profile?.score || 0) + pendingScore).toLocaleString()}
          </motion.h1>
          <div className="flex items-center gap-2 opacity-40">
            <div className="h-[1px] w-4 bg-[#F2A900]" />
            <span className="text-[6px] font-black text-white uppercase tracking-[0.5em]">DINNERS</span>
            <div className="h-[1px] w-4 bg-[#F2A900]" />
          </div>
        </div>

        {/* Tactical Interaction Port (Small) */}
        <motion.button
          onMouseDown={handleTap}
          onTouchStart={handleTap}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.92 }}
          className="group relative w-48 h-48 flex items-center justify-center bg-transparent outline-none"
        >
          <div className="absolute inset-4 bg-stone-900/10 rounded-full border border-white/5 backdrop-blur-sm" />
          <div className="absolute inset-0 border border-[#F2A900]/5 rounded-full animate-pulse" />

          {/* Asset/Skin Display */}
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10 flex flex-col items-center"
          >
            <div className="relative group-active:scale-90 transition-transform duration-75">
              {currentSkin.image ? (
                <img src={currentSkin.image} alt="" className="w-32 h-32 object-contain drop-shadow-2xl" referrerPolicy="no-referrer" />
              ) : (
                <SkinIcon className="w-24 h-24 text-[#F2A900] drop-shadow-[0_0_20px_rgba(242,169,0,0.3)]" />
              )}
            </div>
            <span className="mt-2 text-[6px] font-black uppercase tracking-[0.4em] text-white/30">{currentSkin.name}</span>
          </motion.div>
        </motion.button>
      </div>

      {/* Footer Info (Small/Compact) */}
      <div className="absolute bottom-8 w-full px-8 flex items-center justify-between z-20">
        <div className="flex gap-3">
           <div className="bg-black/80 border-l border-[#F2A900] border-y border-white/5 border-r border-white/5 px-4 py-2 rounded-r-lg flex flex-col items-start backdrop-blur-md shadow-xl">
              <span className="text-[11px] font-black italic text-white leading-none mb-0.5">LVL {level}</span>
              <span className="text-[6px] font-black text-gray-500 uppercase tracking-widest">{currentLevelRank.rank}</span>
           </div>
        </div>

        {pendingScore > 0 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={forceSync}
            className="flex items-center gap-3 bg-[#F2A900] text-black p-2 px-4 rounded-lg font-black uppercase text-[9px] shadow-lg shadow-[#F2A900]/10 hover:bg-white transition-colors"
          >
            <ICONS.Zap className="w-3 h-3" />
            <span>SYNC PROGRESS</span>
          </motion.button>
        )}
      </div>

      {/* Tactical Feedback Particles */}
      <AnimatePresence>
        {shockwaves.map(sw => (
          <motion.div
            key={sw.id}
            initial={{ opacity: 1, scale: 0.5 }}
            animate={{ opacity: 0, scale: 4 }}
            className="fixed pointer-events-none z-40 w-16 h-16 rounded-full border border-[#F2A900]/50"
            style={{ left: sw.x - 32, top: sw.y - 32 }}
          />
        ))}

        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, x: p.x, y: p.y }}
            animate={{ 
              opacity: 0, 
              x: p.x + p.vx * 15, 
              y: p.y + p.vy * 15,
              scale: 0
            }}
            className="fixed pointer-events-none z-40 w-1 h-1 bg-[#F2A900] rounded-sm transform rotate-45"
          />
        ))}

        {taps.map(tap => (
          <motion.div
            key={tap.id}
            initial={{ opacity: 0, y: tap.y, x: tap.x - 20, scale: 0.5 }}
            animate={{ opacity: 1, y: tap.y - 120, scale: 1.5 }}
            exit={{ opacity: 0 }}
            className="fixed pointer-events-none z-50 flex items-center gap-1"
          >
            <span className="text-4xl font-black italic text-[#F2A900] drop-shadow-[0_0_15px_rgba(0,0,0,1)]">+{multiplier}</span>
            <ICONS.Zap className="w-6 h-6 text-[#F2A900] fill-current drop-shadow-[0_0_10px_rgba(242,169,0,0.5)]" />
          </motion.div>
        ))}
      </AnimatePresence>
      {/* Royal Pass Modal */}
      <AnimatePresence>
        {isRPModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-scanline opacity-10" />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-lg bg-[#111] border border-white/5 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] relative flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">ROYAL_PASS</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-1 h-1 bg-[#F2A900] rounded-full animate-pulse" />
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">SEASON 01: GENESIS PROTOCOL</span>
                  </div>
                </div>
                <button onClick={() => setIsRPModalOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                  <ICONS.Logout className="w-4 h-4 rotate-45" />
                </button>
              </div>

              <div className="p-4 bg-black/40 flex items-center gap-2">
                <button 
                  onClick={() => setRpTab('rewards')}
                  className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${rpTab === 'rewards' ? 'bg-[#F2A900] text-black' : 'bg-white/5 text-gray-500'}`}
                >
                  REWARDS
                </button>
                <button 
                  onClick={() => setRpTab('missions')}
                  className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${rpTab === 'missions' ? 'bg-[#F2A900] text-black' : 'bg-white/5 text-gray-500'}`}
                >
                  MISSIONS
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
                {rpTab === 'rewards' ? (
                  <div className="grid gap-4">
                    {rpRewards.map((reward) => {
                      const isClaimed = profile?.claimedRpRewards?.includes(reward.level);
                      return (
                        <div key={reward.level} className={`p-5 rounded-3xl border flex items-center justify-between transition-all ${rpLevel >= reward.level ? 'bg-[#1A1A1A] border-[#F2A900]/20' : 'bg-black/50 border-white/5 opacity-50'}`}>
                          <div className="flex items-center gap-6">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl italic border-2 ${rpLevel >= reward.level ? 'bg-[#F2A900] border-black text-black' : 'bg-black border-white/10 text-white/20'}`}>
                              {reward.level}
                            </div>
                            <div>
                              <span className="text-[7px] font-black text-gray-500 uppercase tracking-[0.2em]">{reward.type} MODULE</span>
                              <h4 className="text-sm font-black italic text-white uppercase">{reward.name || 'DATA_REWARD'}</h4>
                            </div>
                          </div>
                          
                          {isClaimed ? (
                            <ICONS.Check className="w-5 h-5 text-green-500" />
                          ) : rpLevel >= reward.level ? (
                            <motion.button
                              disabled={claimingRp.includes(reward.level)}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleClaimRpReward(reward.level, reward)}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                                claimingRp.includes(reward.level) ? 'bg-white/5 text-white/20' : 'bg-[#F2A900] text-black hover:bg-white'
                              }`}
                            >
                              {claimingRp.includes(reward.level) ? '...' : 'CLAIM'}
                            </motion.button>
                          ) : (
                            <ICONS.Lock className="w-4 h-4 text-gray-800" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {MISSIONS.map(mission => {
                      const isCompleted = sessionTaps >= mission.goal;
                      const isClaimed = profile?.claimedMissions?.includes(mission.id);
                      const progress = Math.min(100, (sessionTaps / mission.goal) * 100);
                      
                      return (
                        <div key={mission.id} className="p-6 rounded-[2.5rem] bg-black/40 border border-white/5 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-8 bg-[#F2A900]/5 rounded-full blur-3xl" />
                           <div className="flex items-center justify-between mb-6">
                              <div>
                                <h4 className="text-xl font-black italic text-white uppercase tracking-tighter leading-none mb-1">{mission.label}</h4>
                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">TAP {mission.goal} TIMES</p>
                              </div>
                              <div className="text-right">
                                <span className="text-[14px] font-black italic text-[#F2A900] leading-none">+{mission.reward} XP</span>
                              </div>
                           </div>
                           
                           <div className="relative">
                             <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-6">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${progress}%` }}
                                 className="h-full bg-gradient-to-r from-blue-600 to-[#F2A900]" 
                               />
                             </div>
                             
                             <button 
                              disabled={!isCompleted || isClaimed || claimingMissions.includes(mission.id)}
                              onClick={() => handleClaimMission(mission.id, mission.reward)}
                              className={`w-full py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                isClaimed ? 'bg-white/5 text-white/10' :
                                isCompleted ? 'bg-white text-black hover:bg-[#F2A900]' : 
                                'bg-white/5 text-gray-500'
                              }`}
                             >
                               {isClaimed ? 'SECURED' : claimingMissions.includes(mission.id) ? 'CLAIMING...' : isCompleted ? 'CLAIM XP' : `${sessionTaps} / ${mission.goal}`}
                             </button>
                           </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

