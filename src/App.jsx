import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import MasterCrudPage from './components/MasterCrudPage'
import { entities } from './config/entities'
import AssignEmployeeMaster from './pages/AssignEmployeeMaster'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Report from './pages/Report'
import TrainingRecord from './pages/TrainingRecord'
import UserCreation from './pages/UserCreation'

function RequireAuth({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Dashboard is a full-width page with its own header, so it sits outside the sidebar Layout */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />

        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route path="/report" element={<Report />} />
          <Route path="/report/assign" element={<TrainingRecord />} />
          <Route path="/users" element={<UserCreation />} />
          <Route path="/masters/assignEmployee" element={<AssignEmployeeMaster />} />
          {Object.entries(entities)
            .filter(([, cfg]) => !cfg.custom)
            .map(([key, cfg]) => (
              <Route key={key} path={`/masters/${key}`} element={<MasterCrudPage key={key} config={cfg} />} />
            ))}
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}
