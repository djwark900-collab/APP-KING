import React from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../constants';

export const LoadingScreen: React.FC = () => {
  const [creator, setCreator] = React.useState<{name: string, logo: string} | null>(null);

  React.useEffect(() => {
    userService.getCreatorInfo().then(info => {
      if (info) setCreator({ name: info.name || '', logo: info.logo || '' });
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#070707] flex flex-col items-center justify-center relative overflow-hidden font-mono">
      {/* Background FX layers */}
      <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none mix-blend-overlay" />
      <div className="absolute inset-0 bg-scanline opacity-[0.05] pointer-events-none" />
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#F2A900 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* App Logo or Hero Icon */}
        <div className="relative mb-8 p-1">
          <motion.div 
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 5, 0, -5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-24 relative z-10"
          >
            {creator?.logo ? (
              <img src={creator.logo} alt="" className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(242,169,0,0.5)]" />
            ) : (
              <ICONS.Tapper className="w-full h-full text-[#F2A900] drop-shadow-[0_0_20px_rgba(242,169,0,0.4)]" />
            )}
          </motion.div>
          <div className="absolute inset-0 bg-[#F2A900] blur-3xl opacity-20 animate-pulse" />
        </div>

        {/* Loading Text */}
        <div className="text-center">
          <motion.h1 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-black italic tracking-tighter text-white mb-2 uppercase"
          >
            {creator?.name || 'BATTLEGROUNDS'} <span className="text-[#F2A900]">TAPPER</span>
          </motion.h1>
          
          <div className="flex flex-col items-center gap-6 mt-8">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[#F2A900] font-black uppercase text-[8px] tracking-[0.6em] animate-pulse">
                INITIALIZING_SYSTEMS
              </span>
              <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-[#F2A900]/40 to-transparent" />
            </div>
            
            {/* Elegant Loading Bar */}
            <div className="w-48 h-0.5 bg-white/5 rounded-full overflow-hidden relative">
              <motion.div 
                animate={{ 
                  left: ['-100%', '100%']
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-[#F2A900] to-transparent"
              />
            </div>

            {/* Tactical Accents */}
            <div className="flex gap-2">
              {[1, 2, 3].map(i => (
                <motion.div 
                  key={i}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                  className="w-1.5 h-1.5 bg-[#F2A900] rounded-full"
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Security Scanning Line */}
      <motion.div 
        animate={{ top: ['-10%', '110%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-[100px] bg-gradient-to-b from-transparent via-[#F2A900]/5 to-transparent pointer-events-none"
      />
    </div>
  );
};
