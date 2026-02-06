
import React from 'react';
import { OperatorSummary, MachineSummary } from '../types';

interface Props {
  operatorSummaries: OperatorSummary[];
  machineSummaries: MachineSummary[];
}

const StatsCards: React.FC<Props> = ({ operatorSummaries, machineSummaries }) => {
  return (
    <div className="space-y-8 mb-8">
      {/* Machine Stats Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
          <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest">Hiệu suất Máy Cắt (Theo ca)</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {machineSummaries.map((m, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl border-l-4 border-l-amber-500 border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  </div>
                  <span className="font-bold text-slate-800">Máy {m.machineNo}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{m.day}/{m.month}</span>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Tổng TG chạy máy</span>
                  <p className="text-2xl font-black text-amber-600 leading-none">{m.totalRunTimeHours}<span className="text-xs ml-1 font-bold">giờ</span></p>
                </div>
                
                <div className="flex flex-col gap-1.5 border-t border-slate-50 pt-2">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-400">TỔNG SƠ ĐỒ (m):</span>
                    <span className="text-slate-700">{m.totalMarkerLength.toFixed(1)}m</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-400">TỔNG ĐƯỜNG CẮT (m):</span>
                    <span className="text-indigo-600">{m.totalPathLength.toFixed(1)}m</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-400">TỔNG BTP (C/P/L):</span>
                    <div className="flex gap-1">
                      <span className="text-blue-600" title="Chính">{m.totalBtpMain}</span>
                      <span className="text-emerald-600" title="Phối">{m.totalBtpMatching}</span>
                      <span className="text-amber-600" title="Lót">{m.totalBtpLining}</span>
                    </div>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 font-medium italic pt-1">{m.tableCount} bàn cắt hoàn tất</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Operator Stats Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
          <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest">Hiệu suất Công nhân</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {operatorSummaries.map((s, idx) => (
            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{s.operator}</h3>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-tight">Tổng hợp cá nhân</p>
                </div>
                <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                  {s.totalRecords} lượt cắt
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1 p-3 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Cá nhân TG chạy thực tế</span>
                  <p className="text-xl font-black text-blue-600">{s.totalRunTimeHours} giờ</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Tổng mét cắt</span>
                    <p className="text-lg font-bold text-slate-900">{s.totalPathLength.toLocaleString()}m</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Tốc độ TB</span>
                    <p className="text-lg font-bold text-slate-900">{s.averageSpeed} m/ph</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default StatsCards;
