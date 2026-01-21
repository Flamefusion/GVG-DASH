import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface DashboardFilters {
  dateRange: { from: Date | null; to: Date | null };
  size: string;
  sku: string;
}

export interface KPI {
  total_inward: number;
  qc_accepted: number;
  testing_accepted: number;
  total_rejected: number;
  moved_to_inventory: number;
  work_in_progress: number;
}

export interface ChartData {
  sku: string;
  count: number;
}

export interface AnalysisKPIs {
  total_rejected: number;
  de_tech_rejection: number;
  ihc_rejection: number;
  vqc_rejection: number;
  ft_rejection: number;
  cs_rejection: number;
}

export interface AnalysisChartData {
  name: string;
  value: number;
}

export interface AnalysisTrendData {
  day: string;
  rejected: number;
}

export interface AnalysisData {
  kpis: AnalysisKPIs;
  acceptedVsRejected: AnalysisChartData[];
  rejectionBreakdown: AnalysisChartData[];
  rejectionTrend: AnalysisTrendData[];
  topVqcRejections: AnalysisChartData[];
  topFtRejections: AnalysisChartData[];
  topCsRejections: AnalysisChartData[];
  deTechVendorRejections: AnalysisChartData[];
  ihcVendorRejections: AnalysisChartData[];
}

interface DashboardContextType {
  filters: DashboardFilters;
  setFilters: (filters: DashboardFilters) => void;
  applyFilters: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  kpis: KPI | null;
  vqcWipChart: ChartData[];
  ftWipChart: ChartData[];
  analysisData: AnalysisData | null;
  skus: string[];
  sizes: string[];
  loading: boolean;
  error: string | null;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8080';

const getWeekDateRange = () => {
  const today = new Date();
  const first = today.getDate() - today.getDay();
  const last = first + 6;

  const from = new Date(today.setDate(first));
  const to = new Date(today.setDate(last));
  
  return { from, to };
};

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: getWeekDateRange(),
    size: 'all',
    sku: 'all',
  });
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [vqcWipChart, setVqcWipChart] = useState<ChartData[]>([]);
  const [ftWipChart, setFtWipChart] = useState<ChartData[]>([]);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [skus, setSkus] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };
  
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const fetchData = useCallback(async (currentFilters: DashboardFilters) => {
    setLoading(true);
    setError(null);
    
    const params = new URLSearchParams();
    if (currentFilters.dateRange.from) {
      params.append('start_date', formatDate(currentFilters.dateRange.from));
    }
    if (currentFilters.dateRange.to) {
      params.append('end_date', formatDate(currentFilters.dateRange.to));
    }
    if (currentFilters.size && currentFilters.size !== 'all') {
      params.append('size', currentFilters.size);
    }
    if (currentFilters.sku && currentFilters.sku !== 'all') {
      params.append('sku', currentFilters.sku);
    }
    const queryString = params.toString();

    try {
      const [kpiResponse, chartResponse, analysisResponse] = await Promise.all([
        fetch(`${BACKEND_URL}/kpis?${queryString}`),
        fetch(`${BACKEND_URL}/charts?${queryString}`),
        fetch(`${BACKEND_URL}/analysis?${queryString}`),
      ]);

      if (!kpiResponse.ok) throw new Error(`HTTP error! status: ${kpiResponse.status} for KPIs`);
      if (!chartResponse.ok) throw new Error(`HTTP error! status: ${chartResponse.status} for Charts`);
      if (!analysisResponse.ok) throw new Error(`HTTP error! status: ${analysisResponse.status} for Analysis`);

      const kpiData = await kpiResponse.json();
      const chartData = await chartResponse.json();
      const analysisData = await analysisResponse.json();

      setKpis(kpiData);
      setVqcWipChart(chartData.vqc_wip_sku_wise);
      setFtWipChart(chartData.ft_wip_sku_wise);
      setAnalysisData(analysisData);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError(`Failed to load data: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const [skusResponse, sizesResponse] = await Promise.all([
        fetch(`${BACKEND_URL}/skus`),
        fetch(`${BACKEND_URL}/sizes`),
      ]);
      if (!skusResponse.ok) throw new Error('Failed to fetch SKUs');
      if (!sizesResponse.ok) throw new Error('Failed to fetch sizes');
      
      const skusData = await skusResponse.json();
      const sizesData = await sizesResponse.json();

      setSkus(['all', ...skusData.filter(s => s)]);
      setSizes(['all', ...sizesData.filter(s => s)]);
    } catch (err) {
      console.error("Failed to fetch filter options:", err);
      setError(`Failed to load filter options: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  useEffect(() => {
    fetchFilterOptions();
    fetchData(filters);
  }, [fetchData, fetchFilterOptions]);

  const applyFilters = () => {
    fetchData(filters);
  };

  return (
    <DashboardContext.Provider
      value={{
        filters,
        setFilters,
        applyFilters,
        darkMode,
        toggleDarkMode,
        kpis,
        vqcWipChart,
        ftWipChart,
        analysisData,
        skus,
        sizes,
        loading,
        error,
      }}
    >
      <div className={darkMode ? 'dark' : ''}>{children}</div>
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
};