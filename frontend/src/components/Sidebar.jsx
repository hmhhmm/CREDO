import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ShieldCheck, FolderOpen, PlayCircle, CreditCard, LogOut,
} from 'lucide-react'

// Navigation mirrors the product's three pillars (Prove → Perform → Present)
// so the menu speaks the same language as the dashboard journey. Overview sits
// above the pillars as the always-available home.
const navGroups = [
  {
    pillar: null,
    items: [
      { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
    ],
  },
  {
    pillar: 'Prove',
    items: [
      { to: '/dashboard/verify',    label: 'Verify',    icon: ShieldCheck },
      { to: '/dashboard/portfolio', label: 'Portfolio', icon: FolderOpen },
    ],
  },
  {
    pillar: 'Perform',
    items: [
      { to: '/simuhire/session-demo', label: 'SimuHire', icon: PlayCircle },
    ],
  },
  {
    pillar: 'Present',
    items: [
      { to: '/dashboard/namecard', label: 'Namecard', icon: CreditCard },
    ],
  },
]

function NavItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
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
  )
}

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-line bg-parchment min-h-screen flex flex-col">
      <div className="p-6 border-b border-line">
        <span className="font-display font-bold text-ink text-lg tracking-tight">CREDO</span>
        <p className="text-xs text-slate mt-0.5">Prove. Present. Perform.</p>
      </div>
      <nav className="flex-1 p-3 space-y-4">
        {navGroups.map(({ pillar, items }, i) => (
          <div key={pillar ?? `group-${i}`} className="space-y-0.5">
            {pillar && (
              <p className="px-3 pb-1 text-[10px] font-mono uppercase tracking-widest text-slate/60">
                {pillar}
              </p>
            )}
            {items.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </div>
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
