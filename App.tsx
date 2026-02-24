
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CuttingRecord, Branch } from './types';
import CuttingForm from './components/CuttingForm';
import FilterBar from './components/FilterBar';
import AIAnalysis from './components/AIAnalysis';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import { calculateMinutes, getOperatorSummaries, getMachineSummaries, recordToDate } from './utils/helpers';
import { exportToExcel, exportByOperator } from './utils/export';
import { LayoutDashboard, ClipboardList, Settings, Trash2, Database, Download, Upload, PlusCircle } from 'lucide-react';

const RECORDS_PER_PAGE = 30;

type View = 'dashboard' | 'records' | 'admin';

const App: React.FC = () => {
  const [records, setRecords] = useState<CuttingRecord[]>([]);
  const [deletedRecords, setDeletedRecords] = useState<CuttingRecord[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CuttingRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showTrash, setShowTrash] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [lastSaved, setLastSaved] = useState<string>('');
  const formRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter states
  const [filterDay, setFilterDay] = useState<number | string>('');
  const [filterMonth, setFilterMonth] = useState<number | string>('');
  const [filterOperator, setFilterOperator] = useState<string>('');
  const [filterMachine, setFilterMachine] = useState<string>('');
  const [filterBranch, setFilterBranch] = useState<string>('');
  const [filterFabricType, setFilterFabricType] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('cutting_records');
    const savedDeleted = localStorage.getItem('deleted_cutting_records');
    const savedBranches = localStorage.getItem('cutting_branches');
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setRecords(parsed);
      } catch (e) { console.error("Database error: Records corrupted", e); }
    }
    if (savedDeleted) {
      try {
        const parsed = JSON.parse(savedDeleted);
        if (Array.isArray(parsed)) setDeletedRecords(parsed);
      } catch (e) { console.error("Database error: Trash corrupted", e); }
    }
    if (savedBranches) {
      try {
        const parsed = JSON.parse(savedBranches);
        if (Array.isArray(parsed)) setBranches(parsed);
      } catch (e) { console.error("Database error: Branches corrupted", e); }
    } else {
      // Default branch if none exists
      const defaultBranch = { id: 'default', name: 'Xưởng chính' };
      setBranches([defaultBranch]);
    }
    
    setIsDataLoaded(true);
    setLastSaved(new Date().toLocaleTimeString());
  }, []);

  // 2. Auto-save
  useEffect(() => {
    if (isDataLoaded) {
      localStorage.setItem('cutting_records', JSON.stringify(records));
      localStorage.setItem('deleted_cutting_records', JSON.stringify(deletedRecords));
      localStorage.setItem('cutting_branches', JSON.stringify(branches));
      setLastSaved(new Date().toLocaleTimeString());
    }
  }, [records, deletedRecords, branches, isDataLoaded]);

  const handleBackup = () => {
    const backupData = {
      records,
      deletedRecords,
      branches,
      exportDate: new Date().toISOString(),
      appVersion: "1.3.0"
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_MayCat_Vail_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.records && Array.isArray(data.records)) {
          if (window.confirm('Hành động này sẽ thay thế toàn bộ dữ liệu hiện tại. Bạn có chắc chắn?')) {
            setRecords(data.records);
            setDeletedRecords(data.deletedRecords || []);
            setBranches(data.branches || [{ id: 'default', name: 'Xưởng chính' }]);
            alert('Khôi phục dữ liệu thành công!');
          }
        } else {
          alert('File không đúng định dạng!');
        }
      } catch (err) {
        alert('Lỗi đọc file: ' + err);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = (recordData: Omit<CuttingRecord, 'id' | 'timestamp'>) => {
    if (editingRecord && editingRecord.id) {
      setRecords(prev => prev.map(r => 
        r.id === editingRecord.id ? { ...recordData, id: r.id, timestamp: r.timestamp } : r
      ));
      setEditingRecord(null);
      alert("Đã cập nhật thành công!");
    } else {
      const newRecord: CuttingRecord = { 
        ...recordData, 
        id: Math.random().toString(36).substr(2, 9), 
        timestamp: Date.now() 
      };
      setRecords(prev => [newRecord, ...prev]);
      alert("Đã lưu bản ghi mới!");
    }
  };

  const handleAddBranch = (name: string, location: string) => {
    const newBranch: Branch = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      location
    };
    setBranches(prev => [...prev, newBranch]);
  };

  const handleDeleteBranch = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chi nhánh này?')) {
      setBranches(prev => prev.filter(b => b.id !== id));
    }
  };

  const handleEdit = (record: CuttingRecord) => {
    setEditingRecord(record);
    setCurrentView('records');
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const deleteRecord = (id: string) => {
    if (window.confirm('Chuyển vào thùng rác?')) {
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
  };

  const permanentDelete = (id: string) => {
    if (window.confirm('Xóa vĩnh viễn?')) {
      setDeletedRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchDay = filterDay === '' || r.day === Number(filterDay);
      const matchMonth = filterMonth === '' || r.month === Number(filterMonth);
      const matchOp = filterOperator === '' || r.operator === filterOperator;
      const matchMac = filterMachine === '' || r.machineNo === Number(filterMachine);
      const matchBranch = filterBranch === '' || r.branchId === filterBranch;
      const matchFabric = filterFabricType === '' || r.fabricType === filterFabricType;
      
      let matchRange = true;
      if (startDate || endDate) {
        const rDate = recordToDate(r);
        if (startDate) matchRange = matchRange && rDate >= new Date(startDate);
        if (endDate) matchRange = matchRange && rDate <= new Date(endDate);
      }
      
      return matchDay && matchMonth && matchOp && matchMac && matchBranch && matchFabric && matchRange;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [records, filterDay, filterMonth, filterOperator, filterMachine, filterBranch, filterFabricType, startDate, endDate]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * RECORDS_PER_PAGE;
    return filteredRecords.slice(start, start + RECORDS_PER_PAGE);
  }, [filteredRecords, currentPage]);

  const totalPages = Math.ceil(filteredRecords.length / RECORDS_PER_PAGE);

  const uniqueOperators = useMemo(() => Array.from(new Set(records.map(r => r.operator))).sort(), [records]);
  const uniqueMachines = useMemo(() => Array.from(new Set(records.map(r => r.machineNo))).sort((a, b) => a - b), [records]);
  const uniqueFabricTypes = useMemo(() => Array.from(new Set(records.map(r => r.fabricType).filter(Boolean))).sort(), [records]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-200">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-extrabold text-slate-900 leading-tight">Hệ Thống Máy Cắt</h1>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">QUẢN LÝ HIỆU SUẤT ĐA CHI NHÁNH</span>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              <button 
                onClick={() => setCurrentView('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${currentView === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button 
                onClick={() => setCurrentView('records')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${currentView === 'records' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <ClipboardList className="w-4 h-4" />
                Nhập liệu & DS
              </button>
              <button 
                onClick={() => setCurrentView('admin')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${currentView === 'admin' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Settings className="w-4 h-4" />
                Quản trị
              </button>
            </nav>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowTrash(!showTrash)}
                className={`p-2 rounded-lg transition-all relative ${showTrash ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                title="Thùng rác"
              >
                <Trash2 className="w-5 h-5" />
                {deletedRecords.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                    {deletedRecords.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 flex justify-around z-50">
        <button onClick={() => setCurrentView('dashboard')} className={`flex flex-col items-center gap-1 ${currentView === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-bold">Dashboard</span>
        </button>
        <button onClick={() => setCurrentView('records')} className={`flex flex-col items-center gap-1 ${currentView === 'records' ? 'text-blue-600' : 'text-slate-400'}`}>
          <ClipboardList className="w-5 h-5" />
          <span className="text-[10px] font-bold">Nhập liệu</span>
        </button>
        <button onClick={() => setCurrentView('admin')} className={`flex flex-col items-center gap-1 ${currentView === 'admin' ? 'text-blue-600' : 'text-slate-400'}`}>
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-bold">Quản trị</span>
        </button>
      </div>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 w-full">
        {showTrash ? (
          <div className="space-y-6 animate-in slide-in-from-top duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Trash2 className="w-6 h-6 text-amber-600" />
                Thùng rác
              </h2>
              <button 
                onClick={() => setShowTrash(false)}
                className="text-sm font-bold text-blue-600 hover:underline"
              >
                Quay lại
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Ngày</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Công nhân</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Mã hàng</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deletedRecords.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">Thùng rác trống</td></tr>
                  ) : (
                    deletedRecords.map(r => (
                      <tr key={r.id}>
                        <td className="px-6 py-4 text-sm">{r.day}/{r.month}/{r.year}</td>
                        <td className="px-6 py-4 text-sm font-bold">{r.operator}</td>
                        <td className="px-6 py-4 text-sm text-blue-600">{r.productCode}</td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <button onClick={() => restoreRecord(r.id)} className="text-xs font-bold text-emerald-600 hover:bg-emerald-50 px-3 py-1 rounded-lg">Khôi phục</button>
                          <button onClick={() => permanentDelete(r.id)} className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg">Xóa vĩnh viễn</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {currentView === 'dashboard' && (
              <div className="space-y-8">
                <FilterBar 
                  day={filterDay} month={filterMonth} operator={filterOperator} machineNo={filterMachine} branchId={filterBranch} fabricType={filterFabricType} startDate={startDate} endDate={endDate} operators={uniqueOperators} machines={uniqueMachines} branches={branches} fabricTypes={uniqueFabricTypes}
                  onDayChange={setFilterDay} onMonthChange={setFilterMonth} onOperatorChange={setFilterOperator} onMachineChange={setFilterMachine} onBranchChange={setFilterBranch} onFabricTypeChange={setFilterFabricType} onStartDateChange={setStartDate} onEndDateChange={setEndDate}
                  onClear={() => { setFilterDay(''); setFilterMonth(''); setFilterOperator(''); setFilterMachine(''); setFilterBranch(''); setFilterFabricType(''); setStartDate(''); setEndDate(''); }}
                />
                <Dashboard records={filteredRecords} branches={branches} />
              </div>
            )}

            {currentView === 'records' && (
              <div className="space-y-12">
                <section ref={formRef} className="space-y-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                        {editingRecord ? 'Chỉnh sửa bản ghi' : 'Nhập liệu bàn cắt'}
                      </h2>
                      <p className="text-slate-500 text-sm">Ghi nhận dữ liệu thực tế tại máy cắt.</p>
                    </div>
                    {editingRecord && (
                      <button onClick={() => setEditingRecord(null)} className="text-sm font-bold text-red-500 hover:underline">Hủy chỉnh sửa</button>
                    )}
                  </div>
                  <CuttingForm onSave={handleSave} initialData={editingRecord} branches={branches} />
                </section>

                <hr className="border-slate-200" />

                <section className="space-y-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Danh sách dữ liệu</h2>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Thời gian / Máy</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Công nhân / Màu</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Mã hàng / Loại vải</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Chiều dài</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Lá vải / Tối đa</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Hiệu suất</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">BTP (C/P/L)</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">TG Chạy</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ghi chú</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Tùy chọn</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {paginatedRecords.length > 0 ? paginatedRecords.map((r) => {
                            const mins = calculateMinutes(r.startTime, r.endTime);
                            const branchName = branches.find(b => b.id === r.branchId)?.name || '---';
                            return (
                              <tr key={r.id} className="hover:bg-slate-50 transition-colors text-sm group">
                                <td className="px-6 py-4">
                                  <div className="font-bold text-slate-700">{r.day}/{r.month}/{r.year}</div>
                                  <div className="text-[10px] text-slate-400 font-bold uppercase">MÁY {r.machineNo} | {branchName}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="font-bold text-slate-900">{r.operator}</div>
                                  <div className="text-[10px] text-slate-400 font-bold uppercase">MÀU {r.color}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="font-bold text-blue-600">{r.productCode}</div>
                                  <div className="text-[10px] text-slate-500 font-black uppercase">{r.fabricType || '---'} | BÀN {r.tableSeq}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="font-bold text-slate-800">{r.totalPathLength}m</div>
                                  <div className="text-[10px] text-slate-400">Sơ đồ: {r.markerLength}m</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex flex-col items-center">
                                    <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold">{r.pliesPerTable}</span>
                                    <span className="text-[9px] text-slate-400 mt-1 font-bold">MAX: {r.maxPlies || '---'}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {r.maxPlies > 0 ? (
                                    <div className="flex flex-col items-center">
                                      <span className={`text-xs font-black ${((r.pliesPerTable / r.maxPlies) * 100) >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {((r.pliesPerTable / r.maxPlies) * 100).toFixed(1)}%
                                      </span>
                                      <div className="w-12 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full ${((r.pliesPerTable / r.maxPlies) * 100) >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                          style={{ width: `${Math.min((r.pliesPerTable / r.maxPlies) * 100, 100)}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-300 text-xs">---</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-center text-xs font-bold">
                                  <span className="text-blue-600">{r.btpMain}</span>
                                  <span className="text-slate-300 mx-1">|</span>
                                  <span className="text-emerald-600">{r.btpMatching}</span>
                                  <span className="text-slate-300 mx-1">|</span>
                                  <span className="text-amber-600">{r.btpLining}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="font-black text-slate-900">{mins}ph</div>
                                  <div className="text-[10px] text-slate-400 font-bold">{r.startTime}-{r.endTime}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-xs text-slate-600 max-w-[150px] truncate" title={r.notes}>{r.notes || '---'}</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(r)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Sửa">
                                      <Settings className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => deleteRecord(r.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Xóa">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }) : (
                            <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic">Không có dữ liệu...</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {totalPages > 1 && (
                      <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-200">
                        <span className="text-xs font-bold text-slate-500 uppercase">Trang {currentPage} / {totalPages}</span>
                        <div className="flex gap-2">
                          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 border border-slate-200 rounded bg-white text-xs font-bold disabled:opacity-50">Trước</button>
                          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 border border-slate-200 rounded bg-white text-xs font-bold disabled:opacity-50">Sau</button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {currentView === 'admin' && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Quản trị hệ thống</h2>
                    <p className="text-slate-500 text-sm">Quản lý chi nhánh, sao lưu và khôi phục dữ liệu.</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleBackup} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs uppercase hover:bg-blue-700 transition-all">
                      <Download className="w-4 h-4" /> Sao lưu
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold text-xs uppercase hover:bg-slate-300 transition-all">
                      <Upload className="w-4 h-4" /> Khôi phục
                      <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
                    </button>
                  </div>
                </div>

                <AdminPanel 
                  branches={branches} 
                  onAddBranch={handleAddBranch} 
                  onDeleteBranch={handleDeleteBranch} 
                />
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-auto hidden md:block">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Hệ thống giám sát năng suất v1.3.0</p>
          <p className="text-slate-600 text-sm font-medium">Bản quyền phần mềm thuộc về bộ phận kỹ thuật | Code by ThiemLV</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
