import React from 'react';
import { CuttingRecord, Branch } from '../types';
import StatsCards from './StatsCards';
import PerformanceCharts from './PerformanceCharts';
import { getOperatorSummaries, getMachineSummaries } from '../utils/helpers';
import { exportToExcel } from '../utils/export';
import { Download } from 'lucide-react';

interface Props {
  records: CuttingRecord[];
  branches: Branch[];
}

const Dashboard: React.FC<Props> = ({ records, branches }) => {
  const operatorSummaries = getOperatorSummaries(records);
  const machineSummaries = getMachineSummaries(records);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bảng điều khiển</h1>
          <p className="text-slate-500">Tổng quan hiệu suất và thống kê sản xuất</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => exportToExcel(records, 'BaoCao_MayCat')} 
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs uppercase hover:bg-emerald-700 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" /> Xuất Excel
          </button>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
            <span className="text-sm font-medium text-slate-500">Chi nhánh:</span>
            <span className="text-sm font-bold text-blue-600">{branches.length}</span>
            <span className="mx-2 text-slate-300">|</span>
            <span className="text-sm font-medium text-slate-500">Bản ghi:</span>
            <span className="text-sm font-bold text-blue-600">{records.length}</span>
          </div>
        </div>
      </div>

      <StatsCards 
        operatorSummaries={operatorSummaries} 
        machineSummaries={machineSummaries} 
      />

      <div className="grid grid-cols-1 gap-8">
        <PerformanceCharts 
          operatorSummaries={operatorSummaries} 
          machineSummaries={machineSummaries} 
          records={records}
        />
      </div>
    </div>
  );
};

export default Dashboard;
