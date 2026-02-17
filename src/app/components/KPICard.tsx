import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { useDashboard } from '@/app/contexts/DashboardContext';

interface KPICardProps {
  title: string;
  value: number | string;
  comparisonValue?: number;
  suffix?: string;
  icon: LucideIcon;
  color: string;
  onClick: () => void;
  percentage?: number | string;
  percentageStyle?: 'side' | 'inline';
  isWarning?: boolean;
}

// Function to create gradient from a color
const getGradient = (color: string, isWarning: boolean = false) => {
  const gradients: Record<string, string> = {
    '#3b82f6': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    '#10b981': 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    '#8b5cf6': 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    '#ef4444': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    '#f59e0b': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    '#fb923c': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Orange Gradient
    '#06b6d4': 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
  };
  
  if (isWarning) {
    // If it's a warning, we can use a slightly more muted version of the color or keep it same
    // but the border will do the heavy lifting
    return gradients[color] || `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`;
  }
  
  return gradients[color] || `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`;
};

export const KPICard: React.FC<KPICardProps> = ({ title, value, comparisonValue, suffix, icon: Icon, color, onClick, percentage, percentageStyle = 'inline', isWarning = false }) => {
  const { darkMode } = useDashboard();

  const formattedPercentage = typeof percentage === 'number' ? percentage.toFixed(2) : percentage;
  
  // Calculate Comparison Delta
  const calculateDelta = () => {
    if (comparisonValue === undefined || comparisonValue === 0 || typeof value !== 'number') return null;
    const delta = ((value - comparisonValue) / comparisonValue) * 100;
    return delta;
  };

  const delta = calculateDelta();

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -8 }}
      whileTap={{ scale: 0.98 }}
      animate={isWarning ? { 
        outlineColor: ["rgba(239, 68, 68, 1)", "rgba(239, 68, 68, 0)", "rgba(239, 68, 68, 1)"],
        boxShadow: ["0px 0px 0px rgba(239, 68, 68, 0)", "0px 0px 20px rgba(239, 68, 68, 0.4)", "0px 0px 0px rgba(239, 68, 68, 0)"]
      } : {}}
      transition={isWarning ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" } : {}}
      className={`cursor-pointer rounded-2xl p-5 shadow-xl transition-all relative overflow-hidden h-full ${isWarning ? 'outline-[3px] outline-solid' : ''}`}
      style={{
        background: getGradient(color, isWarning),
      }}
      onClick={onClick}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
      
      <div className="relative z-10 flex h-full text-black items-center">
        <div className="flex-1 flex flex-col h-full">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wide text-black flex items-center gap-2">
              {title}
              {percentage !== undefined && percentageStyle === 'inline' && (
                <span className="text-xs font-black opacity-80">({formattedPercentage}%)</span>
              )}
            </p>
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="rounded-full p-2 bg-white/20 backdrop-blur-md"
            >
              <Icon size={18} color="black" />
            </motion.div>
          </div>
          
          <div className="mt-auto">
            <div className="flex items-baseline gap-2">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-black text-black"
              >
                {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
              </motion.p>
              
              {delta !== null && (
                <div className={`text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center ${delta >= 0 ? 'bg-green-400/30' : 'bg-red-400/30'}`}>
                  {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
                </div>
              )}
            </div>
            {comparisonValue !== undefined && (
              <p className="text-[10px] font-bold text-black/60 mt-1 uppercase">vs Last Month</p>
            )}
          </div>
        </div>

        {percentage !== undefined && percentageStyle === 'side' && (
          <div className="ml-4 flex items-baseline border-l border-black/10 pl-4">
            <span className="text-4xl font-black leading-none">{formattedPercentage}</span>
            <span className="text-xl font-bold opacity-70 ml-0.5">%</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
