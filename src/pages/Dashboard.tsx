
import {
  FolderKanban,
  CheckCircle2,
  Clock3,
  Users,
  ArrowUpRight,
} from 'lucide-react'

const stats = [
  {
    title: 'Total Projects',
    value: '12',
    change: '+2 this month',
    icon: FolderKanban,
  },
  {
    title: 'Completed Tasks',
    value: '48',
    change: '+12 this week',
    icon: CheckCircle2,
  },
  {
    title: 'Pending Tasks',
    value: '16',
    change: '5 due soon',
    icon: Clock3,
  },
  {
    title: 'Team Members',
    value: '08',
    change: 'Across 3 teams',
    icon: Users,
  },
]

const projects = [
  { name: 'Website Redesign', status: 'In Progress', progress: 75 },
  { name: 'Mobile Application', status: 'In Progress', progress: 45 },
  { name: 'API Development', status: 'Completed', progress: 100 },
]

export default function Dashboard() {
  return (
    <div className="space-y-8">

      <section>
        <p className="text-sm text-blue-400">
          Tuesday, November 10, 2026
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Welcome back, Developer!
        </h1>

        <p className="mt-2 text-slate-400">
          Here's what's happening with your workspace today.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <div
              key={stat.title}
              className="rounded-xl border border-slate-800 bg-slate-900 p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  {stat.title}
                </p>

                <Icon size={21} className="text-blue-400" />
              </div>

              <h2 className="mt-5 text-3xl font-bold">
                {stat.value}
              </h2>

              <p className="mt-2 text-xs text-emerald-400">
                {stat.change}
              </p>
            </div>
          )
        })}

      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 xl:col-span-2">

          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Active Projects
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Track your team's progress.
              </p>
            </div>

            <button className="flex items-center gap-2 text-sm text-blue-400">
              View all <ArrowUpRight size={16} />
            </button>
          </div>

          <div className="space-y-7">

            {projects.map((project) => (
              <div key={project.name}>

                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {project.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {project.status}
                    </p>
                  </div>

                  <span className="text-sm font-semibold">
                    {project.progress}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>

              </div>
            ))}

          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">

          <h2 className="text-lg font-semibold">
            Quick Overview
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Your workspace is progressing.
          </p>

          <div className="mt-8 rounded-lg bg-slate-800 p-4">
            <p className="text-sm text-slate-400">
              Overall completion
            </p>
            <p className="mt-2 text-3xl font-bold text-blue-400">
              72%
            </p>
          </div>

          <div className="mt-5 rounded-lg bg-slate-800 p-4">
            <p className="text-sm text-slate-400">
              Upcoming deadlines
            </p>
            <p className="mt-2 text-2xl font-bold">
              5
            </p>
          </div>

        </div>

      </section>
    </div>
  )
}
