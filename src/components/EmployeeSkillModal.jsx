import { useEffect } from 'react'
import { fmtDate } from './StageCell'
import { RANK_LETTER, stageRank, stationsFor, summarize } from './stageUtils'

const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')

const stageText = (r, letter) => {
  if (letter === 't') return `${fmtDate(r.tStartDate)} → ${r.tEndDate ? fmtDate(r.tEndDate) : 'ongoing'}`
  if (letter === 'u') return `${fmtDate(r.uStartDate)} → ${r.uEndDate ? fmtDate(r.uEndDate) : 'ongoing'}`
  if (letter === 'a') return `from ${fmtDate(r.aStartDate)}`
  if (letter === 'c') return 'Competent to train'
  return 'Not started'
}

const LEGEND = [
  ['t', 'Training plan'],
  ['u', 'Under training'],
  ['a', 'Authorised'],
  ['c', 'Competent to train others']
]

// Popup opened from a dashboard card: the employee's stations, grouped by area,
// laid out like the Eaton skill matrix sheet (station header + coloured stage cell).
export default function EmployeeSkillModal({ employee, assignments, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const stations = stationsFor(assignments)
  const s = summarize(assignments)

  const byArea = {}
  stations.forEach((r) => {
    const area = r.area?.areaName ?? r.areaCode
    ;(byArea[area] ??= []).push(r)
  })
  const areaNames = Object.keys(byArea).sort()
  const stationName = (r) => r.workStation?.workStationName ?? r.workStationCode

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="emp-modal" role="dialog" aria-modal="true">
        <div className="emp-modal-banner">
          <img src="/logo.png" alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
          <span>Skill Matrix</span>
          <button type="button" className="emp-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="emp-modal-body">
          <div className="emp-modal-head">
            <div className="stamp big">
              {employee.photo ? <img src={employee.photo} alt="" /> : <span>{initials(employee.empName)}</span>}
            </div>
            <div className="emp-modal-info">
              <h2>{employee.empName}</h2>
              <div className="emp-modal-meta">
                <span>Employee no: <strong>{employee.empId}</strong></span>
                {employee.empCategory && <span>Category: <strong>{employee.empCategory}</strong></span>}
                {employee.department && <span>Department: <strong>{employee.department.deptName}</strong></span>}
              </div>
              <div className="emp-modal-summary">
                <span className="emp-modal-pct">{s.pct}% completed</span>
                {['c', 'a', 'u', 't'].map((k) => (
                  <span key={k} className={`stage-chip-sm stage-${k}`}>
                    <strong>{k.toUpperCase()}</strong> {s[k]} stations
                  </span>
                ))}
                <span className="emp-modal-total">{s.total} assigned</span>
              </div>
            </div>
          </div>

          {stations.length === 0 ? (
            <p>No stations assigned yet.</p>
          ) : (
            areaNames.map((area) => (
              <section className="skill-area" key={area}>
                <h4>{area}</h4>
                <div className="skill-tiles">
                  {byArea[area]
                    .sort((x, y) => stationName(x).localeCompare(stationName(y)))
                    .map((r) => {
                      const letter = RANK_LETTER[stageRank(r)]
                      return (
                        <div className={`skill-tile ${letter ? '' : 'none'}`} key={r.workStationCode}>
                          <div className="skill-tile-head">{stationName(r)}</div>
                          <div className={`skill-tile-body ${letter ? `stage-${letter}` : ''}`}>
                            <strong>{letter ? letter.toUpperCase() : '—'}</strong>
                            <small>{stageText(r, letter)}</small>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </section>
            ))
          )}

          <div className="skill-legend">
            {LEGEND.map(([k, label]) => (
              <span key={k} className={`stage-chip-sm stage-${k}`}>
                <strong>{k.toUpperCase()}</strong> {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
