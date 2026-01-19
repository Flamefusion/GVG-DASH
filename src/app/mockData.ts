
export const analysisKpis = {
  totalRejection: 1250,
  '3deTechRejection': 300,
  ihcRejection: 150,
  vqcRejection: 400,
  ftRejection: 250,
  csRejection: 150,
};

export const rejectionStatusData = [
  { name: 'Accepted', value: 8500 },
  { name: 'Rejected', value: 1250 },
];

export const rejectionBreakdownData = [
  { name: 'VQC Rejection', value: 400 },
  { name: 'FT Rejection', value: 250 },
  { name: 'CS Rejection', value: 150 },
];

export const rejectionTrendData = [
  { month: 'Jan', rejected: 120 },
  { month: 'Feb', rejected: 150 },
  { month: 'Mar', rejected: 130 },
  { month: 'Apr', rejected: 180 },
  { month: 'May', rejected: 200 },
  { month: 'Jun', rejected: 170 },
];

export const topVqcRejections = [
  { name: 'Reason A', value: 50 },
  { name: 'Reason B', value: 45 },
  { name: 'Reason C', value: 40 },
  { name: 'Reason D', value: 35 },
  { name: 'Reason E', value: 30 },
  { name: 'Reason F', value: 25 },
  { name: 'Reason G', value: 20 },
  { name: 'Reason H', value: 15 },
  { name: 'Reason I', value: 10 },
  { name: 'Reason J', value: 5 },
];

export const topFtRejections = [
  { name: 'Reason X', value: 60 },
  { name: 'Reason Y', value: 55 },
  { name: 'Reason Z', value: 50 },
  { name: 'Reason W', value: 45 },
  { name: 'Reason V', value: 40 },
];

export const topCsRejections = [
    { name: 'Reason P', value: 30 },
    { name: 'Reason Q', value: 25 },
    { name: 'Reason R', value: 20 },
    { name: 'Reason S', value: 15 },
    { name: 'Reason T', value: 10 },
];

export const deTechVendorRejections = [
  { vendor: 'Vendor 1', rejected: 30 },
  { vendor: 'Vendor 2', rejected: 25 },
  { vendor: 'Vendor 3', rejected: 22 },
  { vendor: 'Vendor 4', rejected: 20 },
  { vendor: 'Vendor 5', rejected: 18 },
  { vendor: 'Vendor 6', rejected: 15 },
  { vendor: 'Vendor 7', rejected: 12 },
  { vendor: 'Vendor 8', rejected: 10 },
  { vendor: 'Vendor 9', rejected: 8 },
  { vendor: 'Vendor 10', rejected: 5 },
];

export const ihcVendorRejections = [
    { vendor: 'Vendor A', rejected: 20 },
    { vendor: 'Vendor B', rejected: 18 },
    { vendor: 'Vendor C', rejected: 15 },
    { vendor: 'Vendor D', rejected: 12 },
    { vendor: 'Vendor E', rejected: 10 },
    { vendor: 'Vendor F', rejected: 8 },
    { vendor: 'Vendor G', rejected: 5 },
    { vendor: 'Vendor H', rejected: 4 },
    { vendor: 'Vendor I', rejected: 3 },
    { vendor: 'Vendor J', rejected: 2 },
];

export const reportKpis = {
  daily: {
    totalReceived: 500,
    totalAccepted: 450,
    totalRejected: 50,
  },
  weekly: {
    totalReceived: 2500,
    totalAccepted: 2250,
    totalRejected: 250,
  },
  monthly: {
    totalReceived: 10000,
    totalAccepted: 9000,
    totalRejected: 1000,
  },
};

export const rejectionReasons = {
  'VQC': [
    { reason: 'Screen damage', quantity: 10 },
    { reason: 'Speaker issue', quantity: 5 },
  ],
  'FT': [
    { reason: 'Software bug', quantity: 15 },
    { reason: 'Battery drain', quantity: 8 },
  ],
  'CS': [
    { reason: 'Scratches', quantity: 7 },
  ],
};

export const reportVendors = ['Vendor A', 'Vendor B', 'Vendor C'];
export const reportStages = ['VQC', 'FT', 'CS'];
export const reportTypes = ['Daily', 'Weekly', 'Monthly'];
