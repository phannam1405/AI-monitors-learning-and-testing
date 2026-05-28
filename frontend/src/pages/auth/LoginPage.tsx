import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../../api'
import { useAuthStore } from '../../store/authStore'
import { Button, Input } from '../../components/common'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authApi.login(form)
      const { accessToken, user } = res.data.result
      setAuth(user, accessToken)
      toast.success(`Chào mừng, ${user.fullName}!`)
      if (user.role === 'ADMIN') navigate('/admin')
      else if (user.role === 'TEACHER') navigate('/teacher')
      else navigate('/student')
    } catch {
      // axios interceptor đã toast lỗi
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎓</div>
          <h1 className="text-2xl font-bold text-white">Hệ thống giám sát</h1>
          <p className="text-gray-400 text-sm mt-1">Học và Thi trực tuyến</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700 space-y-4">
          <Input
            label="Tên đăng nhập"
            placeholder="username"
            value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            required
            autoFocus
          />
          <Input
            label="Mật khẩu"
            type="password"
            placeholder="••••••"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required
          />
          <Button type="submit" loading={loading} className="w-full mt-2">
            Đăng nhập
          </Button>
          <p className="text-center text-sm text-gray-400">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300">
              Đăng ký
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
