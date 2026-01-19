import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { DataRow } from '@/app/utils/mockData';
import { useDashboard } from '@/app/contexts/DashboardContext';

interface DataTableModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  data: DataRow[];
}

const ROWS_PER_PAGE = 100;

export const DataTableModal: React.FC<DataTableModalProps> = ({ open, onClose, title, data }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const { darkMode } = useDashboard();

  const totalPages = Math.ceil(data.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  const currentData = data.slice(startIndex, endIndex);

  const downloadCSV = () => {
    const headers = ['ID', 'Date', 'SKU', 'Size', 'Quantity', 'Status', 'Inspector', 'Remarks'];
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        [row.id, row.date, row.sku, row.size, row.quantity, row.status, row.inspector, row.remarks].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_data.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`max-w-6xl max-h-[80vh] overflow-y-auto ${darkMode ? 'bg-gray-800 text-white' : ''}`}>
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
                <TableHead>ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Inspector</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.sku}</TableCell>
                  <TableCell>{row.size}</TableCell>
                  <TableCell>{row.quantity}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        row.status === 'Approved'
                          ? 'bg-green-100 text-green-700'
                          : row.status === 'Rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {row.status}
                    </span>
                  </TableCell>
                  <TableCell>{row.inspector}</TableCell>
                  <TableCell>{row.remarks}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex items-center justify-between">
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} entries
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
              <span className={`flex items-center px-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Page {currentPage} of {totalPages}
              </span>
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
