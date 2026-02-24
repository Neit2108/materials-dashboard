
export interface Branch {
  id: string;
  name: string;
  location?: string;
}

export interface CuttingRecord {
  id: string;
  branchId: string;
  day: number;
  month: number;
  year: number;
  machineNo: number;
  operator: string;
  tableSeq: number;
  productCode: string;
  fabricType: string;
  color: number;
  markerLength: number;
  totalPathLength: number;
  productsPerMarker: number;
  pliesPerTable: number;
  maxPlies: number;
  btpMain: number;
  btpMatching: number;
  btpLining: number;
  fabricLoadingTime: string; // HH:mm
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  bladeChangeTime: number; // minutes
  repairTime: number; // minutes
  bladeStatusBefore: number;
  bladeStatusAfter: number;
  notes: string;
  timestamp: number;
}

export interface OperatorSummary {
  operator: string;
  totalPathLength: number;
  totalRunTimeMinutes: number;
  totalRunTimeHours: number;
  averageSpeed: number;
  totalRecords: number;
  totalPlies: number;
  totalMaxPlies: number;
  totalMarkerLength: number;
  totalProducts: number;
  totalBtp: number;
}

export interface MachineSummary {
  machineNo: number;
  day: number;
  month: number;
  year: number;
  totalRunTimeMinutes: number;
  totalRunTimeHours: number;
  totalMarkerLength: number;
  totalPathLength: number;
  totalBtpMain: number;
  totalBtpMatching: number;
  totalBtpLining: number;
  tableCount: number;
  totalPlies: number;
  totalMaxPlies: number;
}
