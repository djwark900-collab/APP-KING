import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ROYAL_PASS_REWARDS, ICONS } from '../constants';
import { userService } from '../services/userService';
import { motion } from 'motion/react';

export const RoyalPass: React.FC = () => {
  const { profile, user, rpRewards } = useAuth();
  
  useEffect(() => {
    // We now use rpRewards from context which is cached
  }, [user]);

  // RP points are usually separate, but we use score for now
  // Every 2000 points is 1 RP level as defined in constants.ts
  const pointsPerLevel = 2000;
  const score = profile?.score || 0;
  const rpLevel = Math.min(Math.floor(score / pointsPerLevel) + 1, 25);
  const currentLevelPoints = score % pointsPerLevel;
  const progress = rpLevel >= 25 ? 100 : (currentLevelPoints / pointsPerLevel) * 100;

  const [claimingLevels, setClaimingLevels] = useState<number[]>([]);

  const handleClaim = async (level: number, reward: any) => {
    if (!user || claimingLevels.includes(level)) return;
    setClaimingLevels(prev => [...prev, level]);
    try {
      await userService.claimRoyalPassReward(user.uid, level, reward);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setClaimingLevels(prev => prev.filter(l => l !== level));
    }
  };

  const displayRewards = rpRewards.length > 0 ? rpRewards : ROYAL_PASS_REWARDS;

  return (
    <div className="flex flex-col h-full bg-[#070707] relative overflow-hidden font-mono">
      {/* Background Decor - More intense on mobile */}
      <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[40%] bg-[#F2A900]/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[40%] bg-red-600/5 blur-[100px] rounded-full" />

      {/* Header Section - Modern Mobile Game Style */}
      <div className="p-4 pt-6 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <motion.div 
                animate={{ rotate: [0, 5, 0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center border-2 border-[#F2A900] shadow-[0_0_25px_rgba(242,169,0,0.2)] relative z-10"
              >
                <ICONS.Crown className="text-[#F2A900] w-9 h-9 drop-shadow-[0_0_10px_rgba(242,169,0,0.5)]" />
              </motion.div>
              <div className="absolute -inset-1 bg-[#F2A900]/20 blur-lg rounded-2xl" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1 h-1 bg-[#F2A900] rounded-full" />
                <span className="text-[#F2A900] text-[8px] font-black uppercase tracking-[0.4em] italic">SEASON 01</span>
              </div>
              <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-white flex items-center gap-2">
                ROYAL <span className="text-[#F2A900]">PASS</span>
              </h2>
            </div>
          </div>
          
          <div className="bg-black/60 border border-white/10 rounded-xl px-4 py-2 backdrop-blur-md text-center transform -skew-x-12 shadow-lg">
             <div className="text-[14px] font-black italic text-white leading-none">ELITE</div>
             <div className="text-[7px] font-black text-[#F2A900] uppercase tracking-widest mt-0.5">STATUS</div>
          </div>
        </div>

        {/* Level Progression Card - Redesigned for Mobile Impact */}
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border border-white/10 rounded-[2rem] p-5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#F2A900]/5 rounded-full blur-3xl -mr-10 -mt-10" />
          
          <div className="flex items-center gap-5 relative z-10">
            <div className="relative shrink-0">
               <svg className="w-20 h-20 transform -rotate-90">
                 <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                 <motion.circle 
                   cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" strokeDasharray={226.2} strokeDashoffset={226.2 - (226.2 * progress) / 100}
                   fill="transparent" className="text-[#F2A900]" strokeLinecap="round"
                   initial={{ strokeDashoffset: 226.2 }}
                   animate={{ strokeDashoffset: 226.2 - (226.2 * progress) / 100 }}
                   transition={{ duration: 1.5, ease: "easeOut" }}
                 />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className="text-2xl font-black italic text-white italic -mb-1">{rpLevel}</span>
                 <span className="text-[6px] font-black text-gray-500 uppercase tracking-widest">RANK</span>
               </div>
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-black text-white italic uppercase tracking-tighter">SURVIVOR PROGRESS</span>
                <span className="text-[8px] font-bold text-[#F2A900] uppercase tracking-widest">{Math.max(0, pointsPerLevel - currentLevelPoints).toLocaleString()} <span className="text-white/40">PTS LEFT</span></span>
              </div>
              <div className="h-2.5 bg-black rounded-full overflow-hidden border border-white/5 p-0.5 shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-[#F2A900] to-[#FFD700] rounded-full relative shadow-[0_0_10px_rgba(242,169,0,0.5)]"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:10px_10px] animate-[slide_1s_linear_infinite]" />
                </motion.div>
              </div>
              <div className="flex justify-between mt-2">
                 <div className="flex items-center gap-1">
                   <div className="w-1 h-1 bg-[#F2A900] rounded-full" />
                   <span className="text-[8px] font-black text-gray-500">TIER {rpLevel}</span>
                 </div>
                 <span className="text-[8px] font-black text-gray-700 italic">GOAL {rpLevel + 1}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tiers Navigation - Smaller for mobile */}
      <div className="px-4 flex gap-2 mb-4 z-10 shrink-0">
        <button className="flex-1 py-3.5 bg-white text-black rounded-2xl font-black text-[9px] uppercase shadow-xl transition-all active:scale-95">REWARDS</button>
        <button className="flex-1 py-3.5 bg-[#1A1A1A] text-gray-500 rounded-2xl font-black text-[9px] uppercase border border-white/5 active:scale-95">MISSIONS</button>
      </div>

      {/* Rewards List */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-3 custom-scrollbar z-10">
        <div className="flex justify-between items-center sticky top-0 py-3 bg-[#070707]/90 backdrop-blur-xl z-20 border-b border-white/5 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-[#F2A900] rounded-full animate-pulse" />
            <h3 className="text-[10px] font-black text-white italic uppercase tracking-[0.1em]">PROGRESSION TRAL: 01-25</h3>
          </div>
          {(() => {
            const unclaimedCount = displayRewards.filter(reward => 
              rpLevel >= reward.level && !profile?.claimedRpRewards?.includes(reward.level)
            ).length;
            
            if (unclaimedCount > 0) {
              return (
                <motion.button 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: [0.9, 1.05, 0.9] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  onClick={() => userService.claimAllAvailableRewards(user!.uid!, profile?.level || 1, rpLevel, displayRewards)}
                  className="text-[9px] font-black uppercase bg-[#F2A900] text-black px-4 py-2 rounded-xl shadow-lg shadow-[#F2A900]/20 active:scale-95"
                >
                  COLLECT ({unclaimedCount})
                </motion.button>
              );
            }
            return null;
          })()}
        </div>
        
        {displayRewards.map((reward) => {
          const isUnlocked = rpLevel >= reward.level;
          const isClaimed = profile?.claimedRpRewards?.includes(reward.level);
          const Icon = ICONS[reward.icon as keyof typeof ICONS] || ICONS.Zap;
          
          return (
            <motion.div 
              key={reward.level}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className={`relative overflow-hidden group ${isUnlocked && !isClaimed ? 'z-10' : 'z-0'}`}
            >
              {/* Unlock Highlight Effect */}
              {isUnlocked && !isClaimed && (
                <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-[#F2A900]/30 to-transparent animate-[shimmer_2s_infinite] pointer-events-none" />
              )}
              
              <div className={`p-3 rounded-2xl border-2 flex items-center justify-between h-20 transition-all ${
                isClaimed 
                  ? 'bg-black/50 border-white/5 opacity-50 grayscale-[0.5]' 
                  : isUnlocked 
                    ? 'bg-[#1A1A1A] border-[#F2A900]/30 shadow-2xl shadow-black ring-1 ring-[#F2A900]/10' 
                    : 'bg-black/80 border-white/5 opacity-80'
              }`}>
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex flex-col items-center justify-center w-12 border-r border-white/10 pr-4 shrink-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1 transform skew-x-[-10deg] ${
                      isUnlocked 
                        ? 'bg-[#F2A900] text-black shadow-lg shadow-[#F2A900]/20' 
                        : 'bg-[#121212] text-gray-700 border border-white/5'
                    }`}>
                      <span className="text-[12px] font-black italic">{reward.level}</span>
                    </div>
                    <span className={`text-[6px] font-black uppercase tracking-widest ${isUnlocked ? 'text-[#F2A900]' : 'text-gray-800'}`}>TIER</span>
                  </div>
                  
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all relative overflow-hidden shrink-0 ${
                    isUnlocked ? 'bg-black border-[#F2A900]/20' : 'bg-black border-white/5'
                  }`}>
                    {reward.image ? (
                      <img src={reward.image} alt={reward.name} className="w-full h-full object-cover p-0.5 rounded-xl" referrerPolicy="no-referrer" />
                    ) : (
                      <Icon className={`w-7 h-7 ${isUnlocked ? 'text-[#F2A900]' : 'text-gray-900'}`} />
                    )}
                    
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                        <ICONS.Lock className="w-4 h-4 text-white/20" />
                      </div>
                    )}
                  </div>
 
                  <div className="truncate flex-1">
                    <div className={`font-black uppercase italic tracking-tighter text-sm truncate ${isUnlocked ? 'text-white' : 'text-gray-700'}`} style={reward.color ? { color: reward.color } : {}}>
                      {reward.name}
                    </div>
                    <div className={`text-[8px] font-black uppercase tracking-widest mt-1 ${isUnlocked ? 'text-[#F2A900]/60' : 'text-gray-800'}`}>
                      {reward.type === 'money' ? 'BATTLE COIN' : reward.type === 'skin' ? 'EPIC SKIN' : 'THEMED FRAME'}
                    </div>
                  </div>
                </div>
 
                <div className="shrink-0 ml-4">
                  {isUnlocked && !isClaimed ? (
                    <motion.button 
                      disabled={claimingLevels.includes(reward.level)}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleClaim(reward.level, reward)}
                      className={`w-24 py-3 rounded-xl font-black text-[9px] uppercase shadow-lg transition-all transform active:scale-95 ${
                        claimingLevels.includes(reward.level) ? 'bg-white/10 text-white/20' : 'bg-[#F2A900] text-black shadow-[#F2A900]/20 hover:bg-white'
                      }`}
                    >
                      {claimingLevels.includes(reward.level) ? 'SYNCING...' : 'COLLECT'}
                    </motion.button>
                  ) : isClaimed ? (
                    <div className="flex flex-col items-center justify-center px-4">
                      <ICONS.Check className="w-5 h-5 text-green-500 mb-1" />
                      <span className="text-[6px] font-black text-green-500 uppercase tracking-widest">OBTAINED</span>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center">
                      <ICONS.Lock className="w-4 h-4 text-gray-800 opacity-50" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>

  );
};
