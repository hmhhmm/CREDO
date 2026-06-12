import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GitBranch } from 'lucide-react'

export default function Login() {
  const [role, setRole] = useState('candidate')
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

        <div className="flex rounded-card border border-line overflow-hidden mb-6">
          {['candidate', 'employer'].map(r => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-2 text-sm font-medium capitalize transition-colors ${role === r ? 'bg-ink text-parchment' : 'text-slate hover:text-ink bg-parchment'}`}
            >
              {r}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate uppercase tracking-wider block mb-1.5">Email</label>
            <input type="email" className="w-full border border-line rounded-card px-3 py-2 text-sm bg-parchment text-ink focus:outline-none focus:border-ink placeholder-slate" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="text-xs font-medium text-slate uppercase tracking-wider block mb-1.5">Password</label>
            <input type="password" className="w-full border border-line rounded-card px-3 py-2 text-sm bg-parchment text-ink focus:outline-none focus:border-ink" required />
          </div>
          <button type="submit" className="w-full bg-ink text-parchment py-2.5 rounded-card text-sm font-medium hover:bg-opacity-90 transition-colors">
            Sign in
          </button>
          {role === 'candidate' && (
            <>
              <div className="text-center text-xs text-slate">or</div>
              <button type="button" className="w-full flex items-center justify-center gap-2 border border-line rounded-card py-2 text-sm text-ink hover:bg-parchment-shade transition-colors font-medium">
                <GitBranch size={15} /> Continue with GitHub
              </button>
            </>
          )}
        </form>

        <p className="text-center text-xs text-slate mt-6">
          No account?{' '}
          <Link to="/register" className="text-ink font-medium hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  )
}
