import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { useDashboard } from '@/app/contexts/DashboardContext';

interface KPICardProps {
  title: string;
  value: number | string;
  suffix?: string;
  icon: LucideIcon;
  color: string;
  onClick: () => void;
  percentage?: number | string;
  percentageStyle?: 'side' | 'inline';
}

// Function to create gradient from a color
const getGradient = (color: string) => {
  const gradients: Record<string, string> = {
    '#3b82f6': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    '#10b981': 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    '#8b5cf6': 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    '#ef4444': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    '#f59e0b': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    '#fb923c': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Orange Gradient
    '#06b6d4': 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
  };
  return gradients[color] || `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`;
};

export const KPICard: React.FC<KPICardProps> = ({ title, value, suffix, icon: Icon, color, onClick, percentage, percentageStyle = 'inline' }) => {
  const { darkMode } = useDashboard();

  const formattedPercentage = typeof percentage === 'number' ? percentage.toFixed(2) : percentage;

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -8 }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer rounded-2xl p-5 shadow-xl transition-all relative overflow-hidden h-full"
      style={{
        background: getGradient(color),
      }}
      onClick={onClick}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
      
      <div className="relative z-10 flex h-full text-black items-center">
        <div className="flex-1 flex flex-col h-full">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-black flex items-center gap-2">
              {title}
              {percentage !== undefined && percentageStyle === 'inline' && (
                <span className="text-xs font-bold opacity-70">({formattedPercentage}%)</span>
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
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-extrabold text-black"
            >
              {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
            </motion.p>
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
