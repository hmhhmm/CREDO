import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GitBranch, User, Building2 } from 'lucide-react'

export default function Register() {
  const [role, setRole] = useState(null)
  const [consent, setConsent] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (role === 'candidate') navigate('/dashboard')
    else navigate('/employer')
  }

  return (
    <div className="min-h-screen bg-parchment flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="font-display font-bold text-ink text-2xl mb-8 block">CREDO</Link>

      <div className="bg-parchment border border-line rounded-card w-full max-w-md p-8">
        <h1 className="font-display font-bold text-ink text-2xl mb-1">Create your account</h1>
        <p className="text-slate text-sm mb-6">Join the verified career platform.</p>

        {/* Role selector */}
        <p className="text-xs font-semibold text-slate uppercase tracking-wider mb-3">I am a</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { key: 'candidate', icon: User, label: 'Candidate', desc: 'Build a verified career identity' },
            { key: 'employer', icon: Building2, label: 'Employer', desc: 'Find verified talent faster' },
          ].map(({ key, icon: Icon, label, desc }) => (
            <button
              key={key}
              onClick={() => setRole(key)}
              className={`p-4 rounded-card border text-left transition-colors ${
                role === key ? 'border-ink bg-ink text-parchment' : 'border-line bg-parchment hover:border-slate text-ink'
              }`}
            >
              <Icon size={18} className="mb-2" />
              <p className="font-semibold text-sm">{label}</p>
              <p className={`text-xs mt-0.5 ${role === key ? 'text-parchment opacity-70' : 'text-slate'}`}>{desc}</p>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {role === 'candidate' && (
            <>
              <div>
                <label className="text-xs font-medium text-slate uppercase tracking-wider block mb-1.5">Full Name</label>
                <input className="w-full border border-line rounded-card px-3 py-2 text-sm bg-parchment text-ink focus:outline-none focus:border-ink placeholder-slate" placeholder="Ahmad Farid" required />
              </div>
              <div>
                <label className="text-xs font-medium text-slate uppercase tracking-wider block mb-1.5">Email</label>
                <input type="email" className="w-full border border-line rounded-card px-3 py-2 text-sm bg-parchment text-ink focus:outline-none focus:border-ink placeholder-slate" placeholder="you@example.com" required />
              </div>
              <div>
                <label className="text-xs font-medium text-slate uppercase tracking-wider block mb-1.5">Password</label>
                <input type="password" className="w-full border border-line rounded-card px-3 py-2 text-sm bg-parchment text-ink focus:outline-none focus:border-ink" required />
              </div>
              <button type="button" className="w-full flex items-center justify-center gap-2 border border-line rounded-card py-2 text-sm text-ink hover:bg-parchment-shade transition-colors font-medium">
                <GitBranch size={15} /> Continue with GitHub
              </button>
              <div className="text-center text-xs text-slate">or</div>
            </>
          )}

          {role === 'employer' && (
            <>
              <div>
                <label className="text-xs font-medium text-slate uppercase tracking-wider block mb-1.5">Full Name</label>
                <input className="w-full border border-line rounded-card px-3 py-2 text-sm bg-parchment text-ink focus:outline-none focus:border-ink placeholder-slate" placeholder="Amirul Hassan" required />
              </div>
              <div>
                <label className="text-xs font-medium text-slate uppercase tracking-wider block mb-1.5">Email</label>
                <input type="email" className="w-full border border-line rounded-card px-3 py-2 text-sm bg-parchment text-ink focus:outline-none focus:border-ink placeholder-slate" placeholder="you@company.com" required />
              </div>
              <div>
                <label className="text-xs font-medium text-slate uppercase tracking-wider block mb-1.5">Company Name</label>
                <input className="w-full border border-line rounded-card px-3 py-2 text-sm bg-parchment text-ink focus:outline-none focus:border-ink placeholder-slate" placeholder="TechCorp Malaysia" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate uppercase tracking-wider block mb-1.5">Industry</label>
                  <select className="w-full border border-line rounded-card px-3 py-2 text-sm bg-parchment text-ink focus:outline-none focus:border-ink" required>
                    <option value="">Select</option>
                    <option>Technology</option>
                    <option>Finance</option>
                    <option>Healthcare</option>
                    <option>Education</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate uppercase tracking-wider block mb-1.5">Company Size</label>
                  <select className="w-full border border-line rounded-card px-3 py-2 text-sm bg-parchment text-ink focus:outline-none focus:border-ink" required>
                    <option value="">Select</option>
                    <option>1–10</option>
                    <option>11–50</option>
                    <option>51–200</option>
                    <option>201–500</option>
                    <option>500+</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate uppercase tracking-wider block mb-1.5">Password</label>
                <input type="password" className="w-full border border-line rounded-card px-3 py-2 text-sm bg-parchment text-ink focus:outline-none focus:border-ink" required />
              </div>
            </>
          )}

          {role && (
            <>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5" required />
                <span className="text-xs text-slate leading-relaxed">
                  I consent to CREDO processing my data under{' '}
                  <span className="underline cursor-pointer">PDPA 2010</span>. My raw documents and code are processed in memory only and not stored.
                </span>
              </label>
              <button
                type="submit"
                disabled={!consent || !role}
                className="w-full bg-ink text-parchment py-2.5 rounded-card text-sm font-medium hover:bg-opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Create account
              </button>
            </>
          )}
        </form>

        <p className="text-center text-xs text-slate mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-ink font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
