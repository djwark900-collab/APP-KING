import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SHORE_ITEMS, ICONS, calculateLevel, LEVELS, LEVEL_REWARDS } from '../constants';
import { userService } from '../services/userService';
import { motion, AnimatePresence } from 'motion/react';

interface ProfileProps {
  targetUserId?: string;
}

export const Profile: React.FC<ProfileProps & { onNavigate?: (tab: 'home' | 'shop' | 'top' | 'profile' | 'settings' | 'admin' | 'rp' | 'live') => void }> = ({ targetUserId, onNavigate }) => {
  const { profile: myProfile, user: currentUser, pendingScore, forceSync, isSyncing, quotaExceeded, frames, skins, rpRewards } = useAuth();
  const [targetProfile, setTargetProfile] = useState<any | null>(null);
  const [isLoadingTarget, setIsLoadingTarget] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhoto, setNewPhoto] = useState('');
  const [status, setStatus] = useState('');
  const [creator, setCreator] = useState<{name: string, logo: string} | null>(null);

  // Determine which profile were viewing
  const isViewingSelf = !targetUserId || targetUserId === currentUser?.uid;
  const profile = isViewingSelf ? myProfile : targetProfile;
  const user = isViewingSelf ? currentUser : { uid: targetUserId };

  useEffect(() => {
    if (!isViewingSelf && targetUserId) {
      setIsLoadingTarget(true);
      userService.getUserProfile(targetUserId)
        .then(setTargetProfile)
        .finally(() => setIsLoadingTarget(false));
    }
  }, [targetUserId, isViewingSelf]);

  useEffect(() => {
    if (isViewingSelf && profile) {
      setNewName(profile.displayName || '');
      setNewPhoto(profile.photoURL || '');
    }
  }, [profile, isViewingSelf]);

  useEffect(() => {
    userService.getCreatorInfo().then(info => {
      if (info) setCreator({ name: info.name || '', logo: info.logo || '' });
    });
  }, []);

  if (isLoadingTarget) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <ICONS.Tapper className="animate-spin text-[#F2A900] w-12 h-12" />
        <p className="text-[10px] font-black italic text-[#F2A900] uppercase tracking-[0.3em] animate-pulse">Accessing Encrypted Dossier...</p>
      </div>
    );
  }

  if (!profile && !isViewingSelf) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <ICONS.Alert className="text-red-500 w-12 h-12" />
        <p className="text-[10px] font-black italic text-red-500 uppercase tracking-[0.3em]">Survivor Terminated or Data Lost.</p>
      </div>
    );
  }
  
  const currentFrame = frames.find(f => f.id === profile?.selectedFrameId);
  const currentSkin = skins.find(s => s.id === profile?.selectedSkinId);

  const level = profile ? calculateLevel(profile.score) : 1;
  const currentRank = LEVELS.findLast(l => level >= l.min) || LEVELS[0];
  const RankIcon = ICONS[currentRank.icon as keyof typeof ICONS] || ICONS.Shield;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setStatus('Updating ID...');
    setLoadingUpdate(true);
    try {
      await userService.updateProfile(user.uid, { displayName: newName, photoURL: newPhoto });
      setStatus('ID Updated!');
      setTimeout(() => { setIsEditing(false); setStatus(''); }, 1000);
    } catch (err) {
      setStatus('Update failed');
    } finally {
      setLoadingUpdate(false);
    }
  };

  return (
    <div className={`p-6 bg-[#0F0F0F] min-h-full ${isViewingSelf ? 'pb-24' : 'pb-6'}`}>
      {isViewingSelf && pendingScore > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-[#F2A900] border-4 border-black rounded-2xl shadow-xl flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <ICONS.Flame className="w-5 h-5 text-black" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-black leading-none">Unsynced Progress</span>
              <span className="text-lg font-black text-black italic">+{pendingScore} DINNERS</span>
            </div>
          </div>
          <button 
            onClick={forceSync}
            disabled={isSyncing || quotaExceeded}
            className={`px-4 py-2 bg-black text-white rounded-lg font-black uppercase text-[10px] italic shadow-lg active:scale-95 transition-all ${
              (isSyncing || quotaExceeded) ? 'opacity-50 grayscale' : 'hover:bg-white hover:text-black'
            }`}
          >
            {isSyncing ? 'Saving...' : quotaExceeded ? 'Limit Reached' : 'Save Now'}
          </button>
        </motion.div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter transform -skew-x-12 mb-1">SURVIVOR ID</h2>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{isViewingSelf ? 'Personal dossier' : 'Public record'}</p>
        </div>
        {isViewingSelf && (
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="p-3 bg-[#1A1A1A] border border-[#333] rounded-xl text-[#F2A900] active:scale-95 transition-all"
          >
            <ICONS.Settings className="w-5 h-5" />
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.form 
            key="edit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleUpdate} 
            className="bg-[#1A1A1A] border-2 border-[#F2A900] rounded-2xl p-6 mb-8 space-y-4"
          >
            <h3 className="font-black italic text-[#F2A900] uppercase text-sm">UPDATE PERSONNEL DATA</h3>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Callsign</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-black border border-[#333] rounded p-3 text-sm outline-none focus:border-[#F2A900]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Personnel Photo (URL or File)</label>
              <div className="flex flex-col gap-2">
                <input value={newPhoto} onChange={e => setNewPhoto(e.target.value)} className="w-full bg-black border border-[#333] rounded p-3 text-sm outline-none focus:border-[#F2A900]" placeholder="https://..." />
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setNewPhoto(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="w-full bg-[#333] text-gray-300 font-black uppercase text-[10px] py-2 rounded text-center border border-[#444] hover:bg-[#444]">
                    Select Image File
                  </div>
                </div>
              </div>
            </div>
            {status && <p className="text-center text-[10px] font-black uppercase text-[#F2A900]">{status}</p>}
            <button 
              type="submit" 
              disabled={loadingUpdate}
              className={`w-full ${loadingUpdate ? 'bg-gray-700' : 'bg-[#F2A900] hover:bg-[#FFC000]'} text-black font-black uppercase py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2`}
            >
              {loadingUpdate ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : 'Save Changes'}
            </button>
          </motion.form>
        ) : (
          <motion.div 
            key="display"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-8 mb-8 relative overflow-hidden"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#F2A900] opacity-5 blur-3xl -mr-16 -mt-16" />
            
            <div className="flex flex-col items-center">
              <div className="relative mb-6">
                {currentFrame?.image && (
                  <div className="absolute inset-[-15%] pointer-events-none z-10">
                    <img src={currentFrame.image} alt="" className="w-full h-full object-contain mix-blend-screen opacity-80" referrerPolicy="no-referrer" />
                  </div>
                )}
                
                <div className="w-32 h-32 rounded-full bg-black border-4 border-[#333] flex items-center justify-center overflow-hidden relative shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <ICONS.Profile className="w-16 h-16 text-gray-700" />
                  )}
                </div>
              </div>

              <div className="text-center mb-8 relative">
                <motion.h3 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const newName = prompt("Enter new battle name:", profile?.displayName || '');
                    if (newName && newName !== profile?.displayName) {
                      userService.updateProfile(user!.uid!, { displayName: newName });
                    }
                  }}
                  className="text-3xl font-black italic mb-3 uppercase tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] cursor-pointer hover:text-[#F2A900] transition-colors"
                  style={{ color: currentSkin?.color || currentFrame?.color || '#FFFFFF' }}
                >
                  {profile?.displayName || 'Survivor'}
                </motion.h3>
                
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-[#F2A900] text-black px-4 py-1.5 rounded shadow-[0_4px_10px_rgba(242,169,0,0.2)] border-2 border-black flex items-center gap-3 transform -skew-x-12">
                    <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                      <ICONS.Tapper className="w-3.5 h-3.5 text-[#F2A900]" />
                    </div>
                    <span className="font-black text-sm transform skew-x-12 tracking-wider">SURVIVOR LVL {level}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    <RankIcon className="w-4 h-4 text-[#F2A900]" />
                    <span className="text-gray-300 text-[10px] font-black uppercase tracking-[0.2em]">{currentRank.rank} Tier</span>
                  </div>
                </div>
              </div>
              
              {onNavigate && isViewingSelf && (
                <button 
                  onClick={() => onNavigate('top')}
                  className="w-full mb-6 bg-black/40 border border-white/5 p-4 rounded-xl flex items-center justify-between group active:scale-[0.98] transition-all hover:border-[#F2A900]/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#F2A900]/10 text-[#F2A900] rounded-lg flex items-center justify-center">
                      <ICONS.Trophy className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="text-[10px] font-black text-[#F2A900] uppercase tracking-widest">Global Rankings</div>
                      <div className="text-white font-black italic uppercase text-sm">View Leaderboard</div>
                    </div>
                  </div>
                  <ICONS.Chevron className="w-5 h-5 text-gray-700 group-hover:text-[#F2A900] transition-colors" />
                </button>
              )}

              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="bg-black/50 p-4 rounded-xl border border-[#333] text-center relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-[#F2A900]/20" />
                  <div className="text-2xl font-black text-[#F2A900] italic leading-none mb-1 drop-shadow-[0_0_8px_rgba(242,169,0,0.3)]">{profile?.score?.toLocaleString() || 0}</div>
                  <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center justify-center gap-1">
                    <ICONS.Flame className="w-2 h-2" /> Dinners
                  </div>
                </div>
                <div className="bg-black/50 p-4 rounded-xl border border-[#333] text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-white/10" />
                  <div className="text-2xl font-black text-white italic leading-none mb-1">{level}</div>
                  <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center justify-center gap-1">
                    <ICONS.Tapper className="w-2 h-2" /> Combat
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {isViewingSelf && (
        <div className="space-y-8">
          <section>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <ICONS.Zap className="w-3 h-3 text-[#F2A900]" /> LEVEL MILESTONES
              </h3>
              {(() => {
                const unclaimedCount = Object.keys(LEVEL_REWARDS).filter(lvl => 
                  level >= parseInt(lvl) && !profile?.claimedLevelRewards?.includes(parseInt(lvl))
                ).length;
                
                if (unclaimedCount > 0 && profile) {
                  return (
                    <button 
                      onClick={() => userService.claimAllAvailableRewards(user!.uid!, level, profile.rpLevel || 1, rpRewards)}
                      className="text-[9px] font-black uppercase bg-[#F2A900] text-black px-3 py-1 rounded shadow-lg animate-bounce"
                    >
                      Claim All ({unclaimedCount})
                    </button>
                  );
                }
                return null;
              })()}
            </div>
            <div className="space-y-2">
              {Object.entries(LEVEL_REWARDS).sort((a,b) => parseInt(a[0]) - parseInt(b[0])).map(([lvlStr, reward]) => {
                const lvl = parseInt(lvlStr);
                const isClaimed = profile?.claimedLevelRewards?.includes(lvl);
                const isUnlocked = level >= lvl;
                
                return (
                  <motion.div 
                    key={lvl} 
                    whileTap={isUnlocked && !isClaimed ? { scale: 0.98 } : {}}
                    onClick={() => isUnlocked && !isClaimed && userService.claimLevelReward(user!.uid!, lvl, reward as number)}
                    className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                      isClaimed ? 'bg-[#F2A900]/5 border-[#F2A900]/20' : 
                      !isUnlocked ? 'bg-black/30 border-white/5 opacity-50' : 
                      'bg-white/5 border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] cursor-pointer hover:border-[#F2A900]/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded flex items-center justify-center font-black text-xs border ${
                        isClaimed ? 'bg-[#F2A900] border-black text-black' : 
                        isUnlocked ? 'bg-white/10 border-white/20 text-white' : 
                        'bg-transparent border-gray-800 text-gray-700'
                      }`}>
                        {lvl}
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-gray-500 uppercase">Reward Pool</div>
                        <div className="font-black italic flex items-center gap-1 text-sm">
                          {reward} <ICONS.Zap className="w-3 h-3 text-yellow-400" />
                        </div>
                      </div>
                    </div>
                    {isClaimed ? (
                      <div className="flex items-center gap-1 text-[10px] font-black text-[#F2A900] uppercase italic">
                        <ICONS.Zap className="w-3 h-3" /> CLAIMED
                      </div>
                    ) : isUnlocked ? (
                      <div className="text-[10px] font-black text-white uppercase animate-pulse flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> TAP TO CLAIM
                      </div>
                    ) : (
                      <div className="text-[10px] font-bold text-gray-800 uppercase">LOCKED</div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <ICONS.Shield className="w-3 h-3 text-[#F2A900]" /> EQUIPPED GEAR
            </h3>
            <div className="space-y-3">
              <div className="p-5 bg-black border-2 border-white/5 rounded-[2rem] space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#F2A900]/5 blur-3xl -mr-16 -mt-16" />
                
                <div className="flex items-center gap-4 relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#F2A900] to-[#E6A000] rounded-2xl flex items-center justify-center border-2 border-black shadow-[0_5px_15px_rgba(242,169,0,0.3)]">
                    <ICONS.Settings className="w-7 h-7 text-black" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-[#F2A900] uppercase tracking-[0.3em] mb-0.5">Tactical Gear</div>
                    <div className="font-black text-lg italic uppercase text-white tracking-tighter leading-none">Armory Loadout</div>
                  </div>
                </div>

                <div className="space-y-6 relative">
                  <div>
                    <label className="text-[9px] font-black text-gray-500 uppercase mb-3 flex items-center gap-2 tracking-[0.2em] bg-white/5 w-fit px-2 py-0.5 rounded">
                      <ICONS.Photo className="w-3 h-3 text-[#F2A900]" /> Deployment Frames
                    </label>
                    <div className="grid grid-cols-4 gap-4">
                      {profile?.ownedFrames?.map((frameId: string) => {
                        const frame = frames.find(f => f.id === frameId);
                        const isSelected = profile.selectedFrameId === frameId;
                        return (
                          <motion.button
                            key={frameId}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => userService.selectItem(user!.uid!, frameId, 'frame')}
                            className={`aspect-square relative rounded-2xl border-2 transition-all flex items-center justify-center overflow-hidden ${
                              isSelected 
                                ? 'bg-[#F2A900]/10 border-[#F2A900] shadow-[0_0_20px_rgba(242,169,0,0.25)]' 
                                : 'bg-white/5 border-white/5 hover:border-white/20'
                            }`}
                          >
                            {frame?.image ? (
                              <img src={frame.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                            ) : (
                              <ICONS.Profile className="w-6 h-6 text-gray-700" />
                            )}
                            
                            {isSelected && (
                              <div className="absolute inset-0 border-2 border-[#F2A900] rounded-2xl animate-pulse pointer-events-none" />
                            )}
                            
                            <div className={`absolute bottom-0 inset-x-0 h-1 transition-all ${isSelected ? 'bg-[#F2A900]' : 'bg-transparent'}`} />
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-gray-500 uppercase mb-3 flex items-center gap-2 tracking-[0.2em] bg-white/5 w-fit px-2 py-0.5 rounded">
                      <ICONS.Flame className="w-3 h-3 text-[#F2A900]" /> Tactical Combat Skins
                    </label>
                    <div className="grid grid-cols-4 gap-4">
                      {profile?.ownedSkins?.map((skinId: string) => {
                        const skin = skins.find(s => s.id === skinId);
                        const isSelected = profile.selectedSkinId === skinId;
                        return (
                          <motion.button
                            key={skinId}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => userService.selectItem(user!.uid!, skinId, 'skin')}
                            className={`aspect-square relative rounded-2xl border-2 transition-all flex items-center justify-center overflow-hidden ${
                              isSelected 
                                ? 'bg-[#F2A900]/10 border-[#F2A900] shadow-[0_0_20px_rgba(242,169,0,0.25)]' 
                                : 'bg-white/5 border-white/5 hover:border-white/20'
                            }`}
                          >
                            {skin?.image ? (
                              <img src={skin.image} alt="" className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="flex items-center justify-center">
                                {(() => {
                                  const SkinIcon = ICONS[skin?.icon as keyof typeof ICONS] || ICONS.Flame;
                                  return <SkinIcon className={`w-8 h-8 ${isSelected ? 'text-[#F2A900]' : 'text-gray-700'}`} style={skin?.color ? { color: skin.color } : {}} />;
                                })()}
                              </div>
                            )}

                            {isSelected && (
                              <div className="absolute inset-0 border-2 border-[#F2A900] rounded-2xl animate-pulse pointer-events-none" />
                            )}
                            
                            <div className={`absolute bottom-0 inset-x-0 h-1 transition-all ${isSelected ? 'bg-[#F2A900]' : 'bg-transparent'}`} />
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {creator && (
              <div className="pt-8 mt-12 border-t border-white/5 flex flex-col items-center opacity-20 hover:opacity-100 transition-opacity pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px w-8 bg-[#F2A900]/20" />
                  <span className="text-[7px] font-black uppercase tracking-[0.4em] text-[#F2A900]">ENGINE ORIGIN</span>
                  <div className="h-px w-8 bg-[#F2A900]/20" />
                </div>
                <div className="flex items-center gap-3">
                  {creator.logo && <img src={creator.logo} alt="" className="w-6 h-6 rounded-lg object-contain bg-white/5" referrerPolicy="no-referrer" />}
                  <span className="text-sm font-black italic text-white uppercase tracking-tighter">{creator.name}</span>
                </div>
                <div className="text-[6px] font-bold text-gray-700 uppercase tracking-widest mt-2">© 2024 Battle Royale Tap Simulator</div>
              </div>
            )}
          </section>

        </div>
      )}
    </div>
  );
};
