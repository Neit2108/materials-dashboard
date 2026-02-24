
import React, { useState, useEffect, useMemo } from 'react';
import { CuttingRecord, Branch } from '../types';
import { calculateMinutes as calcMins } from '../utils/helpers';

interface Props {
  onSave: (record: Omit<CuttingRecord, 'id' | 'timestamp'>) => void;
  initialData?: CuttingRecord | null;
  branches: Branch[];
}

const CuttingForm: React.FC<Props> = ({ onSave, initialData, branches }) => {
  const getDefaultState = () => ({
    branchId: branches.length > 0 ? branches[0].id : '',
    day: new Date().getDate(),
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    machineNo: 1,
    operator: '',
    tableSeq: 1,
    productCode: '',
    fabricType: '',
    color: 1,
    markerLength: 0,
    totalPathLength: 0,
    productsPerMarker: 0,
    pliesPerTable: 0,
    maxPlies: 0,
    btpMain: 0,
    btpMatching: 0,
    btpLining: 0,
    fabricLoadingTime: '',
    startTime: '',
    endTime: '',
    bladeChangeTime: 0,
    repairTime: 0,
    bladeStatusBefore: 0,
    bladeStatusAfter: 0,
    notes: ''
  });

  const [formData, setFormData] = useState(getDefaultState());
  const [errors, setErrors] = useState<{ day?: string; month?: string }>({});

  // Time components for easier entry
  const [timeParts, setTimeParts] = useState({
    fabricH: '', fabricM: '',
    startH: '', startM: '',
    endH: '', endM: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
      const [fh, fm] = (initialData.fabricLoadingTime || ':').split(':');
      const [sh, sm] = (initialData.startTime || ':').split(':');
      const [eh, em] = (initialData.endTime || ':').split(':');
      setTimeParts({
        fabricH: fh || '', fabricM: fm || '',
        startH: sh || '', startM: sm || '',
        endH: eh || '', endM: em || ''
      });
    } else {
      setFormData(prev => ({
        ...prev,
        tableSeq: prev.tableSeq,
        productCode: '',
        fabricType: '',
        color: 1,
        markerLength: 0,
        totalPathLength: 0,
        productsPerMarker: 0,
        pliesPerTable: 0,
        maxPlies: 0,
        btpMain: 0,
        btpMatching: 0,
        btpLining: 0,
        fabricLoadingTime: '',
        startTime: '',
        endTime: '',
        bladeChangeTime: 0,
        repairTime: 0,
        bladeStatusBefore: 0,
        bladeStatusAfter: 0,
        notes: ''
      }));
      setTimeParts({
        fabricH: '', fabricM: '',
        startH: '', startM: '',
        endH: '', endM: ''
      });
    }
  }, [initialData]);

  // Sync timeParts to formData
  useEffect(() => {
    const formatTime = (h: string, m: string) => {
      if (!h && !m) return '';
      const hh = h.padStart(2, '0');
      const mm = m.padStart(2, '0');
      return `${hh}:${mm}`;
    };

    setFormData(prev => ({
      ...prev,
      fabricLoadingTime: formatTime(timeParts.fabricH, timeParts.fabricM),
      startTime: formatTime(timeParts.startH, timeParts.startM),
      endTime: formatTime(timeParts.endH, timeParts.endM)
    }));
  }, [timeParts]);

  // Automatic BTP calculation: BTP = Số lá vải * Số SP/ Sơ đồ
  useEffect(() => {
    const calculatedBtp = formData.pliesPerTable * formData.productsPerMarker;
    if (calculatedBtp !== formData.btpMain) {
      setFormData(prev => ({ ...prev, btpMain: calculatedBtp }));
    }
  }, [formData.pliesPerTable, formData.productsPerMarker]);

  const maxDays = useMemo(() => (formData.month === 2 ? 29 : 31), [formData.month]);

  useEffect(() => {
    const newErrors: { day?: string; month?: string } = {};
    if (formData.month < 1 || formData.month > 12) newErrors.month = 'Tháng 1-12';
    if (formData.day < 1 || formData.day > maxDays) newErrors.day = `Ngày 1-${maxDays}`;
    setErrors(newErrors);
  }, [formData.day, formData.month, maxDays]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: string | number = value;

    if (type === 'number') {
      const parsed = parseFloat(value) || 0;
      if (['day', 'month', 'year', 'machineNo', 'color', 'tableSeq', 'bladeStatusBefore', 'bladeStatusAfter'].includes(name)) {
        finalValue = Math.floor(parsed);
      } else {
        finalValue = parsed;
      }
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(errors).length > 0) return;
    
    onSave(formData);
    
    setFormData(prev => ({
      ...prev,
      tableSeq: prev.tableSeq + 1,
      productCode: '',
      fabricType: '',
      color: 1,
      markerLength: 0,
      totalPathLength: 0,
      productsPerMarker: 0,
      pliesPerTable: 0,
      maxPlies: 0,
      btpMain: 0,
      btpMatching: 0,
      btpLining: 0,
      fabricLoadingTime: '',
      startTime: '',
      endTime: '',
      bladeChangeTime: 0,
      repairTime: 0,
      bladeStatusBefore: 0,
      bladeStatusAfter: 0,
      notes: ''
    }));

    setTimeParts({
      fabricH: '', fabricM: '',
      startH: '', startM: '',
      endH: '', endM: ''
    });
  };

  const runTime = calcMins(formData.startTime, formData.endTime);
  const cuttingSpeed = runTime > 0 ? (formData.totalPathLength / runTime).toFixed(2) : "0.00";
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Chi nhánh/Xưởng</label>
          <select name="branchId" value={formData.branchId} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none">
            <option value="">Chọn chi nhánh</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Ngày (1-{maxDays})</label>
          <input type="number" name="day" min="1" max={maxDays} step="1" value={formData.day} onChange={handleChange} onFocus={(e) => e.target.select()} required className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none ${errors.day ? 'border-red-500' : 'border-slate-300'}`} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Tháng (1-12)</label>
          <input type="number" name="month" min="1" max="12" step="1" value={formData.month} onChange={handleChange} onFocus={(e) => e.target.select()} required className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none ${errors.month ? 'border-red-500' : 'border-slate-300'}`} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Năm</label>
          <input type="number" name="year" value={formData.year} onChange={handleChange} onFocus={(e) => e.target.select()} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Máy cắt số</label>
          <input type="number" name="machineNo" step="1" value={formData.machineNo} onChange={handleChange} onFocus={(e) => e.target.select()} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Công nhân ĐK</label>
          <input type="text" name="operator" value={formData.operator} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">STT Bàn cắt</label>
          <input type="number" name="tableSeq" value={formData.tableSeq} onChange={handleChange} onFocus={(e) => e.target.select()} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Mã hàng</label>
          <input type="text" name="productCode" value={formData.productCode} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Chủng loại vải</label>
          <input type="text" name="fabricType" value={formData.fabricType} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" placeholder="VD: Cotton, Kaki..." />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Màu (Số)</label>
          <input type="number" name="color" value={formData.color} onChange={handleChange} onFocus={(e) => e.target.select()} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Chiều dài sơ đồ (m)</label>
          <input type="number" step="0.01" min="0.01" name="markerLength" value={formData.markerLength} onChange={handleChange} onFocus={(e) => e.target.select()} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Tổng chiều dài cắt (m)</label>
          <input type="number" step="0.01" min="0.01" name="totalPathLength" value={formData.totalPathLength} onChange={handleChange} onFocus={(e) => e.target.select()} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Số sp / Sơ đồ</label>
          <input type="number" min="1" name="productsPerMarker" value={formData.productsPerMarker} onChange={handleChange} onFocus={(e) => e.target.select()} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Số lá vải / Bàn</label>
          <input type="number" min="1" name="pliesPerTable" value={formData.pliesPerTable} onChange={handleChange} onFocus={(e) => e.target.select()} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Số lớp quy định tối đa</label>
          <input type="number" min="1" name="maxPlies" value={formData.maxPlies} onChange={handleChange} onFocus={(e) => e.target.select()} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">BTP Chính (Tự động)</label>
          <input type="number" name="btpMain" value={formData.btpMain} readOnly className="w-full px-3 py-2 border border-slate-100 bg-slate-50 rounded-lg outline-none text-slate-500" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">BTP Phối</label>
          <input type="number" name="btpMatching" value={formData.btpMatching} onChange={handleChange} onFocus={(e) => e.target.select()} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">BTP Lót</label>
          <input type="number" name="btpLining" value={formData.btpLining} onChange={handleChange} onFocus={(e) => e.target.select()} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">TG Cho vải (Giờ:Phút)</label>
          <div className="flex gap-1">
            <input type="number" placeholder="giờ" min="0" max="23" value={timeParts.fabricH} onChange={(e) => setTimeParts(p => ({ ...p, fabricH: e.target.value }))} onFocus={(e) => e.target.select()} className="w-1/2 px-2 py-2 border border-slate-300 rounded-lg outline-none text-center" />
            <input type="number" placeholder="phút" min="0" max="59" value={timeParts.fabricM} onChange={(e) => setTimeParts(p => ({ ...p, fabricM: e.target.value }))} onFocus={(e) => e.target.select()} className="w-1/2 px-2 py-2 border border-slate-300 rounded-lg outline-none text-center" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">TG Bắt đầu (Giờ:Phút)</label>
          <div className="flex gap-1">
            <input type="number" placeholder="giờ" min="0" max="23" value={timeParts.startH} onChange={(e) => setTimeParts(p => ({ ...p, startH: e.target.value }))} onFocus={(e) => e.target.select()} className="w-1/2 px-2 py-2 border border-slate-300 rounded-lg outline-none text-center" />
            <input type="number" placeholder="phút" min="0" max="59" value={timeParts.startM} onChange={(e) => setTimeParts(p => ({ ...p, startM: e.target.value }))} onFocus={(e) => e.target.select()} className="w-1/2 px-2 py-2 border border-slate-300 rounded-lg outline-none text-center" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">TG Kết thúc (Giờ:Phút)</label>
          <div className="flex gap-1">
            <input type="number" placeholder="giờ" min="0" max="23" value={timeParts.endH} onChange={(e) => setTimeParts(p => ({ ...p, endH: e.target.value }))} onFocus={(e) => e.target.select()} className="w-1/2 px-2 py-2 border border-slate-300 rounded-lg outline-none text-center" />
            <input type="number" placeholder="phút" min="0" max="59" value={timeParts.endM} onChange={(e) => setTimeParts(p => ({ ...p, endM: e.target.value }))} onFocus={(e) => e.target.select()} className="w-1/2 px-2 py-2 border border-slate-300 rounded-lg outline-none text-center" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Thay dao (phút)</label>
          <input type="number" name="bladeChangeTime" min="0" value={formData.bladeChangeTime} onChange={handleChange} onFocus={(e) => e.target.select()} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Sửa máy (phút)</label>
          <input type="number" name="repairTime" min="0" value={formData.repairTime} onChange={handleChange} onFocus={(e) => e.target.select()} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Dao (Trước)</label>
          <input type="number" name="bladeStatusBefore" min="0" value={formData.bladeStatusBefore} onChange={handleChange} onFocus={(e) => e.target.select()} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Dao (Sau)</label>
          <input type="number" name="bladeStatusAfter" min="0" value={formData.bladeStatusAfter} onChange={handleChange} onFocus={(e) => e.target.select()} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>
        <div className="space-y-2 lg:col-span-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Ghi chú</label>
          <input type="text" name="notes" value={formData.notes} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" placeholder="Nhập ghi chú nếu có..." />
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex flex-wrap gap-6 items-center">
        <div className="flex flex-col">
          <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Tổng TG máy chạy từng bàn</span>
          <span className="text-lg font-bold text-blue-900">{runTime} phút</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Số mét cắt / phút</span>
          <span className="text-lg font-bold text-blue-900">{cuttingSpeed} m/phút</span>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button type="submit" disabled={hasErrors} className={`px-6 py-2.5 font-semibold rounded-lg shadow-sm transition-all transform active:scale-95 ${hasErrors ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
          {initialData ? 'Cập nhật bản ghi' : 'Lưu bản ghi'}
        </button>
      </div>
    </form>
  );
};

export default CuttingForm;
