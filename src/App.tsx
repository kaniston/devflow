
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import MainLayout from './shell/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'

import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Tasks from './pages/Tasks'
import Issues from './pages/Issues'
import Team from './pages/Team'
import Settings from './pages/Settings'

import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected pages */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/issues" element={<Issues />} />
            <Route path="/team" element={<Team />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
