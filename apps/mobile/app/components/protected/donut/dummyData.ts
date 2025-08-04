export interface Data {
  value: number;
  percentage: number;
  color: string;
  name: string;
}

export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// color palette
const colors = ['#fe769c','#46a0f8','#c3f439','#88dabc','#9CA3AF','#ef4444'];

export const DUMMY_DATA: Record<string, Data[]> = {
  January: [
    { value: 3200, percentage: 16, color: colors[0], name: 'Food' },
    { value: 18000, percentage: 30, color: colors[1], name: 'Transport' },
    { value: 9000, percentage: 20, color: colors[2], name: 'Shopping' },
    { value: 15000, percentage: 25, color: colors[3], name: 'Bills' },
    { value: 4000, percentage: 9, color: colors[4], name: 'Other' },
    { value: 2000, percentage: 10, color: colors[5], name: 'Insurance' },
  ],
  February: [
    { value: 12000, percentage: 24, color: '#fe769c', name: 'Food' },
    { value: 3000, percentage: 6, color: '#46a0f8', name: 'Transport' },
    { value: 20000, percentage: 40, color: '#c3f439', name: 'Shopping' },
    { value: 7000, percentage: 14, color: '#88dabc', name: 'Bills' },
    { value: 6000, percentage: 12, color: '#9CA3AF', name: 'Other' },
    { value: 1500, percentage: 7, color: '#ef4444', name: 'Insurance' },
  ],
  March: [
    { value: 5000, percentage: 10, color: '#fe769c', name: 'Food' },
    { value: 17000, percentage: 34, color: '#46a0f8', name: 'Transport' },
    { value: 4000, percentage: 8, color: '#c3f439', name: 'Shopping' },
    { value: 20000, percentage: 40, color: '#88dabc', name: 'Bills' },
    { value: 3000, percentage: 6, color: '#9CA3AF', name: 'Other' },
    { value: 1000, percentage: 5, color: '#ef4444', name: 'Insurance' },
  ],
  April: [
    { value: 8000, percentage: 16, color: '#fe769c', name: 'Food' },
    { value: 6000, percentage: 12, color: '#46a0f8', name: 'Transport' },
    { value: 15000, percentage: 30, color: '#c3f439', name: 'Shopping' },
    { value: 12000, percentage: 24, color: '#88dabc', name: 'Bills' },
    { value: 20000, percentage: 40, color: '#9CA3AF', name: 'Other' },
    { value: 1200, percentage: 6, color: '#ef4444', name: 'Insurance' },
  ],
  May: [
    { value: 20000, percentage: 40, color: '#fe769c', name: 'Food' },
    { value: 3000, percentage: 6, color: '#46a0f8', name: 'Transport' },
    { value: 18000, percentage: 36, color: '#c3f439', name: 'Shopping' },
    { value: 4000, percentage: 8, color: '#88dabc', name: 'Bills' },
    { value: 7000, percentage: 14, color: '#9CA3AF', name: 'Other' },
    { value: 1500, percentage: 7, color: '#ef4444', name: 'Insurance' },
  ],
  June: [
    { value: 15000, percentage: 30, color: '#fe769c', name: 'Food' },
    { value: 5000, percentage: 10, color: '#46a0f8', name: 'Transport' },
    { value: 12000, percentage: 24, color: '#c3f439', name: 'Shopping' },
    { value: 13000, percentage: 26, color: '#88dabc', name: 'Bills' },
    { value: 5000, percentage: 10, color: '#9CA3AF', name: 'Other' },
    { value: 1000, percentage: 5, color: '#ef4444', name: 'Insurance' },
  ],
  July: [
    { value: 18000, percentage: 36, color: '#fe769c', name: 'Food' },
    { value: 4000, percentage: 8, color: '#46a0f8', name: 'Transport' },
    { value: 15000, percentage: 30, color: '#c3f439', name: 'Shopping' },
    { value: 7000, percentage: 14, color: '#88dabc', name: 'Bills' },
    { value: 6000, percentage: 12, color: '#9CA3AF', name: 'Other' },
    { value: 1200, percentage: 6, color: '#ef4444', name: 'Insurance' },
  ],
  August: [
    { value: 14000, percentage: 28, color: '#fe769c', name: 'Food' },
    { value: 6000, percentage: 12, color: '#46a0f8', name: 'Transport' },
    { value: 16000, percentage: 32, color: '#c3f439', name: 'Shopping' },
    { value: 8000, percentage: 16, color: '#88dabc', name: 'Bills' },
    { value: 4000, percentage: 8, color: '#9CA3AF', name: 'Other' },
    { value: 1000, percentage: 5, color: '#ef4444', name: 'Insurance' },
  ],
  September: [
    { value: 17000, percentage: 34, color: '#fe769c', name: 'Food' },
    { value: 3000, percentage: 6,  color: '#46a0f8', name: 'Transport' },
    { value: 14000, percentage: 28, color: '#c3f439', name: 'Shopping' },
    { value: 9000, percentage: 18, color: '#88dabc', name: 'Bills' },
    { value: 7000, percentage: 14, color: '#9CA3AF', name: 'Other' },
    { value: 1000, percentage: 5, color: '#ef4444', name: 'Insurance' },
  ],
  October: [
    { value: 16000, percentage: 32, color: '#fe769c', name: 'Food' },
    { value: 4000, percentage: 8, color: '#46a0f8', name: 'Transport' },
    { value: 13000, percentage: 26, color: '#c3f439', name: 'Shopping' },
    { value: 8000, percentage: 16, color: '#88dabc', name: 'Bills' },
    { value: 6000, percentage: 12, color: '#9CA3AF', name: 'Other' },
    { value: 1000, percentage: 5, color: '#ef4444', name: 'Insurance' },
  ],
  November: [
    { value: 15000, percentage: 30, color: '#fe769c', name: 'Food' },
    { value: 3500, percentage: 7, color: '#46a0f8', name: 'Transport' },
    { value: 12000, percentage: 24, color: '#c3f439', name: 'Shopping' },
    { value: 10000, percentage: 20, color: '#88dabc', name: 'Bills' },
    { value: 9500, percentage: 19, color: '#9CA3AF', name: 'Other' },
    { value: 1000, percentage: 5, color: '#ef4444', name: 'Insurance' },
  ],
  December: [
    { value: 22000, percentage: 44, color: '#fe769c', name: 'Food' },
    { value: 4000, percentage: 8, color: '#46a0f8', name: 'Transport' },
    { value: 11000, percentage: 22, color: '#c3f439', name: 'Shopping' },
    { value: 7000, percentage: 14, color: '#88dabc', name: 'Bills' },
    { value: 4000, percentage: 8, color: '#9CA3AF', name: 'Other' },
    { value: 1000, percentage: 5, color: '#ef4444', name: 'Insurance' },
  ],
  // ... replicate for other months (omitted for brevity)
}; 


