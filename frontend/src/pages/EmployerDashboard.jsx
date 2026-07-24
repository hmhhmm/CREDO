import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users, Briefcase, Bookmark, ArrowRight, X } from 'lucide-react'
import { jobsApi, employersApi, ApiError } from '../lib/api'
import { jobFromApi } from '../lib/adapters'

const emptyForm = { title: '', requiredSkills: '', requireVerified: false, requireSimuHire: false, description: '' }

export default function EmployerDashboard() {
  const [employer, setEmployer] = useState(null)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([employersApi.me(), jobsApi.list()])
      .then(([employerRes, jobsRes]) => {
        if (cancelled) return
        setEmployer(employerRes)
        setJobs(jobsRes.map(jobFromApi))
        setError('')
      })
      .catch(err => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Could not load your dashboard. Is the backend running?')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handlePostJob = async (e) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    try {
      const created = await jobsApi.create({
        title: form.title,
        company: employer?.company_name ?? '',
        required_skills: form.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
        require_verified: form.requireVerified,
        require_simuhire: form.requireSimuHire,
        description: form.description || null,
      })
      setJobs(prev => [jobFromApi(created), ...prev])
      setForm(emptyForm)
      setShowForm(false)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not post this job. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-parchment">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-line">
        <Link to="/" className="font-display font-bold text-ink text-lg">CREDO</Link>
        <div className="flex items-center gap-4">
          {employer?.company_name && <span className="text-sm text-slate">{employer.company_name}</span>}
          <Link
            to="/employer/candidates"
            className="flex items-center gap-2 bg-ink text-parchment px-4 py-2 rounded-card text-sm font-medium hover:bg-opacity-90 transition-colors"
          >
            <Users size={14} /> Browse Candidates
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="font-display font-bold text-ink text-3xl mb-1">Employer Dashboard</h1>
          {employer && (
            <p className="text-slate text-sm">{employer.company_name}{employer.industry ? ` · ${employer.industry}` : ''}</p>
          )}
        </div>

        {error && (
          <p className="text-xs text-alert bg-alert/10 border border-alert/30 rounded-card px-3 py-2 mb-6">{error}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Active Listings', value: jobs.length, icon: Briefcase },
            // No backend endpoint tracks candidate views or shortlists yet — these stay
            // as placeholders until that's built, not silently swapped for fabricated data.
            { label: 'Candidates Viewed', value: '—', icon: Users },
            { label: 'Shortlisted', value: '—', icon: Bookmark },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="border border-line rounded-card p-5 bg-parchment">
              <Icon size={16} className="text-slate mb-2" />
              <p className="font-mono text-2xl font-medium text-ink">{value}</p>
              <p className="text-xs text-slate mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Job listings */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate uppercase tracking-wider">Active Job Listings</h2>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1 text-xs text-ink font-medium hover:underline"
          >
            {showForm ? <X size={12} /> : <Plus size={12} />} {showForm ? 'Cancel' : 'Post a job'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handlePostJob} className="border border-line rounded-card p-5 bg-parchment mb-4 space-y-3">
            {formError && (
              <p className="text-xs text-alert bg-alert/10 border border-alert/30 rounded-card px-3 py-2">{formError}</p>
            )}
            <div>
              <label className="text-xs font-medium text-slate uppercase tracking-wider block mb-1.5">Job Title</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border border-line rounded-card px-3 py-2 text-sm bg-parchment text-ink focus:outline-none focus:border-ink"
                placeholder="Junior ML Engineer"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate uppercase tracking-wider block mb-1.5">Required Skills (comma-separated)</label>
              <input
                value={form.requiredSkills}
                onChange={e => setForm(f => ({ ...f, requiredSkills: e.target.value }))}
                className="w-full border border-line rounded-card px-3 py-2 text-sm bg-parchment text-ink focus:outline-none focus:border-ink"
                placeholder="Python, Machine Learning, SQL"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate uppercase tracking-wider block mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-line rounded-card px-3 py-2 text-sm bg-parchment text-ink focus:outline-none focus:border-ink"
                rows={2}
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requireVerified}
                  onChange={e => setForm(f => ({ ...f, requireVerified: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-xs text-ink">Verified Only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requireSimuHire}
                  onChange={e => setForm(f => ({ ...f, requireSimuHire: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-xs text-ink">Require SimuHire</span>
              </label>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-ink text-parchment px-4 py-2 rounded-card text-sm font-medium hover:bg-opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'Posting…' : 'Post job'}
            </button>
          </form>
        )}

        <div className="space-y-3">
          {loading ? (
            <p className="text-sm text-slate text-center py-8">Loading job listings…</p>
          ) : jobs.length === 0 ? (
            <p className="text-sm text-slate text-center py-8">No job listings yet.</p>
          ) : (
            jobs.map(job => (
              <div key={job.id} className="border border-line rounded-card p-5 bg-parchment">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-ink">{job.title}</h3>
                    <p className="text-xs text-slate mt-0.5">{job.company} · Posted {job.createdAt}</p>
                    {job.description && <p className="text-xs text-slate mt-1 leading-relaxed">{job.description}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {job.requireVerified && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#F0FAF6] border border-verified/30 text-verified font-mono">
                        Verified Only
                      </span>
                    )}
                    {job.requireSimuHire && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-parchment-shade border border-line text-slate font-mono">
                        SimuHire req.
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex flex-wrap gap-1.5">
                    {job.requiredSkills.map(s => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-full border border-line text-slate bg-parchment-shade">
                        {s}
                      </span>
                    ))}
                  </div>
                  <Link
                    to={`/employer/candidates?skills=${job.requiredSkills.join(',')}&verified=${job.requireVerified}`}
                    className="flex items-center gap-1 text-xs text-ink font-medium hover:underline shrink-0 ml-3"
                  >
                    Browse matching <ArrowRight size={10} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
