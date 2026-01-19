export interface DataRow {
  id: number;
  date: string;
  sku: string;
  size: string;
  quantity: number;
  status: string;
  inspector: string;
  remarks: string;
}

// Generate mock data
export const generateMockData = (count: number, category: string): DataRow[] => {
  const skus = ['SKU-A001', 'SKU-B002', 'SKU-C003', 'SKU-D004', 'SKU-E005'];
  const sizes = ['Small', 'Medium', 'Large', 'XL', 'XXL'];
  const statuses = ['Pending', 'Approved', 'Rejected', 'In Progress'];
  const inspectors = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Williams', 'Tom Brown'];
  const remarks = ['Good quality', 'Minor defects', 'Excellent', 'Needs review', 'Standard'];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    date: new Date(2026, 0, Math.floor(Math.random() * 18) + 1).toISOString().split('T')[0],
    sku: skus[Math.floor(Math.random() * skus.length)],
    size: sizes[Math.floor(Math.random() * sizes.length)],
    quantity: Math.floor(Math.random() * 1000) + 100,
    status: category || statuses[Math.floor(Math.random() * statuses.length)],
    inspector: inspectors[Math.floor(Math.random() * inspectors.length)],
    remarks: remarks[Math.floor(Math.random() * remarks.length)],
  }));
};

// Chart data for VQC WIP SKU WISE
export const vqcChartData = [
  { sku: 'SKU-A001', count: 45 },
  { sku: 'SKU-B002', count: 32 },
  { sku: 'SKU-C003', count: 58 },
  { sku: 'SKU-D004', count: 23 },
  { sku: 'SKU-E005', count: 41 },
];

// Chart data for FT WIP SKU WISE
export const ftChartData = [
  { sku: 'SKU-A001', count: 38 },
  { sku: 'SKU-B002', count: 47 },
  { sku: 'SKU-C003', count: 29 },
  { sku: 'SKU-D004', count: 55 },
  { sku: 'SKU-E005', count: 34 },
];

// KPI data
export const kpiData = {
  totalInward: { value: 2450, change: '+12%', data: generateMockData(250, 'Inward') },
  qcAccepted: { value: 1876, change: '+8%', data: generateMockData(187, 'QC Accepted') },
  testingAccepted: { value: 1654, change: '+5%', data: generateMockData(165, 'Testing Accepted') },
  totalRejected: { value: 342, change: '-3%', data: generateMockData(100, 'Rejected') },
  movedToInventory: { value: 1543, change: '+10%', data: generateMockData(154, 'Moved to Inventory') },
  workInProgress: { value: 564, change: '+2%', data: generateMockData(120, 'In Progress') },
};
