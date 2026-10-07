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
const PrintIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
)

const statusOf = (s) =>
  s.c > 0 ? { label: 'Competent', cls: 'ok' }
  : s.u > 0 ? { label: 'In training', cls: 'mid' }
  : { label: 'Needs training', cls: 'low' }

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

  const kpi = visible.reduce(
  (acc, e) => {
    const s = summaries[e.empId] || EMPTY
    acc.comp += s.c
    acc.tr += s.u
    acc.sum += s.pct || 0
    if (statusOf(s).cls === 'low') acc.need += 1
    return acc
  },
  { comp: 0, tr: 0, sum: 0, need: 0 }
)
const avgSkill = visible.length ? Math.round(kpi.sum / visible.length) : 0

  const deptName = useMemo(() => {
  const m = {}
  departments.forEach((d) => { m[d.deptCode] = d.deptName })
  return m
}, [departments])

const handlePrint = () => window.print()

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
                
<button
  type="button"
  className="eye-btn"
  title="Print all details"
  onClick={handlePrint}
>
  <PrintIcon />
</button>
              </div>
        <div className="kpi-row">
                <div className="kpi-tile"><small>Employees</small><b>{visible.length}</b></div>
                <div className="kpi-tile"><small>Competent stations</small><b>{kpi.comp}</b></div>
                <div className="kpi-tile"><small>Under training</small><b>{kpi.tr}</b></div>
                <div className="kpi-tile"><small>Average skill</small><b>{avgSkill}%</b></div>
                <div className="kpi-tile"><small>Need training</small><b>{kpi.need}</b></div>
              </div>

              <div className="stage-legend">
                <span><i className="lg lg-c" />C competent</span>
                <span><i className="lg lg-a" />A authorised</span>
                <span><i className="lg lg-u" />U under training</span>
                <span><i className="lg lg-t" />T training plan</span>
              </div>

         {visible.length === 0 ? (
                <p>No employees found.</p>
              ) : (
                <div className="emp-grid">
                  {visible.map((e) => {
                    const s = summaries[e.empId] || EMPTY
                    const st = statusOf(s)
                    const pct = Math.min(100, Math.round(s.pct || 0))
                    return (
                      <article className="emp-card pro" key={e.empId}>
                        <span className={`emp-status ${st.cls}`}>{st.label}</span>
                        <span className="emp-dept">{e.deptCode}</span>

                        <button
                          type="button"
                          className="emp-avatar"
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

                        <div className="skill-bar">
                          <div className="skill-bar-top"><span>Skill</span><span>{pct}%</span></div>
                          <div className="skill-bar-track"><i style={{ width: `${pct}%` }} /></div>
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
      <section className="print-only">
  <div className="print-head">
    <img src="/logo.png" alt="Logo" />
    <div>
      <h1>Employee Skill Matrix</h1>
      <p>
        {active === 'ALL' ? 'All departments' : deptName[active] || active}
        {' · '}{visible.length} employees
        {' · Printed on '}{new Date().toLocaleDateString()}
      </p>
    </div>
  </div>

  <table className="print-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Photo</th>
        <th>Name</th>
        <th>Emp ID</th>
        <th>Department</th>
        <th>C</th>
        <th>A</th>
        <th>U</th>
        <th>T</th>
        <th>Total</th>
        <th>Progress</th>
      </tr>
    </thead>
    <tbody>
      {visible.map((e, i) => {
        const s = summaries[e.empId] || EMPTY
        return (
          <tr key={e.empId}>
            <td>{i + 1}</td>
            <td>
              {e.photo
                ? <img className="print-photo" src={e.photo} alt="" />
                : <span className="print-photo print-initials">{initials(e.empName)}</span>}
            </td>
            <td>{e.empName}</td>
            <td>{e.empId}</td>
            <td>{deptName[e.deptCode] || e.deptCode}</td>
            <td className="stage-c">{s.c}</td>
            <td className="stage-a">{s.a}</td>
            <td className="stage-u">{s.u}</td>
            <td className="stage-t">{s.t}</td>
            <td>{s.total}</td>
            <td>{Math.round(s.pct)}%</td>
          </tr>
        )
      })}
    </tbody>
  </table>
</section>
    </div>
  )
}