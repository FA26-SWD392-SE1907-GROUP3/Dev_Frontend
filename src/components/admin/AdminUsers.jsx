import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import { Plus, MoreVertical, Search, Filter, KeyRound, UserX, UserCheck, Shield } from 'lucide-react';

export default function AdminUsers({ users, setUsers, onShowToast, t }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Add User Form States
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Lecturer');
  const [newStudentId, setNewStudentId] = useState('');
  const [newCampus, setNewCampus] = useState('FPT University Hà Nội');

  // Selected User for Actions
  const [selectedUser, setSelectedUser] = useState(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const newUser = {
      id: `usr-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim(),
      role: newRole,
      status: 'Active',
      studentId: newRole === 'Student' ? (newStudentId.trim() || `SE${Math.floor(180000 + Math.random() * 9000)}`) : undefined,
      campus: newCampus,
      department: newRole !== 'Student' ? newCampus : undefined,
    };

    setUsers([newUser, ...users]);
    setIsModalOpen(false);
    setNewName('');
    setNewEmail('');
    setNewStudentId('');
    onShowToast(`${newUser.name} đã được thêm thành công.`);
  };

  const handleToggleStatus = (user) => {
    const updatedStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    setUsers(users.map((u) => (u.id === user.id ? { ...u, status: updatedStatus } : u)));
    setIsActionModalOpen(false);
    onShowToast(`Đã chuyển trạng thái tài khoản ${user.name} sang: ${updatedStatus === 'Active' ? 'Hoạt động' : 'Đã khóa'}`);
  };

  const handleResetPassword = (user) => {
    setIsActionModalOpen(false);
    onShowToast(`Đã gửi liên kết đặt lại mật khẩu đến: ${user.email}`);
  };

  const filteredUsers = users.filter((u) => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const q = searchQuery.toLowerCase();
    const matchQuery =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.studentId && u.studentId.toLowerCase().includes(q)) ||
      (u.campus && u.campus.toLowerCase().includes(q));
    return matchRole && matchQuery;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-apptext tracking-tight">{t.usersTitle}</h1>
          <p className="text-sm text-mutedtext mt-1">{t.usersSub}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="h-10 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium flex items-center space-x-2 transition-colors self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addUser}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface rounded-xl border border-appborder p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between transition-colors">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mutedtext" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchUsers || 'Tìm kiếm theo họ tên, email hoặc MSSV...'}
            className="w-full h-10 pl-9 pr-4 bg-canvas border border-appborder rounded-lg text-sm text-apptext placeholder:text-mutedtext focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-mutedtext shrink-0 hidden sm:block" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="all">{t.filterAllRoles || 'Tất cả vai trò'}</option>
            <option value="Lecturer">{t.filterLecturers || 'Giảng viên'}</option>
            <option value="Student">{t.filterStudents || 'Sinh viên'}</option>
            <option value="Admin">{t.filterAdmins || 'Quản trị viên'}</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-surface rounded-xl border border-appborder shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-appborder text-xs font-semibold uppercase">
              <tr>
                <th className="px-5 py-3">{t.colName}</th>
                <th className="px-5 py-3">{t.colAccount}</th>
                <th className="px-5 py-3">{t.colRole}</th>
                <th className="px-5 py-3">{t.userCampus || 'Cơ sở / Đơn vị'}</th>
                <th className="px-5 py-3">{t.colStatus}</th>
                <th className="px-5 py-3 text-right">{t.colAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-appborder">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-mutedtext">
                    Không tìm thấy người dùng nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="h-[52px] hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-2">
                      <div className="font-semibold text-apptext flex items-center space-x-2">
                        <span>{user.name}</span>
                        {user.studentId && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-primary border border-blue-200 dark:border-blue-900 font-medium">
                            {user.studentId}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-2 text-mutedtext font-mono text-xs">{user.email}</td>
                    <td className="px-5 py-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        user.role === 'Admin'
                          ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                          : user.role === 'Lecturer'
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-primary border-blue-200 dark:border-blue-800'
                          : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-2 text-xs text-mutedtext">
                      {user.campus || user.department || 'Đại học FPT'}
                    </td>
                    <td className="px-5 py-2">
                      <StatusBadge status={user.status === 'Active' ? t.statusActive : t.statusInactive} />
                    </td>
                    <td className="px-5 py-2 text-right">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setIsActionModalOpen(true);
                        }}
                        className="p-1.5 rounded-md text-mutedtext hover:text-apptext hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Thao tác tài khoản"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t.addUser}>
        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-apptext mb-1">{t.colName} *</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="VD: Nguyễn Văn An"
              className="w-full h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-apptext mb-1">{t.colAccount} *</label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="annvse180001@fpt.edu.vn"
              className="w-full h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-apptext mb-1">{t.colRole} *</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="Lecturer">{t.filterLecturers || 'Giảng viên'}</option>
                <option value="Student">{t.filterStudents || 'Sinh viên'}</option>
                <option value="Admin">{t.filterAdmins || 'Quản trị viên'}</option>
              </select>
            </div>

            {newRole === 'Student' ? (
              <div>
                <label className="block text-xs font-medium text-apptext mb-1">Mã số sinh viên (MSSV)</label>
                <input
                  type="text"
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  placeholder="VD: SE184920"
                  className="w-full h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-apptext mb-1">Bộ môn / Phòng ban</label>
                <input
                  type="text"
                  value={newCampus}
                  onChange={(e) => setNewCampus(e.target.value)}
                  placeholder="VD: Bộ môn Kỹ thuật Phần mềm"
                  className="w-full h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-apptext mb-1">Cơ sở FPT University</label>
            <select
              value={newCampus}
              onChange={(e) => setNewCampus(e.target.value)}
              className="w-full h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="FPT University Hà Nội">FPT University Hà Nội (Hòa Lạc)</option>
              <option value="FPT University TP.HCM">FPT University TP.HCM (Khu Công nghệ cao)</option>
              <option value="FPT University Đà Nẵng">FPT University Đà Nẵng</option>
              <option value="FPT University Cần Thơ">FPT University Cần Thơ</option>
              <option value="FPT University Quy Nhơn">FPT University Quy Nhơn</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="h-10 px-4 rounded-lg border border-appborder text-xs font-medium text-mutedtext hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="h-10 px-5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs"
            >
              {t.addUser}
            </button>
          </div>
        </form>
      </Modal>

      {/* Action Options Modal */}
      {selectedUser && (
        <Modal
          isOpen={isActionModalOpen}
          onClose={() => setIsActionModalOpen(false)}
          title={`Thao tác tài khoản: ${selectedUser.name}`}
        >
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-canvas border border-appborder text-xs space-y-1">
              <div><strong className="text-apptext">Họ tên:</strong> {selectedUser.name}</div>
              <div><strong className="text-apptext">Email:</strong> {selectedUser.email}</div>
              {selectedUser.studentId && <div><strong className="text-apptext">MSSV:</strong> {selectedUser.studentId}</div>}
              <div><strong className="text-apptext">Vai trò:</strong> {selectedUser.role}</div>
              <div><strong className="text-apptext">Trạng thái:</strong> {selectedUser.status === 'Active' ? 'Đang hoạt động' : 'Đã khóa'}</div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleToggleStatus(selectedUser)}
                className={`w-full h-10 px-4 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-colors ${
                  selectedUser.status === 'Active'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {selectedUser.status === 'Active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                <span>{selectedUser.status === 'Active' ? 'Khóa tài khoản người dùng' : 'Kích hoạt lại tài khoản'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleResetPassword(selectedUser)}
                className="w-full h-10 px-4 rounded-lg border border-appborder hover:bg-slate-100 dark:hover:bg-slate-800 text-apptext text-xs font-semibold flex items-center justify-center space-x-2 transition-colors"
              >
                <KeyRound className="w-4 h-4 text-primary" />
                <span>Đặt lại mật khẩu & Gửi link xác thực</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
