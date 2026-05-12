import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { ICONS, THEME } from '../constants';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

interface SettingsProps {
  onNavigate: (tab: 'home' | 'shop' | 'top' | 'profile' | 'settings' | 'admin' | 'rp') => void;
}

export const Settings: React.FC<SettingsProps> = ({ onNavigate }) => {
  const { profile, deleteAccount } = useAuth();
  const isAdmin = profile?.email === 'traleague@gmail.com' || profile?.email === 'zakho@gmail.com' || profile?.isAdmin;

  const [isDeleting, setIsDeleting] = useState(false);

  // Game Settings State
  const [settings, setSettings] = useState({
    masterVolume: 80,
    musicEnabled: true,
    sfxEnabled: true,
    notifications: true,
    hapticFeedback: true,
    graphicsQuality: 'High'
  });

  const handleLogout = () => {
    if (confirm("Are you sure you want to abandon the mission?")) {
      signOut(auth);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm("WARNING: THIS ACTION IS IRREVERSIBLE. ALL PROGRESS, SKINS, AND SCORE WILL BE PERMANENTLY DELETED FROM THE LIVE SERVERS. PROCEED?")) {
      try {
        setIsDeleting(true);
        await deleteAccount();
      } catch (err) {
        alert("Failed to wipe data. You may need to re-authenticate.");
        setIsDeleting(false);
      }
    }
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: typeof prev[key] === 'boolean' ? !prev[key] : prev[key]
    }));
  };

  return (
    <div className="flex flex-col h-full bg-[#0F0F0F] relative overflow-hidden">
      <div className="p-6 pt-8 pb-4">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none mb-1 text-white">SETTINGS</h2>
        <div className="flex items-center gap-2">
          <span className="text-[#F2A900] text-[10px] font-black uppercase tracking-[0.25em]">Configuration</span>
          <div className="h-px flex-1 bg-white/5" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24 custom-scrollbar">
        {/* Audio & Visuals Section */}
        <div className="mb-8 space-y-4">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <ICONS.Sound className="w-3.5 h-3.5" /> AUDIO & VISUALS
          </h3>
          
          <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-4 space-y-6">
            {/* Master Volume Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-tight">Master Volume</span>
                <span className="text-xs font-black text-[#F2A900]">{settings.masterVolume}%</span>
              </div>
              <input 
                type="range"
                min="0"
                max="100"
                value={settings.masterVolume}
                onChange={(e) => setSettings({...settings, masterVolume: parseInt(e.target.value)})}
                className="w-full h-1.5 bg-black rounded-lg appearance-none cursor-pointer accent-[#F2A900]"
              />
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${settings.musicEnabled ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    <ICONS.Sound className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-gray-300 uppercase italic tracking-tighter">Combat BGM</span>
                </div>
                <button 
                  onClick={() => toggleSetting('musicEnabled')}
                  className={`w-12 h-6 rounded-full transition-all relative ${settings.musicEnabled ? 'bg-[#F2A900]' : 'bg-gray-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.musicEnabled ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${settings.hapticFeedback ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-500/10 text-gray-500'}`}>
                    <ICONS.Zap className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-gray-300 uppercase italic tracking-tighter">Force Feedback</span>
                </div>
                <button 
                  onClick={() => toggleSetting('hapticFeedback')}
                  className={`w-12 h-6 rounded-full transition-all relative ${settings.hapticFeedback ? 'bg-[#F2A900]' : 'bg-gray-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.hapticFeedback ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Account & Security Section */}
        <div className="mb-8 space-y-4">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <ICONS.Security className="w-3.5 h-3.5" /> ACCOUNT & SECURITY
          </h3>
          
          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={() => toggleSetting('notifications')}
              className="flex items-center justify-between p-4 bg-[#1A1A1A] border border-white/5 rounded-2xl group active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center border border-white/5 group-hover:bg-[#F2A900]/10 group-hover:text-[#F2A900] transition-colors">
                  <ICONS.Notification className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold uppercase text-xs text-white">Deploy Notifications</div>
                  <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Missions & Rewards</div>
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full ${settings.notifications ? 'bg-[#F2A900] shadow-[0_0_8px_rgba(242,169,0,0.5)]' : 'bg-gray-800'}`} />
            </button>
          </div>
        </div>

        {/* Security Section */}
        {isAdmin && (
          <div className="mb-8 space-y-4">
            <h3 className="text-[10px] font-black text-[#F2A900] uppercase tracking-widest flex items-center gap-2">
              <ICONS.Star className="w-3.5 h-3.5" /> COMMAND CENTER
            </h3>
            
            <button 
              onClick={() => onNavigate('admin')}
              className="w-full flex items-center justify-between p-5 bg-black/40 border-2 border-[#F2A900]/20 rounded-2xl group active:scale-[0.98] transition-all hover:border-[#F2A900]/50 hover:bg-[#F2A900]/5 shadow-[0_10px_30px_rgba(242,169,0,0.05)]"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 bg-[#F2A900]/10 text-[#F2A900] rounded-xl flex items-center justify-center border border-[#F2A900]/20 group-hover:scale-110 transition-transform">
                  <ICONS.Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-black italic uppercase text-sm text-[#F2A900]">Admin Protocol</div>
                  <div className="text-[9px] text-[#F2A900]/50 font-bold uppercase tracking-wider">Access System Mainframe</div>
                </div>
              </div>
              <ICONS.Chevron className="w-5 h-5 text-[#F2A900]/30 group-hover:text-[#F2A900]/60 transition-colors" />
            </button>
          </div>
        )}

        {/* Statistics & Info */}
        <div className="mb-10 bg-gradient-to-r from-red-600/10 to-transparent border-l-4 border-red-600 p-6 rounded-r-2xl space-y-4">
          <h4 className="text-xs font-black text-white italic uppercase tracking-tighter mb-1">CRITICAL ZONE</h4>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 bg-red-600/20 text-red-500 border border-red-600/30 font-black py-4 rounded-xl hover:bg-red-600 hover:text-white shadow-xl shadow-red-900/20 transition-all uppercase tracking-tighter italic"
          >
            <ICONS.Logout className="w-5 h-5" />
            Terminate Mission Profile
          </button>

          <button 
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="w-full text-[10px] font-black text-red-500/50 hover:text-red-500 uppercase tracking-widest transition-colors py-2 disabled:opacity-50"
          >
            {isDeleting ? 'WIPING DATA...' : 'Permanently Wipe Save Data'}
          </button>
        </div>

        <div className="text-center opacity-30 pb-10">
          <div className="text-[10px] font-black tracking-[0.4em] uppercase mb-1">PUBG TAPPER ENGINE</div>
          <div className="text-[8px] font-bold uppercase tracking-widest">Build 1.2.9_X64 - STABLE</div>
        </div>
      </div>
    </div>
  );
};
