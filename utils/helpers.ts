
import { CuttingRecord, OperatorSummary, MachineSummary } from '../types';

export const calculateMinutes = (start: string, end: string): number => {
  if (!start || !end) return 0;
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  
  const startTotal = startH * 60 + startM;
  let endTotal = endH * 60 + endM;
  
  // Handle cross-day shifts
  if (endTotal < startTotal) endTotal += 1440; 
  
  return endTotal - startTotal;
};

export const getOperatorSummaries = (records: CuttingRecord[]): OperatorSummary[] => {
  const map = new Map<string, OperatorSummary>();

  records.forEach((r) => {
    const runTime = calculateMinutes(r.startTime, r.endTime);
    const existing = map.get(r.operator) || {
      operator: r.operator,
      totalPathLength: 0,
      totalRunTimeMinutes: 0,
      totalRunTimeHours: 0,
      averageSpeed: 0,
      totalRecords: 0,
      totalPlies: 0,
      totalMaxPlies: 0,
      totalMarkerLength: 0,
      totalProducts: 0,
      totalBtp: 0,
    };

    existing.totalPathLength += r.totalPathLength;
    existing.totalRunTimeMinutes += runTime;
    existing.totalRecords += 1;
    existing.totalPlies += (r.pliesPerTable || 0);
    existing.totalMaxPlies += (r.maxPlies || 0);
    existing.totalMarkerLength += (r.markerLength || 0);
    existing.totalProducts += (r.productsPerMarker || 0);
    existing.totalBtp += (r.btpMain || 0) + (r.btpMatching || 0) + (r.btpLining || 0);
    
    map.set(r.operator, existing);
  });

  return Array.from(map.values()).map(summary => ({
    ...summary,
    totalRunTimeHours: Number((summary.totalRunTimeMinutes / 60).toFixed(2)),
    averageSpeed: summary.totalRunTimeMinutes > 0 
      ? Number((summary.totalPathLength / summary.totalRunTimeMinutes).toFixed(2)) 
      : 0
  }));
};

export const getMachineSummaries = (records: CuttingRecord[]): MachineSummary[] => {
  const map = new Map<string, MachineSummary>();

  records.forEach((r) => {
    const key = `M${r.machineNo}-D${r.day}-M${r.month}-Y${r.year}`;
    const runTime = calculateMinutes(r.startTime, r.endTime);
    
    const existing = map.get(key) || {
      machineNo: r.machineNo,
      day: r.day,
      month: r.month,
      year: r.year,
      totalRunTimeMinutes: 0,
      totalRunTimeHours: 0,
      totalMarkerLength: 0,
      totalPathLength: 0,
      totalBtpMain: 0,
      totalBtpMatching: 0,
      totalBtpLining: 0,
      tableCount: 0,
      totalPlies: 0,
      totalMaxPlies: 0
    };

    existing.totalRunTimeMinutes += runTime;
    existing.totalMarkerLength += (r.markerLength || 0);
    existing.totalPathLength += (r.totalPathLength || 0);
    existing.totalBtpMain += (r.btpMain || 0);
    existing.totalBtpMatching += (r.btpMatching || 0);
    existing.totalBtpLining += (r.btpLining || 0);
    existing.tableCount += 1;
    existing.totalPlies += (r.pliesPerTable || 0);
    existing.totalMaxPlies += (r.maxPlies || 0);
    
    map.set(key, existing);
  });

  return Array.from(map.values()).map(summary => ({
    ...summary,
    totalRunTimeHours: Number((summary.totalRunTimeMinutes / 60).toFixed(2))
  })).sort((a, b) => b.year - a.year || b.month - a.month || b.day - a.day || a.machineNo - b.machineNo);
};

export const recordToDate = (r: { day: number, month: number, year: number }) => {
  return new Date(r.year, r.month - 1, r.day);
};
