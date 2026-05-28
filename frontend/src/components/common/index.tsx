import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import type { Role } from '../../types'

// ── Button ──
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}
export function Button({ variant = 'primary', size = 'md', loading, children, className = '', ...props }: BtnProps) {
  const base = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-500',
    danger: 'bg-red-600 text-white hover:bg-red-500',
    ghost: 'bg-transparent text-gray-300 hover:bg-gray-700 border border-gray-600',
    success: 'bg-green-600 text-white hover:bg-green-500',
  }
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' }
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <span className="mr-2 animate-spin">⏳</span> : null}
      {children}
    </button>
  )
}

// ── Badge ──
interface BadgeProps { label: string; color?: 'green' | 'red' | 'orange' | 'blue' | 'purple' | 'gray' }
export function Badge({ label, color = 'gray' }: BadgeProps) {
  const colors = {
    green: 'bg-green-900 text-green-300',
    red: 'bg-red-900 text-red-300',
    orange: 'bg-orange-900 text-orange-300',
    blue: 'bg-blue-900 text-blue-300',
    purple: 'bg-purple-900 text-purple-300',
    gray: 'bg-gray-700 text-gray-300',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
      {label}
    </span>
  )
}

// ── Modal ──
interface ModalProps { isOpen: boolean; onClose: () => void; title: string; children: ReactNode; size?: 'sm' | 'md' | 'lg' }
export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className={`bg-gray-800 rounded-2xl shadow-2xl w-full ${sizes[size]} border border-gray-700`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ── Input ──
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string }
export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm text-gray-300">{label}</label>}
      <input
        className={`w-full bg-gray-700 border ${error ? 'border-red-500' : 'border-gray-600'} rounded-lg px-3 py-2 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        {...props}
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}

// ── Select ──
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { label?: string; options: { value: string; label: string }[] }
export function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm text-gray-300">{label}</label>}
      <select
        className={`w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        {...props}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

// ── PrivateRoute ──
interface PrivateRouteProps { children: ReactNode; roles?: Role[] }
export function PrivateRoute({ children, roles }: PrivateRouteProps) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />
  return <>{children}</>
}

// ── PageHeader ──
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// ── Loading spinner ──
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={`${sizes[size]} border-2 border-blue-500 border-t-transparent rounded-full animate-spin`} />
  )
}

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center space-y-3">
        <Spinner size="lg" />
        <p className="text-gray-400 text-sm">Đang tải...</p>
      </div>
    </div>
  )
}
