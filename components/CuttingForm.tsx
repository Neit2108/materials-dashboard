
import React, { useState, useEffect, useMemo } from 'react';
import { CuttingRecord } from '../types';
import { calculateMinutes as calcMins } from '../utils/helpers';

interface Props {
  onSave: (record: Omit<CuttingRecord, 'id' | 'timestamp'>) => void;
  initialData?: CuttingRecord | null;
}

const CuttingForm: React.FC<Props> = ({ onSave, initialData }) => {
  const getDefaultState = () => ({
    day: new Date().getDate(),
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    machineNo: 1,
    operator: '',
    tableSeq: 1,
    productCode: '',
    color: 1,
    markerLength: 0,
    totalPathLength: 0,
    productsPerMarker: 0,
    pliesPerTable: 0,
    btpMain: 0,
    btpMatching: 0,
    btpLining: 0,
    fabricLoadingTime: '',
    startTime: '',
    endTime: '',
    bladeChangeTime: 0,
    repairTime: 0,
    bladeStatusBefore: 'Tốt',
    bladeStatusAfter: 'Tốt'
  });

  const [formData, setFormData] = useState(getDefaultState());
  const [errors, setErrors] = useState<{ day?: string; month?: string }>({});

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    } else {
      // Khi không còn bản ghi đang sửa, ta giữ lại các thông tin chung (ngày, máy, công nhân)
      // nhưng xóa sạch các thông tin chi tiết của bàn cắt
      setFormData(prev => ({
        ...prev,
        tableSeq: prev.tableSeq,
        productCode: '',
        color: 1,
        markerLength: 0,
        totalPathLength: 0,
        productsPerMarker: 0,
        pliesPerTable: 0,
        btpMain: 0,
        btpMatching: 0,
        btpLining: 0,
        fabricLoadingTime: '',
        startTime: '',
        endTime: '',
        bladeChangeTime: 0,
        repairTime: 0,
        bladeStatusBefore: 'Tốt',
        bladeStatusAfter: 'Tốt'
      }));
    }
  }, [initialData]);

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
      if (['day', 'month', 'year', 'machineNo', 'color', 'tableSeq'].includes(name)) {
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
    
    // Lưu dữ liệu
    onSave(formData);
    
    // Sau khi lưu hoặc cập nhật thành công, thực hiện xóa dữ liệu (clear)
    // Ta giữ lại các thông tin mang tính chất "phiên làm việc" để người dùng đỡ phải nhập lại
    setFormData(prev => ({
      ...prev,
      tableSeq: prev.tableSeq + 1, // Tự động tăng STT bàn cắt
      productCode: '',
      color: 1,
      markerLength: 0,
      totalPathLength: 0,
      productsPerMarker: 0,
      pliesPerTable: 0,
      btpMain: 0,
      btpMatching: 0,
      btpLining: 0,
      fabricLoadingTime: '',
      startTime: '',
      endTime: '',
      bladeChangeTime: 0,
      repairTime: 0,
      bladeStatusBefore: 'Tốt',
      bladeStatusAfter: 'Tốt'
    }));
  };

  const runTime = calcMins(formData.startTime, formData.endTime);
  const cuttingSpeed = runTime > 0 ? (formData.totalPathLength / runTime).toFixed(2) : "0.00";
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Ngày (1-{maxDays})</label>
          <input type="number" name="day" min="1" max={maxDays} step="1" value={formData.day} onChange={handleChange} required className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none ${errors.day ? 'border-red-500' : 'border-slate-300'}`} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Tháng (1-12)</label>
          <input type="number" name="month" min="1" max="12" step="1" value={formData.month} onChange={handleChange} required className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none ${errors.month ? 'border-red-500' : 'border-slate-300'}`} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Năm</label>
          <input type="number" name="year" value={formData.year} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Máy cắt số</label>
          <input type="number" name="machineNo" step="1" value={formData.machineNo} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Công nhân ĐK</label>
          <input type="text" name="operator" value={formData.operator} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">STT Bàn cắt</label>
          <input type="number" name="tableSeq" value={formData.tableSeq} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Mã hàng</label>
          <input type="text" name="productCode" value={formData.productCode} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Màu (Số)</label>
          <input type="number" name="color" value={formData.color} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Chiều dài sơ đồ (m)</label>
          <input type="number" step="0.01" name="markerLength" value={formData.markerLength} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Tổng chiều dài cắt (m)</label>
          <input type="number" step="0.01" name="totalPathLength" value={formData.totalPathLength} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Số sp / Sơ đồ</label>
          <input type="number" name="productsPerMarker" value={formData.productsPerMarker} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Số lá vải / Bàn</label>
          <input type="number" name="pliesPerTable" value={formData.pliesPerTable} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">BTP Chính</label>
          <input type="number" name="btpMain" value={formData.btpMain} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">BTP Phối</label>
          <input type="number" name="btpMatching" value={formData.btpMatching} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">BTP Lót</label>
          <input type="number" name="btpLining" value={formData.btpLining} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">TG Cho vải</label>
          <input type="time" name="fabricLoadingTime" value={formData.fabricLoadingTime} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">TG Bắt đầu</label>
          <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">TG Kết thúc</label>
          <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Thay dao (phút)</label>
          <input type="number" name="bladeChangeTime" value={formData.bladeChangeTime} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Sửa máy (phút)</label>
          <input type="number" name="repairTime" value={formData.repairTime} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Dao (Trước)</label>
          <select name="bladeStatusBefore" value={formData.bladeStatusBefore} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none">
            <option>Tốt</option><option>Trung bình</option><option>Cần thay</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Dao (Sau)</label>
          <select name="bladeStatusAfter" value={formData.bladeStatusAfter} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none">
            <option>Tốt</option><option>Trung bình</option><option>Mòn/Mẻ</option>
          </select>
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
