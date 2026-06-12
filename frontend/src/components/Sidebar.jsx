import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ShieldCheck, FolderOpen, PlayCircle, CreditCard, LogOut } from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard/verify', label: 'Verify', icon: ShieldCheck },
  { to: '/dashboard/portfolio', label: 'Portfolio', icon: FolderOpen },
  { to: '/simuhire/session-demo', label: 'SimuHire', icon: PlayCircle },
  { to: '/dashboard/namecard', label: 'Namecard', icon: CreditCard },
]

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-line bg-parchment min-h-screen flex flex-col">
      <div className="p-6 border-b border-line">
        <span className="font-display font-bold text-ink text-lg tracking-tight">CREDO</span>
        <p className="text-xs text-slate mt-0.5">Prove. Present. Perform.</p>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-card text-sm transition-colors ${
                isActive
                  ? 'bg-ink text-parchment font-medium'
                  : 'text-slate hover:text-ink hover:bg-parchment-shade'
              }`
            }
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-line">
        <button className="flex items-center gap-2.5 px-3 py-2 rounded-card text-sm text-slate hover:text-ink hover:bg-parchment-shade transition-colors w-full">
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
