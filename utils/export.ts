
import XLSX from 'xlsx-js-style';
import { CuttingRecord } from '../types';
import { calculateMinutes } from './helpers';

export const exportToExcel = (records: CuttingRecord[], fileName: string, sheetName: string = 'Báo cáo') => {
  if (!records || records.length === 0) {
    alert("Không có dữ liệu để xuất báo cáo!");
    return;
  }

  // 1. Tính toán tổng thời gian máy chạy và công nhân theo ngày/ca làm việc
  const machineDailyTotals = new Map<string, number>();
  const operatorDailyTotals = new Map<string, number>();

  records.forEach(r => {
    const mKey = `${r.machineNo}-${r.day}-${r.month}-${r.year}`;
    const oKey = `${r.operator}-${r.day}-${r.month}-${r.year}`;
    const mins = calculateMinutes(r.startTime, r.endTime);
    
    machineDailyTotals.set(mKey, (machineDailyTotals.get(mKey) || 0) + mins);
    operatorDailyTotals.set(oKey, (operatorDailyTotals.get(oKey) || 0) + mins);
  });

  // 2. Chuẩn bị Tiêu đề (Headers)
  const headers = [
    'Ngày', 'Tháng', 'Năm', 'Máy cắt số', 'Công nhân ĐK', 'STT Bàn cắt', 'Mã hàng', 'Màu', 
    'Chiều dài sơ đồ (m)', 'Tổng chiều dài đường cắt (m)', 'Số sp/Sơ đồ', 'Số lá vải/Bàn', 
    'BTP Chính', 'BTP Phối', 'BTP Lót', 'TG Cho vải', 'TG Bắt đầu', 'TG Kết thúc', 
    'TG chạy bàn (Phút)', 'Số mét cắt/phút', 'TG Thay dao (Phút)', 'TG Sửa máy (Phút)', 
    'Trạng thái dao Trước', 'Trạng thái dao Sau', 
    'TỔNG TG MÁY CHẠY/CA (Giờ)', 'TỔNG TG CÔNG NHÂN/CA (Giờ)'
  ];

  // 3. Chuẩn bị Dữ liệu (Rows)
  const rows = records.map(r => {
    const runTime = calculateMinutes(r.startTime, r.endTime);
    const speed = runTime > 0 ? (r.totalPathLength / runTime).toFixed(2) : "0.00";
    const mKey = `${r.machineNo}-${r.day}-${r.month}-${r.year}`;
    const oKey = `${r.operator}-${r.day}-${r.month}-${r.year}`;
    
    return [
      r.day, r.month, r.year, r.machineNo, r.operator, r.tableSeq, r.productCode, r.color,
      r.markerLength, r.totalPathLength, r.productsPerMarker, r.pliesPerTable,
      r.btpMain, r.btpMatching, r.btpLining, r.fabricLoadingTime, r.startTime, r.endTime,
      runTime, speed, r.bladeChangeTime, r.repairTime,
      r.bladeStatusBefore, r.bladeStatusAfter,
      Number(((machineDailyTotals.get(mKey) || 0) / 60).toFixed(2)),
      Number(((operatorDailyTotals.get(oKey) || 0) / 60).toFixed(2))
    ];
  });

  const totalMarker = records.reduce((s, r) => s + (Number(r.markerLength) || 0), 0);
  const totalPath = records.reduce((s, r) => s + (Number(r.totalPathLength) || 0), 0);

  const summaryRow = [
    'TỔNG CỘNG:', '', '', '', '', '', '', '',
    Number(totalMarker.toFixed(2)), Number(totalPath.toFixed(2)), '', '',
    '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ];

  // 4. Khởi tạo Sheet
  const wsData = [headers, ...rows, summaryRow];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // 5. Cấu hình độ rộng cột
  const wscols = headers.map(() => ({ wch: 15 }));
  wscols[4] = { wch: 25 }; 
  ws['!cols'] = wscols;

  // 6. Ghi file (Browser/Mobile download)
  try {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  } catch (error) {
    console.error("Lỗi xuất Excel:", error);
    alert("Có lỗi xảy ra khi tạo file Excel.");
  }
};

export const exportByOperator = (records: CuttingRecord[], operatorName: string) => {
  const filtered = records.filter(r => r.operator === operatorName);
  exportToExcel(filtered, `BaoCao_CongNhan_${operatorName.replace(/\s+/g, '_')}`, `Công nhân ${operatorName}`);
};
