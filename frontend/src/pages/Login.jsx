import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GitBranch, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [role, setRole] = useState('candidate')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (role === 'employer') navigate('/employer')
    else navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-parchment flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="font-display font-bold text-ink text-2xl mb-8 block">CREDO</Link>

      <div className="bg-parchment border border-line rounded-card w-full max-w-sm p-8">
        <h1 className="font-display font-bold text-ink text-2xl mb-1">Welcome back</h1>
        <p className="text-slate text-sm mb-6">Sign in to your CREDO account.</p>

        {/* Role tab */}
        <div className="flex bg-parchment-shade rounded-card p-0.5 mb-6">
          {['candidate', 'employer'].map(r => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-1.5 text-sm font-medium capitalize rounded-card transition-colors ${
                role === r ? 'bg-parchment text-ink shadow-sm border border-line' : 'text-slate hover:text-ink'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* GitHub first for candidates */}
        {role === 'candidate' && (
          <>
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 border border-line rounded-card py-2.5 text-sm text-ink hover:bg-parchment-shade transition-colors font-medium mb-4"
            >
              <GitBranch size={15} /> Continue with GitHub
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-line" />
              <span className="text-xs text-slate">or sign in with email</span>
              <div className="flex-1 h-px bg-line" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate uppercase tracking-wider block mb-1.5">Email</label>
            <input
              type="email"
              className="w-full border border-line rounded-card px-3 py-2 text-sm bg-parchment text-ink focus:outline-none focus:border-ink placeholder-slate"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate uppercase tracking-wider">Password</label>
              <button type="button" className="text-xs text-slate hover:text-ink">Forgot password?</button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full border border-line rounded-card px-3 py-2 pr-10 text-sm bg-parchment text-ink focus:outline-none focus:border-ink"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-ink"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-ink text-parchment py-2.5 rounded-card text-sm font-medium hover:bg-opacity-90 transition-colors"
          >
            Sign in
          </button>
        </form>

        <p className="text-center text-xs text-slate mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-ink font-medium hover:underline">Build your CREDO →</Link>
        </p>
      </div>
    </div>
  )
}
