import React from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../constants';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Grid Accent */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#F2A900 0.5px, transparent 0.5px)', backgroundSize: '10px 10px' }} />
      
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* Animated Icon */}
        <motion.div 
          animate={{ 
            rotate: [0, 90, 180, 270, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
          className="mb-8"
        >
          <ICONS.Tapper className="w-20 h-20 text-[#F2A900] drop-shadow-[0_0_20px_rgba(242,169,0,0.4)]" />
        </motion.div>

        {/* Loading Text */}
        <div className="text-center">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl font-black italic tracking-tighter text-white mb-2 transform -skew-x-12"
          >
            BATTLEGROUNDS <span className="text-[#F2A900]">TAPPER</span>
          </motion.h1>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex flex-col items-center gap-4"
          >
            <p className="text-[#F2A900] font-black uppercase text-xs tracking-[0.3em]">
              Preparing for Drop...
            </p>
            
            {/* Loading Bar */}
            <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden border border-white/10">
              <motion.div 
                animate={{ 
                  x: ['-100%', '100%'],
                  opacity: [0, 1, 0]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-1/2 h-full bg-[#F2A900]"
              />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Decorative Skewed Lines */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#F2A900]/30 to-transparent blur-sm" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#F2A900]/30 to-transparent blur-sm" />
    </div>
  );
};
