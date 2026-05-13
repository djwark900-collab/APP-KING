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
      <div className="absolute top-20 left-4 z-20 flex flex-col gap-3">
        {onNavigate && (
          <motion.button 
            whileHover={{ x: 3 }}
            onClick={() => onNavigate('top')}
            className="group flex items-center gap-2.5 bg-black/80 border border-white/5 rounded-lg p-2.5 backdrop-blur-md shadow-xl hover:border-[#F2A900]/30 transition-all"
          >
            <ICONS.Trophy className="w-4 h-4 text-[#F2A900]" />
            <div className="flex flex-col items-start leading-none">
              <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Ranking</span>
              <span className="text-[10px] font-black italic text-white uppercase">SURVIVORS</span>
            </div>
          </motion.button>
        )}
      </div>

      {/* HUD: Right - Economy (Compact) */}
      <div className="absolute top-20 right-4 flex flex-col items-end gap-3 z-20">
        <div className="bg-black/80 border border-white/5 rounded-lg p-2.5 pr-4 flex items-center gap-3 backdrop-blur-md shadow-xl">
          <div className="w-8 h-8 bg-[#F2A900]/5 rounded flex items-center justify-center border border-[#F2A900]/10">
            <ICONS.Zap className="w-4 h-4 text-[#F2A900] animate-pulse" />
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Gold</span>
            <motion.span 
              key={profile?.money}
              className="text-lg font-black italic text-white"
            >
              {profile?.money?.toLocaleString() || 0}
            </motion.span>
          </div>
        </div>

        {isBoostActive && (
          <motion.div 
            initial={{ x: 10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-red-600/10 border border-red-600/30 rounded-lg p-1.5 px-3 backdrop-blur-sm flex items-center gap-2.5"
          >
            <ICONS.Zap className="w-3 h-3 text-red-500 animate-bounce" />
            <div className="flex flex-col items-start">
              <span className="text-[11px] font-black italic text-red-500 leading-none">{multiplier}X ACTIVE</span>
              <span className="text-[7px] font-mono text-white/50">{formatTime(timeLeft)}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Center HUD: Season Progress */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-black/40 border border-white/5 rounded-2xl p-3 px-4 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-scanline opacity-[0.03] pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-gradient-to-br from-[#F2A900] to-[#8B0000] rounded-md flex items-center justify-center shadow-lg">
                <ICONS.Crown className="w-4 h-4 text-black" />
              </div>
              <div>
                <h3 className="text-[11px] font-black italic text-white leading-none">S1 SURVIVAL</h3>
                <div className="text-[6px] font-black text-[#F2A900] uppercase tracking-[0.2em] mt-1">LVL {rpLevel} PROG</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest block">RP XP</span>
              <span className="text-[12px] font-black italic text-white leading-none">{rpProgress}%</span>
            </div>
          </div>
          
          <div className="h-1 bg-black rounded-full overflow-hidden border border-white/5 relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${rpProgress}%` }}
              className="h-full bg-gradient-to-r from-[#F2A900] to-[#FFD700] rounded-full relative" 
            />
          </div>
        </div>
      </div>

      {/* Gameplay Core */}
      <div className="flex-1 flex flex-col items-center justify-center relative w-full pt-16">
        {/* Score Readout (Soul/Dynamic) */}
        <div className="absolute top-8 flex flex-col items-center">
          <div className="opacity-30 mb-2 flex flex-col items-center">
            <span className="text-[7px] font-black text-white uppercase tracking-[0.8em]">COMBAT RATING</span>
          </div>
          
          <div className="relative group cursor-default">
            <h1 className="text-7xl font-black text-white italic tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-transform duration-700 group-hover:scale-105">
              {((profile?.score || 0) + pendingScore).toLocaleString() || 0}
            </h1>
            <div className="absolute inset-0 blur-2xl bg-[#F2A900]/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          
          {isSyncing && (
             <p className="text-[7px] font-black text-[#F2A900] uppercase tracking-[0.5em] mt-3 animate-pulse">
               UPLOADING_DATA...
             </p>
          )}
        </div>

        {/* Tactical Interaction Port (Button) */}
        <motion.button
          onMouseDown={handleTap}
          onTouchStart={handleTap}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.94, y: 5 }}
          className="group relative w-64 h-64 flex items-center justify-center bg-transparent transition-all outline-none"
        >
          {/* Hardware Frame UI */}
          <div className="absolute inset-0 bg-stone-900/10 rounded-[3rem] border border-white/5 backdrop-blur-sm" />
          
          {/* Animated Tech Rings */}
          <div className="absolute inset-[-8px] border-2 border-[#F2A900]/10 rounded-[3.5rem] animate-[flicker_10s_infinite]" />
          <div className="absolute inset-[-15px] border border-white/5 rounded-[4rem] animate-pulse opacity-20" />

          {/* Interactive Core */}
          <div className="absolute inset-1.5 bg-gradient-to-br from-[#111] to-[#010101] rounded-[2.8rem] border-2 border-white/5 shadow-2xl transition-colors group-hover:border-[#F2A900]/20">
             <div className="absolute inset-0 bg-black/60 group-active:bg-[#F2A900]/5 transition-colors" />
             
             {/* Corner Markers */}
             <div className="absolute top-3 left-3 w-1.5 h-1.5 border-t border-l border-[#F2A900]/40" />
             <div className="absolute top-3 right-3 w-1.5 h-1.5 border-t border-r border-[#F2A900]/40" />
             <div className="absolute bottom-3 left-3 w-1.5 h-1.5 border-b border-l border-[#F2A900]/40" />
             <div className="absolute bottom-3 right-3 w-1.5 h-1.5 border-b border-r border-[#F2A900]/40" />
          </div>

          {/* Asset/Skin Display */}
          <motion.div
            animate={{ 
              y: [0, -6, 0],
              filter: ["brightness(1)", "brightness(1.1)", "brightness(1)"]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10 flex flex-col items-center"
          >
            <div className="relative group-active:scale-90 transition-transform duration-75">
              <div className="absolute inset-0 bg-[#F2A900] blur-[40px] opacity-[0.08] group-hover:opacity-20 transition-opacity" />
              {currentSkin.image ? (
                <img src={currentSkin.image} alt="" className="w-48 h-48 object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)] relative z-10" referrerPolicy="no-referrer" />
              ) : (
                <SkinIcon className="w-32 h-32 text-[#F2A900] drop-shadow-[0_0_20px_rgba(242,169,0,0.3)] relative z-10" />
              )}
            </div>
            <div className="mt-4 flex flex-col items-center">
               <span className="text-[8px] font-black uppercase tracking-[0.5em] text-white/40 group-hover:text-[#F2A900]/60 transition-colors">{currentSkin.name}</span>
            </div>
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
    </div>
  );
};
