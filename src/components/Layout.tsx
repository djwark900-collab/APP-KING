import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ICONS, THEME } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { Home } from './Home';
import { Shop } from './Shop';
import { Leaderboard } from './Leaderboard';
import { Profile } from './Profile';
import { Settings } from './Settings';
import { Admin } from './Admin';
import { RoyalPass } from './RoyalPass';

export const Layout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'shop' | 'top' | 'profile' | 'settings' | 'admin' | 'rp'>(() => {
    const savedTab = localStorage.getItem('activeTab');
    return (savedTab as any) || 'home';
  });
  const { profile } = useAuth();
  
  const isAdmin = profile?.email === 'traleague@gmail.com' || profile?.isAdmin;

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const tabs = [
    { id: 'shop', icon: ICONS.Shop, label: 'SHOP' },
    { id: 'top', icon: ICONS.Leaderboard, label: 'TOP' },
    { id: 'home', icon: ICONS.Home, label: 'HOME' },
    { id: 'rp', icon: ICONS.Crown, label: 'PASS' },
    { id: 'profile', icon: ICONS.Profile, label: 'ID' },
  ];

  if (isAdmin) {
    tabs.push({ id: 'admin', icon: ICONS.Zap, label: 'HQ' });
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <Home />;
      case 'shop': return <Shop />;
      case 'top': return <Leaderboard />;
      case 'profile': return <Profile />;
      case 'settings': return <Settings />;
      case 'admin': return <Admin />;
      case 'rp': return <RoyalPass />;
      default: return <Home />;
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0F0F0F] text-white overflow-hidden max-w-md mx-auto shadow-2xl border-x border-[#222]">
      {/* Top Bar */}
      <div className="h-16 flex items-center justify-between px-6 bg-[#1A1A1A] border-bottom border-[#333] shrink-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#F2A900] flex items-center justify-center rounded">
            <ICONS.Tapper className="text-black w-5 h-5" />
          </div>
          <span className="font-black tracking-tighter text-lg leading-none">PUBG</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-black/50 border border-[#333] px-3 py-1.5 rounded-full flex items-center gap-2">
            <ICONS.Flame className="w-4 h-4 text-[#F2A900]" />
            <span className="font-mono text-[#F2A900] font-bold">
              {profile?.score?.toLocaleString() || 0}
            </span>
          </div>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`p-2 rounded-lg border transition-all ${
              activeTab === 'settings' 
                ? 'bg-[#F2A900] text-black border-[#F2A900]' 
                : 'bg-black/40 text-gray-500 border-white/5 hover:border-white/10'
            }`}
          >
            <ICONS.Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <nav className="h-24 bg-[#1A1A1A] border-t-2 border-[#333] flex items-center justify-around px-2 shrink-0 z-20 relative"
           style={{ 
             backgroundImage: `linear-gradient(rgba(26,26,26,0.8), rgba(26,26,26,0.9)), url('https://www.transparenttextures.com/patterns/carbon-fibre.png')`,
             backgroundSize: '200px'
           }}>
        
        {/* Decorative Hardware Elements */}
        <div className="absolute top-0 left-4 w-1.5 h-1.5 bg-[#444] rounded-full border border-black -mt-[4px]" />
        <div className="absolute top-0 right-4 w-1.5 h-1.5 bg-[#444] rounded-full border border-black -mt-[4px]" />
        
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isCenter = index === 2; // Home button

          if (isCenter) {
            return (
              <div key={tab.id} className="relative -top-6 w-20 flex flex-col items-center">
                <button
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-2xl relative overflow-hidden ${
                    isActive 
                      ? 'bg-[#F2A900] text-black scale-110' 
                      : 'bg-[#222] text-gray-400 hover:bg-[#333]'
                  }`}
                  style={{
                    boxShadow: isActive ? '0 0 20px rgba(242,169,0,0.4)' : 'none'
                  }}
                >
                  {/* Internal Glow for Center */}
                  {isActive && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                  <Icon className={`w-8 h-8 relative z-10`} />
                </button>
                <span className={`text-[10px] font-black tracking-widest uppercase mt-2 ${isActive ? 'text-[#F2A900]' : 'text-gray-500'}`}>
                  {tab.label}
                </span>
              </div>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center gap-1 transition-all flex-1 h-full relative ${
                isActive ? 'text-[#F2A900]' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-black tracking-widest uppercase">{tab.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="activeTabIndicator"
                  className="absolute bottom-4 w-1.5 h-1.5 bg-[#F2A900] rounded-full"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
