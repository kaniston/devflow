
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Users,
  Plus,
  Search,
  Mail,
  ShieldCheck,
  Code2,
  Palette,
  Briefcase,
  Clock3,
  RefreshCw,
  X,
  Send,
  AlertCircle,
  CheckCircle2,
  Building2,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

type Role = 'Admin' | 'Manager' | 'Developer' | 'Designer'

type Member = {
  id: string
  userId: string
  name: string
  email: string
  role: Role
  department: string
  joinedAt: string
}

type Invitation = {
  id: string
  email: string
  role: Role
  status: string
  expiresAt: string | null
  createdAt: string
}

type Profile = {
  id: string
  full_name: string | null
  email: string | null
  department: string | null
}

type TeamLoadResult = {
  members: Member[]
  invitations: Invitation[]
  workspaceId: string | null
  currentRole: Role | null
}

const roles: Role[] = ['Admin', 'Manager', 'Developer', 'Designer']

const roleStyles: Record<Role, string> = {
  Admin: 'bg-[#C47B50]/15 text-[#E9B28D] border-[#C47B50]/30',
  Manager: 'bg-[#83A9D1]/15 text-[#A9C8E8] border-[#83A9D1]/30',
  Developer: 'bg-[#55B88A]/15 text-[#75D5A7] border-[#55B88A]/30',
  Designer: 'bg-[#B69AE8]/15 text-[#CDB7F3] border-[#B69AE8]/30',
}

const roleIcons = {
  Admin: ShieldCheck,
  Manager: Briefcase,
  Developer: Code2,
  Designer: Palette,
}

function formatDate(date: string | null) {
  if (!date) return 'Not available'

  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Fetch workspace data without updating React state.
async function loadTeamFromSupabase(): Promise<TeamLoadResult> {
  const { data: authData, error: authError } =
    await supabase.auth.getUser()

  if (authError) throw authError

  const user = authData.user

  if (!user) {
    throw new Error('Your session has expired. Please log in again.')
  }

  const { data: ownMembership, error: membershipError } = await supabase
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (membershipError) throw membershipError

  if (!ownMembership) {
    return {
      members: [],
      invitations: [],
      workspaceId: null,
      currentRole: null,
    }
  }

  const activeWorkspaceId = ownMembership.workspace_id as string
  const activeRole = ownMembership.role as Role

  const { data: membershipRows, error: membersError } = await supabase
    .from('workspace_members')
    .select('id, workspace_id, user_id, role, joined_at')
    .eq('workspace_id', activeWorkspaceId)
    .order('joined_at', { ascending: true })

  if (membersError) throw membersError

  const userIds = (membershipRows ?? []).map(
    (membership) => membership.user_id as string,
  )

  let profiles: Profile[] = []

  if (userIds.length > 0) {
    const { data: profileRows, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, department')
      .in('id', userIds)

    if (profilesError) throw profilesError

    profiles = (profileRows ?? []) as Profile[]
  }

  const profileMap = new Map(
    profiles.map((profile) => [profile.id, profile]),
  )

  const members: Member[] = (membershipRows ?? []).map((membership) => {
    const memberProfile = profileMap.get(
      membership.user_id as string,
    )

    return {
      id: membership.id as string,
      userId: membership.user_id as string,
      name: memberProfile?.full_name || 'Workspace Member',
      email: memberProfile?.email || 'Email unavailable',
      role: membership.role as Role,
      department: memberProfile?.department || 'Not specified',
      joinedAt: membership.joined_at as string,
    }
  })

  let invitations: Invitation[] = []

  if (activeRole === 'Admin') {
    const { data: invitationRows, error: invitationsError } =
      await supabase
        .from('workspace_invitations')
        .select('id, email, role, status, expires_at, created_at')
        .eq('workspace_id', activeWorkspaceId)
        .order('created_at', { ascending: false })

    if (invitationsError) throw invitationsError

    invitations = (invitationRows ?? []).map((invitation) => ({
      id: invitation.id as string,
      email: invitation.email as string,
      role: invitation.role as Role,
      status: invitation.status as string,
      expiresAt: invitation.expires_at as string | null,
      createdAt: invitation.created_at as string,
    }))
  }

  return {
    members,
    invitations,
    workspaceId: activeWorkspaceId,
    currentRole: activeRole,
  }
}

function Team() {
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [currentRole, setCurrentRole] = useState<Role | null>(null)

  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [showInviteForm, setShowInviteForm] = useState(false)

  const [email, setEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('Developer')

  // Refresh workspace data when requested by the user.
  const refreshTeam = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const result = await loadTeamFromSupabase()

      setMembers(result.members)
      setInvitations(result.invitations)
      setWorkspaceId(result.workspaceId)
      setCurrentRole(result.currentRole)
    } catch (err) {
      console.error('Team loading error:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load your workspace team.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial loading: state updates happen only after async data loading.
  useEffect(() => {
    let isMounted = true

    const loadInitialTeam = async () => {
      try {
        const result = await loadTeamFromSupabase()

        if (isMounted) {
          setMembers(result.members)
          setInvitations(result.invitations)
          setWorkspaceId(result.workspaceId)
          setCurrentRole(result.currentRole)
        }
      } catch (err) {
        console.error('Team loading error:', err)

        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load your workspace team.',
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadInitialTeam()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredMembers = useMemo(() => {
    const searchText = search.toLowerCase().trim()

    return members.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchText) ||
        member.email.toLowerCase().includes(searchText) ||
        member.department.toLowerCase().includes(searchText)

      const matchesRole =
        roleFilter === 'All' || member.role === roleFilter

      return matchesSearch && matchesRole
    })
  }, [members, search, roleFilter])

  const pendingInvitations = invitations.filter(
    (invitation) => invitation.status === 'pending',
  )

  const adminCount = members.filter(
    (member) => member.role === 'Admin',
  ).length

  const developerCount = members.filter(
    (member) => member.role === 'Developer',
  ).length

  const managerCount = members.filter(
    (member) => member.role === 'Manager',
  ).length

  const canInvite = currentRole === 'Admin'

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!workspaceId) {
      setError('No workspace was found for your account.')
      return
    }

    const normalizedEmail = email.trim().toLowerCase()

    if (
      members.some(
        (member) => member.email.toLowerCase() === normalizedEmail,
      )
    ) {
      setError('This person is already a member of your workspace.')
      return
    }

    if (
      pendingInvitations.some(
        (invitation) =>
          invitation.email.toLowerCase() === normalizedEmail,
      )
    ) {
      setError('There is already a pending invitation for this email.')
      return
    }

    setSending(true)
    setError('')
    setNotice('')

    try {
      const { error: inviteError } = await supabase.functions.invoke(
        'invite-member',
        {
          body: {
            email: normalizedEmail,
            role: inviteRole,
            workspace_id: workspaceId,
          },
        },
      )

      if (inviteError) throw inviteError

      setNotice(`Invitation sent to ${normalizedEmail}.`)
      setEmail('')
      setInviteRole('Developer')
      setShowInviteForm(false)

      await refreshTeam()
    } catch (err) {
      console.error('Invitation error:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to send the invitation. Please try again.',
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-7">
      {/* Page heading */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#C47B50]">
            <Users size={14} />
            Workspace
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#F2F0ED] sm:text-3xl">
            Team Members
          </h1>

          <p className="mt-2 text-sm text-[#A5A5A2]">
            Manage your workspace members, roles and invitations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void refreshTeam()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-[#3B4145] bg-[#292D30] px-3.5 py-2.5 text-sm font-medium text-[#D5D2CE] transition hover:border-[#C47B50]/50 hover:text-[#E9B28D] disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? 'animate-spin' : ''}
            />
            Refresh
          </button>

          {canInvite && (
            <button
              onClick={() => {
                setError('')
                setNotice('')
                setShowInviteForm(true)
              }}
              className="df-primary-button flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
            >
              <Plus size={17} />
              Invite Member
            </button>
          )}
        </div>
      </div>

      {/* Feedback */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-[#E47770]/30 bg-[#E47770]/10 p-4 text-sm text-[#F09A93]">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="flex items-start gap-3 rounded-xl border border-[#55B88A]/30 bg-[#55B88A]/10 p-4 text-sm text-[#75D5A7]">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Members"
          value={members.length}
          icon={<Users size={20} />}
        />

        <SummaryCard
          title="Admins"
          value={adminCount}
          icon={<ShieldCheck size={20} />}
        />

        <SummaryCard
          title="Managers"
          value={managerCount}
          icon={<Briefcase size={20} />}
        />

        <SummaryCard
          title="Developers"
          value={developerCount}
          icon={<Code2 size={20} />}
        />
      </div>

      {/* Invitation overview */}
      {canInvite && (
        <div className="df-panel flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#C47B50]/15 p-3 text-[#E9B28D]">
              <Mail size={21} />
            </div>

            <div>
              <h3 className="font-semibold text-[#F2F0ED]">
                Pending invitations
              </h3>
              <p className="mt-1 text-sm text-[#A5A5A2]">
                Invitations waiting to be accepted.
              </p>
            </div>
          </div>

          <div className="text-3xl font-bold tabular-nums text-[#E9B28D]">
            {pendingInvitations.length}
          </div>
        </div>
      )}

      {/* Search and filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-3.5 text-[#777D80]"
            size={17}
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email or department..."
            className="w-full rounded-xl border border-[#3B4145] bg-[#292D30] py-3 pl-10 pr-4 text-sm text-[#F2F0ED] outline-none transition placeholder:text-[#777D80] focus:border-[#C47B50]"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          className="rounded-xl border border-[#3B4145] bg-[#292D30] px-4 py-3 text-sm text-[#F2F0ED] outline-none focus:border-[#C47B50]"
        >
          <option value="All">All roles</option>
          {roles.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {/* Members */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#F2F0ED]">
              Workspace members
            </h2>

            <p className="mt-1 text-sm text-[#777D80]">
              {filteredMembers.length} member
              {filteredMembers.length !== 1 ? 's' : ''} displayed
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-44 animate-pulse rounded-2xl border border-[#3B4145] bg-[#292D30]"
              />
            ))}
          </div>
        ) : error && members.length === 0 ? (
          <div className="rounded-2xl border border-[#3B4145] bg-[#292D30] p-10 text-center">
            <AlertCircle
              size={34}
              className="mx-auto mb-3 text-[#E47770]"
            />

            <h3 className="font-semibold text-[#F2F0ED]">
              Unable to load workspace members
            </h3>

            <p className="mt-2 text-sm text-[#A5A5A2]">
              Check your Supabase permissions and try refreshing.
            </p>

            <button
              onClick={() => void refreshTeam()}
              className="df-secondary-button mt-5 rounded-xl px-4 py-2 text-sm"
            >
              Try again
            </button>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#3B4145] bg-[#292D30] p-12 text-center">
            <Users
              size={36}
              className="mx-auto mb-3 text-[#777D80]"
            />

            <h3 className="font-semibold text-[#F2F0ED]">
              No team members found
            </h3>

            <p className="mt-2 text-sm text-[#A5A5A2]">
              Try another search or invite someone to your workspace.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredMembers.map((member) => {
              const RoleIcon = roleIcons[member.role] ?? Users

              return (
                <article
                  key={member.id}
                  className="df-panel rounded-2xl p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#C47B50]/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#C47B50]/30 bg-[#C47B50]/15 text-lg font-bold text-[#E9B28D]">
                        {member.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-[#F2F0ED]">
                          {member.name}
                        </h3>

                        <span
                          className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${roleStyles[member.role] ?? roleStyles.Developer}`}
                        >
                          <RoleIcon size={12} />
                          {member.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 border-t border-[#3B4145] pt-4">
                    <p className="flex items-center gap-2 break-all text-sm text-[#A5A5A2]">
                      <Mail
                        size={15}
                        className="shrink-0 text-[#C47B50]"
                      />
                      {member.email}
                    </p>

                    <p className="flex items-center gap-2 text-sm text-[#A5A5A2]">
                      <Building2
                        size={15}
                        className="shrink-0 text-[#C47B50]"
                      />
                      {member.department}
                    </p>

                    <p className="flex items-center gap-2 text-xs text-[#777D80]">
                      <Clock3 size={14} />
                      Joined {formatDate(member.joinedAt)}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {/* Pending invitation list */}
      {canInvite && pendingInvitations.length > 0 && (
        <section className="df-panel overflow-hidden rounded-2xl">
          <div className="border-b border-[#3B4145] p-5">
            <h2 className="font-semibold text-[#F2F0ED]">
              Pending invitations
            </h2>

            <p className="mt-1 text-sm text-[#A5A5A2]">
              People who have been invited but have not joined yet.
            </p>
          </div>

          <div className="divide-y divide-[#3B4145]">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex flex-wrap items-center justify-between gap-3 p-5"
              >
                <div className="min-w-0">
                  <p className="break-all text-sm font-medium text-[#F2F0ED]">
                    {invitation.email}
                  </p>

                  <p className="mt-1 text-xs text-[#777D80]">
                    Invited {formatDate(invitation.createdAt)}
                    {invitation.expiresAt
                      ? ` · Expires ${formatDate(invitation.expiresAt)}`
                      : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${roleStyles[invitation.role] ?? roleStyles.Developer}`}
                  >
                    {invitation.role}
                  </span>

                  <span className="rounded-full border border-[#E6AD58]/30 bg-[#E6AD58]/10 px-2.5 py-1 text-xs font-medium text-[#E6AD58]">
                    Pending
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Invite member modal */}
      {showInviteForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[#3B4145] bg-[#292D30] p-6 shadow-2xl sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex rounded-xl bg-[#C47B50]/15 p-3 text-[#E9B28D]">
                  <Mail size={21} />
                </div>

                <h2 className="text-xl font-bold text-[#F2F0ED]">
                  Invite a team member
                </h2>

                <p className="mt-1 text-sm text-[#A5A5A2]">
                  Send a secure invitation to join your workspace.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                aria-label="Close invitation form"
                className="rounded-lg p-2 text-[#A5A5A2] transition hover:bg-[#32373A] hover:text-[#F2F0ED]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#D5D2CE]">
                  Email address
                </label>

                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-[#3B4145] bg-[#191B1D] px-4 py-3 text-sm text-[#F2F0ED] outline-none placeholder:text-[#777D80] focus:border-[#C47B50]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#D5D2CE]">
                  Assign role
                </label>

                <select
                  value={inviteRole}
                  onChange={(event) =>
                    setInviteRole(event.target.value as Role)
                  }
                  className="w-full rounded-xl border border-[#3B4145] bg-[#191B1D] px-4 py-3 text-sm text-[#F2F0ED] outline-none focus:border-[#C47B50]"
                >
                  {roles.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-[#3B4145] bg-[#191B1D] p-4">
                <p className="text-xs leading-5 text-[#A5A5A2]">
                  The invited person will receive an email with a secure
                  signup or login link. They will become a workspace member
                  after accepting the invitation.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="df-secondary-button rounded-xl px-4 py-2.5 text-sm font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={sending}
                  className="df-primary-button flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={15} />
                  {sending ? 'Sending...' : 'Send Invitation'}
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
}: {
  title: string
  value: number
  icon: React.ReactNode
}) {
  return (
    <div className="df-panel flex items-center gap-4 rounded-2xl p-5">
      <div className="rounded-xl border border-[#C47B50]/20 bg-[#C47B50]/10 p-3 text-[#E9B28D]">
        {icon}
      </div>

      <div>
        <p className="text-sm text-[#A5A5A2]">{title}</p>

        <p className="mt-1 text-2xl font-bold tabular-nums text-[#F2F0ED]">
          {value}
        </p>
      </div>
    </div>
  )
}

export default Team
