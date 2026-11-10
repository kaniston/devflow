
import { Outlet } from 'react-router-dom'
import { Bell, Search, Menu } from 'lucide-react'
import Sidebar from '../components/layout/Sidebar'

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <Sidebar />

      <main className="ml-64 min-h-screen">

        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-800 bg-slate-950/90 px-8 backdrop-blur">

          <div className="flex items-center gap-3">
            <Menu className="text-slate-400" size={20} />
            <span className="text-sm text-slate-400">
              Workspace / Overview
            </span>
          </div>

          <div className="flex items-center gap-5">

            <div className="flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2">
              <Search size={17} className="text-slate-400" />
              <input
                placeholder="Search anything..."
                className="w-40 bg-transparent text-sm outline-none placeholder:text-slate-500"
              />
            </div>

            <button aria-label="Notifications">
              <Bell size={20} className="text-slate-400" />
            </button>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-semibold">
              K
            </div>

          </div>
        </header>

        <div className="p-8">
          <Outlet />
        </div>

      </main>
    </div>
  )
}
