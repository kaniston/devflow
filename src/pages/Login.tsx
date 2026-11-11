
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setError('')
    setLoading(true)

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        })

      if (loginError) {
        throw loginError
      }

      if (data.user) {
        navigate('/', { replace: true })
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Login failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">

        {/* Header */}
        <div className="mb-7 text-center">
          <h1 className="text-3xl font-bold text-indigo-600">
            DevFlow
          </h1>

          <h2 className="mt-5 text-2xl font-bold text-slate-900">
            Welcome back
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Login to continue to your workspace.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">

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
              autoComplete="email"
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
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

        </form>

        {/* Register Link */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Create Account
          </Link>
        </p>

      </div>
    </div>
  )
}

export default Login
