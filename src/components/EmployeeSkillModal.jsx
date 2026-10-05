import { useEffect, useMemo, useState } from 'react'
import { summarize, stationsFor, stageRank, RANK_LETTER } from './stageUtils'

const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')

/* ------------------------------------------------------------------
   ADAPTER – reads names even when the row holds nested objects
   (e.g. row.area = { areaName: 'Tank Assembly' }).
------------------------------------------------------------------- */
const text = (v) => {
  if (v == null) return ''
  if (typeof v !== 'object') return String(v)
  return text(
    v.areaName ?? v.stationName ?? v.name ?? v.title ?? v.areaCode ?? v.stationCode ?? v.code ?? ''
  )
}
const areaOf = (r) =>
  text(r.areaName ?? r.area ?? r.areaDesc ?? r.station?.areaName ?? r.areaCode) || 'Other'
const stationName = (v) => {
  if (v == null) return ''
  if (typeof v !== 'object') return String(v)
  return stationName(v.workStationName ?? v.stationName ?? v.name ?? v.workStationCode ?? '')
}
const stationOf = (r) =>
  stationName(
    r.workStationName ?? r.workStation ?? r.station ?? r.stationName ?? r.workStationCode
  ) || r.workStationCode || '—'

// Highest stage reached, using the same rule as stageUtils (C > A > U > T)
const stageOf = (r) => (RANK_LETTER[stageRank(r)] || '').toUpperCase()

const STAGES = [
  { key: 'C', label: 'Competent to train' },
  { key: 'A', label: 'Authorised' },
  { key: 'U', label: 'Under training' },
  { key: 'T', label: 'Trained' },
]

export default function EmployeeSkillModal({ employee, assignments, onClose }) {
  const [logoOk, setLogoOk] = useState(true)
  const s = useMemo(() => summarize(assignments), [assignments])

  // Group: area -> stage -> [station names]
  const areas = useMemo(() => {
    const m = {}
    stationsFor(assignments).forEach((r) => {
      const a = areaOf(r)
      m[a] ??= { C: [], A: [], U: [], T: [] }
      const st = stageOf(r)
      if (st) m[a][st].push(stationOf(r))
    })
    return Object.entries(m).sort(([x], [y]) => x.localeCompare(y))
  }, [assignments])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="emp-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="emp-modal-banner">
          {logoOk && <img src="/logo.png" alt="" onError={() => setLogoOk(false)} />}
          <span>Skill Matrix</span>
          <button className="emp-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="emp-modal-body">
          <div className="emp-modal-head">
            <div className="stamp big">
              {employee.photo ? <img src={employee.photo} alt="" /> : <span>{initials(employee.empName)}</span>}
            </div>
            <div className="emp-modal-info">
              <h2>{employee.empName}</h2>
              <div className="emp-modal-meta">
                <span>Code: {employee.empId}</span>
                {employee.deptCode && <span>Dept: {employee.deptCode}</span>}
              </div>
              <div className="emp-modal-summary">
                {['c', 'a', 'u', 't'].map((k) => (
                  <span key={k} className={`stage-chip-sm stage-${k}`}>
                    <strong>{k.toUpperCase()}</strong> {s[k]}
                  </span>
                ))}
                <span className="emp-modal-total">{s.total} stations assigned</span>
              </div>
            </div>
          </div>

          {areas.length === 0 && <p className="muted" style={{ marginTop: 20 }}>No stations assigned yet.</p>}

          {areas.map(([area, byStage]) => (
            <section className="area-card" key={area}>
              <h4 className="area-title">{area}</h4>
              <div className="area-bar" />
              {STAGES.map(({ key, label }) => (
                <div className="area-row" key={key}>
                  <div className="area-stage">
                    <span className={`stage-badge stage-${key.toLowerCase()}`}>{key}</span>
                    {label}
                  </div>
                  <div className="area-stations">
                    {byStage[key].length ? (
                      byStage[key].map((n) => (
                        <span className={`station-chip stage-${key.toLowerCase()}`} key={n}>{n}</span>
                      ))
                    ) : (
                      <span className="area-none">None</span>
                    )}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
