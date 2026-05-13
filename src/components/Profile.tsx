import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SHORE_ITEMS, ICONS, calculateLevel, LEVELS, LEVEL_REWARDS } from '../constants';
import { userService } from '../services/userService';
import { motion, AnimatePresence } from 'motion/react';

interface ProfileProps {
  targetUserId?: string;
}

export const Profile: React.FC<ProfileProps & { onNavigate?: (tab: 'home' | 'shop' | 'top' | 'profile' | 'settings' | 'admin' | 'rp') => void }> = ({ targetUserId, onNavigate }) => {
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
      setNewName(profile?.displayName || '');
      setNewPhoto(profile?.photoURL || '');
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

  const level = profile ? calculateLevel(profile?.score || 0) : 1;
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
    <div className={`p-6 bg-[#070707] min-h-full font-mono selection:bg-[#F2A900] selection:text-black ${isViewingSelf ? 'pb-32' : 'pb-10'}`}>
      {/* Background FX Layers */}
      <div className="fixed inset-0 bg-noise opacity-[0.02] pointer-events-none" />
      <div className="fixed inset-0 bg-scanline opacity-[0.04] pointer-events-none" />

      {isViewingSelf && pendingScore > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-8 p-0.5 bg-gradient-to-r from-red-600 to-[#F2A900] rounded-xl overflow-hidden shadow-2xl"
        >
          <div className="bg-black/90 backdrop-blur-md p-4 flex items-center justify-between rounded-[10px]">
            <div className="flex items-center gap-4">
              <div className="relative">
                <ICONS.Alert className="w-5 h-5 text-red-500 animate-pulse" />
                <div className="absolute inset-0 bg-red-500 blur-lg opacity-20" />
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase text-gray-500 tracking-[0.2em] mb-0.5">Unsynced Tactical Data</span>
                <span className="text-sm font-black text-white italic">+{pendingScore} CHICKEN DINNERS</span>
              </div>
            </div>
            <button 
              onClick={forceSync}
              disabled={isSyncing || quotaExceeded}
              className={`px-5 py-2.5 rounded-lg font-black uppercase text-[9px] tracking-widest transition-all ${
                (isSyncing || quotaExceeded) 
                  ? 'bg-white/5 text-white/20 border border-white/5' 
                  : 'bg-[#F2A900] text-black hover:bg-white shadow-[0_0_20px_rgba(242,169,0,0.2)] active:scale-95'
              }`}
            >
              {isSyncing ? 'UPLOADING...' : quotaExceeded ? 'X-LIMITED' : 'SYNC NOW'}
            </button>
          </div>
        </motion.div>
      )}

      <div className="relative flex items-center justify-between mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-[2px] w-8 bg-[#F2A900]" />
            <span className="text-[10px] font-black text-[#F2A900] uppercase tracking-[0.4em]">Section: Dossier</span>
          </div>
          <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">PERSONNEL ID</h2>
        </div>
        {isViewingSelf && (
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="w-12 h-12 bg-black/80 border border-white/5 rounded-xl flex items-center justify-center text-gray-500 hover:text-[#F2A900] hover:border-[#F2A900]/30 transition-all active:scale-90 shadow-xl backdrop-blur-md"
          >
            <ICONS.Settings className="w-6 h-6" />
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.form 
            key="edit"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            onSubmit={handleUpdate} 
            className="bg-[#111] border border-[#F2A900]/30 rounded-3xl p-8 mb-10 relative overflow-hidden backdrop-blur-xl"
          >
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#F2A900]/50 to-transparent" />
            <h3 className="font-black italic text-[#F2A900] uppercase text-sm mb-8 flex items-center gap-3">
               <div className="w-2 h-2 bg-[#F2A900] rounded-full animate-pulse" />
               UPDATE CALLSIGN DATA
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">OPERATOR CALLSIGN</label>
                <input 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm font-black text-white outline-none focus:border-[#F2A900] transition-colors" 
                  placeholder="ENTER CALLSIGN"
                />
              </div>
              
              <div>
                <label className="block text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">IDENTIFICATION PHOTO (URL)</label>
                <input 
                  value={newPhoto} 
                  onChange={e => setNewPhoto(e.target.value)} 
                  className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm font-black text-white outline-none focus:border-[#F2A900] transition-colors mb-3" 
                  placeholder="HTTPS://IMAGE-URL.JPG" 
                />
                
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
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full bg-white/5 text-gray-400 font-black uppercase text-[10px] py-4 rounded-xl text-center border border-dashed border-white/10 hover:border-white/20 transition-all">
                    UPLOAD LOCAL SCAN
                  </div>
                </div>
              </div>
            </div>

            {status && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-[10px] font-black uppercase text-[#F2A900] mt-6 tracking-widest"
              >
                {status}
              </motion.p>
            )}

            <div className="grid grid-cols-2 gap-4 mt-8">
               <button 
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-full bg-white/5 text-white/50 font-black uppercase py-4 rounded-xl text-[10px] tracking-widest hover:bg-white/10 transition-all"
              >
                ABORT
              </button>
              <button 
                type="submit" 
                disabled={loadingUpdate}
                className={`w-full ${loadingUpdate ? 'bg-gray-800' : 'bg-[#F2A900] hover:bg-white'} text-black font-black uppercase py-4 rounded-xl text-[10px] tracking-widest transition-all shadow-xl flex items-center justify-center gap-2`}
              >
                {loadingUpdate ? 'UPLOADING...' : 'SAVE DATA'}
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.div 
            key="display"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111] border border-white/5 rounded-3xl p-8 mb-10 relative overflow-hidden backdrop-blur-xl shadow-2xl"
          >
            {/* Background UI Accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#F2A900] opacity-[0.03] blur-[100px] pointer-events-none" />
            <div className="absolute top-4 left-4 w-10 h-10 border-t border-l border-white/10 rounded-tl-xl" />
            <div className="absolute bottom-4 right-4 w-10 h-10 border-b border-r border-white/10 rounded-br-xl" />
            
            <div className="flex flex-col items-center">
              <div className="relative mb-10 group">
                <div className="absolute inset-[-20%] border border-[#F2A900]/20 rounded-full animate-[spin_10s_linear_infinite] opacity-50" />
                <div className="absolute inset-[-10%] border-2 border-dashed border-white/5 rounded-full" />
                
                {currentFrame?.image && (
                  <div className="absolute inset-[-25%] pointer-events-none z-20">
                    <img src={currentFrame.image} alt="" className="w-full h-full object-contain mix-blend-screen brightness-125" referrerPolicy="no-referrer" />
                  </div>
                )}
                
                <div className="w-40 h-40 rounded-full bg-black border-4 border-white/5 flex items-center justify-center overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,1)] ring-8 ring-black">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                  ) : (
                    <ICONS.Profile className="w-20 h-20 text-gray-800" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent mix-blend-multiply" />
                </div>
              </div>

              <div className="text-center mb-10 w-full">
                <div className="flex flex-col items-center gap-1 mb-4">
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic mb-1">OPERATOR_ID</span>
                  </div>
                  <h3 
                    className="text-4xl font-black italic uppercase tracking-tighter text-white drop-shadow-2xl"
                    style={{ textShadow: `0 0 20px ${currentSkin?.color || '#F2A900'}44` }}
                  >
                    {profile?.displayName || 'SURVIVOR'}
                  </h3>
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <div className="bg-[#F2A900] text-black px-5 py-2 rounded-lg shadow-xl flex items-center gap-3 transform -skew-x-12">
                    <ICONS.Crown className="w-4 h-4 text-black" />
                    <span className="font-black text-xs transform skew-x-12 tracking-widest uppercase">RANK: {currentRank.rank}</span>
                  </div>
                  
                  <div className="bg-white/5 backdrop-blur-md px-5 py-2 rounded-lg border border-white/10 flex items-center gap-3 transform skew-x-12">
                    <ICONS.Tapper className="w-4 h-4 text-[#F2A900] transform -skew-x-12" />
                    <span className="text-white text-xs font-black uppercase transform -skew-x-12 tracking-widest">LEVEL {level}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 w-full">
                <div className="bg-black/60 p-5 rounded-2xl border border-white/5 flex flex-col items-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[#F2A900]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[12px] font-black text-[#F2A900] italic mb-1">{profile?.score?.toLocaleString() || 0}</span>
                  <span className="text-[6px] font-black uppercase text-gray-500 tracking-[0.3em]">DINNERS</span>
                </div>
                <div className="bg-black/60 p-5 rounded-2xl border border-white/5 flex flex-col items-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[12px] font-black text-white italic mb-1">{profile?.wins?.toLocaleString() || profile?.score?.toLocaleString() || 0}</span>
                  <span className="text-[6px] font-black uppercase text-gray-500 tracking-[0.3em]">CARRIES</span>
                </div>
                <div className="bg-black/60 p-5 rounded-2xl border border-white/5 flex flex-col items-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[12px] font-black text-red-500 italic mb-1">{profile?.rpLevel || 1}</span>
                  <span className="text-[6px] font-black uppercase text-gray-500 tracking-[0.3em]">ELITE PASS</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {isViewingSelf && (
        <div className="space-y-12">
          <section>
            <div className="flex justify-between items-end mb-6 px-2">
              <div>
                <div className="h-1 w-6 bg-[#F2A900] mb-2" />
                <h3 className="text-sm font-black text-white italic uppercase tracking-widest flex items-center gap-3">
                  <ICONS.Trophy className="w-4 h-4 text-[#F2A900]" /> PROGRESSION PATH
                </h3>
              </div>
              {(() => {
                const unclaimedCount = Object.keys(LEVEL_REWARDS).filter(lvl => 
                  level >= parseInt(lvl) && !profile?.claimedLevelRewards?.includes(parseInt(lvl))
                ).length;
                
                if (unclaimedCount > 0 && profile) {
                  return (
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => userService.claimAllAvailableRewards(user!.uid!, level, profile?.rpLevel || 1, rpRewards)}
                      className="text-[9px] font-black uppercase bg-[#F2A900] text-black px-5 py-2 rounded-lg shadow-2xl animate-bounce"
                    >
                      COLLECT ALL ({unclaimedCount})
                    </motion.button>
                  );
                }
                return null;
              })()}
            </div>
            
            <div className="space-y-3">
              {Object.entries(LEVEL_REWARDS).sort((a,b) => parseInt(a[0]) - parseInt(b[0])).map(([lvlStr, reward]) => {
                const lvl = parseInt(lvlStr);
                const isClaimed = profile?.claimedLevelRewards?.includes(lvl);
                const isUnlocked = level >= lvl;
                
                return (
                  <motion.div 
                    key={lvl} 
                    whileHover={isUnlocked && !isClaimed ? { x: 5 } : {}}
                    onClick={() => isUnlocked && !isClaimed && userService.claimLevelReward(user!.uid!, lvl, reward as number)}
                    className={`p-5 rounded-2xl border transition-all flex items-center justify-between group overflow-hidden relative ${
                      isClaimed ? 'bg-black opacity-40 border-white/5' : 
                      !isUnlocked ? 'bg-black/30 border-white/5 grayscale' : 
                      'bg-[#111] border-white/10 hover:border-[#F2A900]/30 cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
                    }`}
                  >
                    {!isClaimed && isUnlocked && <div className="absolute top-0 left-0 w-1 h-full bg-[#F2A900]" />}
                    
                    <div className="flex items-center gap-5 relative z-10">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl italic border-2 transition-all ${
                        isClaimed ? 'bg-black border-white/10 text-white/20' : 
                        isUnlocked ? 'bg-[#F2A900] border-black text-black' : 
                        'bg-black/50 border-white/5 text-white/10'
                      }`}>
                        {lvl}
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 group-hover:text-[#F2A900] transition-colors">Combat Milestone</div>
                        <div className="font-black italic flex items-center gap-2 text-lg text-white">
                          <span className="text-[#F2A900] tracking-tighter">+{reward}</span>
                          <ICONS.Zap className="w-5 h-5 text-red-600 fill-current" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative z-10">
                      {isClaimed ? (
                        <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-widest">
                          <ICONS.Zap className="w-3 h-3" /> SECURED
                        </div>
                      ) : isUnlocked ? (
                        <div className="text-[10px] font-black text-white uppercase flex items-center gap-2 bg-[#F2A900]/10 px-4 py-2 rounded-lg border border-[#F2A900]/20 group-hover:bg-[#F2A900] group-hover:text-black transition-all">
                          EXTRACT DATA
                        </div>
                      ) : (
                        <div className="text-[9px] font-black text-gray-700 uppercase tracking-widest">LOCKED_ID</div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          <section>
            <div className="h-1 w-6 bg-[#F2A900] mb-2" />
            <h3 className="text-sm font-black text-white italic uppercase tracking-widest mb-8 flex items-center gap-3">
              <ICONS.Settings className="w-4 h-4 text-[#F2A900]" /> ARMORY STASH
            </h3>
            
            <div className="bg-[#111] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
               {/* Background UI Lines */}
              <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-l from-[#F2A900]/20 to-transparent" />
              
              <div className="space-y-12">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] flex items-center gap-3">
                      <div className="w-2 h-2 bg-[#F2A900] rounded-full" /> TACTICAL FRAMES
                    </label>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {profile?.ownedFrames?.map((frameId: string) => {
                      const frame = frames.find(f => f.id === frameId);
                      const isSelected = profile?.selectedFrameId === frameId;
                      return (
                        <motion.button
                          key={frameId}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => userService.selectItem(user!.uid!, frameId, 'frame')}
                          className={`aspect-square relative rounded-2xl border-2 transition-all p-1 overflow-hidden flex items-center justify-center ${
                            isSelected 
                              ? 'bg-[#F2A900]/10 border-[#F2A900] shadow-[0_0_20px_rgba(242,169,0,0.2)]' 
                              : 'bg-black border-white/5 hover:border-white/20'
                          }`}
                        >
                          <div className="absolute inset-0 bg-scanline opacity-[0.1]" />
                          {frame?.image ? (
                            <img src={frame.image} alt="" className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                          ) : (
                            <ICONS.Profile className="w-8 h-8 text-white/10" />
                          )}
                          
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-3 h-3 bg-[#F2A900] rounded-full border-2 border-black animate-pulse" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div>
                   <div className="flex items-center justify-between mb-6">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-600 rounded-full" /> COMBAT SKINS
                    </label>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {profile?.ownedSkins?.map((skinId: string) => {
                      const skin = skins.find(s => s.id === skinId);
                      const isSelected = profile?.selectedSkinId === skinId;
                      return (
                        <motion.button
                          key={skinId}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => userService.selectItem(user!.uid!, skinId, 'skin')}
                          className={`aspect-square relative rounded-2xl border-2 transition-all p-1 overflow-hidden flex items-center justify-center ${
                            isSelected 
                              ? 'bg-red-600/10 border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.2)]' 
                              : 'bg-black border-white/5 hover:border-white/20'
                          }`}
                        >
                          <div className="absolute inset-0 bg-scanline opacity-[0.1]" />
                          {skin?.image ? (
                            <img src={skin.image} alt="" className="w-full h-full object-contain p-2 rounded-xl" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="flex items-center justify-center">
                              {(() => {
                                const SkinIcon = ICONS[skin?.icon as keyof typeof ICONS] || ICONS.Flame;
                                return <SkinIcon className={`w-8 h-8 ${isSelected ? 'text-red-500' : 'text-white/10'}`} style={skin?.color ? { color: skin.color } : {}} />;
                              })()}
                            </div>
                          )}
                          
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-black animate-pulse" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            {creator && (
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="pt-16 mt-16 border-t border-white/5 flex flex-col items-center opacity-30 hover:opacity-100 transition-opacity pb-10"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#F2A900]/40" />
                  <span className="text-[9px] font-black uppercase tracking-[0.6em] text-[#F2A900] italic">SYSTEM ORIGIN</span>
                  <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#F2A900]/40" />
                </div>
                <div className="flex items-center gap-4">
                  {creator.logo && <img src={creator.logo} alt="" className="w-8 h-8 rounded-lg object-contain bg-white/5 p-1" referrerPolicy="no-referrer" />}
                  <div>
                    <span className="text-lg font-black italic text-white uppercase tracking-tighter leading-none block">{creator.name}</span>
                    <span className="text-[7px] font-black text-gray-600 uppercase tracking-widest mt-1 block">PROTOCOL ENGINE v1.0.4</span>
                  </div>
                </div>
              </motion.div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
