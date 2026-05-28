import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Gắn token vào mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Xử lý lỗi global
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const msg = error.response?.data?.message || 'Đã có lỗi xảy ra'
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    } else if (error.response?.status !== 404) {
      toast.error(msg)
    }
    return Promise.reject(error)
  }
)

export default api
