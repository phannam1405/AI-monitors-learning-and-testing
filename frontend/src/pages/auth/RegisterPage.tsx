import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../../api'
import { useAuthStore } from '../../store/authStore'
import { Button, Input } from '../../components/common'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '' })
  const [loading, setLoading] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authApi.register(form)
      const { accessToken, user } = res.data.result
      setAuth(user, accessToken)
      toast.success('Đăng ký thành công!')
      navigate('/student')
    } catch {
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎓</div>
          <h1 className="text-2xl font-bold text-white">Tạo tài khoản</h1>
          <p className="text-gray-400 text-sm mt-1">Mặc định vai trò Sinh viên</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700 space-y-4">
          <Input label="Họ và tên" placeholder="Nguyễn Văn A" value={form.fullName} onChange={set('fullName')} required />
          <Input label="Tên đăng nhập" placeholder="username" value={form.username} onChange={set('username')} required />
          <Input label="Email" type="email" placeholder="email@example.com" value={form.email} onChange={set('email')} required />
          <Input label="Mật khẩu" type="password" placeholder="Tối thiểu 6 ký tự" value={form.password} onChange={set('password')} required minLength={6} />
          <Button type="submit" loading={loading} className="w-full mt-2">
            Đăng ký
          </Button>
          <p className="text-center text-sm text-gray-400">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300">Đăng nhập</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
