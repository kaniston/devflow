
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Register() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
          },
        },
      })

      if (error) throw error

      if (data.session) {
        navigate('/')
      } else {
        setSuccess('Registration successful! Check your email to confirm your account before logging in.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-7 text-center">
          <h1 className="text-3xl font-bold text-indigo-600">DevFlow</h1>
          <h2 className="mt-5 text-2xl font-bold text-slate-900">
            Create your account
          </h2>
          <p className="mt-6 text-center text-sm text-gray-600">
  Already have an account?{' '}
  <Link
    to="/login"
    className="font-semibold text-indigo-600 hover:text-indigo-700"
  >
    Login
  </Link>
</p>
          <p className="mt-2 text-sm text-slate-500">
            Start managing your projects with DevFlow.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your full name"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email address
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Confirm password
            </label>
            <input
              required
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter your password"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register
