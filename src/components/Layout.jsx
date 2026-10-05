import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { entities } from '../config/entities'

const groups = [
  {
    id: 'masters',
    label: 'Masters',
    items: Object.entries(entities).map(([key, cfg]) => ({
      to: `/masters/${key}`,
      label: cfg.title,
    })),
  },
  {
    id: 'admin',
    label: 'Administration',
    items: [{ to: '/users', label: 'User Creation' }],
  },
  {
    id: 'reports',
    label: 'Reports',
    items: [
      { to: '/report', label: 'Employee Skill Matrix Report', end: true },
      { to: '/report/assign', label: 'Employee Assign Report' },
    ],
  },
]

const findGroup = (path) =>
  groups.find((g) => g.items.some((i) => path.startsWith(i.to)))?.id ?? null

export default function Layout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(() => findGroup(pathname))

  // keep the right group open if the user navigates by URL / dashboard
  useEffect(() => {
    const g = findGroup(pathname)
    if (g) setOpen(g)
  }, [pathname])

  const toggle = (id) => setOpen((cur) => (cur === id ? null : id))

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

          {groups.map((g) => {
            const isOpen = open === g.id
            return (
              <div key={g.id} className={`nav-group ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="nav-group-btn"
                  onClick={() => toggle(g.id)}
                >
                  <span>{g.label}</span>
                  <span className="nav-chevron">▾</span>
                </button>

                <div className="nav-group-body">
                  <div className="nav-group-inner">
                    {g.items.map((item, i) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className="nav-sub"
                        style={{ '--i': i }}
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </nav>
        <button className="logout" onClick={logout}>Log out</button>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}