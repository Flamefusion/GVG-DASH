import React from 'react';
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
import { DashboardFilters } from '@/app/components/DashboardFilters';
import { useDashboard } from '@/app/contexts/DashboardContext';
import { RejectionStatusCharts } from '@/app/components/RejectionStatusCharts';
import { RejectionTrendChart } from '@/app/components/RejectionTrendChart';
import { TopRejectionsCharts } from '@/app/components/TopRejectionsCharts';
import { VendorRejectionCharts } from '@/app/components/VendorRejectionCharts';
import { Skeleton } from '@/app/components/ui/skeleton';

const Analysis: React.FC = () => {
  const { darkMode, analysisData, loading, error, filters } = useDashboard();

  if (loading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-6 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96 mb-8" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!analysisData) return <div className="p-8">No analysis data available.</div>;

  const isRT = filters.stage === 'RT' || filters.stage === 'RT CS';
  const isWabiSabi = filters.line === 'WABI SABI';

  const kpiCards = [
    {
      title: 'TOTAL REJECTION',
      value: (analysisData.kpis.total_rejected ?? 0).toLocaleString(),
      icon: XCircle,
      color: '#ef4444',
      show: true,
    },
    {
      title: '3DE TECH REJECTION',
      value: (analysisData.kpis.de_tech_rejection ?? 0).toLocaleString(),
      icon: Package,
      color: '#f59e0b',
      show: !isRT && !isWabiSabi,
    },
    {
      title: 'IHC REJECTION',
      value: (analysisData.kpis.ihc_rejection ?? 0).toLocaleString(),
      icon: FlaskConical,
      color: '#8b5cf6',
      show: !isRT && !isWabiSabi,
    },
    {
      title: 'VQC REJECTION',
      value: (analysisData.kpis.vqc_rejection ?? 0).toLocaleString(),
      icon: CheckCircle,
      color: '#10b981',
      show: true,
    },
    {
      title: 'FT REJECTION',
      value: (analysisData.kpis.ft_rejection ?? 0).toLocaleString(),
      icon: Clock,
      color: '#06b6d4',
      show: true,
    },
    {
      title: 'CS REJECTION',
      value: (analysisData.kpis.cs_rejection ?? 0).toLocaleString(),
      icon: Archive,
      color: '#3b82f6',
      show: true,
    },
  ];

  const visibleKpiCards = kpiCards.filter(card => card.show);

  return (
    <div
      className={`min-h-screen p-8 transition-colors ${
        darkMode ? 'bg-black' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
      }`}
    >
      <DashboardFilters />

      <div className={`grid gap-4 mb-8 ${
        visibleKpiCards.length === 6 ? 'grid-cols-6' : 
        visibleKpiCards.length === 4 ? 'grid-cols-4' : 'grid-cols-4'
      }`}>
        {visibleKpiCards.map((card, index) => (
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
              onClick={() => {}}
            />
          </motion.div>
        ))}
      </div>

      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <RejectionStatusCharts 
          acceptedVsRejected={analysisData.acceptedVsRejected}
          rejectionBreakdown={analysisData.rejectionBreakdown}
        />
      </motion.div>

      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <VendorRejectionCharts 
          deTechData={analysisData.deTechVendorRejections}
          ihcData={analysisData.ihcVendorRejections}
        />
      </motion.div>

      {!isRT && (
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <TopRejectionsCharts 
            topVqcRejections={analysisData.topVqcRejections}
            topFtRejections={analysisData.topFtRejections}
            topCsRejections={analysisData.topCsRejections}
          />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <RejectionTrendChart data={analysisData.rejectionTrend} />
      </motion.div>
    </div>
  );
};

export default Analysis;
