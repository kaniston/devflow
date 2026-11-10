
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Bug,
  Users,
  Settings,
  Zap,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Projects', path: '/projects', icon: FolderKanban },
  { name: 'My Tasks', path: '/tasks', icon: CheckSquare },
  { name: 'Issues', path: '/issues', icon: Bug },
  { name: 'Team', path: '/team', icon: Users },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-950 text-white">

      <div className="flex h-20 items-center gap-3 border-b border-slate-800 px-6">
        <div className="rounded-xl bg-blue-600 p-2">
          <Zap size={22} />
        </div>
        <span className="text-xl font-bold tracking-tight">
          DevFlow
        </span>
      </div>

      <div className="px-4 py-6">
        <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Workspace
        </p>

        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon size={19} />
                {item.name}
              </NavLink>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto p-4">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <Settings size={19} />
          Settings
        </NavLink>

        <div className="mt-4 rounded-xl bg-slate-900 p-4">
          <p className="text-sm font-semibold">DevFlow Pro</p>
          <p className="mt-1 text-xs text-slate-400">
            Your workspace is ready.
          </p>
        </div>
      </div>
    </aside>
  )
}
