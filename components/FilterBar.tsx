
import React from 'react';

interface FilterBarProps {
  day: number | string;
  month: number | string;
  operator: string;
  machineNo: string;
  startDate: string;
  endDate: string;
  operators: string[];
  machines: number[];
  onDayChange: (val: string) => void;
  onMonthChange: (val: string) => void;
  onOperatorChange: (val: string) => void;
  onMachineChange: (val: string) => void;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onClear: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ 
  day, 
  month, 
  operator, 
  machineNo,
  startDate,
  endDate,
  operators, 
  machines,
  onDayChange, 
  onMonthChange, 
  onOperatorChange,
  onMachineChange,
  onStartDateChange,
  onEndDateChange,
  onClear
}) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        {/* Basic Filters */}
        <div className="space-y-1.5 min-w-[100px] flex-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ngày</label>
          <select 
            value={day} 
            onChange={(e) => onDayChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Tất cả ngày</option>
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5 min-w-[100px] flex-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tháng</label>
          <select 
            value={month} 
            onChange={(e) => onMonthChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Tất cả tháng</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5 min-w-[150px] flex-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Máy số</label>
          <select 
            value={machineNo} 
            onChange={(e) => onMachineChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Tất cả máy</option>
            {machines.map(m => (
              <option key={m} value={m}>Máy {m}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5 min-w-[200px] flex-[2]">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Công nhân ĐK</label>
          <select 
            value={operator} 
            onChange={(e) => onOperatorChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Tất cả công nhân</option>
            {operators.map(op => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4 pt-4 border-t border-slate-100">
        <div className="space-y-1.5 min-w-[150px] flex-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Từ ngày</label>
          <input 
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="space-y-1.5 min-w-[150px] flex-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Đến ngày</label>
          <input 
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex-1 flex justify-end">
          <button 
            onClick={onClear}
            className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
