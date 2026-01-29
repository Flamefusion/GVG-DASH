import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDashboard } from '@/app/contexts/DashboardContext';

interface DataRow {
  vqc_inward_date: string;
  serial_number: string;
  vqc_status: string;
  vqc_reason: string;
  ft_inward_date: string;
  ft_status: string;
  ft_reason: string;
  cs_status: string;
  cs_reason: string;
  size: string;
  sku: string;
  ctpf_mo: string;
  air_mo: string;
  vendor: string;
  last_updated_at: string;
}

interface DataTableModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  kpiKey: string;
}

const ROWS_PER_PAGE = 100;
const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8080';

export const DataTableModal: React.FC<DataTableModalProps> = ({ open, onClose, title, kpiKey }) => {
  const { darkMode, filters } = useDashboard();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [data, setData] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const fetchData = useCallback(async (page: number) => {
    if (!open || !kpiKey) return;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: String(page),
      limit: String(ROWS_PER_PAGE),
    });

    if (filters.dateRange.from) params.append('start_date', formatDate(filters.dateRange.from));
    if (filters.dateRange.to) params.append('end_date', formatDate(filters.dateRange.to));
    if (filters.size && filters.size !== 'all') params.append('size', filters.size);
    if (filters.sku && filters.sku !== 'all') params.append('sku', filters.sku);

    if (filters.stage) {
      params.append('stage', filters.stage);
      let date_column = 'vqc_inward_date';
      if (filters.stage === 'FT') {
        date_column = 'ft_inward_date';
      } else if (filters.stage === 'CS' || filters.stage === 'RT CS') {
        date_column = 'cs_comp_date';
      }
      params.append('date_column', date_column);

      if (filters.stage === 'RT' || filters.stage === 'RT CS') {
        params.append('table', 'rt_conversion_data');
      }
    }

    try {
      const response = await fetch(`${BACKEND_URL}/kpi-data/${kpiKey}?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result.data);
      setTotalPages(result.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [open, kpiKey, filters]);

  useEffect(() => {
    fetchData(currentPage);
  }, [fetchData, currentPage]);
  
  useEffect(() => {
    // Reset to first page when modal is opened for a new KPI
    setCurrentPage(1);
  }, [kpiKey]);


  const downloadCSV = async () => {
    const params = new URLSearchParams();
    if (filters.dateRange.from) params.append('start_date', formatDate(filters.dateRange.from));
    if (filters.dateRange.to) params.append('end_date', formatDate(filters.dateRange.to));
    if (filters.size && filters.size !== 'all') params.append('size', filters.size);
    if (filters.sku && filters.sku !== 'all') params.append('sku', filters.sku);
    params.append('download', 'true');

    if (filters.stage) {
      params.append('stage', filters.stage);
      let date_column = 'vqc_inward_date';
      if (filters.stage === 'FT') {
        date_column = 'ft_inward_date';
      } else if (filters.stage === 'CS' || filters.stage === 'RT CS') {
        date_column = 'cs_comp_date';
      }
      params.append('date_column', date_column);

      if (filters.stage === 'RT' || filters.stage === 'RT CS') {
        params.append('table', 'rt_conversion_data');
      }
    }

    // Fetch all data for CSV export
    const response = await fetch(`${BACKEND_URL}/kpi-data/${kpiKey}?${params.toString()}`);
    const result = await response.json();
    const allData = result.data;
    
    if (allData.length === 0) {
      alert("No data available to download.");
      return;
    }

    const headers = Object.keys(allData[0] || {});
    const csvContent = [
      headers.join(','),
      ...allData.map((row: any) =>
        headers.map(header => JSON.stringify(row[header])).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_data.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`max-w-[95vw] max-h-[95vh] overflow-y-auto ${darkMode ? 'bg-gray-800 text-white' : ''}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-2xl">{title}</span>
            <Button onClick={downloadCSV} className="flex items-center gap-2">
              <Download size={16} />
              Download CSV
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                {Object.keys(data[0] || {}).map(key => <TableHead key={key}>{key}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={15}>Loading...</TableCell></TableRow>
              ) : error ? (
                <TableRow><TableCell colSpan={15} className="text-red-500">{error}</TableCell></TableRow>
              ) : (
                data.map((row, index) => (
                  <TableRow key={index}>
                    {Object.values(row).map((value, i) => <TableCell key={i}>{String(value)}</TableCell>)}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="mt-4 flex items-center justify-between">
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

