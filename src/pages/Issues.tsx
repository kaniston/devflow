
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Bug,
  AlertCircle,
  CheckCircle2,
  Clock3,
  ShieldAlert,
  Loader2,
  Filter,
  CalendarDays,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

type IssueStatus = 'Open' | 'In Progress' | 'Resolved'
type Severity = 'Low' | 'Medium' | 'High' | 'Critical'

type Issue = {
  id: string
  title: string
  description: string
  severity: Severity
  status: IssueStatus
  reportedDate: string
}

const issueStatuses: IssueStatus[] = [
  'Open',
  'In Progress',
  'Resolved',
]

const severityStyles: Record<Severity, string> = {
  Low: 'border-[#83A9D1]/20 bg-[#83A9D1]/10 text-[#83A9D1]',
  Medium: 'border-[#E6AD58]/20 bg-[#E6AD58]/10 text-[#E6AD58]',
  High: 'border-[#E49A62]/20 bg-[#E49A62]/10 text-[#E49A62]',
  Critical: 'border-[#E47770]/20 bg-[#E47770]/10 text-[#E47770]',
}

const statusStyles: Record<IssueStatus, string> = {
  Open: 'border-[#E47770]/20 bg-[#E47770]/10 text-[#E47770]',
  'In Progress': 'border-[#83A9D1]/20 bg-[#83A9D1]/10 text-[#83A9D1]',
  Resolved: 'border-[#55B88A]/20 bg-[#55B88A]/10 text-[#55B88A]',
}

// LOAD ISSUES FROM SUPABASE
async function loadIssuesFromSupabase(): Promise<Issue[]> {
  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((issue) => ({
    id: String(issue.id),
    title: issue.title,
    description: issue.description ?? '',
    severity: issue.severity as Severity,
    status: issue.status as IssueStatus,
    reportedDate: issue.created_at
      ? issue.created_at.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  }))
}

function Issues() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [severityFilter, setSeverityFilter] = useState('All')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<Severity>('Medium')
  const [status, setStatus] = useState<IssueStatus>('Open')

  // INITIAL DATA LOAD
  useEffect(() => {
    let isMounted = true

    const loadIssues = async () => {
      try {
        const formattedIssues = await loadIssuesFromSupabase()

        if (isMounted) {
          setIssues(formattedIssues)
          setError('')
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Unable to load issues.'
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadIssues()

    return () => {
      isMounted = false
    }
  }, [])

  // SEARCH AND FILTER
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const query = search.toLowerCase()

      const matchesSearch =
        issue.title.toLowerCase().includes(query) ||
        issue.description.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'All' || issue.status === statusFilter

      const matchesSeverity =
        severityFilter === 'All' || issue.severity === severityFilter

      return matchesSearch && matchesStatus && matchesSeverity
    })
  }, [issues, search, statusFilter, severityFilter])

  // FORM HELPERS
  const openNewForm = () => {
    setEditingId(null)
    setTitle('')
    setDescription('')
    setSeverity('Medium')
    setStatus('Open')
    setError('')
    setShowForm(true)
  }

  const openEditForm = (issue: Issue) => {
    setEditingId(issue.id)
    setTitle(issue.title)
    setDescription(issue.description)
    setSeverity(issue.severity)
    setStatus(issue.status)
    setError('')
    setShowForm(true)
  }

  const closeForm = () => {
    if (saving) return
    setShowForm(false)
    setEditingId(null)
  }

  // CREATE OR UPDATE ISSUE
  const saveIssue = async (event: FormEvent<HTMLFormElement>) => {
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

      const issueData = {
        title: title.trim(),
        description: description.trim(),
        severity,
        status,
      }

      if (editingId) {
        const { error } = await supabase
          .from('issues')
          .update(issueData)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('issues')
          .insert({
            ...issueData,
            owner_id: user.id,
          })

        if (error) throw error
      }

      setShowForm(false)
      setEditingId(null)

      const refreshedIssues = await loadIssuesFromSupabase()
      setIssues(refreshedIssues)
      setError('')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to save issue.'
      )
    } finally {
      setSaving(false)
    }
  }

  // DELETE ISSUE
  const deleteIssue = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this issue?')) {
      return
    }

    setError('')

    try {
      const { error } = await supabase
        .from('issues')
        .delete()
        .eq('id', id)

      if (error) throw error

      const refreshedIssues = await loadIssuesFromSupabase()
      setIssues(refreshedIssues)
      setError('')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to delete issue.'
      )
    }
  }

  // UPDATE ISSUE STATUS
  const changeStatus = async (id: string, nextStatus: IssueStatus) => {
    setError('')

    try {
      const { error } = await supabase
        .from('issues')
        .update({ status: nextStatus })
        .eq('id', id)

      if (error) throw error

      setIssues((current) =>
        current.map((issue) =>
          issue.id === id
            ? { ...issue, status: nextStatus }
            : issue
        )
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update issue status.'
      )
    }
  }

  // STATISTICS
  const openCount = issues.filter(
    (issue) => issue.status === 'Open'
  ).length

  const progressCount = issues.filter(
    (issue) => issue.status === 'In Progress'
  ).length

  const resolvedCount = issues.filter(
    (issue) => issue.status === 'Resolved'
  ).length

  const criticalCount = issues.filter(
    (issue) =>
      issue.severity === 'Critical' && issue.status !== 'Resolved'
  ).length

  const resolutionRate = issues.length
    ? Math.round((resolvedCount / issues.length) * 100)
    : 0

  const formatDate = (date: string) => {
    return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-7">

      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#C47B50]">
            <Bug size={14} />
            Workspace / Issue Tracker
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#F2F0ED] sm:text-3xl">
            Issue Tracker
          </h1>

          <p className="mt-2 text-sm text-[#A5A5A2]">
            Report, prioritize, and resolve project issues.
          </p>
        </div>

        <button
          onClick={openNewForm}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#C47B50] px-5 py-3 text-sm font-semibold text-[#191B1D] shadow-lg shadow-[#C47B50]/10 transition hover:bg-[#E9B28D]"
        >
          <Plus size={18} />
          Report Issue
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-[#E47770]/30 bg-[#E47770]/10 p-4 text-sm text-[#F19A93]">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* STATISTICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Issues"
          value={issues.length}
          detail="All reported issues"
          icon={<Bug size={20} />}
          accent="copper"
        />

        <SummaryCard
          title="Open"
          value={openCount}
          detail="Waiting for attention"
          icon={<AlertCircle size={20} />}
          accent="red"
        />

        <SummaryCard
          title="In Progress"
          value={progressCount}
          detail="Currently being addressed"
          icon={<Clock3 size={20} />}
          accent="blue"
        />

        <SummaryCard
          title="Resolved"
          value={resolvedCount}
          detail={`${resolutionRate}% resolution rate`}
          icon={<CheckCircle2 size={20} />}
          accent="green"
        />
      </div>

      {/* CRITICAL ISSUES PANEL */}
      <div className="rounded-2xl border border-[#E47770]/25 bg-[#E47770]/[0.07] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-[#E47770]/20 bg-[#E47770]/10 p-3 text-[#E47770]">
              <ShieldAlert size={22} />
            </div>

            <div>
              <h2 className="font-semibold text-[#F2F0ED]">
                Critical issues requiring attention
              </h2>

              <p className="mt-1 text-sm text-[#A5A5A2]">
                Review unresolved critical issues and prioritize their resolution.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:pl-4">
            <span className="text-3xl font-bold tabular-nums text-[#E47770]">
              {criticalCount}
            </span>

            <span className="text-xs text-[#A5A5A2]">
              {criticalCount === 1 ? 'Critical issue' : 'Critical issues'}
            </span>
          </div>
        </div>
      </div>

      {/* RESOLUTION PROGRESS */}
      <div className="rounded-2xl border border-[#3B4145] bg-[#292D30] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-[#F2F0ED]">
              Issue resolution progress
            </h2>

            <p className="mt-1 text-xs text-[#777D80]">
              Percentage of reported issues resolved
            </p>
          </div>

          <span className="text-2xl font-bold text-[#55B88A]">
            {resolutionRate}%
          </span>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#191B1D]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#348D66] to-[#55B88A] transition-all duration-500"
            style={{ width: `${resolutionRate}%` }}
          />
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="rounded-2xl border border-[#3B4145] bg-[#292D30] p-4">
        <div className="flex flex-col gap-3 xl:flex-row">
          <div className="relative flex-1">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777D80]"
              size={18}
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search issues by title or description..."
              className="w-full rounded-xl border border-[#3B4145] bg-[#191B1D] py-3 pl-11 pr-4 text-sm text-[#F2F0ED] outline-none transition placeholder:text-[#777D80] focus:border-[#C47B50]"
            />
          </div>

          <div className="relative xl:w-48">
            <Filter
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A5A5A2]"
              size={16}
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full appearance-none rounded-xl border border-[#3B4145] bg-[#191B1D] py-3 pl-10 pr-4 text-sm text-[#F2F0ED] outline-none focus:border-[#C47B50]"
            >
              <option value="All">All Statuses</option>
              {issueStatuses.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="relative xl:w-48">
            <Filter
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A5A5A2]"
              size={16}
            />

            <select
              value={severityFilter}
              onChange={(event) => setSeverityFilter(event.target.value)}
              className="w-full appearance-none rounded-xl border border-[#3B4145] bg-[#191B1D] py-3 pl-10 pr-4 text-sm text-[#F2F0ED] outline-none focus:border-[#C47B50]"
            >
              <option value="All">All Severities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        <p className="mt-3 text-xs text-[#777D80]">
          Showing {filteredIssues.length} of {issues.length} issues
        </p>
      </div>

      {/* ISSUE TRACKER LIST */}
      <div className="overflow-hidden rounded-2xl border border-[#3B4145] bg-[#292D30]">
        <div className="border-b border-[#3B4145] px-5 py-4">
          <h2 className="font-semibold text-[#F2F0ED]">
            Reported Issues
          </h2>

          <p className="mt-1 text-xs text-[#777D80]">
            Review and manage your reported issues
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Loader2 className="mb-3 animate-spin text-[#C47B50]" size={28} />
            <p className="text-sm text-[#A5A5A2]">
              Loading issues...
            </p>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-[#C47B50]/20 bg-[#C47B50]/10 text-[#C47B50]">
              <Bug size={26} />
            </div>

            <h3 className="font-semibold text-[#F2F0ED]">
              {issues.length === 0
                ? 'No issues reported yet'
                : 'No matching issues'}
            </h3>

            <p className="mt-2 text-sm text-[#A5A5A2]">
              {issues.length === 0
                ? 'Report your first issue to start tracking it.'
                : 'Try changing your search or filters.'}
            </p>

            {issues.length === 0 && (
              <button
                onClick={openNewForm}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#C47B50] px-5 py-3 text-sm font-semibold text-[#191B1D] transition hover:bg-[#E9B28D]"
              >
                <Plus size={17} />
                Report First Issue
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#3B4145]">
            {filteredIssues.map((issue) => (
              <article
                key={issue.id}
                className="flex flex-col gap-4 p-5 transition hover:bg-[#303538] lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div
                    className={`mt-0.5 rounded-xl border p-2.5 ${
                      issue.severity === 'Critical'
                        ? 'border-[#E47770]/20 bg-[#E47770]/10 text-[#E47770]'
                        : issue.severity === 'High'
                          ? 'border-[#E49A62]/20 bg-[#E49A62]/10 text-[#E49A62]'
                          : 'border-[#3B4145] bg-[#202426] text-[#A5A5A2]'
                    }`}
                  >
                    <Bug size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words font-semibold text-[#F2F0ED]">
                        {issue.title}
                      </h3>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                          severityStyles[issue.severity] ?? severityStyles.Medium
                        }`}
                      >
                        {issue.severity}
                      </span>
                    </div>

                    <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-5 text-[#A5A5A2]">
                      {issue.description || 'No description provided.'}
                    </p>

                    <p className="mt-3 flex items-center gap-1.5 text-xs text-[#777D80]">
                      <CalendarDays size={13} />
                      Reported on {formatDate(issue.reportedDate)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <select
                    value={issue.status}
                    onChange={(event) =>
                      changeStatus(
                        issue.id,
                        event.target.value as IssueStatus
                      )
                    }
                    aria-label="Change issue status"
                    className={`rounded-lg border px-3 py-2.5 text-xs font-semibold outline-none ${
                      statusStyles[issue.status] ?? statusStyles.Open
                    }`}
                  >
                    {issueStatuses.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => openEditForm(issue)}
                    aria-label="Edit issue"
                    title="Edit issue"
                    className="rounded-lg p-2.5 text-[#A5A5A2] transition hover:bg-[#C47B50]/10 hover:text-[#E9B28D]"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    onClick={() => deleteIssue(issue.id)}
                    aria-label="Delete issue"
                    title="Delete issue"
                    className="rounded-lg p-2.5 text-[#A5A5A2] transition hover:bg-[#E47770]/10 hover:text-[#E47770]"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

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
                  Issue Management
                </p>

                <h2 className="text-xl font-bold text-[#F2F0ED]">
                  {editingId ? 'Edit Issue' : 'Report New Issue'}
                </h2>

                <p className="mt-1 text-sm text-[#A5A5A2]">
                  Provide details to help track and resolve the issue.
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

            <form onSubmit={saveIssue} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#E9E5E0]">
                  Issue title <span className="text-[#E47770]">*</span>
                </label>

                <input
                  required
                  maxLength={150}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Login page error"
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
                  placeholder="Explain what happened and how to reproduce it..."
                  rows={4}
                  maxLength={2000}
                  className="w-full resize-none rounded-xl border border-[#454B4F] bg-[#191B1D] px-4 py-3 text-sm text-[#F2F0ED] outline-none transition placeholder:text-[#777D80] focus:border-[#C47B50]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#E9E5E0]">
                    Severity
                  </label>

                  <select
                    value={severity}
                    onChange={(event) =>
                      setSeverity(event.target.value as Severity)
                    }
                    className="w-full rounded-xl border border-[#454B4F] bg-[#191B1D] px-3 py-3 text-sm text-[#F2F0ED] outline-none focus:border-[#C47B50]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#E9E5E0]">
                    Status
                  </label>

                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as IssueStatus)
                    }
                    className="w-full rounded-xl border border-[#454B4F] bg-[#191B1D] px-3 py-3 text-sm text-[#F2F0ED] outline-none focus:border-[#C47B50]"
                  >
                    {issueStatuses.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
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
                      {editingId ? 'Save Changes' : 'Report Issue'}
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
  icon: ReactNode
  accent: 'copper' | 'red' | 'blue' | 'green'
}) {
  const accents = {
    copper: 'border-[#C47B50]/20 bg-[#C47B50]/10 text-[#D9956E]',
    red: 'border-[#E47770]/20 bg-[#E47770]/10 text-[#E47770]',
    blue: 'border-[#83A9D1]/20 bg-[#83A9D1]/10 text-[#83A9D1]',
    green: 'border-[#55B88A]/20 bg-[#55B88A]/10 text-[#55B88A]',
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

export default Issues
