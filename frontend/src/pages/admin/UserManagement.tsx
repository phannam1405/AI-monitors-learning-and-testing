import { useEffect, useState } from 'react'
import { adminApi } from '../../api'
import type { User } from '../../types'
import { Button, Badge, PageHeader, Modal, Select } from '../../components/common'
import toast from 'react-hot-toast'

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [roleModal, setRoleModal] = useState<User | null>(null)
  const [newRole, setNewRole] = useState<string>('')
  const [filter, setFilter] = useState<string>('')

  useEffect(() => {
    setLoading(true)
    adminApi.getUsers(filter || undefined)
      .then(r => setUsers(r.data.result))
      .finally(() => setLoading(false))
  }, [filter])

  const handleToggle = async (id: number) => {
    const res = await adminApi.toggleStatus(id)
    setUsers(us => us.map(u => u.id === id ? res.data.result : u))
    toast.success('Đã cập nhật trạng thái')
  }

  const handleUpdateRole = async () => {
    if (!roleModal || !newRole) return
    const res = await adminApi.updateRole(roleModal.id, newRole)
    setUsers(us => us.map(u => u.id === roleModal.id ? res.data.result : u))
    setRoleModal(null)
    toast.success('Đã cập nhật role')
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Xoá tài khoản này?')) return
    await adminApi.deleteUser(id)
    setUsers(us => us.filter(u => u.id !== id))
    toast.success('Đã xoá tài khoản')
  }

  const ROLE_COLOR: Record<string, 'purple' | 'blue' | 'green'> = {
    ADMIN: 'purple', TEACHER: 'blue', STUDENT: 'green',
  }

  return (
    <div>
      <PageHeader title="👥 Quản lý tài khoản" subtitle={`${users.length} tài khoản`} />

      {/* Filter */}
      <div className="flex gap-3 mb-4">
        {['', 'STUDENT', 'TEACHER', 'ADMIN'].map(r => (
          <button key={r}
            onClick={() => setFilter(r)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === r ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            {r || 'Tất cả'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr className="text-gray-400 text-left">
                <th className="px-4 py-3">Họ tên</th>
                <th className="px-4 py-3">Tài khoản</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Đang tải...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Không có tài khoản</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-gray-750">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{u.fullName}</div>
                    <div className="text-xs text-gray-400">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 font-mono text-xs">{u.username}</td>
                  <td className="px-4 py-3"><Badge label={u.role} color={ROLE_COLOR[u.role] ?? 'gray'} /></td>
                  <td className="px-4 py-3"><Badge label={u.isActive ? 'Hoạt động' : 'Bị khoá'} color={u.isActive ? 'green' : 'red'} /></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    {u.role !== 'ADMIN' && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setRoleModal(u); setNewRole(u.role) }}
                          className="text-blue-400 hover:text-blue-300 text-xs">Role</button>
                        <button onClick={() => handleToggle(u.id)}
                          className={`text-xs ${u.isActive ? 'text-orange-400 hover:text-orange-300' : 'text-green-400 hover:text-green-300'}`}>
                          {u.isActive ? 'Khoá' : 'Mở'}
                        </button>
                        <button onClick={() => handleDelete(u.id)}
                          className="text-red-400 hover:text-red-300 text-xs">Xoá</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!roleModal} onClose={() => setRoleModal(null)} title="Cập nhật vai trò" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-300">Thay đổi role cho <strong className="text-white">{roleModal?.fullName}</strong></p>
          <Select label="Vai trò mới" value={newRole} onChange={e => setNewRole(e.target.value)}
            options={[
              { value: 'STUDENT', label: 'Sinh viên' },
              { value: 'TEACHER', label: 'Giáo viên' },
            ]} />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setRoleModal(null)}>Huỷ</Button>
            <Button onClick={handleUpdateRole}>Cập nhật</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
