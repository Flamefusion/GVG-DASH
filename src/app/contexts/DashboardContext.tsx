import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface DashboardFilters {
  dateRange: { from: Date | null; to: Date | null };
  selectedSizes: string[];
  selectedSkus: string[];
  stage: string;
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

export interface ReportFilters {
  dateRange: { from: Date | null; to: Date | null };
  vendor: string;
  stage: string;
  reportType: 'Daily' | 'Rejection';
  selectedSizes: string[];
  selectedSkus: string[];
}

export interface SearchFilters {
  serialNumbers: string;
  moNumbers: string;
  stage: string;
  vendor: string;
  selectedSizes: string[];
  selectedSkus: string[];
  selectedStatuses: string[];
  selectedReasons: string[];
  dateRange: { from: Date | null; to: Date | null };
}

export interface SearchResults {
  data: any[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  hasSearched: boolean;
}

interface DashboardContextType {
  filters: DashboardFilters;
  setFilters: (filters: DashboardFilters) => void;
  reportFilters: ReportFilters;
  setReportFilters: (filters: ReportFilters) => void;
  searchFilters: SearchFilters;
  setSearchFilters: React.Dispatch<React.SetStateAction<SearchFilters>>;
  searchResults: SearchResults;
  setSearchResults: React.Dispatch<React.SetStateAction<SearchResults>>;
  applyFilters: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  isFullScreen: boolean;
  toggleFullScreen: () => void;
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

const getMonthDateRange = () => {
  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth(), 1);
  const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  return { from, to };
};

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: getMonthDateRange(),
    selectedSizes: [],
    selectedSkus: [],
    stage: 'VQC',
  });
  const [reportFilters, setReportFilters] = useState<ReportFilters>({
    dateRange: { from: null, to: null },
    vendor: 'all',
    stage: 'VQC',
    reportType: 'Daily',
    selectedSizes: [],
    selectedSkus: [],
  });
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    serialNumbers: '',
    moNumbers: '',
    stage: 'All',
    vendor: 'all',
    selectedSizes: [],
    selectedSkus: [],
    selectedStatuses: [],
    selectedReasons: [],
    dateRange: { from: null, to: null },
  });
  const [searchResults, setSearchResults] = useState<SearchResults>({
    data: [],
    totalRecords: 0,
    totalPages: 0,
    currentPage: 1,
    hasSearched: false,
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

  const toggleFullScreen = () => {
    setIsFullScreen((prev) => !prev);
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
    if (currentFilters.selectedSizes && currentFilters.selectedSizes.length > 0) {
      currentFilters.selectedSizes.forEach(s => params.append('size', s));
    }
    if (currentFilters.selectedSkus && currentFilters.selectedSkus.length > 0) {
      currentFilters.selectedSkus.forEach(s => params.append('sku', s));
    }
    if (currentFilters.stage) {
      params.append('stage', currentFilters.stage);
      let date_column = 'vqc_inward_date';
      if (currentFilters.stage === 'FT') {
        date_column = 'ft_inward_date';
      } else if (currentFilters.stage === 'CS' || currentFilters.stage === 'RT CS') {
        date_column = 'cs_comp_date';
      }
      params.append('date_column', date_column);

      if (currentFilters.stage === 'RT' || currentFilters.stage === 'RT CS') {
        params.append('table', 'rt_conversion_data');
      }
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
      const table = (filters.stage === 'RT' || filters.stage === 'RT CS') ? 'rt_conversion_data' : 'master_station_data';
      const params = new URLSearchParams({ table });
      const queryString = params.toString();

      const [skusResponse, sizesResponse] = await Promise.all([
        fetch(`${BACKEND_URL}/skus?${queryString}`),
        fetch(`${BACKEND_URL}/sizes?${queryString}`),
      ]);
      if (!skusResponse.ok) throw new Error('Failed to fetch SKUs');
      if (!sizesResponse.ok) throw new Error('Failed to fetch sizes');
      
      const skusData = await skusResponse.json();
      const sizesData = await sizesResponse.json();

      setSkus(skusData.filter(s => s));
      setSizes(sizesData.filter(s => s));
    } catch (err) {
      console.error("Failed to fetch filter options:", err);
      setError(`Failed to load filter options: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [filters.stage]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchData(filters);
  }, []);

  const applyFilters = () => {
    fetchData(filters);
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      if (!document.fullscreenElement && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, [isFullScreen]);

  useEffect(() => {
    if (isFullScreen) {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    }
  }, [isFullScreen]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <DashboardContext.Provider
      value={{
        filters,
        setFilters,
        reportFilters,
        setReportFilters,
        searchFilters,
        setSearchFilters,
        searchResults,
        setSearchResults,
        applyFilters,
        darkMode,
        toggleDarkMode,
        isFullScreen,
        toggleFullScreen,
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
      {children}
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