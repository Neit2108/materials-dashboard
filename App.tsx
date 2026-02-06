
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CuttingRecord } from './types';
import CuttingForm from './components/CuttingForm';
import StatsCards from './components/StatsCards';
import PerformanceCharts from './components/PerformanceCharts';
import FilterBar from './components/FilterBar';
import AIAnalysis from './components/AIAnalysis';
import { calculateMinutes, getOperatorSummaries, getMachineSummaries, recordToDate } from './utils/helpers';
import { exportToExcel, exportByOperator } from './utils/export';

const RECORDS_PER_PAGE = 30;

const App: React.FC = () => {
  const [records, setRecords] = useState<CuttingRecord[]>([]);
  const [deletedRecords, setDeletedRecords] = useState<CuttingRecord[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CuttingRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showTrash, setShowTrash] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>('');
  const formRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter states
  const [filterDay, setFilterDay] = useState<number | string>('');
  const [filterMonth, setFilterMonth] = useState<number | string>('');
  const [filterOperator, setFilterOperator] = useState<string>('');
  const [filterMachine, setFilterMachine] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // 1. Initial Load from LocalStorage (Database simulation)
  useEffect(() => {
    const saved = localStorage.getItem('cutting_records');
    const savedDeleted = localStorage.getItem('deleted_cutting_records');
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecords(parsed);
      } catch (e) { console.error("Database error: Records corrupted", e); }
    }
    if (savedDeleted) {
      try {
        const parsedDeleted = JSON.parse(savedDeleted);
        setDeletedRecords(parsedDeleted);
      } catch (e) { console.error("Database error: Trash corrupted", e); }
    }
    
    setIsDataLoaded(true);
    setLastSaved(new Date().toLocaleTimeString());
  }, []);

  // 2. Auto-save to LocalStorage whenever records or deletedRecords change
  useEffect(() => {
    if (isDataLoaded) {
      localStorage.setItem('cutting_records', JSON.stringify(records));
      localStorage.setItem('deleted_cutting_records', JSON.stringify(deletedRecords));
      setLastSaved(new Date().toLocaleTimeString());
    }
  }, [records, deletedRecords, isDataLoaded]);

  // Data Backup Function (Export JSON)
  const handleBackup = () => {
    const backupData = {
      records,
      deletedRecords,
      exportDate: new Date().toISOString(),
      appVersion: "1.2.0"
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_MayCat_Vail_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Data Restore Function (Import JSON)
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (data.records && Array.isArray(data.records)) {
          if (window.confirm('Hành động này sẽ thay thế toàn bộ dữ liệu hiện tại bằng dữ liệu từ file backup. Bạn có chắc chắn?')) {
            setRecords(data.records);
            setDeletedRecords(data.deletedRecords || []);
            alert('Khôi phục dữ liệu thành công!');
          }
        } else {
          alert('File không đúng định dạng dữ liệu của phần mềm!');
        }
      } catch (err) {
        alert('Lỗi đọc file: ' + err);
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = (recordData: Omit<CuttingRecord, 'id' | 'timestamp'>) => {
    if (editingRecord && editingRecord.id) {
      setRecords(prev => prev.map(r => 
        r.id === editingRecord.id ? { ...recordData, id: r.id, timestamp: r.timestamp } : r
      ));
      setEditingRecord(null);
      alert("Đã ghi lại thay đổi thành công!");
    } else {
      const newRecord: CuttingRecord = { 
        ...recordData, 
        id: Math.random().toString(36).substr(2, 9), 
        timestamp: Date.now() 
      };
      setRecords(prev => [newRecord, ...prev]);
    }
  };

  const handleEdit = (record: CuttingRecord) => {
    setEditingRecord(record);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const deleteRecord = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn chuyển bản ghi này vào thùng rác?')) {
      setRecords(prev => {
        const recordToDelete = prev.find(r => r.id === id);
        if (recordToDelete) {
          setDeletedRecords(prevDel => [recordToDelete, ...prevDel]);
          return prev.filter(r => r.id !== id);
        }
        return prev;
      });
    }
  };

  const restoreRecord = (id: string) => {
    setDeletedRecords(prevDel => {
      const recordToRestore = prevDel.find(r => r.id === id);
      if (recordToRestore) {
        setRecords(prevRec => [recordToRestore, ...prevRec].sort((a, b) => b.timestamp - a.timestamp));
        return prevDel.filter(r => r.id !== id);
      }
      return prevDel;
    });
    alert("Đã khôi phục bản ghi thành công!");
  };

  const permanentDelete = (id: string) => {
    if (window.confirm('Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa vĩnh viễn bản ghi này?')) {
      setDeletedRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  const clearTrash = () => {
    if (window.confirm('Xóa sạch thùng rác? Hành động này không thể hoàn tác.')) {
      setDeletedRecords([]);
    }
  };

  const duplicateRecord = (record: CuttingRecord) => {
    setEditingRecord({ ...record, id: '' }); 
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const deleteFilteredRecords = () => {
    const count = filteredRecords.length;
    if (count === 0) return;
    if (window.confirm(`Bạn có chắc chắn muốn chuyển ${count} bản ghi đang hiển thị vào thùng rác?`)) {
      const filteredIds = new Set(filteredRecords.map(r => r.id));
      const itemsToMove = records.filter(r => filteredIds.has(r.id));
      
      setRecords(prev => prev.filter(r => !filteredIds.has(r.id)));
      setDeletedRecords(prev => [...itemsToMove, ...prev]);
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchDay = filterDay === '' || r.day === Number(filterDay);
      const matchMonth = filterMonth === '' || r.month === Number(filterMonth);
      const matchOp = filterOperator === '' || r.operator === filterOperator;
      const matchMac = filterMachine === '' || r.machineNo === Number(filterMachine);
      
      let matchRange = true;
      if (startDate || endDate) {
        const rDate = recordToDate(r);
        if (startDate) matchRange = matchRange && rDate >= new Date(startDate);
        if (endDate) matchRange = matchRange && rDate <= new Date(endDate);
      }
      
      return matchDay && matchMonth && matchOp && matchMac && matchRange;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [records, filterDay, filterMonth, filterOperator, filterMachine, startDate, endDate]);

  const totalPages = Math.ceil(filteredRecords.length / RECORDS_PER_PAGE);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * RECORDS_PER_PAGE;
    return filteredRecords.slice(start, start + RECORDS_PER_PAGE);
  }, [filteredRecords, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterDay, filterMonth, filterOperator, filterMachine, startDate, endDate]);

  const operatorSummaries = useMemo(() => getOperatorSummaries(filteredRecords), [filteredRecords]);
  const machineSummaries = useMemo(() => getMachineSummaries(filteredRecords), [filteredRecords]);
  
  const uniqueOperators = useMemo(() => Array.from(new Set(records.map(r => r.operator))).sort(), [records]);
  const uniqueMachines = useMemo(() => Array.from(new Set(records.map(r => r.machineNo))).sort((a, b) => a - b), [records]);

  const isFiltered = filterDay !== '' || filterMonth !== '' || filterOperator !== '' || filterMachine !== '' || startDate !== '' || endDate !== '';

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-indigo-200 shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-extrabold text-slate-900 leading-tight">Hiệu Suất Máy Cắt Vải</h1>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter">PHẦN MỀM THỐNG KÊ HIỆU SUẤT - THIEMLV</span>
              </div>
            </div>
            <div className="hidden md:flex gap-4 items-center">
               <div className="flex flex-col items-end mr-4">
                 <span className="text-[9px] font-black text-emerald-500 uppercase flex items-center gap-1">
                   <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                   Đã lưu tự động
                 </span>
                 <span className="text-[8px] text-slate-400 font-bold uppercase">{lastSaved}</span>
               </div>
               <div className="h-4 w-[1px] bg-slate-200"></div>
               <button 
                onClick={() => setShowTrash(!showTrash)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${showTrash ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
               >
                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                 Thùng rác ({deletedRecords.length})
               </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-20 w-full space-y-12">
        {/* DATA MANAGEMENT BAR */}
        <div className="bg-indigo-900 p-3 rounded-2xl shadow-xl flex flex-wrap justify-between items-center gap-4 border border-indigo-800">
           <div className="flex items-center gap-2 pl-2">
             <svg className="w-5 h-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
             <span className="text-xs font-black text-white uppercase tracking-widest">Cơ sở dữ liệu cục bộ</span>
           </div>
           <div className="flex gap-2">
             <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
             <button onClick={() => fileInputRef.current?.click()} className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-indigo-100 text-[10px] font-black uppercase rounded-lg transition-all border border-indigo-500">
               Nhập dữ liệu
             </button>
             <button onClick={handleBackup} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase rounded-lg transition-all shadow-lg shadow-emerald-950/20">
               Sao lưu (Backup)
             </button>
           </div>
        </div>

        <section ref={formRef} className="space-y-6 max-w-5xl mx-auto">
          <div className="flex justify-between items-end border-l-4 border-indigo-500 pl-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                {editingRecord?.id ? 'Chỉnh sửa & Ghi lại' : 'Nhập liệu bàn cắt mới'}
              </h2>
              <p className="text-slate-500 text-sm font-medium italic">Ghi nhận dữ liệu thực tế tại máy cắt.</p>
            </div>
            {editingRecord && (
              <button 
                onClick={() => setEditingRecord(null)} 
                className="px-4 py-1.5 bg-slate-200 text-slate-700 text-[10px] font-black uppercase rounded-lg hover:bg-slate-300 transition-colors"
              >
                Hủy Sửa / Nhập mới
              </button>
            )}
          </div>
          <div className={`${editingRecord?.id ? 'ring-4 ring-indigo-100 rounded-2xl' : ''} transition-all duration-300`}>
            <CuttingForm onSave={handleSave} initialData={editingRecord} />
          </div>
        </section>

        <hr className="border-slate-200" />

        <section className="space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-col gap-1 border-l-4 border-emerald-500 pl-4">
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Thống kê & Phân tích năng suất</h2>
              <p className="text-slate-500 text-sm font-medium italic">Biểu đồ và danh sách dữ liệu chi tiết.</p>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              <button onClick={() => exportToExcel(filteredRecords, `BaoCao_TongHop_MayCat`)} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                XUẤT TỔNG ({filteredRecords.length})
              </button>
              {filterOperator && (
                <button onClick={() => exportByOperator(filteredRecords, filterOperator)} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95">
                  XUẤT THEO CN: {filterOperator}
                </button>
              )}
            </div>
          </div>

          <FilterBar 
            day={filterDay} month={filterMonth} operator={filterOperator} machineNo={filterMachine} startDate={startDate} endDate={endDate} operators={uniqueOperators} machines={uniqueMachines}
            onDayChange={setFilterDay} onMonthChange={setFilterMonth} onOperatorChange={setFilterOperator} onMachineChange={setFilterMachine} onStartDateChange={setStartDate} onEndDateChange={setEndDate}
            onClear={() => { setFilterDay(''); setFilterMonth(''); setFilterOperator(''); setFilterMachine(''); setStartDate(''); setEndDate(''); }}
          />

          {/* AI ANALYSIS SECTION */}
          <AIAnalysis operatorSummaries={operatorSummaries} machineSummaries={machineSummaries} />
          
          <StatsCards operatorSummaries={operatorSummaries} machineSummaries={machineSummaries} />

          <PerformanceCharts 
            operatorSummaries={operatorSummaries} 
            machineSummaries={machineSummaries} 
            records={filteredRecords}
          />

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Thời gian / Máy</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Công nhân / Màu</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Mã hàng / Bàn</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Chiều dài</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Lá vải</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">BTP (C/P/L)</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">TG Chạy</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Tốc độ</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Tùy chọn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRecords.length > 0 ? paginatedRecords.map((r) => {
                    const mins = calculateMinutes(r.startTime, r.endTime);
                    const speed = mins > 0 ? (r.totalPathLength / mins).toFixed(2) : "0.00";
                    const isBeingEdited = editingRecord?.id === r.id;

                    return (
                      <tr key={r.id} className={`transition-colors text-sm group ${isBeingEdited ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                        <td className="px-6 py-5 whitespace-nowrap"><span className="font-bold text-slate-700">{r.day}/{r.month}/{r.year}</span><div className="text-[10px] text-slate-400 font-bold">MÁY SỐ {r.machineNo}</div></td>
                        <td className="px-6 py-5 whitespace-nowrap"><div className="font-bold text-slate-900">{r.operator}</div><div className="text-[10px] text-slate-400 font-bold uppercase">MÀU {r.color}</div></td>
                        <td className="px-6 py-5 whitespace-nowrap"><div className="font-bold text-indigo-600">{r.productCode}</div><div className="text-[10px] text-slate-500 font-black uppercase">BÀN {r.tableSeq}</div></td>
                        <td className="px-6 py-5 whitespace-nowrap text-center"><div><span className="font-bold text-slate-800">{r.totalPathLength}</span><span className="text-[10px] text-slate-400 ml-0.5">m</span></div><div className="text-[10px] text-slate-400 font-medium italic">Sơ đồ: {r.markerLength}m</div></td>
                        <td className="px-6 py-5 whitespace-nowrap text-center"><span className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-xs font-black shadow-sm text-slate-700">{r.pliesPerTable}</span></td>
                        <td className="px-6 py-5 whitespace-nowrap text-center text-xs font-bold"><span className="text-blue-600">{r.btpMain}</span><span className="text-slate-300 mx-1">|</span><span className="text-emerald-600">{r.btpMatching}</span><span className="text-slate-300 mx-1">|</span><span className="text-amber-600">{r.btpLining}</span></td>
                        <td className="px-6 py-5 whitespace-nowrap text-center"><div className="font-black text-slate-900">{mins}<span className="text-[10px] font-normal ml-0.5 italic">ph</span></div><div className="text-[10px] text-slate-400 font-bold">{r.startTime}-{r.endTime}</div></td>
                        <td className="px-6 py-5 whitespace-nowrap text-center"><div className="font-black text-indigo-600">{speed}</div><div className="text-[10px] text-slate-400 font-bold italic">m/phút</div></td>
                        <td className="px-6 py-5 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => duplicateRecord(r)} className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors shadow-sm bg-white border border-emerald-100" title="Sao chép">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                            </button>
                            <button onClick={() => handleEdit(r)} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors shadow-sm bg-white border border-indigo-100" title="Sửa">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5m-5-5l5 5m0 0l-5 5m5-5H13"/></svg>
                            </button>
                            <button onClick={() => deleteRecord(r.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors shadow-sm bg-white border border-red-100" title="Xóa">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-slate-400 italic font-medium">Không tìm thấy dữ liệu phù hợp...</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-200">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Trang {currentPage} / {totalPages}
                </div>
                <div className="flex gap-2">
                  <button 
                    disabled={currentPage === 1} 
                    onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo({ top: formRef.current?.offsetTop || 0, behavior: 'smooth' }); }}
                    className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    Trang trước
                  </button>
                  <button 
                    disabled={currentPage === totalPages} 
                    onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo({ top: formRef.current?.offsetTop || 0, behavior: 'smooth' }); }}
                    className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    Trang sau
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Hệ thống giám sát năng suất v1.2.0</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm">
            <span className="text-slate-600 font-medium">Bản quyền phần mềm thuộc về bộ phận kỹ thuật</span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="text-indigo-600 font-black">Code by ThiemLV</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
