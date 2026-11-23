import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface ThemeConfig {
  id: string;
  name: string;
  type: 'color' | 'gradient' | 'image' | 'animated';
  value: string;
  text: 'text-brand-navy' | 'text-white' | 'text-gray-900' | string;
  glassmorphism?: boolean;
  blur?: number; 
  particles?: boolean;
  movingGradient?: boolean;
  darkMode?: boolean;
}

interface BackgroundLayerProps {
  theme: ThemeConfig;
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({ theme }) => {
  const isImage = theme.type === 'image';
  const isGradient = theme.type === 'gradient' || theme.type === 'animated';
  
  const particles = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      size: Math.random() * 4 + 2,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
    }));
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
      {/* Base Layer */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={theme.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 transform-gpu"
          style={{
            backgroundColor: theme.type === 'color' ? theme.value : undefined,
            backgroundImage: isGradient ? theme.value : isImage ? `url(${theme.value})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Moving Gradient Overlay */}
          {theme.movingGradient && (
            <div className="absolute inset-0 opacity-30 mix-blend-soft-light overflow-hidden pointer-events-none">
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 90, 0],
                  x: ['-10%', '10%', '-10%'],
                  y: ['-10%', '10%', '-10%'],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-50%] bg-gradient-to-br from-white/40 via-transparent to-white/40 rounded-full blur-3xl transform-gpu will-change-transform"
              />
              <motion.div 
                animate={{ 
                  scale: [1.2, 1, 1.2],
                  rotate: [0, -90, 0],
                  x: ['10%', '-10%', '10%'],
                  y: ['10%', '-10%', '10%'],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-50%] bg-gradient-to-tr from-white/20 via-transparent to-white/20 rounded-full blur-3xl transform-gpu will-change-transform"
              />
            </div>
          )}

          {/* Particles */}
          {theme.particles && (
            <div className="absolute inset-0 opacity-30">
              {particles.map((p) => (
                <motion.div
                  key={p.id}
                  className="absolute bg-white/40 rounded-full blur-[1px]"
                  style={{
                    width: p.size,
                    height: p.size,
                    left: p.left,
                    top: p.top,
                  }}
                  animate={{
                    y: [0, -150, 0],
                    opacity: [0, 1, 0],
                    scale: [0.5, 1.5, 0.5],
                  }}
                  transition={{
                    duration: p.duration,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: p.delay,
                  }}
                />
              ))}
            </div>
          )}

          {/* Glassmorphism Overlay */}
          {theme.glassmorphism && (
            <div 
              className="absolute inset-0 bg-white/5 backdrop-blur-[20px]" 
              style={{ backdropFilter: `blur(${theme.blur || 20}px)` }}
            />
          )}

          {/* Dark Mode Tint */}
          {theme.darkMode && (
            <div className="absolute inset-0 bg-black/20" />
          )}
        </motion.div>
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.1) translate(2%, 2%); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 15s infinite ease-in-out;
        }
      `}} />
    </div>
  );
};
