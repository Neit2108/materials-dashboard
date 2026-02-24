
import XLSX from 'xlsx-js-style';
import { CuttingRecord } from '../types';
import { calculateMinutes } from './helpers';

export const exportToExcel = (records: CuttingRecord[], fileName: string, sheetName: string = 'Báo cáo') => {
  if (!records || records.length === 0) {
    alert("Không có dữ liệu để xuất báo cáo!");
    return;
  }

  // 1. Sắp xếp dữ liệu theo công nhân và ngày
  const sortedRecords = [...records].sort((a, b) => {
    if (a.operator !== b.operator) return a.operator.localeCompare(b.operator);
    const dateA = new Date(a.year, a.month - 1, a.day).getTime();
    const dateB = new Date(b.year, b.month - 1, b.day).getTime();
    return dateA - dateB;
  });

  // 2. Chuẩn bị Tiêu đề (Headers)
  const headers = [
    'Ngày', 'Tháng', 'Máy cắt số', 'Công nhân ĐK', 'STT Bàn cắt', 'Mã hàng', 'Màu', 
    'Chiều dài sơ đồ cắt', 'Tổng chiều dài đường cắt', 'Số SP /Sơ đồ cắt', 'Số lá vải / bàn', 
    'Chủng loại vải', 'Số lớp quy định tối đa', '% số lớp thực tế / số lớp quy định', 
    'Tổng số lượng BTP', 'Thời gian cắt trên bàn', 'Tổng thời gian máy chạy (phút)', 
    'Số mét cắt / phút', 'Dao trước', 'Dao sau'
  ];

  const wsData: any[][] = [headers];

  // 3. Nhóm theo công nhân
  const operators = Array.from(new Set(sortedRecords.map(r => r.operator)));

  operators.forEach(op => {
    const opRecords = sortedRecords.filter(r => r.operator === op);
    
    // Thêm các dòng dữ liệu của công nhân này
    opRecords.forEach(r => {
      const runTime = calculateMinutes(r.startTime, r.endTime);
      const speed = runTime > 0 ? (r.totalPathLength / runTime).toFixed(2) : "0.00";
      const efficiency = r.maxPlies > 0 ? ((r.pliesPerTable / r.maxPlies) * 100).toFixed(1) : "0";
      const totalBtp = (r.btpMain || 0) + (r.btpMatching || 0) + (r.btpLining || 0);
      
      wsData.push([
        r.day, r.month, r.machineNo, r.operator, r.tableSeq, r.productCode, r.color,
        r.markerLength, r.totalPathLength, r.productsPerMarker, r.pliesPerTable,
        r.fabricType || '', r.maxPlies || 0, efficiency + '%',
        totalBtp, `${r.startTime} - ${r.endTime}`, runTime,
        speed, r.bladeStatusBefore, r.bladeStatusAfter
      ]);
    });

    // 4. Tính toán tổng cộng cho công nhân này
    const totalMarker = opRecords.reduce((s, r) => s + (Number(r.markerLength) || 0), 0);
    const totalPath = opRecords.reduce((s, r) => s + (Number(r.totalPathLength) || 0), 0);
    const totalProducts = opRecords.reduce((s, r) => s + (Number(r.productsPerMarker) || 0), 0);
    const totalPlies = opRecords.reduce((s, r) => s + (Number(r.pliesPerTable) || 0), 0);
    const totalBtpAll = opRecords.reduce((s, r) => s + (r.btpMain || 0) + (r.btpMatching || 0) + (r.btpLining || 0), 0);
    const totalRunTime = opRecords.reduce((s, r) => s + calculateMinutes(r.startTime, r.endTime), 0);

    wsData.push([
      `TỔNG CỘNG (${op}):`, '', '', '', '', '', '',
      Number(totalMarker.toFixed(2)), Number(totalPath.toFixed(2)), totalProducts, totalPlies,
      '', '', '', totalBtpAll, '', totalRunTime, '', '', ''
    ]);
    
    // Thêm dòng trống giữa các công nhân
    wsData.push([]);
  });

  // 5. Khởi tạo Sheet
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
