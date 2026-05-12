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
      {/* Header Section */}
      <div className="p-6 pt-8 pb-12 bg-gradient-to-b from-[#F2A900]/20 to-transparent relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ICONS.Crown className="w-32 h-32 rotate-12" />
        </div>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-[#F2A900] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(242,169,0,0.3)] border-2 border-black rotate-3">
            <ICONS.Crown className="text-black w-10 h-10" />
          </div>
          <div>
            <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none mb-1 shadow-black drop-shadow-md">ROYAL PASS</h2>
            <div className="flex items-center gap-2">
              <span className="text-[#F2A900] text-xs font-black uppercase tracking-[0.2em] bg-black/40 px-2 py-0.5 rounded">SEASON 1</span>
              <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">WILD SURVIVAL</span>
            </div>
          </div>
        </div>

        {/* Progress Display */}
        <div className="bg-black/60 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex justify-between items-end mb-2">
            <div className="flex items-center gap-2">
              <span className="text-4xl font-black italic text-[#F2A900]">{rpLevel}</span>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-500 uppercase leading-none">Current</span>
                <span className="text-sm font-black uppercase tracking-tighter">Pass Level</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-[#F2A900] uppercase tracking-widest block">Next Reward</span>
              <span className="text-xs font-bold text-gray-400">{Math.max(0, pointsPerLevel - currentLevelPoints).toLocaleString()} pts remaining</span>
            </div>
          </div>
          
          <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-white/5 p-0.5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-[#F2A900] rounded-full relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[slide_1s_linear_infinite]" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Rewards List */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-3 custom-scrollbar">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
            <div className="w-8 h-px bg-white/10" /> 
            Pass Progression 1-25
          </h3>
          {(() => {
            const unclaimedCount = (rpRewards.length > 0 ? rpRewards : ROYAL_PASS_REWARDS).filter(reward => 
              rpLevel >= reward.level && !profile?.claimedRpRewards?.includes(reward.level)
            ).length;
            
            if (unclaimedCount > 0) {
              return (
                <button 
                  onClick={() => userService.claimAllAvailableRewards(user!.uid!, profile.level, rpLevel, (rpRewards.length > 0 ? rpRewards : ROYAL_PASS_REWARDS))}
                  className="text-[9px] font-black uppercase bg-[#F2A900] text-black px-3 py-1 rounded shadow-lg animate-pulse"
                >
                  Claim All ({unclaimedCount})
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
              whileHover={isUnlocked && !isClaimed ? { scale: 1.01, x: 5 } : {}}
              className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                isClaimed 
                  ? 'bg-black/20 border-white/5 opacity-50' 
                  : isUnlocked 
                    ? 'bg-[#1A1A1A] border-[#F2A900]/30 border-l-4 border-l-[#F2A900]' 
                    : 'bg-black/40 border-white/5'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all relative overflow-hidden ${
                  isUnlocked ? 'bg-[#F2A900]/10 border-[#F2A900]/20' : 'bg-black/60 border-white/5'
                }`}>
                  {reward.image ? (
                    <img src={reward.image} alt={reward.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <Icon className={`w-6 h-6 ${isUnlocked ? 'text-[#F2A900]' : 'text-gray-700'}`} />
                  )}
                  {!isUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                      <ICONS.Lock className="w-3 h-3 text-white/40" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isUnlocked ? 'text-[#F2A900]' : 'text-gray-600'}`}>Tier {reward.level}</span>
                    {isClaimed && <ICONS.Check className="w-3 h-3 text-green-500" />}
                  </div>
                  <div 
                    className={`font-black text-sm uppercase italic tracking-tighter ${isUnlocked ? 'text-white' : 'text-gray-600'}`}
                    style={reward.color ? { color: reward.color } : {}}
                  >
                    {reward.name}
                  </div>
                </div>
              </div>

              {isUnlocked && !isClaimed ? (
                <button 
                  onClick={() => handleClaim(reward.level, reward)}
                  className="bg-[#F2A900] text-black px-4 py-2 rounded-lg font-black text-[10px] uppercase shadow-lg shadow-[#F2A900]/20 active:scale-95 transition-all"
                >
                  Claim
                </button>
              ) : (
                <div className={`text-[9px] font-black uppercase tracking-widest ${isClaimed ? 'text-green-500/50' : 'text-gray-800'}`}>
                  {isClaimed ? 'Secured' : 'Locked'}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
