
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Plus,
  Search,
  FolderKanban,
  CalendarDays,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  Clock3,
  CircleDot,
  ArrowUpRight,
  Filter,
  Target,
  Loader2,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

type Project = {
  id: string
  name: string
  description: string
  status: 'Planning' | 'In Progress' | 'Completed'
  deadline: string
  progress: number
}

const statusStyles = {
  Planning: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  'In Progress': 'border-blue-400/20 bg-blue-400/10 text-blue-300',
  Completed: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-400',
}

// LOAD PROJECTS FROM SUPABASE
async function loadProjectsFromSupabase(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []) as Project[]
}

function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [status, setStatus] = useState<Project['status']>('Planning')
  const [progress, setProgress] = useState(0)

  // INITIAL DATA LOAD
  useEffect(() => {
    let isMounted = true

    const loadProjects = async () => {
      try {
        const projectData = await loadProjectsFromSupabase()

        if (isMounted) {
          setProjects(projectData)
          setError('')
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Unable to load projects.'
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadProjects()

    return () => {
      isMounted = false
    }
  }, [])

  // SEARCH AND FILTER
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const query = search.toLowerCase().trim()

      const matchesSearch =
        project.name.toLowerCase().includes(query) ||
        (project.description ?? '').toLowerCase().includes(query)

      const matchesFilter =
        filter === 'All' || project.status === filter

      return matchesSearch && matchesFilter
    })
  }, [projects, search, filter])

  // FORM HELPERS
  const openNewForm = () => {
    setEditingId(null)
    setName('')
    setDescription('')
    setDeadline('')
    setStatus('Planning')
    setProgress(0)
    setError('')
    setShowForm(true)
  }

  const openEditForm = (project: Project) => {
    setEditingId(project.id)
    setName(project.name)
    setDescription(project.description ?? '')
    setDeadline(project.deadline ?? '')
    setStatus(project.status)
    setProgress(project.progress ?? 0)
    setError('')
    setShowForm(true)
  }

  const closeForm = () => {
    if (saving) return
    setShowForm(false)
    setEditingId(null)
  }

  // CREATE OR UPDATE PROJECT
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setSaving(true)
    setError('')

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!user) throw new Error('Please log in again.')

      const projectData = {
        name: name.trim(),
        description: description.trim(),
        deadline: deadline || null,
        status,
        progress: status === 'Completed' ? 100 : progress,
      }

      if (editingId) {
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('projects')
          .insert({
            ...projectData,
            owner_id: user.id,
          })

        if (error) throw error
      }

      setShowForm(false)
      setEditingId(null)

      const refreshedProjects = await loadProjectsFromSupabase()
      setProjects(refreshedProjects)
      setError('')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to save project.'
      )
    } finally {
      setSaving(false)
    }
  }

  // DELETE PROJECT
  const deleteProject = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return
    }

    setError('')

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw error

      const refreshedProjects = await loadProjectsFromSupabase()
      setProjects(refreshedProjects)
      setError('')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to delete project.'
      )
    }
  }

  // PROJECT STATISTICS
  const completed = projects.filter(
    (project) => project.status === 'Completed'
  ).length

  const active = projects.filter(
    (project) => project.status === 'In Progress'
  ).length

  const planning = projects.filter(
    (project) => project.status === 'Planning'
  ).length

  const averageProgress = projects.length
    ? Math.round(
        projects.reduce(
          (total, project) => total + (project.progress ?? 0),
          0
        ) / projects.length
      )
    : 0

  const formatDeadline = (date: string | null) => {
    if (!date) return 'No deadline'

    return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const isOverdue = (date: string | null, projectStatus: string) => {
    if (!date || projectStatus === 'Completed') return false

    return new Date(`${date}T00:00:00`) < new Date(new Date().toDateString())
  }

  return (
    <div className="space-y-7">

      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#C47B50]">
            <FolderKanban size={14} />
            Workspace / Projects
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#F2F0ED] sm:text-3xl">
            Projects
          </h1>

          <p className="mt-2 text-sm text-[#A5A5A2]">
            Plan, organize, and track your development work.
          </p>
        </div>

        <button
          onClick={openNewForm}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#C47B50] px-5 py-3 text-sm font-semibold text-[#191B1D] shadow-lg shadow-[#C47B50]/10 transition hover:bg-[#E9B28D]"
        >
          <Plus size={18} />
          New Project
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-[#E47770]/30 bg-[#E47770]/10 p-4 text-sm text-[#F19A93]">
          <CircleDot size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* STATISTICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Projects"
          value={projects.length}
          icon={<FolderKanban size={20} />}
          detail="All your projects"
          accent="copper"
        />

        <SummaryCard
          title="In Progress"
          value={active}
          icon={<Clock3 size={20} />}
          detail="Currently active"
          accent="blue"
        />

        <SummaryCard
          title="Completed"
          value={completed}
          icon={<CheckCircle2 size={20} />}
          detail="Successfully finished"
          accent="green"
        />

        <SummaryCard
          title="Average Progress"
          value={`${averageProgress}%`}
          icon={<Target size={20} />}
          detail={`${planning} projects in planning`}
          accent="purple"
        />
      </div>

      {/* SEARCH AND FILTER */}
      <div className="rounded-2xl border border-[#3B4145] bg-[#292D30] p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777D80]"
              size={18}
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects by name or description..."
              className="w-full rounded-xl border border-[#3B4145] bg-[#191B1D] py-3 pl-11 pr-4 text-sm text-[#F2F0ED] outline-none transition placeholder:text-[#777D80] focus:border-[#C47B50]"
            />
          </div>

          <div className="relative md:w-52">
            <Filter
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A5A5A2]"
              size={16}
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-[#3B4145] bg-[#191B1D] py-3 pl-10 pr-4 text-sm text-[#F2F0ED] outline-none focus:border-[#C47B50]"
            >
              <option value="All">All Projects</option>
              <option value="Planning">Planning</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-[#777D80]">
          <span>
            Showing {filteredProjects.length} of {projects.length} projects
          </span>
          <span>{filter === 'All' ? 'All statuses' : filter}</span>
        </div>
      </div>

      {/* PROJECT LIST */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#3B4145] bg-[#292D30] px-6 py-16 text-center">
          <Loader2 className="mb-3 animate-spin text-[#C47B50]" size={30} />
          <p className="text-sm font-medium text-[#F2F0ED]">
            Loading projects...
          </p>
          <p className="mt-1 text-xs text-[#777D80]">
            Connecting to your workspace database
          </p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#4A5054] bg-[#292D30] px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#C47B50]/20 bg-[#C47B50]/10 text-[#C47B50]">
            <FolderKanban size={30} />
          </div>

          <h3 className="text-lg font-semibold text-[#F2F0ED]">
            {projects.length === 0
              ? 'Your workspace is ready'
              : 'No matching projects'}
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-sm text-[#A5A5A2]">
            {projects.length === 0
              ? 'Create your first project and start organizing your development work.'
              : 'Try changing your search or status filter.'}
          </p>

          {projects.length === 0 && (
            <button
              onClick={openNewForm}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#C47B50] px-5 py-3 text-sm font-semibold text-[#191B1D] transition hover:bg-[#E9B28D]"
            >
              <Plus size={17} />
              Create your first project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {filteredProjects.map((project) => {
            const safeProgress = Math.min(
              100,
              Math.max(0, project.progress ?? 0)
            )

            const overdue = isOverdue(project.deadline, project.status)

            return (
              <div
                key={project.id}
                className="group rounded-2xl border border-[#3B4145] bg-[#292D30] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#C47B50]/50 hover:bg-[#303538]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#C47B50]/20 bg-[#C47B50]/10 text-[#D9956E]">
                      <FolderKanban size={20} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-[#F2F0ED]">
                        {project.name}
                      </h3>

                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[#A5A5A2]">
                        {project.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => openEditForm(project)}
                      aria-label="Edit project"
                      title="Edit project"
                      className="rounded-lg p-2 text-[#A5A5A2] transition hover:bg-[#C47B50]/10 hover:text-[#E9B28D]"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={() => deleteProject(project.id)}
                      aria-label="Delete project"
                      title="Delete project"
                      className="rounded-lg p-2 text-[#A5A5A2] transition hover:bg-[#E47770]/10 hover:text-[#E47770]"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium ${statusStyles[project.status] ?? statusStyles.Planning}`}
                  >
                    {project.status}
                  </span>

                  <span
                    className={`flex items-center gap-1.5 text-xs ${
                      overdue ? 'text-[#E47770]' : 'text-[#A5A5A2]'
                    }`}
                  >
                    <CalendarDays size={14} />
                    {overdue ? 'Overdue · ' : ''}
                    {formatDeadline(project.deadline)}
                  </span>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-[#A5A5A2]">
                      Project progress
                    </span>

                    <span className="text-sm font-semibold tabular-nums text-[#E9B28D]">
                      {safeProgress}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-[#191B1D]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#A95F3C] to-[#E9B28D] transition-all duration-500"
                      style={{ width: `${safeProgress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#3B4145] pt-4">
                  <span className="text-xs text-[#777D80]">
                    {safeProgress === 100
                      ? 'Project finished'
                      : safeProgress === 0
                        ? 'Not started'
                        : 'Work in progress'}
                  </span>

                  <span className="flex items-center gap-1 text-xs font-medium text-[#C47B50]">
                    View project
                    <ArrowUpRight size={14} />
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeForm()
          }}
        >
          <div className="my-auto w-full max-w-xl rounded-2xl border border-[#454B4F] bg-[#292D30] p-5 shadow-2xl sm:p-7">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#C47B50]">
                  Project Management
                </p>

                <h2 className="text-xl font-bold text-[#F2F0ED]">
                  {editingId ? 'Edit Project' : 'Create New Project'}
                </h2>

                <p className="mt-1 text-sm text-[#A5A5A2]">
                  {editingId
                    ? 'Update your project details.'
                    : 'Add a new project to your workspace.'}
                </p>
              </div>

              <button
                onClick={closeForm}
                disabled={saving}
                aria-label="Close form"
                className="rounded-lg p-2 text-[#A5A5A2] transition hover:bg-[#3B4145] hover:text-white disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#E9E5E0]">
                  Project name <span className="text-[#E47770]">*</span>
                </label>

                <input
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Website Redesign"
                  className="w-full rounded-xl border border-[#454B4F] bg-[#191B1D] px-4 py-3 text-sm text-[#F2F0ED] outline-none transition placeholder:text-[#777D80] focus:border-[#C47B50]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#E9E5E0]">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the purpose and goals of this project..."
                  rows={3}
                  maxLength={1000}
                  className="w-full resize-none rounded-xl border border-[#454B4F] bg-[#191B1D] px-4 py-3 text-sm text-[#F2F0ED] outline-none transition placeholder:text-[#777D80] focus:border-[#C47B50]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#E9E5E0]">
                    Deadline
                  </label>

                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full rounded-xl border border-[#454B4F] bg-[#191B1D] px-3 py-3 text-sm text-[#F2F0ED] outline-none focus:border-[#C47B50]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#E9E5E0]">
                    Project status
                  </label>

                  <select
                    value={status}
                    onChange={(e) => {
                      const nextStatus = e.target.value as Project['status']
                      setStatus(nextStatus)

                      if (nextStatus === 'Completed') {
                        setProgress(100)
                      } else if (status === 'Completed') {
                        setProgress(0)
                      }
                    }}
                    className="w-full rounded-xl border border-[#454B4F] bg-[#191B1D] px-3 py-3 text-sm text-[#F2F0ED] outline-none focus:border-[#C47B50]"
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-[#3B4145] bg-[#191B1D] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-medium text-[#E9E5E0]">
                    Project progress
                  </label>

                  <span className="rounded-lg bg-[#C47B50]/10 px-3 py-1 text-sm font-bold text-[#E9B28D]">
                    {status === 'Completed' ? 100 : progress}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={status === 'Completed' ? 100 : progress}
                  disabled={status === 'Completed'}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full cursor-pointer accent-[#C47B50] disabled:cursor-not-allowed"
                />

                <div className="mt-2 flex justify-between text-xs text-[#777D80]">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {error && (
                <p className="rounded-lg border border-[#E47770]/30 bg-[#E47770]/10 p-3 text-sm text-[#F19A93]">
                  {error}
                </p>
              )}

              <div className="flex flex-col-reverse justify-end gap-3 border-t border-[#3B4145] pt-5 sm:flex-row">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-[#454B4F] px-5 py-3 text-sm font-medium text-[#D0CECA] transition hover:bg-[#3B4145] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#C47B50] px-6 py-3 text-sm font-semibold text-[#191B1D] transition hover:bg-[#E9B28D] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      {editingId ? 'Save Changes' : 'Create Project'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  title,
  value,
  icon,
  detail,
  accent,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  detail: string
  accent: 'copper' | 'blue' | 'green' | 'purple'
}) {
  const accents = {
    copper: 'border-[#C47B50]/20 bg-[#C47B50]/10 text-[#D9956E]',
    blue: 'border-[#83A9D1]/20 bg-[#83A9D1]/10 text-[#83A9D1]',
    green: 'border-[#55B88A]/20 bg-[#55B88A]/10 text-[#55B88A]',
    purple: 'border-[#B49AD8]/20 bg-[#B49AD8]/10 text-[#B49AD8]',
  }

  return (
    <div className="rounded-2xl border border-[#3B4145] bg-[#292D30] p-5 transition hover:border-[#C47B50]/30">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[#A5A5A2]">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-[#F2F0ED]">
            {value}
          </p>
        </div>

        <div className={`rounded-xl border p-3 ${accents[accent]}`}>
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs text-[#777D80]">{detail}</p>
    </div>
  )
}

export default Projects
