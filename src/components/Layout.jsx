import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { entities } from '../config/entities'

export default function Layout() {
  const navigate = useNavigate()

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">Skill Matrix</div>
        <nav>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <div className="nav-group-label">Masters</div>
          {Object.entries(entities).map(([key, cfg]) => (
            <NavLink key={key} to={`/masters/${key}`}>{cfg.title}</NavLink>
          ))}
          <div className="nav-group-label">Administration</div>
          <NavLink to="/users">User Creation</NavLink>
          <div className="nav-group-label">Reports</div>
          <NavLink to="/report" end>Employee Skill Matrix Report</NavLink>
          <NavLink to="/report/assign">Employee Assign Report</NavLink>
        </nav>
        <button className="logout" onClick={logout}>Log out</button>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
