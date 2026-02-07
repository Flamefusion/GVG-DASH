import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Package,
  CheckCircle,
  FlaskConical,
  XCircle,
  Archive,
  Clock,
} from 'lucide-react';
import { KPICard } from '@/app/components/KPICard';
import { ChartSection } from '@/app/components/ChartSection';
import { DataTableModal } from '@/app/components/DataTableModal';
import { DashboardFilters } from '@/app/components/DashboardFilters';
import { useDashboard } from '@/app/contexts/DashboardContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8080';

export const Home: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [selectedKpi, setSelectedKpi] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const { kpis, loading, error, darkMode } = useDashboard();

  useEffect(() => {
    const fetchLastUpdated = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/last-updated`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.last_updated_at) {
          const date = new Date(data.last_updated_at);
          const formattedDate = date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          setLastUpdatedAt(formattedDate);
        }
      } catch (error) {
        console.error('Failed to fetch last updated time:', error);
      }
    };

    fetchLastUpdated();
  }, []);

  const handleKPIClick = (title: string, kpiKey: string) => {
    setModalTitle(title);
    setSelectedKpi(kpiKey);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-xl text-gray-500 dark:text-gray-400">
        Loading dashboard data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-xl text-red-500">
        Error: {error}
      </div>
    );
  }

  const kpiCards = kpis ? [
    {
      title: 'TOTAL INWARD',
      kpiKey: 'total_inward',
      value: kpis.total_inward,
      icon: Package,
      color: '#3b82f6',
    },
    {
      title: 'QC ACCEPTED',
      kpiKey: 'qc_accepted',
      value: kpis.qc_accepted,
      icon: CheckCircle,
      color: '#10b981',
    },
    {
      title: 'TESTING ACCEPTED',
      kpiKey: 'testing_accepted',
      value: kpis.testing_accepted,
      icon: FlaskConical,
      color: '#8b5cf6',
    },
    {
      title: 'TOTAL REJECTED',
      kpiKey: 'total_rejected',
      value: kpis.total_rejected,
      icon: XCircle,
      color: '#ef4444',
    },
    {
      title: 'MOVED TO INVENTORY',
      kpiKey: 'moved_to_inventory',
      value: kpis.moved_to_inventory,
      icon: Archive,
      color: '#f59e0b',
    },
    {
      title: 'WORK IN PROGRESS',
      kpiKey: 'work_in_progress',
      value: kpis.work_in_progress,
      icon: Clock,
      color: '#06b6d4',
    },
  ] : [];

  return (
    <div
      className={`min-h-screen p-8 transition-colors ${
        darkMode ? 'bg-black' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1
          className="text-6xl font-extrabold bg-clip-text text-transparent inline-block"
          style={{
            backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          }}
        >
          FQC DASHBOARD
        </h1>
        <p className={`mt-2 text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Quality Control Monitoring & Analytics
        </p>
        {lastUpdatedAt && (
            <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Last data sync: {lastUpdatedAt}
            </p>
        )}
      </motion.div>

      <DashboardFilters />

      <div className="grid grid-cols-6 gap-4 mb-8">
        {kpiCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
          <KPICard
              title={card.title}
              value={card.value}
              icon={card.icon}
              color={card.color}
              onClick={() => handleKPIClick(card.title, card.kpiKey)}
            />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <ChartSection />
      </motion.div>

      {modalOpen && (
        <DataTableModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={modalTitle}
          kpiKey={selectedKpi}
        />
      )}
    </div>
  );
};