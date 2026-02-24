import React, { useState } from 'react';
import { Branch } from '../types';
import { Plus, Trash2, Building2 } from 'lucide-react';

interface Props {
  branches: Branch[];
  onAddBranch: (name: string, location: string) => void;
  onDeleteBranch: (id: string) => void;
}

const AdminPanel: React.FC<Props> = ({ branches, onAddBranch, onDeleteBranch }) => {
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddBranch(newName, newLocation);
    setNewName('');
    setNewLocation('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          Quản lý Chi nhánh / Xưởng
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            placeholder="Tên chi nhánh/xưởng..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Địa điểm (không bắt buộc)..."
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Thêm mới
          </button>
        </form>

        <div className="overflow-hidden border border-slate-200 rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Tên chi nhánh</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Địa điểm</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {branches.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">
                    Chưa có chi nhánh nào được tạo.
                  </td>
                </tr>
              ) : (
                branches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700">{branch.name}</td>
                    <td className="px-4 py-3 text-slate-600">{branch.location || '---'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onDeleteBranch(branch.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa chi nhánh"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <p className="text-sm text-blue-700">
          <strong>Lưu ý:</strong> Xóa chi nhánh sẽ không xóa các bản ghi đã nhập liên quan đến chi nhánh đó, nhưng chi nhánh đó sẽ không còn xuất hiện trong danh sách lựa chọn khi nhập liệu mới.
        </p>
      </div>
    </div>
  );
};

export default AdminPanel;
