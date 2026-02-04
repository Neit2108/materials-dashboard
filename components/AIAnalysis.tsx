
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { OperatorSummary, MachineSummary } from '../types';

interface Props {
  operatorSummaries: OperatorSummary[];
  machineSummaries: MachineSummary[];
}

const AIAnalysis: React.FC<Props> = ({ operatorSummaries, machineSummaries }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const generateAIReport = async () => {
    if (operatorSummaries.length === 0) {
      alert("Cần có dữ liệu thống kê để AI có thể phân tích.");
      return;
    }

    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Bạn là một chuyên gia quản lý sản xuất ngành may mặc. 
        Hãy phân tích dữ liệu hiệu suất máy cắt vải sau đây và đưa ra báo cáo ngắn gọn bằng tiếng Việt:
        
        Dữ liệu công nhân: ${JSON.stringify(operatorSummaries)}
        Dữ liệu máy móc: ${JSON.stringify(machineSummaries)}
        
        Yêu cầu báo cáo gồm:
        1. 3 nhận xét về năng suất (ai làm tốt nhất, máy nào hoạt động hiệu quả nhất).
        2. 2 đề xuất cụ thể để cải thiện thời gian chạy máy hoặc tốc độ cắt.
        3. Cảnh báo nếu có sự chênh lệch lớn về tốc độ trung bình giữa các công nhân.
        
        Viết dưới dạng Markdown chuyên nghiệp, súc tích.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setReport(response.text || "Không thể tạo báo cáo.");
    } catch (error) {
      console.error("AI Error:", error);
      setReport("Đã có lỗi xảy ra khi kết nối với AI. Vui lòng kiểm tra lại cấu hình API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Trợ lý Phân tích AI</h3>
            <p className="text-xs text-slate-500 font-medium italic">Sử dụng Google Gemini để tối ưu hóa sản xuất.</p>
          </div>
        </div>
        <button 
          onClick={generateAIReport}
          disabled={loading}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg ${
            loading 
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100 active:scale-95'
          }`}
        >
          {loading ? (
            <><svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Đang phân tích...</>
          ) : 'Phát sinh báo cáo Insight'}
        </button>
      </div>

      {report && (
        <div className="bg-white border border-indigo-100 p-6 rounded-xl prose prose-slate max-w-none animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
            {report}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
            <button 
              onClick={() => setReport(null)}
              className="text-[10px] font-black text-slate-400 uppercase hover:text-red-500 transition-colors"
            >
              Đóng báo cáo
            </button>
          </div>
        </div>
      )}

      {!report && !loading && (
        <div className="py-8 text-center border-2 border-dashed border-indigo-100 rounded-xl">
          <p className="text-sm text-slate-400 font-medium italic">Nhấn nút phía trên để AI phân tích dữ liệu hiệu suất hiện tại của bạn.</p>
        </div>
      )}
    </div>
  );
};

export default AIAnalysis;
