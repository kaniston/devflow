
import { useEffect, useState, type FormEvent } from 'react'
import {
  User,
  Bell,
  Palette,
  Save,
  ShieldCheck,
  Settings as SettingsIcon,
  CheckCircle2,
  Sun,
  Moon,
  Mail,
  Briefcase,
  Building2,
} from 'lucide-react'

type Profile = {
  name: string
  email: string
  role: string
  department: string
}

type Preferences = {
  emailNotifications: boolean
  taskUpdates: boolean
  projectUpdates: boolean
  weeklySummary: boolean
  theme: 'Light' | 'Dark'
}

const defaultProfile: Profile = {
  name: 'Kaniston',
  email: 'kaniston@example.com',
  role: 'Admin',
  department: 'Engineering',
}

const defaultPreferences: Preferences = {
  emailNotifications: true,
  taskUpdates: true,
  projectUpdates: true,
  weeklySummary: false,
  theme: 'Dark',
}

function Settings() {
  const [profile, setProfile] = useState<Profile>(() => {
    try {
      const saved = localStorage.getItem('devflow-profile')
      return saved
        ? { ...defaultProfile, ...JSON.parse(saved) as Partial<Profile> }
        : defaultProfile
    } catch {
      return defaultProfile
    }
  })

  const [preferences, setPreferences] = useState<Preferences>(() => {
    try {
      const saved = localStorage.getItem('devflow-preferences')
      return saved
        ? {
            ...defaultPreferences,
            ...JSON.parse(saved) as Partial<Preferences>,
          }
        : defaultPreferences
    } catch {
      return defaultPreferences
    }
  })

  const [message, setMessage] = useState('')

  useEffect(() => {
    localStorage.setItem('devflow-profile', JSON.stringify(profile))
  }, [profile])

  useEffect(() => {
    localStorage.setItem(
      'devflow-preferences',
      JSON.stringify(preferences)
    )
  }, [preferences])

  const updatePreference = <K extends keyof Preferences>(
    key: K,
    value: Preferences[K]
  ) => {
    setPreferences((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const saveSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    localStorage.setItem('devflow-profile', JSON.stringify(profile))
    localStorage.setItem(
      'devflow-preferences',
      JSON.stringify(preferences)
    )

    setMessage('Settings saved successfully!')

    window.setTimeout(() => {
      setMessage('')
    }, 3000)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-7">

      {/* PAGE HEADER */}
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#C47B50]">
          <SettingsIcon size={14} />
          Workspace / Preferences
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[#F2F0ED] sm:text-3xl">
          Settings
        </h1>

        <p className="mt-2 text-sm text-[#A5A5A2]">
          Manage your profile, notifications, and workspace preferences.
        </p>
      </div>

      {/* SUCCESS MESSAGE */}
      {message && (
        <div className="flex items-center gap-3 rounded-xl border border-[#55B88A]/25 bg-[#55B88A]/10 px-4 py-3 text-sm font-medium text-[#55B88A]">
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}

      <form onSubmit={saveSettings} className="space-y-6">

        {/* PROFILE INFORMATION */}
        <section className="rounded-2xl border border-[#3B4145] bg-[#292D30] p-5 sm:p-6">

          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl border border-[#C47B50]/20 bg-[#C47B50]/10 p-3 text-[#C47B50]">
              <User size={21} />
            </div>

            <div>
              <h2 className="font-semibold text-[#F2F0ED]">
                Profile Information
              </h2>

              <p className="mt-1 text-sm text-[#A5A5A2]">
                Manage your personal profile details.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

            {/* FULL NAME */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#E9E5E0]">
                <User size={15} className="text-[#C47B50]" />
                Full Name
              </label>

              <input
                required
                maxLength={100}
                value={profile.name}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    name: event.target.value,
                  })
                }
                placeholder="Enter your name"
                className="w-full rounded-xl border border-[#3B4145] bg-[#191B1D] px-4 py-3 text-sm text-[#F2F0ED] outline-none transition placeholder:text-[#777D80] focus:border-[#C47B50]"
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#E9E5E0]">
                <Mail size={15} className="text-[#C47B50]" />
                Email Address
              </label>

              <input
                required
                type="email"
                value={profile.email}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    email: event.target.value,
                  })
                }
                placeholder="Enter your email"
                className="w-full rounded-xl border border-[#3B4145] bg-[#191B1D] px-4 py-3 text-sm text-[#F2F0ED] outline-none transition placeholder:text-[#777D80] focus:border-[#C47B50]"
              />
            </div>

            {/* ROLE */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#E9E5E0]">
                <Briefcase size={15} className="text-[#C47B50]" />
                Role
              </label>

              <select
                value={profile.role}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    role: event.target.value,
                  })
                }
                className="w-full rounded-xl border border-[#3B4145] bg-[#191B1D] px-4 py-3 text-sm text-[#F2F0ED] outline-none focus:border-[#C47B50]"
              >
                <option>Admin</option>
                <option>Manager</option>
                <option>Developer</option>
                <option>Designer</option>
              </select>
            </div>

            {/* DEPARTMENT */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#E9E5E0]">
                <Building2 size={15} className="text-[#C47B50]" />
                Department
              </label>

              <input
                value={profile.department}
                maxLength={100}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    department: event.target.value,
                  })
                }
                placeholder="Enter department"
                className="w-full rounded-xl border border-[#3B4145] bg-[#191B1D] px-4 py-3 text-sm text-[#F2F0ED] outline-none transition placeholder:text-[#777D80] focus:border-[#C47B50]"
              />
            </div>

          </div>

          <p className="mt-5 text-xs text-[#777D80]">
            Profile details are currently saved in this browser.
          </p>
        </section>

        {/* NOTIFICATION PREFERENCES */}
        <section className="rounded-2xl border border-[#3B4145] bg-[#292D30] p-5 sm:p-6">

          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl border border-[#E6AD58]/20 bg-[#E6AD58]/10 p-3 text-[#E6AD58]">
              <Bell size={21} />
            </div>

            <div>
              <h2 className="font-semibold text-[#F2F0ED]">
                Notification Preferences
              </h2>

              <p className="mt-1 text-sm text-[#A5A5A2]">
                Choose the updates you want to keep enabled.
              </p>
            </div>
          </div>

          <div className="space-y-5">

            <PreferenceToggle
              title="Email Notifications"
              description="Preference for receiving email notifications."
              checked={preferences.emailNotifications}
              onChange={(value) =>
                updatePreference('emailNotifications', value)
              }
            />

            <div className="h-px bg-[#3B4145]" />

            <PreferenceToggle
              title="Task Updates"
              description="Track task assignments and status changes."
              checked={preferences.taskUpdates}
              onChange={(value) =>
                updatePreference('taskUpdates', value)
              }
            />

            <div className="h-px bg-[#3B4145]" />

            <PreferenceToggle
              title="Project Updates"
              description="Keep track of project progress and changes."
              checked={preferences.projectUpdates}
              onChange={(value) =>
                updatePreference('projectUpdates', value)
              }
            />

            <div className="h-px bg-[#3B4145]" />

            <PreferenceToggle
              title="Weekly Summary"
              description="Preference for a weekly workspace summary."
              checked={preferences.weeklySummary}
              onChange={(value) =>
                updatePreference('weeklySummary', value)
              }
            />

          </div>
        </section>

        {/* APPEARANCE */}
        <section className="rounded-2xl border border-[#3B4145] bg-[#292D30] p-5 sm:p-6">

          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl border border-[#C47B50]/20 bg-[#C47B50]/10 p-3 text-[#C47B50]">
              <Palette size={21} />
            </div>

            <div>
              <h2 className="font-semibold text-[#F2F0ED]">
                Appearance
              </h2>

              <p className="mt-1 text-sm text-[#A5A5A2]">
                Choose your preferred appearance setting.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            {/* LIGHT MODE */}
            <button
              type="button"
              onClick={() => updatePreference('theme', 'Light')}
              className={`flex items-center gap-4 rounded-xl border p-4 text-left transition ${
                preferences.theme === 'Light'
                  ? 'border-[#C47B50] bg-[#C47B50]/10'
                  : 'border-[#3B4145] bg-[#191B1D] hover:border-[#777D80]'
              }`}
            >
              <div className="rounded-xl border border-[#3B4145] bg-[#E9E5E0] p-3 text-[#292D30]">
                <Sun size={22} />
              </div>

              <div>
                <p className="font-semibold text-[#F2F0ED]">
                  Light Mode
                </p>

                <p className="mt-1 text-xs text-[#A5A5A2]">
                  Light appearance preference
                </p>
              </div>

              {preferences.theme === 'Light' && (
                <CheckCircle2
                  size={19}
                  className="ml-auto text-[#C47B50]"
                />
              )}
            </button>

            {/* DARK MODE */}
            <button
              type="button"
              onClick={() => updatePreference('theme', 'Dark')}
              className={`flex items-center gap-4 rounded-xl border p-4 text-left transition ${
                preferences.theme === 'Dark'
                  ? 'border-[#C47B50] bg-[#C47B50]/10'
                  : 'border-[#3B4145] bg-[#191B1D] hover:border-[#777D80]'
              }`}
            >
              <div className="rounded-xl border border-[#3B4145] bg-[#292D30] p-3 text-[#E9B28D]">
                <Moon size={22} />
              </div>

              <div>
                <p className="font-semibold text-[#F2F0ED]">
                  Dark Mode
                </p>

                <p className="mt-1 text-xs text-[#A5A5A2]">
                  Dark appearance preference
                </p>
              </div>

              {preferences.theme === 'Dark' && (
                <CheckCircle2
                  size={19}
                  className="ml-auto text-[#C47B50]"
                />
              )}
            </button>

          </div>

          <p className="mt-4 text-xs leading-5 text-[#777D80]">
            Your appearance preference is saved locally. The current DevFlow
            interface uses the Graphite & Copper dark design. A full light
            theme has not been implemented yet.
          </p>
        </section>

        {/* SECURITY INFORMATION */}
        <section className="rounded-2xl border border-[#83A9D1]/20 bg-[#83A9D1]/[0.06] p-5">

          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-[#83A9D1]/20 bg-[#83A9D1]/10 p-3 text-[#83A9D1]">
              <ShieldCheck size={21} />
            </div>

            <div>
              <h3 className="font-semibold text-[#F2F0ED]">
                Account Security
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#A5A5A2]">
                DevFlow authentication is handled through Supabase.
                Profile settings on this page are currently stored in
                browser local storage and are not yet synchronized with
                your Supabase profile.
              </p>
            </div>
          </div>
        </section>

        {/* SAVE BUTTON */}
        <div className="flex justify-end border-t border-[#3B4145] pt-5">
          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#C47B50] px-6 py-3 text-sm font-semibold text-[#191B1D] shadow-lg shadow-[#C47B50]/10 transition hover:bg-[#E9B28D]"
          >
            <Save size={17} />
            Save Settings
          </button>
        </div>

      </form>
    </div>
  )
}

// REUSABLE PREFERENCE TOGGLE
function PreferenceToggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">

      <div>
        <h3 className="text-sm font-medium text-[#F2F0ED]">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-[#777D80]">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked
            ? 'bg-[#C47B50]'
            : 'bg-[#555D61]'
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </button>

    </div>
  )
}

export default Settings
