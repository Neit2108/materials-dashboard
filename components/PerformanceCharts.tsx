
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, Cell 
} from 'recharts';
import { OperatorSummary, MachineSummary, CuttingRecord } from '../types';

interface Props {
  operatorSummaries: OperatorSummary[];
  machineSummaries: MachineSummary[];
  records: CuttingRecord[];
}

const PerformanceCharts: React.FC<Props> = ({ operatorSummaries, machineSummaries, records }) => {
  // Chuẩn bị dữ liệu xu hướng theo ngày
  const dailyData = React.useMemo(() => {
    const map = new Map<string, { date: string, path: number, time: number }>();
    
    // Sắp xếp records theo thời gian để vẽ line chart đúng
    const sortedRecords = [...records].sort((a, b) => {
      const dateA = new Date(a.year, a.month - 1, a.day).getTime();
      const dateB = new Date(b.year, b.month - 1, b.day).getTime();
      return dateA - dateB;
    });

    sortedRecords.forEach(r => {
      const key = `${r.day}/${r.month}`;
      const existing = map.get(key) || { date: key, path: 0, time: 0 };
      existing.path += (r.totalPathLength || 0);
      
      const [h1, m1] = r.startTime.split(':').map(Number);
      const [h2, m2] = r.endTime.split(':').map(Number);
      let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (mins < 0) mins += 1440;
      
      existing.time += (mins / 60);
      map.set(key, existing);
    });

    return Array.from(map.values());
  }, [records]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
      {/* Biểu đồ 1: Thời gian chạy máy */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1 h-5 bg-amber-500 rounded-full"></div>
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight">Thời gian chạy máy (Giờ)</h3>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={machineSummaries}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="machineNo" 
                tick={{fontSize: 10, fontWeight: 700}} 
                label={{ value: 'Số Máy', position: 'insideBottom', offset: -5, fontSize: 10 }}
              />
              <YAxis tick={{fontSize: 10, fontWeight: 700}} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                cursor={{fill: '#f8fafc'}}
              />
              <Bar dataKey="totalRunTimeHours" name="Giờ chạy" radius={[4, 4, 0, 0]}>
                {machineSummaries.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Biểu đồ 2: Năng suất công nhân */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1 h-5 bg-indigo-600 rounded-full"></div>
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight">Sản lượng theo công nhân (Mét cắt)</h3>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={operatorSummaries} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{fontSize: 10, fontWeight: 700}} />
              <YAxis dataKey="operator" type="category" tick={{fontSize: 10, fontWeight: 700}} width={80} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="totalPathLength" name="Tổng mét cắt" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Biểu đồ 3: Xu hướng sản lượng theo ngày */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm xl:col-span-2">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight">Xu hướng sản lượng theo thời gian</h3>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="colorPath" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{fontSize: 10, fontWeight: 700}} />
              <YAxis yAxisId="left" tick={{fontSize: 10, fontWeight: 700}} />
              <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10, fontWeight: 700}} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" align="right" height={36} iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 700}} />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="path" 
                name="Tổng mét cắt (m)" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorPath)" 
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="time" 
                name="Tổng giờ chạy (h)" 
                stroke="#f59e0b" 
                strokeWidth={3}
                dot={{ r: 4, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PerformanceCharts;
