
import { useEffect, useState, type FormEvent } from 'react'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  CalendarDays,
  ListTodo,
  CheckCircle2,
  Clock3,
  CircleDot,
  AlertCircle,
  Loader2,
  Filter,
  Target,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

type TaskStatus = 'To Do' | 'In Progress' | 'Done'
type Priority = 'Low' | 'Medium' | 'High'

type Task = {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  dueDate: string
}

const columns: TaskStatus[] = ['To Do', 'In Progress', 'Done']

const priorityStyles: Record<Priority, string> = {
  Low: 'border-[#83A9D1]/20 bg-[#83A9D1]/10 text-[#83A9D1]',
  Medium: 'border-[#E6AD58]/20 bg-[#E6AD58]/10 text-[#E6AD58]',
  High: 'border-[#E47770]/20 bg-[#E47770]/10 text-[#E47770]',
}

const columnStyles: Record<
  TaskStatus,
  { color: string; icon: typeof CircleDot }
> = {
  'To Do': {
    color: '#A5A5A2',
    icon: CircleDot,
  },
  'In Progress': {
    color: '#83A9D1',
    icon: Clock3,
  },
  Done: {
    color: '#55B88A',
    icon: CheckCircle2,
  },
}

// LOAD TASKS FROM SUPABASE
async function loadTasksFromSupabase(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((task) => ({
    id: String(task.id),
    title: task.title,
    description: task.description ?? '',
    status: task.status as TaskStatus,
    priority: task.priority as Priority,
    dueDate: task.due_date ?? '',
  }))
}

function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('To Do')
  const [priority, setPriority] = useState<Priority>('Medium')
  const [dueDate, setDueDate] = useState('')

  // INITIAL TASK LOAD
  useEffect(() => {
    let isMounted = true

    const loadTasks = async () => {
      try {
        const taskData = await loadTasksFromSupabase()

        if (isMounted) {
          setTasks(taskData)
          setError('')
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Unable to load tasks.'
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadTasks()

    return () => {
      isMounted = false
    }
  }, [])

  // SEARCH AND FILTER
  const visibleTasks = tasks.filter((task) => {
    const query = search.toLowerCase().trim()

    const matchesSearch =
      `${task.title} ${task.description}`
        .toLowerCase()
        .includes(query)

    const matchesPriority =
      priorityFilter === 'All' || task.priority === priorityFilter

    return matchesSearch && matchesPriority
  })

  // FORM HELPERS
  const openNewForm = () => {
    setEditingId(null)
    setTitle('')
    setDescription('')
    setStatus('To Do')
    setPriority('Medium')
    setDueDate('')
    setError('')
    setShowForm(true)
  }

  const openEditForm = (task: Task) => {
    setEditingId(task.id)
    setTitle(task.title)
    setDescription(task.description)
    setStatus(task.status)
    setPriority(task.priority)
    setDueDate(task.dueDate)
    setError('')
    setShowForm(true)
  }

  const closeForm = () => {
    if (saving) return
    setShowForm(false)
    setEditingId(null)
  }

  // CREATE OR UPDATE TASK
  const saveTask = async (event: FormEvent<HTMLFormElement>) => {
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

      const taskData = {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        due_date: dueDate || null,
      }

      if (editingId) {
        const { error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('tasks')
          .insert({
            ...taskData,
            owner_id: user.id,
          })

        if (error) throw error
      }

      setShowForm(false)
      setEditingId(null)

      const refreshedTasks = await loadTasksFromSupabase()
      setTasks(refreshedTasks)
      setError('')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to save task.'
      )
    } finally {
      setSaving(false)
    }
  }

  // DELETE TASK
  const deleteTask = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return
    }

    setError('')

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) throw error

      setTasks((current) => current.filter((task) => task.id !== id))
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to delete task.'
      )
    }
  }

  // UPDATE TASK STATUS
  const changeStatus = async (id: string, nextStatus: TaskStatus) => {
    setError('')
    setUpdatingId(id)

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: nextStatus })
        .eq('id', id)

      if (error) throw error

      setTasks((current) =>
        current.map((task) =>
          task.id === id
            ? { ...task, status: nextStatus }
            : task
        )
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update task status.'
      )
    } finally {
      setUpdatingId(null)
    }
  }

  // DATE HELPERS
  const formatDate = (date: string) => {
    if (!date) return 'No due date'

    return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const isOverdue = (date: string, taskStatus: TaskStatus) => {
    if (!date || taskStatus === 'Done') return false

    return new Date(`${date}T00:00:00`) <
      new Date(new Date().toDateString())
  }

  // STATISTICS
  const completed = tasks.filter((task) => task.status === 'Done').length

  const inProgress = tasks.filter(
    (task) => task.status === 'In Progress'
  ).length

  const todo = tasks.filter((task) => task.status === 'To Do').length

  const highPriority = tasks.filter(
    (task) => task.priority === 'High' && task.status !== 'Done'
  ).length

  const completionRate = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0

  return (
    <div className="space-y-7">

      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#C47B50]">
            <ListTodo size={14} />
            Workspace / Tasks
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#F2F0ED] sm:text-3xl">
            My Tasks
          </h1>

          <p className="mt-2 text-sm text-[#A5A5A2]">
            Organize your work, manage priorities, and track progress.
          </p>
        </div>

        <button
          onClick={openNewForm}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#C47B50] px-5 py-3 text-sm font-semibold text-[#191B1D] shadow-lg shadow-[#C47B50]/10 transition hover:bg-[#E9B28D]"
        >
          <Plus size={18} />
          Add Task
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-[#E47770]/30 bg-[#E47770]/10 p-4 text-sm text-[#F19A93]">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Tasks"
          value={tasks.length}
          detail="All assigned tasks"
          icon={<ListTodo size={20} />}
          accent="copper"
        />

        <SummaryCard
          title="In Progress"
          value={inProgress}
          detail="Currently being worked on"
          icon={<Clock3 size={20} />}
          accent="blue"
        />

        <SummaryCard
          title="Completed"
          value={completed}
          detail={`${completionRate}% completion rate`}
          icon={<CheckCircle2 size={20} />}
          accent="green"
        />

        <SummaryCard
          title="High Priority"
          value={highPriority}
          detail="Unfinished high-priority tasks"
          icon={<AlertCircle size={20} />}
          accent="red"
        />
      </div>

      {/* PROGRESS OVERVIEW */}
      <div className="rounded-2xl border border-[#3B4145] bg-[#292D30] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-[#C47B50]/20 bg-[#C47B50]/10 p-2.5 text-[#D9956E]">
              <Target size={19} />
            </div>

            <div>
              <h2 className="font-semibold text-[#F2F0ED]">
                Task completion
              </h2>
              <p className="mt-1 text-xs text-[#777D80]">
                Overall progress across your tasks
              </p>
            </div>
          </div>

          <span className="text-2xl font-bold text-[#E9B28D]">
            {completionRate}%
          </span>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#191B1D]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#A95F3C] to-[#E9B28D] transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-5 text-xs text-[#A5A5A2]">
          <span>{todo} To Do</span>
          <span>{inProgress} In Progress</span>
          <span>{completed} Done</span>
        </div>
      </div>

      {/* SEARCH AND FILTER */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#3B4145] bg-[#292D30] p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777D80]"
            size={18}
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tasks by title or description..."
            className="w-full rounded-xl border border-[#3B4145] bg-[#191B1D] py-3 pl-11 pr-4 text-sm text-[#F2F0ED] outline-none transition placeholder:text-[#777D80] focus:border-[#C47B50]"
          />
        </div>

        <div className="relative sm:w-48">
          <Filter
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A5A5A2]"
            size={16}
          />

          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            className="w-full appearance-none rounded-xl border border-[#3B4145] bg-[#191B1D] py-3 pl-10 pr-4 text-sm text-[#F2F0ED] outline-none focus:border-[#C47B50]"
          >
            <option value="All">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* KANBAN BOARD */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#3B4145] bg-[#292D30] px-6 py-16 text-center">
          <Loader2 className="mb-3 animate-spin text-[#C47B50]" size={30} />
          <p className="text-sm font-medium text-[#F2F0ED]">
            Loading tasks...
          </p>
          <p className="mt-1 text-xs text-[#777D80]">
            Connecting to your database
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-3">
          {columns.map((column) => {
            const columnTasks = visibleTasks.filter(
              (task) => task.status === column
            )

            const ColumnIcon = columnStyles[column].icon

            return (
              <section
                key={column}
                className="min-w-0 rounded-2xl border border-[#3B4145] bg-[#292D30] p-4"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ColumnIcon
                      size={18}
                      style={{ color: columnStyles[column].color }}
                    />

                    <h2 className="text-sm font-semibold text-[#F2F0ED]">
                      {column}
                    </h2>

                    <span className="rounded-full bg-[#191B1D] px-2.5 py-1 text-xs font-semibold text-[#A5A5A2]">
                      {columnTasks.length}
                    </span>
                  </div>

                  {column === 'To Do' && (
                    <button
                      onClick={openNewForm}
                      title="Add task"
                      aria-label="Add task"
                      className="rounded-lg p-2 text-[#A5A5A2] transition hover:bg-[#C47B50]/10 hover:text-[#E9B28D]"
                    >
                      <Plus size={17} />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {columnTasks.map((task) => {
                    const overdue = isOverdue(task.dueDate, task.status)

                    return (
                      <article
                        key={task.id}
                        className="rounded-xl border border-[#3B4145] bg-[#202426] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#C47B50]/40"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="min-w-0 break-words text-sm font-semibold leading-5 text-[#F2F0ED]">
                            {task.title}
                          </h3>

                          <div className="flex shrink-0 gap-1">
                            <button
                              onClick={() => openEditForm(task)}
                              aria-label="Edit task"
                              title="Edit task"
                              className="rounded-lg p-1.5 text-[#777D80] transition hover:bg-[#C47B50]/10 hover:text-[#E9B28D]"
                            >
                              <Pencil size={15} />
                            </button>

                            <button
                              onClick={() => deleteTask(task.id)}
                              aria-label="Delete task"
                              title="Delete task"
                              className="rounded-lg p-1.5 text-[#777D80] transition hover:bg-[#E47770]/10 hover:text-[#E47770]"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-[#A5A5A2]">
                          {task.description || 'No description provided.'}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${priorityStyles[task.priority] ?? priorityStyles.Medium}`}
                          >
                            {task.priority} Priority
                          </span>

                          <span
                            className={`flex items-center gap-1.5 text-[11px] ${
                              overdue ? 'text-[#E47770]' : 'text-[#777D80]'
                            }`}
                          >
                            <CalendarDays size={13} />
                            {overdue ? 'Overdue · ' : ''}
                            {formatDate(task.dueDate)}
                          </span>
                        </div>

                        <div className="mt-4 border-t border-[#3B4145] pt-3">
                          <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-[#777D80]">
                            Move task
                          </label>

                          <select
                            value={task.status}
                            disabled={updatingId === task.id}
                            onChange={(event) =>
                              changeStatus(
                                task.id,
                                event.target.value as TaskStatus
                              )
                            }
                            className="w-full rounded-lg border border-[#3B4145] bg-[#191B1D] px-3 py-2.5 text-xs text-[#D0CECA] outline-none focus:border-[#C47B50] disabled:opacity-50"
                          >
                            {columns.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>

                          {updatingId === task.id && (
                            <p className="mt-2 flex items-center gap-2 text-xs text-[#C47B50]">
                              <Loader2 size={12} className="animate-spin" />
                              Updating status...
                            </p>
                          )}
                        </div>
                      </article>
                    )
                  })}

                  {columnTasks.length === 0 && (
                    <div className="rounded-xl border border-dashed border-[#454B4F] bg-[#202426]/50 px-4 py-10 text-center">
                      <ListTodo
                        className="mx-auto mb-3 text-[#777D80]"
                        size={26}
                      />

                      <p className="text-xs font-medium text-[#A5A5A2]">
                        No tasks here yet
                      </p>

                      <p className="mt-1 text-[11px] text-[#777D80]">
                        Tasks will appear here
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm()
          }}
        >
          <div className="my-auto w-full max-w-xl rounded-2xl border border-[#454B4F] bg-[#292D30] p-5 shadow-2xl sm:p-7">

            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#C47B50]">
                  Task Management
                </p>

                <h2 className="text-xl font-bold text-[#F2F0ED]">
                  {editingId ? 'Edit Task' : 'Create New Task'}
                </h2>

                <p className="mt-1 text-sm text-[#A5A5A2]">
                  Add details and set a priority for your task.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close form"
                className="rounded-lg p-2 text-[#A5A5A2] transition hover:bg-[#3B4145] hover:text-white disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveTask} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#E9E5E0]">
                  Task title <span className="text-[#E47770]">*</span>
                </label>

                <input
                  required
                  maxLength={150}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Design user dashboard"
                  className="w-full rounded-xl border border-[#454B4F] bg-[#191B1D] px-4 py-3 text-sm text-[#F2F0ED] outline-none transition placeholder:text-[#777D80] focus:border-[#C47B50]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#E9E5E0]">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe what needs to be done..."
                  rows={3}
                  maxLength={1500}
                  className="w-full resize-none rounded-xl border border-[#454B4F] bg-[#191B1D] px-4 py-3 text-sm text-[#F2F0ED] outline-none transition placeholder:text-[#777D80] focus:border-[#C47B50]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#E9E5E0]">
                    Status
                  </label>

                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as TaskStatus)
                    }
                    className="w-full rounded-xl border border-[#454B4F] bg-[#191B1D] px-3 py-3 text-sm text-[#F2F0ED] outline-none focus:border-[#C47B50]"
                  >
                    {columns.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#E9E5E0]">
                    Priority
                  </label>

                  <select
                    value={priority}
                    onChange={(event) =>
                      setPriority(event.target.value as Priority)
                    }
                    className="w-full rounded-xl border border-[#454B4F] bg-[#191B1D] px-3 py-3 text-sm text-[#F2F0ED] outline-none focus:border-[#C47B50]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#E9E5E0]">
                  Due date
                </label>

                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="w-full rounded-xl border border-[#454B4F] bg-[#191B1D] px-4 py-3 text-sm text-[#F2F0ED] outline-none focus:border-[#C47B50]"
                />
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
                  disabled={saving || !title.trim()}
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
                      {editingId ? 'Save Changes' : 'Create Task'}
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

// SUMMARY CARD
function SummaryCard({
  title,
  value,
  detail,
  icon,
  accent,
}: {
  title: string
  value: number
  detail: string
  icon: React.ReactNode
  accent: 'copper' | 'blue' | 'green' | 'red'
}) {
  const accents = {
    copper: 'border-[#C47B50]/20 bg-[#C47B50]/10 text-[#D9956E]',
    blue: 'border-[#83A9D1]/20 bg-[#83A9D1]/10 text-[#83A9D1]',
    green: 'border-[#55B88A]/20 bg-[#55B88A]/10 text-[#55B88A]',
    red: 'border-[#E47770]/20 bg-[#E47770]/10 text-[#E47770]',
  }

  return (
    <div className="rounded-2xl border border-[#3B4145] bg-[#292D30] p-5 transition hover:border-[#C47B50]/30">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[#A5A5A2]">
            {title}
          </p>

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

export default Tasks
