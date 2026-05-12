import React, { useState } from 'react';
import { userService } from '../services/userService';
import { ICONS, ROYAL_PASS_REWARDS } from '../constants';
import { motion } from 'motion/react';

export const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'add' | 'list' | 'rp'>('add');
  const [type, setType] = useState<'frame' | 'skin'>('frame');
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [cost, setCost] = useState(0);
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState('Shield');
  const [isGif, setIsGif] = useState(false);
  const [status, setStatus] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [frames, setFrames] = useState<any[]>([]);
  const [skins, setSkins] = useState<any[]>([]);
  const [rpRewards, setRpRewards] = useState<any[]>([]);

  const loadData = async () => {
    const f = await userService.getFrames();
    const s = await userService.getSkins();
    const r = await userService.getRpRewards();
    setFrames(f);
    setSkins(s);
    setRpRewards(r.length > 0 ? r : ROYAL_PASS_REWARDS);
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (item: any, itemType: 'frame' | 'skin') => {
    setType(itemType);
    setId(item.id);
    setName(item.name);
    setCost(item.cost);
    setUrl(item.image || '');
    setIcon(item.icon || 'Shield');
    setIsGif(item.isGif || false);
    setIsEditing(true);
    setActiveTab('add');
  };

  const handleDelete = async (itemId: string, itemType: 'frame' | 'skin') => {
    if (!window.confirm('Erase this asset from the database?')) return;
    try {
      if (itemType === 'frame') await userService.deleteFrame(itemId);
      else await userService.deleteSkin(itemId);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateRp = async (reward: any) => {
    try {
      await userService.updateRpReward(reward.level.toString(), reward);
      setStatus(`Tier ${reward.level} updated`);
      loadData();
      setTimeout(() => setStatus(''), 2000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(isEditing ? 'Updating...' : 'Deploying...');
    try {
      if (type === 'frame') {
        if (isEditing) await userService.updateFrame(id, { name, cost, image: url, isGif });
        else await userService.addFrame({ id, name, cost, image: url, isGif });
      } else {
        if (isEditing) await userService.updateSkin(id, { name, cost, image: url, icon });
        else await userService.addSkin({ id, name, cost, image: url, icon });
      }
      setStatus(isEditing ? 'Sector updated!' : 'Deployed successfully!');
      if (!isEditing) {
        setId(''); setName(''); setUrl('');
      }
      setIsEditing(false);
      loadData();
    } catch (err: any) {
      setStatus(`Mission failed: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col p-6 overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-8 max-w-4xl mx-auto w-full">
        <div>
          <h2 className="text-3xl font-black italic text-[#F2A900]">BATTLE COMMAND</h2>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Global Asset Deployment & Progression Control</p>
        </div>
        <button onClick={onClose} className="p-2 bg-gray-900 rounded-lg text-white hover:bg-gray-800 transition-colors">
          <ICONS.Logout className="w-6 h-6" />
        </button>
      </div>

      <div className="flex gap-2 mb-8 max-w-4xl mx-auto w-full overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'add', label: isEditing ? 'Edit Asset' : 'Add New Asset', icon: <ICONS.Plus className="w-3 h-3" /> },
          { id: 'list', label: 'Manage All Assets', icon: <ICONS.Settings className="w-3 h-3" /> },
          { id: 'rp', label: 'Royal Pass Rewards', icon: <ICONS.Crown className="w-3 h-3" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              if (tab.id !== 'add') setIsEditing(false);
            }}
            className={`flex items-center gap-2 whitespace-nowrap px-6 py-3 rounded-xl font-black uppercase text-[10px] transition-all border-2 ${
              activeTab === tab.id 
                ? 'bg-[#F2A900] text-black border-black shadow-[0_5px_15px_rgba(242,169,0,0.3)]' 
                : 'bg-gray-900 text-gray-400 border-white/5 hover:border-white/10'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-4xl mx-auto w-full">
        {activeTab === 'add' && (
          <form onSubmit={handleAdd} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setType('frame')}
                className={`flex-1 py-4 rounded-xl font-black uppercase text-xs transition-all border-2 ${type === 'frame' ? 'bg-[#F2A900] text-black border-black' : 'bg-gray-900 text-gray-400 border-white/5'}`}
              >
                Framework Ops
              </button>
              <button 
                type="button"
                onClick={() => setType('skin')}
                className={`flex-1 py-4 rounded-xl font-black uppercase text-xs transition-all border-2 ${type === 'skin' ? 'bg-[#F2A900] text-black border-black' : 'bg-gray-900 text-gray-400 border-white/5'}`}
              >
                Skin Procurement
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-900/50 p-8 rounded-2xl border border-white/5 backdrop-blur-sm">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Asset ID {isEditing && '(Locked)'}</label>
                  <input 
                    value={id} 
                    onChange={e => setId(e.target.value)} 
                    disabled={isEditing}
                    className={`w-full bg-black border border-gray-700 rounded-lg p-3 text-sm focus:border-[#F2A900] outline-none transition-all ${isEditing ? 'opacity-50' : ''}`} 
                    placeholder="e.g. golden_pan" required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Display Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-black border border-gray-700 rounded-lg p-3 text-sm focus:border-[#F2A900] outline-none transition-all" placeholder="e.g. Golden Pan" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Cost (Dinners)</label>
                  <input type="number" value={cost} onChange={e => setCost(Number(e.target.value))} className="w-full bg-black border border-gray-700 rounded-lg p-3 text-sm focus:border-[#F2A900] outline-none" required />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Asset Source (URL or File Cache)</label>
                  <div className="space-y-2">
                    <input value={url} onChange={e => setUrl(e.target.value)} className="w-full bg-black border border-gray-700 rounded-lg p-3 text-sm focus:border-[#F2A900] outline-none" placeholder="https://..." />
                    <div className="relative group/file">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setUrl(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-full bg-gray-800 text-gray-300 font-black uppercase text-[10px] py-3 rounded-lg text-center border border-white/5 group-hover/file:bg-gray-700 transition-colors">
                        Upload Binary Pattern
                      </div>
                    </div>
                  </div>
                </div>

                {type === 'frame' ? (
                  <div className="flex items-center gap-3 p-4 bg-black/40 rounded-xl border border-white/5">
                    <input type="checkbox" checked={isGif} onChange={e => setIsGif(e.target.checked)} id="isGif" className="accent-[#F2A900] w-4 h-4 shadow-sm" />
                    <label htmlFor="isGif" className="text-xs font-bold uppercase text-gray-400">Animated GIF Sequence</label>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Vector Icon Signature</label>
                    <select value={icon} onChange={e => setIcon(e.target.value)} className="w-full bg-black border border-gray-700 rounded-lg p-3 text-sm text-gray-300 outline-none">
                      {Object.keys(ICONS).map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {url && (
              <div className="mt-2 text-center bg-gray-900/30 p-6 rounded-2xl border border-white/5">
                <p className="text-[8px] font-bold text-gray-600 uppercase mb-3 tracking-widest">Neural Link Preview</p>
                <div className="w-24 h-24 mx-auto bg-black rounded-xl border-2 border-[#F2A900]/20 flex items-center justify-center overflow-hidden shadow-2xl">
                  <img src={url} alt="Preview" className="w-full h-full object-contain" />
                </div>
              </div>
            )}

            {status && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-center text-xs font-black uppercase tracking-widest ${status.includes('fail') ? 'text-red-500' : 'text-[#F2A900]'}`}>{status}</motion.p>}

            <div className="flex gap-4">
              {isEditing && (
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-gray-800 text-gray-400 font-black uppercase py-5 rounded-2xl hover:bg-gray-700 transition-all"
                >
                  Abort
                </button>
              )}
              <button type="submit" className="flex-[2] bg-[#F2A900] text-black font-black uppercase py-5 rounded-2xl hover:bg-white hover:-translate-y-1 transition-all shadow-xl shadow-[#F2A900]/10 border-2 border-black">
                {isEditing ? 'Synchronize Updates' : 'Authorize Deployment'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'list' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <section>
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                <div className="w-4 h-4 rounded-sm bg-[#F2A900] shadow-[0_0_10px_rgba(242,169,0,0.4)]" /> FRAME DEPLOYMENTS
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {frames.map(frame => (
                  <div key={frame.id} className="bg-gray-900/50 border border-white/5 rounded-2xl p-4 group">
                    <div className="aspect-square bg-black rounded-lg mb-4 p-2 relative overflow-hidden border border-white/5">
                      <img src={frame.image} alt="" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                        <button onClick={() => handleEdit(frame, 'frame')} className="p-2 bg-blue-500 rounded-lg shadow-lg hover:scale-110 transition-transform"><ICONS.Edit className="w-4 h-4 text-white" /></button>
                        <button onClick={() => handleDelete(frame.id, 'frame')} className="p-2 bg-red-500 rounded-lg shadow-lg hover:scale-110 transition-transform"><ICONS.Trash className="w-4 h-4 text-white" /></button>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="font-black uppercase text-xs truncate mb-1">{frame.name}</p>
                      <p className="text-[10px] font-bold text-[#F2A900] uppercase tracking-widest">{frame.cost} DINNERS</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                <div className="w-4 h-4 rounded-sm bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]" /> SKIN ARSENAL
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {skins.map(skin => {
                  const Icon = ICONS[skin.icon as keyof typeof ICONS] || ICONS.Shield;
                  return (
                    <div key={skin.id} className="bg-gray-900/50 border border-white/5 rounded-2xl p-4 group">
                      <div className="aspect-square bg-black rounded-lg mb-4 flex items-center justify-center relative overflow-hidden border border-white/5">
                        {skin.image ? <img src={skin.image} className="w-full h-full object-contain" /> : <Icon className="w-10 h-10 text-gray-600" />}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                          <button onClick={() => handleEdit(skin, 'skin')} className="p-2 bg-blue-500 rounded-lg shadow-lg hover:scale-110 transition-transform"><ICONS.Edit className="w-4 h-4 text-white" /></button>
                          <button onClick={() => handleDelete(skin.id, 'skin')} className="p-2 bg-red-500 rounded-lg shadow-lg hover:scale-110 transition-transform"><ICONS.Trash className="w-4 h-4 text-white" /></button>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="font-black uppercase text-xs truncate mb-1">{skin.name}</p>
                        <p className="text-[10px] font-bold text-[#F2A900] uppercase tracking-widest">{skin.cost} DINNERS</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'rp' && (
          <div className="space-y-4 animate-in fade-in duration-500 pb-20">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-3">
                <ICONS.Crown className="w-4 h-4 text-[#F2A900]" /> PROGRESSION REWARDS
              </h3>
              {status && <span className="text-[10px] font-black text-[#F2A900] uppercase animate-pulse">{status}</span>}
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {rpRewards.sort((a,b) => a.level - b.level).map((reward, idx) => (
                <div key={reward.level} className="bg-gray-900/50 border border-white/5 rounded-2xl p-6 flex flex-wrap md:flex-nowrap items-center gap-6 group hover:border-[#F2A900]/20 transition-all">
                  <div className="w-12 h-12 bg-black rounded-lg border-2 border-white/5 font-black text-xl italic text-gray-700 flex items-center justify-center group-hover:text-[#F2A900] group-hover:border-[#F2A900]/20 transition-all">
                    {reward.level}
                  </div>
                  
                  <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[8px] font-black uppercase text-gray-600 mb-1">Sector Name</label>
                      <input 
                        value={reward.name} 
                        onChange={e => {
                          const newRewards = [...rpRewards];
                          newRewards[idx].name = e.target.value;
                          setRpRewards(newRewards);
                        }}
                        className="w-full bg-black border border-gray-800 rounded p-2 text-xs text-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black uppercase text-gray-600 mb-1">Payload Type</label>
                      <select 
                        value={reward.type}
                        onChange={e => {
                          const newRewards = [...rpRewards];
                          newRewards[idx].type = e.target.value;
                          setRpRewards(newRewards);
                        }}
                        className="w-full bg-black border border-gray-800 rounded p-2 text-xs text-white"
                      >
                        <option value="money">Money (BP)</option>
                        <option value="skin">Skin Item</option>
                        <option value="frame">Frame Border</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8px] font-black uppercase text-gray-600 mb-1">Value/Asset ID</label>
                      <input 
                        value={reward.value} 
                        onChange={e => {
                          const newRewards = [...rpRewards];
                          const val = reward.type === 'money' ? Number(e.target.value) : e.target.value;
                          newRewards[idx].value = val;
                          setRpRewards(newRewards);
                        }}
                        className="w-full bg-black border border-gray-800 rounded p-2 text-xs text-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black uppercase text-gray-600 mb-1">Icon Key</label>
                      <select 
                        value={reward.icon}
                        onChange={e => {
                          const newRewards = [...rpRewards];
                          newRewards[idx].icon = e.target.value;
                          setRpRewards(newRewards);
                        }}
                        className="w-full bg-black border border-gray-800 rounded p-2 text-xs text-white"
                      >
                        {Object.keys(ICONS).map(k => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleUpdateRp(reward)}
                    className="p-3 bg-gray-800 text-gray-400 rounded-xl hover:bg-[#F2A900] hover:text-black transition-all"
                    title="Synchronize"
                  >
                    <ICONS.Check className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

