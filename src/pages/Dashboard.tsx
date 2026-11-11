
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderKanban,
  CheckCircle2,
  Clock3,
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  Activity,
  CircleDot,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

type Project = {
  id: string | number
  name: string
  status: string
  progress: number
  deadline: string | null
}

type Task = {
  id: string | number
  title: string
  status: string
  priority: string
  due_date: string | null
}

type Issue = {
  id: string | number
  title: string
  status: string
  severity: string
  created_at: string
}

const formatDate = (date: string) => {
  if (!date) return 'No date'
  return new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString(
    'en-IN',
    { day: 'numeric', month: 'short', year: 'numeric' }
  )
}

const getStatusStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'done':
    case 'resolved':
      return 'bg-[#55B88A]/10 text-[#55B88A] border-[#55B88A]/20'
    case 'in progress':
      return 'bg-[#83A9D1]/10 text-[#83A9D1] border-[#83A9D1]/20'
    case 'planning':
    case 'to do':
    case 'open':
      return 'bg-[#E6AD58]/10 text-[#E6AD58] border-[#E6AD58]/20'
    default:
      return 'bg-[#777D80]/10 text-[#A5A5A2] border-[#777D80]/20'
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high':
    case 'critical':
      return 'text-[#E47770]'
    case 'medium':
      return 'text-[#E6AD58]'
    default:
      return 'text-[#55B88A]'
  }
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const fetchDashboard = async () => {
      setLoading(true)
      setError('')

      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser()

        if (authError) throw authError

        if (!authData.user) {
          if (active) setLoading(false)
          return
        }

        const [projectResult, taskResult, issueResult] =
          await Promise.all([
            supabase
              .from('projects')
              .select('id, name, status, progress, deadline')
              .order('created_at', { ascending: false }),

            supabase
              .from('tasks')
              .select('id, title, status, priority, due_date')
              .order('created_at', { ascending: false }),

            supabase
              .from('issues')
              .select('id, title, status, severity, created_at')
              .order('created_at', { ascending: false }),
          ])

        if (!active) return

        if (projectResult.error) {
          console.error('Projects dashboard error:', projectResult.error)
        }

        if (taskResult.error) {
          console.error('Tasks dashboard error:', taskResult.error)
        }

        if (issueResult.error) {
          console.error('Issues dashboard error:', issueResult.error)
        }

        setProjects((projectResult.data ?? []) as Project[])
        setTasks((taskResult.data ?? []) as Task[])
        setIssues((issueResult.data ?? []) as Issue[])

        if (
          projectResult.error ||
          taskResult.error ||
          issueResult.error
        ) {
          setError(
            'Some dashboard information could not be loaded. Check your Supabase table permissions.'
          )
        }
      } catch (err) {
        console.error('Dashboard loading error:', err)

        if (active) {
          setError('Unable to load dashboard data. Please try again.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchDashboard()

    return () => {
      active = false
    }
  }, [])

  const completedTasks = tasks.filter(
    (task) => task.status.toLowerCase() === 'done'
  ).length

  const openTasks = tasks.filter(
    (task) => task.status.toLowerCase() !== 'done'
  ).length

  const unresolvedIssues = issues.filter(
    (issue) => issue.status.toLowerCase() !== 'resolved'
  ).length

  const activeProjects = projects.filter(
    (project) =>
      project.status.toLowerCase() === 'in progress'
  )

  const averageProgress =
    projects.length > 0
      ? Math.round(
          projects.reduce(
            (total, project) =>
              total + Math.min(100, Math.max(0, Number(project.progress) || 0)),
            0
          ) / projects.length
        )
      : 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const nextWeek = new Date(today)
  nextWeek.setDate(today.getDate() + 7)

  const upcomingDeadlines = tasks.filter((task) => {
    if (!task.due_date || task.status.toLowerCase() === 'done') {
      return false
    }

    const dueDate = new Date(`${task.due_date.slice(0, 10)}T00:00:00`)

    return dueDate >= today && dueDate <= nextWeek
  }).length

  const taskStatuses = [
    {
      label: 'To Do',
      count: tasks.filter(
        (task) => task.status.toLowerCase() === 'to do'
      ).length,
      color: '#E6AD58',
    },
    {
      label: 'In Progress',
      count: tasks.filter(
        (task) => task.status.toLowerCase() === 'in progress'
      ).length,
      color: '#83A9D1',
    },
    {
      label: 'Done',
      count: completedTasks,
      color: '#55B88A',
    },
  ]

  const stats = [
    {
      title: 'Total Projects',
      value: projects.length,
      note: `${activeProjects.length} currently active`,
      icon: FolderKanban,
      color: '#C47B50',
      background: 'rgba(196, 123, 80, 0.12)',
    },
    {
      title: 'Completed Tasks',
      value: completedTasks,
      note: `Out of ${tasks.length} total tasks`,
      icon: CheckCircle2,
      color: '#55B88A',
      background: 'rgba(85, 184, 138, 0.12)',
    },
    {
      title: 'Open Tasks',
      value: openTasks,
      note: `${upcomingDeadlines} due in the next 7 days`,
      icon: Clock3,
      color: '#E6AD58',
      background: 'rgba(230, 173, 88, 0.12)',
    },
    {
      title: 'Unresolved Issues',
      value: unresolvedIssues,
      note: `${issues.length} total reported`,
      icon: AlertCircle,
      color: '#E47770',
      background: 'rgba(228, 119, 112, 0.12)',
    },
  ]

  return (
    <div className="space-y-7">

      {/* PAGE INTRODUCTION */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#55B88A]" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A5A5A2]">
              Workspace overview
            </p>
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome back, Developer!
          </h1>

          <p className="mt-2 text-sm text-[#A5A5A2]">
            Here's what's happening across your projects today.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#A5A5A2]">
          <CalendarDays size={15} className="text-[#C47B50]" />
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </section>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-[#E47770]/30 bg-[#E47770]/10 p-4 text-sm text-[#E47770]">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* STATISTICS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <div
              key={stat.title}
              className="rounded-xl border border-[#3B4145] bg-[#292D30] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#C47B50]/50"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-[#A5A5A2]">
                  {stat.title}
                </p>

                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: stat.background }}
                >
                  <Icon size={19} style={{ color: stat.color }} />
                </div>
              </div>

              <div className="mt-5">
                <h2 className="text-3xl font-bold tracking-tight text-[#F2F0ED]">
                  {loading ? '—' : stat.value}
                </h2>

                <p className="mt-2 text-[11px] text-[#777D80]">
                  {loading ? 'Loading data...' : stat.note}
                </p>
              </div>
            </div>
          )
        })}
      </section>

      {/* PROJECTS AND WORKSPACE SUMMARY */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">

        {/* PROJECT PROGRESS */}
        <div className="rounded-xl border border-[#3B4145] bg-[#292D30] p-5 sm:p-6 xl:col-span-2">

          <div className="mb-7 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FolderKanban size={17} className="text-[#C47B50]" />
                <h2 className="text-base font-semibold">
                  Project Progress
                </h2>
              </div>

              <p className="mt-1.5 text-xs text-[#777D80]">
                Monitor progress across your projects.
              </p>
            </div>

            <Link
              to="/projects"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#E9B28D] transition hover:bg-[#C47B50]/10"
            >
              View all
              <ArrowUpRight size={15} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((item) => (
                <div key={item} className="animate-pulse">
                  <div className="mb-3 h-3 w-1/3 rounded bg-[#3B4145]" />
                  <div className="h-2 rounded-full bg-[#3B4145]" />
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#454B4F] px-4 py-10 text-center">
              <FolderKanban
                size={28}
                className="mx-auto text-[#777D80]"
              />
              <p className="mt-3 text-sm font-medium text-[#F2F0ED]">
                No projects yet
              </p>
              <p className="mt-1 text-xs text-[#777D80]">
                Create your first project to see progress here.
              </p>
              <Link
                to="/projects"
                className="mt-4 inline-flex rounded-lg bg-[#C47B50] px-4 py-2 text-xs font-semibold text-[#191B1D] hover:bg-[#D18A5F]"
              >
                Create a project
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {projects.slice(0, 5).map((project) => {
                const progress = Math.min(
                  100,
                  Math.max(0, Number(project.progress) || 0)
                )

                return (
                  <div key={project.id}>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#F2F0ED]">
                          {project.name}
                        </p>

                        <span
                          className={`mt-1 inline-flex rounded-md border px-2 py-0.5 text-[10px] font-medium ${getStatusStyle(project.status)}`}
                        >
                          {project.status}
                        </span>
                      </div>

                      <span className="text-sm font-semibold tabular-nums text-[#E9B28D]">
                        {progress}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-[#191B1D]">
                      <div
                        className="h-full rounded-full bg-[#C47B50] transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-[#777D80]">
                        {project.deadline
                          ? `Deadline: ${formatDate(project.deadline)}`
                          : 'No deadline set'}
                      </span>

                      <Link
                        to="/projects"
                        className="text-[10px] text-[#A5A5A2] hover:text-[#E9B28D]"
                      >
                        View project
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* WORKSPACE OVERVIEW */}
        <div className="rounded-xl border border-[#3B4145] bg-[#292D30] p-5 sm:p-6">

          <div className="flex items-center gap-2">
            <Activity size={17} className="text-[#C47B50]" />
            <h2 className="text-base font-semibold">
              Workspace Overview
            </h2>
          </div>

          <p className="mt-1.5 text-xs text-[#777D80]">
            Your overall project completion.
          </p>

          <div className="mt-7 flex flex-col items-center">
            <div className="relative flex h-40 w-40 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#C47B50 ${averageProgress * 3.6}deg, #454B4F 0deg)`,
              }}
            >
              <div className="flex h-[132px] w-[132px] flex-col items-center justify-center rounded-full bg-[#292D30]">
                <span className="text-3xl font-bold text-[#E9B28D]">
                  {loading ? '—' : `${averageProgress}%`}
                </span>
                <span className="mt-1 text-[10px] text-[#777D80]">
                  Average progress
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-[#A5A5A2]">
                <span className="h-2 w-2 rounded-full bg-[#C47B50]" />
                Total projects
              </span>
              <span className="text-sm font-semibold">
                {loading ? '—' : projects.length}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-[#A5A5A2]">
                <span className="h-2 w-2 rounded-full bg-[#55B88A]" />
                Completed tasks
              </span>
              <span className="text-sm font-semibold">
                {loading ? '—' : completedTasks}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-[#A5A5A2]">
                <span className="h-2 w-2 rounded-full bg-[#E6AD58]" />
                Upcoming deadlines
              </span>
              <span className="text-sm font-semibold">
                {loading ? '—' : upcomingDeadlines}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* TASK STATUS AND RECENT ISSUES */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        {/* TASK BREAKDOWN */}
        <div className="rounded-xl border border-[#3B4145] bg-[#292D30] p-5 sm:p-6">

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-[#C47B50]" />
                <h2 className="text-base font-semibold">
                  Task Overview
                </h2>
              </div>
              <p className="mt-1.5 text-xs text-[#777D80]">
                Your current task distribution.
              </p>
            </div>

            <Link
              to="/tasks"
              className="text-xs font-semibold text-[#E9B28D] hover:text-[#C47B50]"
            >
              View tasks →
            </Link>
          </div>

          <div className="mt-7">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold">
                  {loading ? '—' : tasks.length}
                </p>
                <p className="mt-1 text-xs text-[#777D80]">
                  Total tasks
                </p>
              </div>

              <p className="text-xs text-[#A5A5A2]">
                {loading ? 'Loading...' : `${completedTasks} completed`}
              </p>
            </div>

            <div className="mt-5 flex h-2 overflow-hidden rounded-full bg-[#191B1D]">
              {taskStatuses.map((status) => {
                const percentage =
                  tasks.length > 0
                    ? (status.count / tasks.length) * 100
                    : 0

                return (
                  <div
                    key={status.label}
                    style={{
                      width: loading ? '0%' : `${percentage}%`,
                      backgroundColor: status.color,
                    }}
                  />
                )
              })}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {taskStatuses.map((status) => (
                <div key={status.label}>
                  <p className="text-lg font-bold">
                    {loading ? '—' : status.count}
                  </p>
                  <p className="mt-1 text-[10px] text-[#777D80]">
                    {status.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RECENT ISSUES */}
        <div className="rounded-xl border border-[#3B4145] bg-[#292D30] p-5 sm:p-6">

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CircleDot size={17} className="text-[#E47770]" />
                <h2 className="text-base font-semibold">
                  Recent Issues
                </h2>
              </div>
              <p className="mt-1.5 text-xs text-[#777D80]">
                Latest reported issues in your workspace.
              </p>
            </div>

            <Link
              to="/issues"
              className="text-xs font-semibold text-[#E9B28D] hover:text-[#C47B50]"
            >
              View all →
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              <p className="py-6 text-center text-xs text-[#777D80]">
                Loading issues...
              </p>
            ) : issues.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#454B4F] py-8 text-center">
                <CheckCircle2
                  size={25}
                  className="mx-auto text-[#55B88A]"
                />
                <p className="mt-2 text-sm font-medium">
                  No issues reported
                </p>
                <p className="mt-1 text-xs text-[#777D80]">
                  Your issue tracker is clear.
                </p>
              </div>
            ) : (
              issues.slice(0, 4).map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[#3B4145] bg-[#32373A]/60 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[#F2F0ED]">
                      {issue.title}
                    </p>

                    <p className={`mt-1 text-[10px] font-medium ${getPriorityColor(issue.severity)}`}>
                      {issue.severity} priority
                      <span className="mx-1.5 text-[#777D80]">•</span>
                      {formatDate(issue.created_at)}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-medium ${getStatusStyle(issue.status)}`}
                  >
                    {issue.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <div className="flex flex-col items-center justify-between gap-2 border-t border-[#3B4145] pt-5 text-[10px] text-[#777D80] sm:flex-row">
        <p>DevFlow · Developer Workspace</p>
        <p>Project data powered by Supabase</p>
      </div>

    </div>
  )
}
