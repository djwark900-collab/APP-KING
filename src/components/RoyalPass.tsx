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
  const rpLevel = Math.min(Math.floor(score / pointsPerLevel) + 1, 50);
  const currentLevelPoints = score % pointsPerLevel;
  const progress = (currentLevelPoints / pointsPerLevel) * 100;

  const handleClaim = async (level: number, reward: any) => {
    if (!user) return;
    try {
      await userService.claimRoyalPassReward(user.uid, level, reward);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const displayRewards = rpRewards.length > 0 ? rpRewards : ROYAL_PASS_REWARDS;

  return (
    <div className="flex flex-col h-full bg-[#0F0F0F] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-[#F2A900]/10 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[30%] bg-[#F2A900]/5 blur-[80px] rounded-full" />

      {/* Header Section */}
      <div className="p-6 pt-8 pb-8 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#F2A900] to-[#8B6E00] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(242,169,0,0.3)] border-2 border-black/20 transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer">
              <ICONS.Crown className="text-black w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[#F2A900] text-[10px] font-black uppercase tracking-[0.3em] bg-black/60 px-2 py-0.5 rounded border border-[#F2A900]/20">SEASON 1</span>
              </div>
              <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-white">ROYAL PASS</h2>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Pass Status</div>
            <div className="text-[#F2A900] font-black italic uppercase text-lg">ELITE ACTIVE</div>
          </div>
        </div>

        {/* Level & Progress Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="col-span-1 bg-black/60 border border-white/5 rounded-2xl p-4 backdrop-blur-md flex flex-col items-center justify-center">
            <span className="text-5xl font-black italic text-[#F2A900] leading-none mb-1">{rpLevel}</span>
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">RP LEVEL</span>
          </div>
          <div className="col-span-2 bg-black/60 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
            <div className="flex justify-between items-end mb-3">
              <span className="text-[10px] font-black text-white uppercase tracking-tighter">Season Progression</span>
              <span className="text-[10px] font-bold text-gray-400">{Math.max(0, pointsPerLevel - currentLevelPoints).toLocaleString()} PTS TO NEXT</span>
            </div>
            <div className="h-4 bg-black/40 rounded-full overflow-hidden border border-white/5 p-1 relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-[#F2A900] to-[#FFD700] rounded-full relative"
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[slide_1s_linear_infinite]" />
              </motion.div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[9px] font-black text-[#F2A900]">Lvl {rpLevel}</span>
              <span className="text-[9px] font-black text-gray-600">Lvl {rpLevel + 1}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tiers Navigation */}
      <div className="px-6 flex gap-4 mb-4 z-10">
        <button className="flex-1 py-3 bg-[#F2A900] text-black rounded-xl font-black text-[10px] uppercase shadow-lg shadow-[#F2A900]/10">ROYAL PASS REWARDS</button>
        <button className="flex-1 py-3 bg-white/5 text-gray-500 rounded-xl font-black text-[10px] uppercase border border-white/5 hover:text-white transition-colors">SEASON MISSIONS</button>
      </div>

      {/* Rewards List */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-4 custom-scrollbar z-10">
        <div className="flex justify-between items-center sticky top-0 py-2 bg-[#0F0F0F]/80 backdrop-blur-sm z-20">
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-[#F2A900] rounded-full" />
            STREAK PROGRESSION 1-25
          </h3>
          {(() => {
            const unclaimedCount = (rpRewards.length > 0 ? rpRewards : ROYAL_PASS_REWARDS).filter(reward => 
              rpLevel >= reward.level && !profile?.claimedRpRewards?.includes(reward.level)
            ).length;
            
            if (unclaimedCount > 0) {
              return (
                <button 
                  onClick={() => userService.claimAllAvailableRewards(user!.uid!, profile.level, rpLevel, (rpRewards.length > 0 ? rpRewards : ROYAL_PASS_REWARDS))}
                  className="text-[9px] font-black uppercase bg-[#F2A900] text-black px-4 py-1.5 rounded-lg shadow-xl shadow-[#F2A900]/20 animate-bounce"
                >
                  COLLECT ALL ({unclaimedCount})
                </button>
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
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: reward.level % 10 * 0.05 }}
              whileHover={isUnlocked && !isClaimed ? { scale: 1.02, x: 5 } : {}}
              className={`p-1 rounded-2xl transition-all relative group overflow-hidden ${
                isUnlocked && !isClaimed ? 'bg-gradient-to-r from-[#F2A900]/50 to-transparent' : 'bg-transparent'
              }`}
            >
              <div className={`p-4 rounded-xl border-2 flex items-center justify-between h-20 transition-all ${
                isClaimed 
                  ? 'bg-black/20 border-white/5 opacity-50' 
                  : isUnlocked 
                    ? 'bg-[#1A1A1A] border-[#F2A900]/30 shadow-xl shadow-black' 
                    : 'bg-[#121212] border-white/5'
              }`}>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center w-14 border-r border-white/5 pr-4 mr-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1 transform -rotate-12 ${
                      isUnlocked ? 'bg-[#F2A900] text-black shadow-[0_0_15px_rgba(242,169,0,0.4)]' : 'bg-[#1A1A1A] text-gray-700 border border-white/5'
                    }`}>
                      <span className="text-sm font-black italic pr-0.5">{reward.level}</span>
                    </div>
                    <span className={`text-[6px] font-black uppercase tracking-widest ${isUnlocked ? 'text-[#F2A900]' : 'text-gray-800'}`}>TIER</span>
                  </div>
                  
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all relative overflow-hidden ${
                    isUnlocked ? 'bg-black border-[#F2A900]/20 shadow-[0_0_15px_rgba(242,169,0,0.1)]' : 'bg-black border-white/5'
                  }`}>
                    {reward.image ? (
                      <img src={reward.image} alt={reward.name} className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                    ) : (
                      <Icon className={`w-6 h-6 ${isUnlocked ? 'text-[#F2A900]' : 'text-gray-800'}`} />
                    )}
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
                        <ICONS.Lock className="w-4 h-4 text-white/30" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className={`font-black uppercase italic tracking-tighter text-sm ${isUnlocked ? 'text-white' : 'text-gray-700'}`} style={reward.color ? { color: reward.color } : {}}>
                      {reward.name}
                    </div>
                    <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                      {reward.type === 'money' ? 'BATTLE COIN REWARD' : reward.type === 'skin' ? 'EPIC TAPPER SKIN' : 'LEGENDARY FRAME'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isUnlocked && !isClaimed ? (
                    <button 
                      onClick={() => handleClaim(reward.level, reward)}
                      className="bg-[#F2A900] text-black px-6 py-2 rounded-lg font-black text-[10px] uppercase shadow-lg shadow-[#F2A900]/20 hover:scale-110 active:scale-95 transition-all group-hover:bg-white"
                    >
                      COLLECT
                    </button>
                  ) : isClaimed ? (
                    <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg">
                      <ICONS.Check className="w-3 h-3 text-green-500" />
                      <span className="text-[8px] font-black text-green-500 uppercase">SECURED</span>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center">
                      <ICONS.Lock className="w-4 h-4 text-gray-800" />
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
