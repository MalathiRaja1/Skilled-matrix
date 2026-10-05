import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import EmployeeSkillModal from '../components/EmployeeSkillModal'
import DepartmentStatusPanel from '../components/DepartmentStatusPanel'
import Loader from '../components/Loader'
import { summarize } from '../components/stageUtils'

const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')

const EMPTY = { c: 0, a: 0, u: 0, t: 0, none: 0, total: 0, pct: 0 }

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export default function Dashboard() {
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [assignments, setAssignments] = useState([])
  const [active, setActive] = useState('ALL')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [showOverview, setShowOverview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [logoOk, setLogoOk] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.allSettled([api.get('/employees'), api.get('/departments'), api.get('/assignemployees')])
      .then(([e, d, a]) => {
        if (e.status === 'fulfilled') setEmployees(e.value.data)
        else setError('Could not load employees.')
        if (d.status === 'fulfilled') setDepartments(d.value.data)
        if (a.status === 'fulfilled') setAssignments(a.value.data)
        else if (e.status === 'fulfilled')
          setError('Employees loaded, but station progress could not be loaded (0% shown).')
      })
      .finally(() => setLoading(false))
  }, [])

  const counts = useMemo(() => {
    const m = {}
    employees.forEach((e) => { m[e.deptCode] = (m[e.deptCode] || 0) + 1 })
    return m
  }, [employees])

  const byEmp = useMemo(() => {
    const m = {}
    assignments.forEach((a) => { ;(m[a.empId] ??= []).push(a) })
    return m
  }, [assignments])

  const summaries = useMemo(() => {
    const out = {}
    Object.entries(byEmp).forEach(([id, rows]) => { out[id] = summarize(rows) })
    return out
  }, [byEmp])

  const q = query.trim().toLowerCase()
  const visible = employees.filter(
    (e) =>
      (active === 'ALL' || e.deptCode === active) &&
      (!q || `${e.empId} ${e.empName}`.toLowerCase().includes(q))
  )

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="dash">
      <div className="dash-topbar">
        <div className="dash-topbar-inner">
          <span className="dash-topbar-left">Employee Skill Matrix</span>
          <div className="dash-search">
            <input
              type="text"
              placeholder="Search by name or code…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="dash-topbar-right">
            <Link to="/masters/employee" className="top-btn manage">⚙ Manage</Link>
            <button type="button" className="top-btn logout" onClick={logout}>Log out</button>
          </div>
        </div>
      </div>

      <header className="dash-header">
        <div className="dash-header-inner">
          <div className="dash-brand">
            {logoOk ? (
              <img src="/logo.png" alt="Logo" onError={() => setLogoOk(false)} />
            ) : (
              <span>Skill Matrix</span>
            )}
          </div>
        </div>
      </header>

      {/* Department buttons on their own line */}
      <div className="dash-filterbar">
        <div className="dash-filterbar-inner">
          <button
            type="button"
            className={`dash-pill ${active === 'ALL' ? 'active' : ''}`}
            onClick={() => setActive('ALL')}
          >
            All<span className="dash-count">{employees.length}</span>
          </button>
          {departments.map((d) => (
            <button
              type="button"
              key={d.deptCode}
              className={`dash-pill ${active === d.deptCode ? 'active' : ''}`}
              onClick={() => setActive(d.deptCode)}
            >
              {d.deptName}
              <span className="dash-count">{counts[d.deptCode] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="dash-main">
        {error && <p className="error">{error}</p>}
        {loading ? (
          <Loader label="Loading dashboard…" />
        ) : (
          <div className="dash-body">
            <div className="dash-body-main">
              <div className="dash-summary-row">
                <p className="dash-summary">
                  Showing {visible.length} of {employees.length} employees · click a photo for full details
                </p>
                <button
                  type="button"
                  className="eye-btn"
                  title="View Department Overview"
                  onClick={() => setShowOverview(true)}
                >
                  <EyeIcon />
                </button>
              </div>

              {visible.length === 0 ? (
                <p>No employees found.</p>
              ) : (
                <div className="emp-grid">
                  {visible.map((e) => {
                    const s = summaries[e.empId] || EMPTY
                    return (
                      <article className="emp-card" key={e.empId}>
                        <button
                          type="button"
                          className="stamp stamp-btn"
                          onClick={() => setSelected(e)}
                          title="View stations and areas"
                        >
                          {e.photo ? <img src={e.photo} alt="" /> : <span>{initials(e.empName)}</span>}
                        </button>
                        <h3 title={e.empName}>{e.empName}</h3>
                        <div className="emp-code">{e.empId}</div>
                        <div className="emp-stages">
                          {['c', 'a', 'u', 't'].map((k) => (
                            <span
                              key={k}
                              className={`stage-chip-sm stage-${k}`}
                              title={`${s[k]} station(s) at stage ${k.toUpperCase()}`}
                            >
                              <strong>{k.toUpperCase()}</strong> {s[k]}
                            </span>
                          ))}
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Department Overview popup */}
      {showOverview && (
        <div className="modal-overlay" onClick={() => setShowOverview(false)}>
          <div className="overview-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="overview-close"
              onClick={() => setShowOverview(false)}
              aria-label="Close"
            >
              ×
            </button>
            <DepartmentStatusPanel />
          </div>
        </div>
      )}

      {selected && (
        <EmployeeSkillModal
          employee={selected}
          assignments={byEmp[selected.empId] || []}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}