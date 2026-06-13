import { Link } from 'react-router-dom'
import { Plus, Users, Briefcase, Bookmark, ArrowRight } from 'lucide-react'
import { mockJobListings, mockEmployer } from '../data/mockData'

export default function EmployerDashboard() {
  return (
    <div className="min-h-screen bg-parchment">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-line">
        <Link to="/" className="font-display font-bold text-ink text-lg">CREDO</Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate">{mockEmployer.company}</span>
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
          <p className="text-slate text-sm">{mockEmployer.company} · {mockEmployer.industry}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Active Listings', value: mockJobListings.length, icon: Briefcase },
            { label: 'Candidates Viewed', value: 12, icon: Users },
            { label: 'Shortlisted', value: 3, icon: Bookmark },
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
          <button className="flex items-center gap-1 text-xs text-ink font-medium hover:underline">
            <Plus size={12} /> Post a job
          </button>
        </div>
        <div className="space-y-3">
          {mockJobListings.map(job => (
            <div key={job.id} className="border border-line rounded-card p-5 bg-parchment">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-ink">{job.title}</h3>
                  <p className="text-xs text-slate mt-0.5">{job.company} · Posted {job.createdAt}</p>
                  <p className="text-xs text-slate mt-1 leading-relaxed">{job.description}</p>
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
          ))}
        </div>
      </div>
    </div>
  )
}
