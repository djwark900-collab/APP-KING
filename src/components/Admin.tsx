import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { ICONS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const Admin: React.FC = () => {
  const { profile, frames } = useAuth();
  const [loading, setLoading] = useState(false);

  // Security check: only allows admin access
  const isAdmin = profile?.email === 'traleague@gmail.com' || profile?.isAdmin;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFrame, setEditingFrame] = useState<any>(null);
  const [editingRp, setEditingRp] = useState<any>(null);
  const [rpRewards, setRpRewards] = useState<any[]>([]);
  const [activeAdminTab, setActiveAdminTab] = useState<'frames' | 'rp'>('frames');
  const [formState, setFormState] = useState({ 
    id: '', 
    name: '', 
    cost: '500', 
    image: '',
    type: 'money', // for RP
    value: 0,     // for RP
    level: 1,      // for RP
    color: '#F2A900' // for RP
  });

  const resetForm = () => {
    setFormState({ id: '', name: '', cost: '500', image: '', type: 'money', value: 0, level: 1, color: '#F2A900' });
    setEditingFrame(null);
    setEditingRp(null);
  };

  useEffect(() => {
    if (!isAdmin) return;
    
    const qR = query(collection(db, 'rp_rewards'), orderBy('level', 'asc'));
    const unsubR = onSnapshot(qR, (snap) => {
      setRpRewards(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any));
    });

    return () => unsubR();
  }, [isAdmin]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeAdminTab === 'frames' && (!formState.id || !formState.name)) return;
    if (activeAdminTab === 'rp' && !formState.name) return;
    
    setLoading(true);
    try {
      if (activeAdminTab === 'rp') {
        if (formState.image.length > 900000) {
          throw new Error("Asset data too large (>900KB).");
        }
        await userService.updateRpReward(formState.level.toString(), {
          level: formState.level,
          name: formState.name,
          type: formState.type,
          value: formState.value,
          image: formState.image,
          color: formState.color,
          icon: formState.type === 'money' ? 'Zap' : formState.type === 'skin' ? 'Flame' : 'Photo'
        });
      } else {
        // Validate string size (Firestore limit is 1MB total per document)
        if (formState.image.length > 900000) {
          throw new Error("Asset data too large (>900KB). Please use a URL instead of a Base64 string for large GIFs.");
        }

        if (editingFrame) {
          await userService.updateFrame(editingFrame.id, { 
            name: formState.name, 
            cost: parseInt(formState.cost), 
            image: formState.image 
          });
        } else {
          await userService.addFrame({ 
            id: formState.id, 
            name: formState.name, 
            cost: parseInt(formState.cost), 
            image: formState.image 
          });
        }
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to save. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleInitRP = async () => {
    if (confirm("Initialize RP Rewards with default data?")) {
      const { ROYAL_PASS_REWARDS } = await import('../constants');
      await userService.initRpRewards(ROYAL_PASS_REWARDS);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-12 text-center">
        <ICONS.Alert className="w-16 h-16 text-red-600 mb-4 animate-pulse" />
        <h2 className="text-2xl font-black italic transform -skew-x-12 mb-2">ACCESS DENIED</h2>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Unauthorized Personnel Detected</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#0F0F0F] min-h-full pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter transform -skew-x-12 mb-1">COMMAND HQ</h2>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">System Administration</p>
        </div>
        <div className="flex gap-2">
          {rpRewards.length === 0 && activeAdminTab === 'rp' && (
            <button 
              onClick={handleInitRP}
              className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all shadow-lg shadow-blue-900/20"
            >
              Init Defaults
            </button>
          )}
          <div className="w-12 h-12 bg-red-600/20 border border-red-600/40 rounded-xl flex items-center justify-center">
            <ICONS.Zap className="text-red-500 w-6 h-6 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <button 
          onClick={() => setActiveAdminTab('frames')}
          className={`pb-2 px-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
            activeAdminTab === 'frames' ? 'border-[#F2A900] text-[#F2A900]' : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          Deployment Frames
        </button>
        <button 
          onClick={() => setActiveAdminTab('rp')}
          className={`pb-2 px-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
            activeAdminTab === 'rp' ? 'border-[#F2A900] text-[#F2A900]' : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          Royal Pass
        </button>
      </div>

      <section className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-black text-[#F2A900] uppercase tracking-[0.2em] flex items-center gap-2">
              <ICONS.Profile className="w-4 h-4" /> 
              {activeAdminTab === 'frames' ? 'ASSET MANAGEMENT: FRAMES' : 'CAMPAIGN MANAGEMENT: RP'}
            </h3>
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
              {activeAdminTab === 'frames' ? 'Deploy new cosmetics to the field' : 'Configure season rewards and progression'}
            </p>
          </div>
          {activeAdminTab === 'frames' && (
            <button 
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="bg-[#F2A900] text-black px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all flex items-center gap-2"
            >
              <ICONS.Plus className="w-3 h-3" /> ADD ASSET
            </button>
          )}
        </div>

        <div className="space-y-3">
          {activeAdminTab === 'frames' ? frames.map(frame => (
            <motion.div 
              key={frame.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/60 border border-white/5 p-4 rounded-xl flex items-center justify-between group hover:border-[#F2A900]/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#1A1A1A] rounded-lg border border-white/10 overflow-hidden flex items-center justify-center p-1 relative">
                  {frame.image ? (
                    <img src={frame.image} alt={frame.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <ICONS.Profile className="text-gray-700 w-6 h-6" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                </div>
                <div>
                  <div className="text-sm font-black text-white italic">{frame.name}</div>
                  <div className="text-[10px] font-mono text-gray-600 uppercase mt-0.5 tracking-tighter">{frame.id}</div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Pricing</div>
                  <div className="text-sm font-black text-[#F2A900] flex items-center justify-end gap-1">
                    {frame.cost} <ICONS.Zap className="w-2.5 h-2.5 text-yellow-500" />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <motion.button 
                    whileTap={{ scale: 0.85 }}
                    onClick={() => {
                      setEditingFrame(frame);
                      setFormState({ 
                        id: frame.id, 
                        name: frame.name, 
                        cost: frame.cost.toString(), 
                        image: frame.image || '',
                        type: 'money',
                        value: 0,
                        level: 1
                      });
                      setIsModalOpen(true);
                    }}
                    className="p-3 bg-white/5 hover:bg-[#F2A900] hover:text-black text-white rounded-xl transition-all border border-white/10"
                  >
                    <ICONS.Edit className="w-4 h-4" />
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.85 }}
                    onClick={() => {
                      if (confirm(`INITIATE TERMINATION: ${frame.id}?\nThis asset will be removed from the database.`)) {
                        userService.deleteFrame(frame.id);
                      }
                    }}
                    className="p-3 bg-red-900/20 hover:bg-red-600 hover:text-white text-red-500 rounded-xl transition-all border border-red-500/20"
                  >
                    <ICONS.Trash className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="grid grid-cols-1 gap-3">
              {rpRewards.map(reward => (
                <motion.div 
                  key={reward.level}
                  className="bg-black/60 border border-white/5 p-4 rounded-xl flex items-center justify-between group hover:border-[#F2A900]/30 transition-colors"
                >
                   <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#1A1A1A] rounded-lg border border-white/10 flex items-center justify-center font-black text-[#F2A900]">
                      {reward.level}
                    </div>
                    <div>
                      <div className="text-sm font-black text-white italic">{reward.name}</div>
                      <div className="text-[10px] font-mono text-gray-500 uppercase">{reward.type} Reward • {reward.value}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setEditingRp(reward);
                      setFormState({
                        id: 'rp',
                        name: reward.name,
                        level: reward.level,
                        type: reward.type,
                        value: reward.value,
                        image: reward.image || '',
                        color: reward.color || '#F2A900',
                        cost: '0'
                      });
                      setIsModalOpen(true);
                    }}
                    className="p-3 bg-white/5 hover:bg-[#F2A900] hover:text-black text-white rounded-xl transition-all"
                  >
                    <ICONS.Edit className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
              {rpRewards.length === 0 && (
                <div className="text-center py-10 text-gray-700 italic font-black uppercase text-[10px] tracking-widest">
                  No RP rewards detected. Initialize defaults in the top right.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Asset Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#1A1A1A] border-2 border-[#F2A900] rounded-2xl w-full max-w-md overflow-hidden relative z-10"
            >
              <form onSubmit={handleSave} className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black italic text-[#F2A900] uppercase skew-x-[-12deg]">
                    {activeAdminTab === 'rp' ? `EDIT RP TIER ${formState.level}` : (editingFrame ? 'Modifying Asset' : 'New Deployment')}
                  </h3>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white">
                    <ICONS.Alert className="w-6 h-6 rotate-45" />
                  </button>
                </div>

                <div className="space-y-4">
                  {activeAdminTab === 'rp' ? (
                    <>
                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Reward Name</label>
                        <input 
                          type="text" 
                          required
                          value={formState.name}
                          onChange={e => setFormState({...formState, name: e.target.value})}
                          className="w-full bg-black border border-white/5 rounded-xl p-3 text-white font-bold outline-none focus:border-[#F2A900] transition-colors"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Type</label>
                          <select 
                            value={formState.type}
                            onChange={e => setFormState({...formState, type: e.target.value})}
                            className="w-full bg-black border border-white/5 rounded-xl p-3 text-white font-bold outline-none focus:border-[#F2A900]"
                          >
                            <option value="money">Money (BP)</option>
                            <option value="skin">Skin ID</option>
                            <option value="frame">Frame ID</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Value / ID</label>
                          <input 
                            type="text"
                            value={formState.value}
                            onChange={e => setFormState({...formState, value: e.target.value as any})}
                            className="w-full bg-black border border-white/5 rounded-xl p-3 text-white font-bold outline-none focus:border-[#F2A900]"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Name Color</label>
                          <div className="flex gap-2">
                            <input 
                              type="color"
                              value={formState.color}
                              onChange={e => setFormState({...formState, color: e.target.value})}
                              className="w-12 h-12 bg-black border border-white/5 rounded-xl outline-none cursor-pointer"
                            />
                            <input 
                              type="text"
                              value={formState.color}
                              onChange={e => setFormState({...formState, color: e.target.value})}
                              className="flex-1 bg-black border border-white/5 rounded-xl p-3 text-white font-mono text-xs outline-none focus:border-[#F2A900]"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Asset Image (GIF/UI)</label>
                          <div className="flex gap-2">
                            <input 
                              type="file" 
                              id="rp-image"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => setFormState({...formState, image: reader.result as string});
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            <label 
                              htmlFor="rp-image"
                              className="flex-1 bg-black border border-white/5 rounded-xl p-3 text-gray-500 text-xs font-bold flex items-center justify-center cursor-pointer hover:border-[#F2A900] transition-colors"
                            >
                              {formState.image ? "Change Image" : "Upload Image/GIF"}
                            </label>
                            {formState.image && (
                              <div className="w-12 h-12 rounded-xl border border-white/10 overflow-hidden bg-black flex items-center justify-center">
                                <img src={formState.image} className="w-full h-full object-contain" alt="" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Asset ID (Immutable)</label>
                        <input 
                          disabled={!!editingFrame}
                          value={formState.id}
                          onChange={e => setFormState({...formState, id: e.target.value})}
                          placeholder="e.g. survival_gold"
                          className="w-full bg-black border border-[#333] rounded-lg p-3 text-sm outline-none focus:border-[#F2A900] disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Combat Name</label>
                        <input 
                          value={formState.name}
                          onChange={e => setFormState({...formState, name: e.target.value})}
                          placeholder="e.g. Golden Vanguard"
                          className="w-full bg-black border border-[#333] rounded-lg p-3 text-sm outline-none focus:border-[#F2A900]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Pricing (Gold)</label>
                        <input 
                          type="number"
                          value={formState.cost}
                          onChange={e => setFormState({...formState, cost: e.target.value})}
                          className="w-full bg-black border border-[#333] rounded-lg p-3 text-sm outline-none focus:border-[#F2A900]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 flex justify-between">
                          Asset URL (JPG/PNG/GIF)
                          <span className="text-red-500 font-mono lower">max 1MB if using base64</span>
                        </label>
                        <div className="flex gap-2">
                          <input 
                            value={formState.image}
                            onChange={e => setFormState({...formState, image: e.target.value})}
                            placeholder="https://..."
                            className="flex-1 bg-black border border-[#333] rounded-lg p-3 text-sm outline-none focus:border-[#F2A900]"
                          />
                          {formState.image && (
                            <div className="w-12 h-12 bg-black rounded border border-white/10 overflow-hidden flex items-center justify-center">
                              <img src={formState.image} alt="Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 rounded-xl border border-[#333] font-black text-xs uppercase text-gray-400 hover:bg-white/5 transition-all"
                  >
                    Abort
                  </button>
                  <button 
                    disabled={loading}
                    type="submit"
                    className="flex-[2] py-4 rounded-xl bg-[#F2A900] text-black font-black text-xs uppercase shadow-lg shadow-[#F2A900]/20 hover:bg-[#FFC000] active:scale-95 transition-all"
                  >
                    {loading ? 'Processing...' : editingFrame ? 'Apply Changes' : 'Confirm Deployment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <section className="bg-red-900/10 border border-red-900/20 rounded-2xl p-6 opacity-60">
         <h3 className="text-sm font-black text-red-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
          <ICONS.Alert className="w-4 h-4" /> EMERGENCY OVERRIDE
        </h3>
        <p className="text-[10px] text-gray-500 font-bold uppercase mb-4 leading-relaxed">
          The following tools are for emergency account recovery and balance correction only.
        </p>
        <button className="w-full py-4 bg-red-900/20 text-red-500 border border-red-500/30 rounded-xl font-black uppercase text-xs tracking-tighter opacity-50 cursor-not-allowed">
          Initialize Global Reset (LOCKED)
        </button>
      </section>
    </div>
  );
};
