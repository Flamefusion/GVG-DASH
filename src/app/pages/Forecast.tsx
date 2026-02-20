import React, { useEffect, useCallback, useState } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  AlertCircle,
  Zap,
  ShieldAlert,
  Calendar,
  BarChart3,
  BrainCircuit,
  Loader2,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { KPICard } from '@/app/components/KPICard';
import { useDashboard } from '@/app/contexts/DashboardContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ReportFilters } from '@/app/components/ReportFilters';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
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

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8080';

const Forecast: React.FC = () => {
  const { darkMode, forecastData, setForecastData, reportFilters } = useDashboard();
  const [localLoading, setLocalLoading] = useState(false);
  const [searchSn, setSearchSn] = useState('');
  const [prediction, setPrediction] = useState<any>(null);
  const [predictLoading, setPredictLoading] = useState(false);

  const fetchForecast = useCallback(async () => {
    setLocalLoading(true);
    try {
      const params = new URLSearchParams();
      if (reportFilters.dateRange.from) params.append('start_date', reportFilters.dateRange.from.toISOString().split('T')[0]);
      if (reportFilters.dateRange.to) params.append('end_date', reportFilters.dateRange.to.toISOString().split('T')[0]);
      if (reportFilters.vendor) params.append('vendor', reportFilters.vendor);
      if (reportFilters.line) params.append('line', reportFilters.line);
      if (reportFilters.selectedSizes.length) {
        reportFilters.selectedSizes.forEach(size => params.append('size', size));
      }
      if (reportFilters.selectedSkus.length) {
        reportFilters.selectedSkus.forEach(sku => params.append('sku', sku));
      }

      const response = await fetch(`${BACKEND_URL}/forecast?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch forecast');
      const data = await response.json();
      setForecastData(data);
    } catch (err) {
      console.error('Forecast Error:', err);
    } finally {
      setLocalLoading(false);
    }
  }, [reportFilters, setForecastData]);

  const handlePredict = async () => {
    if (!searchSn.trim()) return;
    setPredictLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/predict-serial?serial_number=${searchSn.trim()}`);
      if (!response.ok) throw new Error('Serial not found');
      const data = await response.json();
      setPrediction(data);
    } catch (err) {
      alert('Serial number not found in master data.');
      setPrediction(null);
    } finally {
      setPredictLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  const kpiCards = forecastData?.kpis ? [
    { title: 'FORECASTED YIELD', value: forecastData?.kpis?.forecasted_yield, suffix: '%', icon: TrendingUp, color: '#10b981' },
    { title: 'FORECASTED GOOD UNITS', value: forecastData?.kpis?.forecasted_good_units, suffix: '', icon: CheckCircle2, color: '#3b82f6' },
    { title: 'FORECASTED REJECTS', value: forecastData?.kpis?.forecasted_rejection_units, suffix: '', icon: ShieldAlert, color: '#ef4444' },
    { title: 'MODEL CONFIDENCE', value: forecastData?.kpis?.model_confidence, suffix: '%', icon: BrainCircuit, color: '#8b5cf6' },
  ] : [];

  const BAR_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#a4de6c', '#d0ed57', '#ffc658', '#8884d8', '#82ca9d'];

  return (
    <div className={`min-h-screen p-8 transition-colors relative ${darkMode ? 'bg-black' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'}`}>
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <BrainCircuit className={darkMode ? 'text-blue-400' : 'text-blue-600'} size={32} />
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>AI Forecast Engine</h1>
        </div>
        {localLoading && (
          <div className="flex items-center gap-2 text-blue-500">
            <Loader2 className="animate-spin" size={20} />
            <span className="text-sm font-medium">Updating Predictions...</span>
          </div>
        )}
      </div>

      <ReportFilters />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((kpi, idx) => (
          <motion.div 
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <KPICard title={kpi.title} value={kpi.value} suffix={kpi.suffix} icon={kpi.icon} color={kpi.color} onClick={() => {}} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className={`border h-full ${darkMode ? 'bg-black border-white/20' : 'bg-white border-transparent shadow-lg'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="text-emerald-500" size={20} />
                Next 7 Days Yield Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {forecastData?.yieldTrend ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecastData.yieldTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#333' : '#eee'} vertical={false} />
                      <XAxis dataKey="day" stroke={darkMode ? '#888' : '#666'} tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} stroke={darkMode ? '#888' : '#666'} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: darkMode ? '#111' : '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#10b981' }}
                      />
                      <Line type="monotone" dataKey="predicted_yield" name="Ensemble Yield %" stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="rf_yield" name="RF Model %" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                      <Line type="monotone" dataKey="xgb_yield" name="XGB Model %" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">Loading trend data...</div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className={`border h-full ${darkMode ? 'bg-black border-white/20' : 'bg-white border-transparent shadow-lg'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldAlert className="text-blue-500" size={20} />
                Real-time Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Enter a Serial Number to predict its probability of passing through all stages.
                </p>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter Serial Number..." 
                    className={darkMode ? 'bg-white/5 border-white/10' : ''}
                    value={searchSn}
                    onChange={(e) => setSearchSn(e.target.value)}
                  />
                  <Button onClick={handlePredict} disabled={predictLoading}>
                    {predictLoading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                  </Button>
                </div>

                {prediction && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-4 rounded-xl border ${
                      prediction.recommendation === 'PROCEED' ? 'bg-emerald-500/10 border-emerald-500/20' :
                      prediction.recommendation === 'HIGH RISK' ? 'bg-rose-500/10 border-rose-500/20' :
                      'bg-amber-500/10 border-amber-500/20'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider opacity-60">Pass Probability</span>
                      <span className={`text-2xl font-black ${
                        prediction.recommendation === 'PROCEED' ? 'text-emerald-500' :
                        prediction.recommendation === 'HIGH RISK' ? 'text-rose-500' :
                        'text-amber-500'
                      }`}>
                        {prediction.overall_pass_probability}%
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-[10px] font-bold uppercase">
                        <span>VQC Risk</span>
                        <span>{prediction.vqc_risk}%</span>
                      </div>
                      <div className="h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500" style={{ width: `${prediction.vqc_risk}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] font-bold uppercase">
                        <span>FT Risk</span>
                        <span>{prediction.ft_risk}%</span>
                      </div>
                      <div className="h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500" style={{ width: `${prediction.ft_risk}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] font-bold uppercase">
                        <span>CS Risk</span>
                        <span>{prediction.cs_risk}%</span>
                      </div>
                      <div className="h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500" style={{ width: `${prediction.cs_risk}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                      {prediction.recommendation === 'PROCEED' ? <CheckCircle2 className="text-emerald-500" size={16} /> :
                       prediction.recommendation === 'HIGH RISK' ? <XCircle className="text-rose-500" size={16} /> :
                       <AlertTriangle className="text-amber-500" size={16} />}
                      <span className="text-xs font-bold">Recommendation: {prediction.recommendation}</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
        >
            <Card className={`border h-full ${darkMode ? 'bg-black border-white/20' : 'bg-white border-transparent shadow-lg'}`}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <BarChart3 className="text-blue-500" size={20} />
                        Forecasted Units (Next 7 Days)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-80">
                        {forecastData?.yieldTrend ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={forecastData.yieldTrend}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#333' : '#eee'} />
                            <XAxis dataKey="day" stroke={darkMode ? '#888' : '#666'} tick={{ fontSize: 12 }} />
                            <YAxis stroke={darkMode ? '#888' : '#666'} tick={{ fontSize: 12 }} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: darkMode ? '#111' : '#fff', border: 'none', borderRadius: '12px' }}
                            />
                            <Bar dataKey="good_units" name="Good Units" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="rejection_units" name="Rejection Units" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                        ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">Loading unit data...</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
        >
            <Card className={`border h-full ${darkMode ? 'bg-black border-white/20' : 'bg-white border-transparent shadow-lg'}`}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <AlertCircle className="text-rose-500" size={20} />
                        Predicted Rejection Reasons (Overall)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-80">
                        {forecastData?.topPredictedRejections ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={forecastData.topPredictedRejections} layout="vertical" margin={{ left: 40, right: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? '#333' : '#eee'} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={150} stroke={darkMode ? '#ccc' : '#333'} tick={{ fontSize: 10 }} />
                            <Tooltip 
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ backgroundColor: darkMode ? '#111' : '#fff', border: 'none', borderRadius: '12px' }}
                            />
                            <Bar dataKey="value" name="Avg Probability %" radius={[0, 4, 4, 0]}>
                                {forecastData.topPredictedRejections.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                                ))}
                            </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">Loading reasons...</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mb-8"
      >
        <Card className={`border ${darkMode ? 'bg-black border-white/20' : 'bg-white border-transparent shadow-lg'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="text-purple-500" size={20} />
              SKU-wise Detailed Forecast & Predicted Reasons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className={`border-b ${darkMode ? 'border-white/10' : 'border-gray-100'}`}>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Vendor</th>
                    <th className="p-3">Size</th>
                    <th className="p-3">Yield %</th>
                    <th className="p-3">Good/Total</th>
                    <th className="p-3">Model Conf.</th>
                    <th className="p-3">Top Rejection Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {forecastData?.detailedForecast?.map((row: any, idx: number) => (
                    <tr key={idx} className={`border-b ${darkMode ? 'border-white/5 hover:bg-white/5' : 'border-gray-50 hover:bg-gray-50'} transition-colors`}>
                      <td className="p-3 font-medium">{row.sku}</td>
                      <td className="p-3">{row.vendor}</td>
                      <td className="p-3">{row.size}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className={row.forecasted_yield_pct > 90 ? 'text-emerald-500' : row.forecasted_yield_pct > 70 ? 'text-amber-500' : 'text-rose-500'}>
                            {row.forecasted_yield_pct}%
                          </span>
                        </div>
                      </td>
                      <td className="p-3">{row.forecasted_good_units} / {row.forecasted_good_units + row.forecasted_rejection_units}</td>
                      <td className="p-3">
                        <div className="w-full bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden min-w-[60px]">
                          <div className="h-full bg-purple-500" style={{ width: `${row.model_confidence_pct}%` }} />
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-xs">{row.top_rejection_reason_1}</span>
                          <span className="text-[10px] opacity-60">{row.rejection_prob_1_pct}% probability</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col gap-6"
        >
          <div className={`p-6 rounded-2xl border flex-1 ${darkMode ? 'bg-blue-900/10 border-blue-800/30' : 'bg-blue-50 border-blue-100'}`}>
            <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
              <Zap size={20} />
              AI Insights & Intelligence
            </h3>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-blue-300/80' : 'text-blue-700/80'}`}>
              Based on the latest ML ensemble (RF + XGBoost), we forecast an overall yield of {forecastData?.kpis?.forecasted_yield ?? '--'}% for the next 7 days. 
              <br/><br/>
              <strong>Key Observation:</strong> {forecastData?.topPredictedRejections?.[0]?.name ?? 'No major issues'} is predicted as the top rejection risk with a {forecastData?.topPredictedRejections?.[0]?.value ?? '--'}% average probability across upcoming batches.
            </p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          className="flex flex-col gap-6"
        >
          <div className={`p-6 rounded-2xl border flex-1 ${darkMode ? 'bg-purple-900/10 border-purple-800/30' : 'bg-purple-50 border-purple-100'}`}>
            <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
              <BrainCircuit size={20} />
              Model Status
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className={`text-xs ${darkMode ? 'text-purple-300/60' : 'text-purple-700/60'}`}>Average Confidence</span>
                <span className={`text-xs font-bold ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>{forecastData?.kpis?.model_confidence ?? '--'}%</span>
              </div>
              <div className="h-1.5 bg-purple-200 dark:bg-purple-900/40 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: `${forecastData?.kpis?.model_confidence ?? 0}%` }} />
              </div>
              <p className={`text-[10px] italic ${darkMode ? 'text-purple-300/40' : 'text-purple-700/40'}`}>
                * Pipeline retrained using the latest 100+ days of history. Ensemble weight: 50% Random Forest / 50% XGBoost.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Forecast;
