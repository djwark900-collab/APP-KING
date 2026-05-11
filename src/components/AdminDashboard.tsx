import React, { useState } from 'react';
import { userService } from '../services/userService';
import { ICONS } from '../constants';
import { motion } from 'motion/react';

export const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [type, setType] = useState<'frame' | 'skin'>('frame');
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [cost, setCost] = useState(0);
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState('Shield');
  const [isGif, setIsGif] = useState(false);
  const [status, setStatus] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Deploying...');
    try {
      if (type === 'frame') {
        await userService.addFrame({ id, name, cost, image: url, isGif });
      } else {
        await userService.addSkin({ id, name, cost, image: url, icon });
      }
      setStatus('Deployed successfully!');
      setId(''); setName(''); setUrl('');
    } catch (err: any) {
      setStatus(`Mission failed: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black italic text-[#F2A900]">BATTLE COMMAND</h2>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Global Asset Deployment</p>
        </div>
        <button onClick={onClose} className="p-2 bg-gray-900 rounded-lg"><ICONS.Logout className="w-6 h-6" /></button>
      </div>

      <form onSubmit={handleAdd} className="space-y-6 max-w-md mx-auto w-full">
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={() => setType('frame')}
            className={`flex-1 py-3 rounded-lg font-black uppercase text-xs ${type === 'frame' ? 'bg-[#F2A900] text-black' : 'bg-gray-800 text-gray-400'}`}
          >
            New Frame
          </button>
          <button 
            type="button"
            onClick={() => setType('skin')}
            className={`flex-1 py-3 rounded-lg font-black uppercase text-xs ${type === 'skin' ? 'bg-[#F2A900] text-black' : 'bg-gray-800 text-gray-400'}`}
          >
            New Skin
          </button>
        </div>

        <div className="space-y-4 bg-gray-900 p-6 rounded-xl border border-gray-800">
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Asset ID</label>
            <input value={id} onChange={e => setId(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-3 text-sm focus:border-[#F2A900] outline-none" placeholder="e.g. golden_pan" required />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Display Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-3 text-sm focus:border-[#F2A900] outline-none" placeholder="e.g. Golden Pan" required />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Cost (Dinners)</label>
            <input type="number" value={cost} onChange={e => setCost(Number(e.target.value))} className="w-full bg-black border border-gray-700 rounded p-3 text-sm focus:border-[#F2A900] outline-none" required />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Asset Source (URL or File)</label>
            <div className="space-y-2">
              <input value={url} onChange={e => setUrl(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-3 text-sm focus:border-[#F2A900] outline-none" placeholder="https://..." />
              <div className="relative">
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
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="w-full bg-gray-800 text-gray-300 font-black uppercase text-[10px] py-2 rounded text-center border border-gray-700 hover:bg-gray-700">
                  Select Local Asset File
                </div>
              </div>
            </div>
          </div>

          {url && (
            <div className="mt-2 text-center">
              <p className="text-[8px] font-bold text-gray-600 uppercase mb-2">Preview</p>
              <div className="w-20 h-20 mx-auto bg-black rounded border border-gray-800 flex items-center justify-center overflow-hidden">
                <img src={url} alt="Preview" className="w-full h-full object-contain" />
              </div>
            </div>
          )}

          {type === 'frame' ? (
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={isGif} onChange={e => setIsGif(e.target.checked)} id="isGif" />
              <label htmlFor="isGif" className="text-xs font-bold uppercase text-gray-400">Animated GIF Frame</label>
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">SVG Icon Template</label>
              <select value={icon} onChange={e => setIcon(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-3 text-sm">
                {Object.keys(ICONS).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          )}
        </div>

        {status && <p className={`text-center text-xs font-bold uppercase ${status.includes('fail') ? 'text-red-500' : 'text-[#F2A900]'}`}>{status}</p>}

        <button type="submit" className="w-full bg-[#F2A900] text-black font-black uppercase py-4 rounded-xl hover:bg-[#FFC000] shadow-lg shadow-[#F2A900]/20">
          Drop Asset
        </button>
      </form>
    </div>
  );
};
