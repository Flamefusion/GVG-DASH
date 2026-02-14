import React from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  AlertCircle,
  Zap,
  ShieldAlert,
  Calendar,
  BarChart3,
  BrainCircuit,
  Construction
} from 'lucide-react';
import { KPICard } from '@/app/components/KPICard';
import { useDashboard } from '@/app/contexts/DashboardContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ReportFilters } from '@/app/components/ReportFilters';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const Forecast: React.FC = () => {
  const { darkMode } = useDashboard();

  // Mock data for UI demonstration during WIP
  const mockForecastData = {
    kpis: {
      forecasted_yield: 94,
      predicted_vqc_reject: 2.1,
      predicted_ft_reject: 1.5,
      predicted_cs_reject: 0.8
    },
    yieldTrend: [
      { day: 'Mon', predicted_yield: 92 },
      { day: 'Tue', predicted_yield: 95 },
      { day: 'Wed', predicted_yield: 93 },
      { day: 'Thu', predicted_yield: 94 },
      { day: 'Fri', predicted_yield: 96 },
      { day: 'Sat', predicted_yield: 95 },
      { day: 'Sun', predicted_yield: 94 },
    ],
    topPredictedRejections: [
      { name: 'SENSOR ISSUE', value: 45 },
      { name: 'CHARGING ISSUE', value: 38 },
      { name: 'COSMETIC DENT', value: 32 },
      { name: 'PCB ALIGNMENT', value: 28 },
      { name: 'SHELL SCRATCH', value: 22 },
    ]
  };

  const kpis = [
    { title: 'FORECASTED YIELD', value: mockForecastData.kpis.forecasted_yield, suffix: '%', icon: TrendingUp, color: '#10b981' },
    { title: 'PREDICTED VQC REJECT', value: mockForecastData.kpis.predicted_vqc_reject, suffix: '%', icon: ShieldAlert, color: '#ef4444' },
    { title: 'PREDICTED FT REJECT', value: mockForecastData.kpis.predicted_ft_reject, suffix: '%', icon: AlertCircle, color: '#f59e0b' },
    { title: 'PREDICTED CS REJECT', value: mockForecastData.kpis.predicted_cs_reject, suffix: '%', icon: Zap, color: '#3b82f6' },
  ];

  const BAR_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'];

  return (
    <div className={`min-h-screen p-8 transition-colors relative ${darkMode ? 'bg-black' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'}`}>
      
      {/* WIP Overlay */}
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-3xl pointer-events-none">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`p-8 rounded-3xl border-2 shadow-2xl flex flex-col items-center gap-4 text-center max-w-md ${
            darkMode ? 'bg-zinc-900 border-yellow-500/50 text-white' : 'bg-white border-yellow-500/50 text-gray-900'
          }`}
        >
          <div className="bg-yellow-500/20 p-4 rounded-full">
            <Construction size={48} className="text-yellow-500" />
          </div>
          <h2 className="text-3xl font-black tracking-tight">FEATURE UNDER WIP</h2>
          <p className={`text-sm font-medium ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
            We are currently designing the Machine Learning models and BigQuery views for real-time forecasting. 
            This page will be live once the prediction engine is fully tuned.
          </p>
          <div className="flex gap-2">
            <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-bold border border-yellow-500/20 uppercase tracking-widest">
              ML Development in Progress
            </span>
          </div>
        </motion.div>
      </div>

      <div className="opacity-40 grayscale-[0.5]">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <BrainCircuit className={darkMode ? 'text-blue-400' : 'text-blue-600'} size={32} />
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Forecast</h1>
          </div>
        </div>

        <ReportFilters onApply={() => {}} />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {kpis.map((kpi, idx) => (
            <div key={kpi.title}>
              <KPICard title={kpi.title} value={kpi.value} suffix={kpi.suffix} icon={kpi.icon} color={kpi.color} onClick={() => {}} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className={`border ${darkMode ? 'bg-black border-white/20' : 'bg-white border-transparent shadow-lg'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="text-emerald-500" size={20} />
                Upcoming 7 Days Yield Forecast (Sample)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockForecastData.yieldTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#333' : '#eee'} />
                    <XAxis dataKey="day" stroke={darkMode ? '#888' : '#666'} />
                    <YAxis domain={[0, 100]} stroke={darkMode ? '#888' : '#666'} />
                    <Line type="monotone" dataKey="predicted_yield" stroke="#10b981" strokeWidth={3} dot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className={`border ${darkMode ? 'bg-black border-white/20' : 'bg-white border-transparent shadow-lg'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="text-rose-500" size={20} />
                Top Predicted Rejection Reasons (Sample)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockForecastData.topPredictedRejections} layout="vertical" margin={{ left: 40, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? '#333' : '#eee'} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={150} stroke={darkMode ? '#ccc' : '#333'} tick={{ fontSize: 10 }} />
                    <Bar dataKey="value" name="Likelihood Score" radius={[0, 4, 4, 0]}>
                      {mockForecastData.topPredictedRejections.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-blue-900/10 border-blue-800/30' : 'bg-blue-50 border-blue-100'}`}>
          <p className={`text-sm flex items-center gap-2 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
            <Zap size={16} />
            <strong>AI Insights:</strong> (Disconnected) Prediction engine setup in progress.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Forecast;
