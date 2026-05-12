import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { roomService, Room } from '../services/roomService';
import { ICONS, THEME, SHORE_ITEMS, calculateLevel, calculateRoyalPass, LEVELS } from '../constants';

export const Home: React.FC<{ onNavigate?: (tab: 'home' | 'shop' | 'top' | 'profile' | 'settings' | 'admin' | 'rp' | 'live') => void }> = ({ onNavigate }) => {
  const { profile, user, pendingScore, isSyncing, addScoreLocal, forceSync, rooms } = useAuth();
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

  useEffect(() => {
    userService.getCreatorInfo().then(info => {
      if (info) setCreator({ name: info.name || '', logo: info.logo || '' });
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
    <div className="h-full flex flex-col items-center justify-center p-8 relative overflow-hidden bg-cover bg-center"
         style={{ backgroundImage: `linear-gradient(rgba(15,15,15,0.8), rgba(15,15,15,0.8)), url('https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80')` }}>
      
      {/* Level Up Notification */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.5 }}
            animate={{ opacity: 1, y: 100, scale: 1 }}
            exit={{ opacity: 0, scale: 2 }}
            className="fixed top-0 left-0 right-0 z-[100] flex flex-col items-center pointer-events-none"
          >
            <div className="bg-[#F2A900] text-black px-8 py-4 rounded-2xl shadow-[0_0_50px_rgba(242,169,0,0.5)] border-4 border-black">
              <h1 className="text-4xl font-black italic uppercase tracking-tighter">Level Up!</h1>
              <p className="text-center font-black">Combat Level {level}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Left Navigation */}
      <div className="absolute top-20 left-6 z-20">
        {onNavigate && (
          <button 
            onClick={() => onNavigate('top')}
            className="flex items-center gap-2 bg-black/60 border border-[#F2A900]/30 rounded-lg p-2 px-3 backdrop-blur-sm hover:border-[#F2A900] transition-all group shadow-lg shadow-black/50"
          >
            <ICONS.Trophy className="w-4 h-4 text-[#F2A900] group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black italic uppercase tracking-tighter text-white">TOP</span>
          </button>
        )}
      </div>

      {/* Top Bar Stats */}
      <div className="absolute top-20 right-6 flex flex-col items-end gap-3 z-20">
        {creator && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 mb-1 opacity-20 hover:opacity-100 transition-opacity translate-x-2"
          >
            <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white">Creator: {creator.name}</span>
            {creator.logo && <img src={creator.logo} alt="" className="w-4 h-4 rounded object-contain bg-white/10" referrerPolicy="no-referrer" />}
          </motion.div>
        )}
        <div className="bg-black/60 border border-[#F2A900]/30 rounded-lg p-2 px-3 flex items-center gap-2 backdrop-blur-sm shadow-lg shadow-black/50">
          <ICONS.Zap className="w-4 h-4 text-[#F2A900] animate-pulse" />
          <div className="text-[10px] font-black italic uppercase tracking-tighter">
            Gold: 
            <motion.span 
              key={profile?.money}
              initial={{ scale: 1.5, color: '#F2A900' }}
              animate={{ scale: 1, color: '#FFFFFF' }}
              className="ml-1 text-white text-xs inline-block"
            >
              {profile?.money || 0}
            </motion.span>
          </div>
        </div>

        {onNavigate && (
          <button 
            onClick={() => onNavigate('live')}
            className={`flex items-center gap-2 border rounded-lg p-2 px-3 backdrop-blur-sm transition-all group ${
              rooms.length > 0 
                ? 'bg-red-600/20 border-red-600/40 animate-pulse hover:bg-red-600 hover:text-white' 
                : 'bg-black/40 border-white/5 hover:border-gray-500'
            }`}
          >
            {rooms.length > 0 ? (
              <>
                <ICONS.Live className="w-3.5 h-3.5 text-red-500 group-hover:text-white" />
                <span className="text-[9px] font-black italic uppercase tracking-tighter text-red-500 group-hover:text-white">LIVE NOW</span>
              </>
            ) : (
              <>
                <ICONS.LiveOff className="w-3.5 h-3.5 text-gray-500 group-hover:text-white" />
                <span className="text-[9px] font-black italic uppercase tracking-tighter text-gray-500 group-hover:text-white">OFF AIR</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Royal Pass Bar */}
      <div className="absolute top-4 left-6 right-6 z-10">
        <div className="flex justify-between items-end mb-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-[#F2A900] italic uppercase tracking-tighter">Royal Pass S1</span>
            {isBoostActive && (
              <motion.span 
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="bg-[#F2A900] text-black text-[7px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 shadow-[0_0_10px_#F2A900]"
              >
                2X • {formatTime(timeLeft)}
              </motion.span>
            )}
          </div>
          <span className="text-xs font-black italic">LVL {rpLevel}</span>
        </div>
        <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${rpProgress}%` }}
            className="h-full bg-gradient-to-r from-[#F2A900] to-[#FFD700] shadow-[0_0_10px_rgba(242,169,0,0.5)]" 
          />
        </div>
      </div>

      <div className="absolute top-20 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <h2 className="text-gray-400 font-black uppercase tracking-widest text-xs">Chicken Dinners</h2>
          <motion.div
            animate={{ 
              opacity: isSyncing ? [0.4, 1, 0.4] : [0.3, 1, 0.3],
              scale: isSyncing ? [1, 1.2, 1] : 1
            }}
            transition={{ duration: isSyncing ? 0.5 : 2, repeat: Infinity }}
          >
            <ICONS.Flame className={`w-3 h-3 ${isSyncing ? 'text-white' : 'text-[#F2A900]'}`} />
          </motion.div>
        </div>
        <div className="text-6xl font-black text-white italic drop-shadow-[0_2px_10px_rgba(242,169,0,0.5)] flex items-center justify-center gap-4">
          {((profile?.score || 0) + pendingScore).toLocaleString() || 0}
          {isSyncing && (
            <motion.div 
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -right-12"
            >
              <ICONS.Alert className="w-6 h-6 text-[#F2A900] animate-spin" />
            </motion.div>
          )}
        </div>
        {isSyncing && (
           <motion.p 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="text-[8px] font-black text-[#F2A900] uppercase tracking-[0.2em] mt-2"
           >
             Auto-Saving Progress...
           </motion.p>
        )}
      </div>

      <motion.button
        onMouseDown={handleTap}
        onTouchStart={handleTap}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96, y: 4 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="group relative w-64 h-64 rounded-full flex items-center justify-center transition-shadow bg-transparent border-none active:outline-none focus:outline-none"
      >
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-[#F2A900] rounded-full opacity-10 blur-3xl group-active:opacity-40 transition-opacity" />
        
        {/* Main Circle Hardware Look */}
        <div className="absolute inset-4 border-[12px] border-[#222] rounded-full group-active:border-[#F2A900] shadow-inner transition-colors" />
        <div className="absolute inset-2 border border-[#F2A900]/20 rounded-full animate-[pulse_3s_infinite]" />
        
        {/* Decorative Internal Ring */}
        <div className="absolute inset-10 border-2 border-dashed border-[#333] rounded-full opacity-50" />

        {/* Skin Display */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10 flex flex-col items-center"
        >
          {currentSkin.image ? (
            <img src={currentSkin.image} alt="" className="w-48 h-48 object-contain drop-shadow-[0_10px_30px_rgba(242,169,0,0.4)]" referrerPolicy="no-referrer" />
          ) : (
            <SkinIcon className="w-32 h-32 text-[#F2A900] drop-shadow-[0_0_20px_rgba(242,169,0,0.6)]" />
          )}
          <span className="mt-4 text-[9px] font-black uppercase tracking-[0.3em] text-[#F2A900] opacity-40">{currentSkin.name}</span>
        </motion.div>
      </motion.button>

      {/* Floating Elements (Shockwaves, Particles, +1s) */}
      <AnimatePresence>
        {shockwaves.map(sw => (
          <motion.div
            key={sw.id}
            initial={{ opacity: 1, scale: 0.5 }}
            animate={{ opacity: 0, scale: 3 }}
            className="fixed pointer-events-none z-40 w-16 h-16 rounded-full border-2 border-[#F2A900]/30 shadow-[0_0_20px_rgba(242,169,0,0.2)]"
            style={{ left: sw.x - 32, top: sw.y - 32 }}
          />
        ))}

        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, x: p.x, y: p.y }}
            animate={{ 
              opacity: 0, 
              x: p.x + p.vx * 10, 
              y: p.y + p.vy * 10,
              scale: 0
            }}
            className="fixed pointer-events-none z-40 w-1.5 h-1.5 bg-[#F2A900] rounded-full shadow-[0_0_8px_#F2A900]"
          />
        ))}

        {taps.map(tap => (
          <motion.div
            key={tap.id}
            initial={{ opacity: 1, y: tap.y - 40, x: tap.x - 20, scale: 0.5, rotate: tap.rotate }}
            animate={{ opacity: 0, y: tap.y - 180, scale: 1.5 }}
            exit={{ opacity: 0 }}
            className="fixed pointer-events-none z-50 text-4xl font-black italic text-[#F2A900] drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
          >
            +{isBoostActive ? 2 : 1}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Manual Sync Button */}
      {pendingScore > 0 && (
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-24 z-50 px-6 w-full flex justify-center"
        >
          <button
            onClick={forceSync}
            disabled={isSyncing}
            className={`flex items-center justify-center gap-3 w-full max-w-sm py-5 rounded-2xl font-black uppercase italic tracking-tighter text-base transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 ${
              isSyncing 
                ? 'bg-gray-800 text-gray-500 border-gray-700' 
                : 'bg-[#F2A900] text-black border-black hover:bg-white hover:-translate-y-2 active:translate-y-0 active:scale-95 shadow-[0_10px_20px_rgba(242,169,0,0.3)]'
            }`}
          >
            {isSyncing ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                  <ICONS.Alert className="w-5 h-5" />
                </motion.div>
                SYCHRONIZING...
              </>
            ) : (
              <>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] opacity-70 mb-1">Unsaved Data Detected</span>
                  <span className="flex items-center gap-2">
                    <ICONS.Zap className="w-5 h-5 fill-current" />
                    SAVE ALL PROGRESS (+{pendingScore})
                  </span>
                </div>
              </>
            )}
          </button>
        </motion.div>
      )}

      <div className="absolute bottom-10 flex gap-2">
        <div className="bg-black/50 border border-[#333] font-black uppercase tracking-widest text-[10px] py-1 px-3 rounded-full">
          Level {level}
        </div>
        <div className="bg-black/50 border border-[#333] font-black uppercase tracking-widest text-[10px] py-1 px-3 rounded-full">
          Tier: {currentLevelRank.rank}
        </div>
      </div>
    </div>
  );
};
