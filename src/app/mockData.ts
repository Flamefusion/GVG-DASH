

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

