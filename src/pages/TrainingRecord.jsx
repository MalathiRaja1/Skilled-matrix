import { useEffect, useMemo, useState } from 'react'
import api from '../api/client'
import { fmtDate } from '../components/StageCell'
import { RANK_LETTER, stageRank, stationsFor } from '../components/stageUtils'

const MIN_ROWS = 7

const EVAL = [
  ['communication', 'Communication Skills'],
  ['technical', 'Technical Skills'],
  ['problem', 'Problem-Solving Ability'],
  ['instructions', 'Following Instructions'],
  ['overall', 'Overall Performance']
]

const blankInfo = { jobTitle: '', trainerName: '', trainerJob: '', trainerContact: '' }

const hoursBetween = (from, to) => {
  if (!from || !to) return ''
  const [fh, fm] = from.split(':').map(Number)
  const [th, tm] = to.split(':').map(Number)
  const mins = th * 60 + tm - (fh * 60 + fm)
  return mins > 0 ? String(Math.round((mins / 60) * 10) / 10) : ''
}

// Printable training record for one employee, laid out like the Eaton form.
// Employee, department and the station rows come from the Assign Employee screen.
// Trainer details, times and ratings are typed here for printing and are not saved.
export default function TrainingRecord() {
  const [employees, setEmployees] = useState([])
  const [assignments, setAssignments] = useState([])
  const [empId, setEmpId] = useState('')
  const [info, setInfo] = useState(blankInfo)
  const [rowInputs, setRowInputs] = useState({}) // workStationCode -> { from, to, rating }
  const [evals, setEvals] = useState({})
  const [logoOk, setLogoOk] = useState(true)

  useEffect(() => {
    api.get('/employees')
      .then((r) => {
        setEmployees(r.data)
        if (r.data.length) setEmpId(r.data[0].empId)
      })
      .catch(() => {})
    api.get('/assignemployees').then((r) => setAssignments(r.data)).catch(() => {})
  }, [])

  const employee = employees.find((e) => e.empId === empId)

  const stations = useMemo(() => {
    const name = (r) => `${r.area?.areaName ?? r.areaCode} ${r.workStation?.workStationName ?? r.workStationCode}`
    return stationsFor(assignments.filter((a) => a.empId === empId)).sort((x, y) =>
      name(x).localeCompare(name(y))
    )
  }, [assignments, empId])

  const changeEmployee = (id) => {
    setEmpId(id)
    setInfo(blankInfo)
    setRowInputs({})
    setEvals({})
  }

  const setRow = (code, patch) => setRowInputs((m) => ({ ...m, [code]: { ...m[code], ...patch } }))
  const rowCount = Math.max(MIN_ROWS, stations.length)

  return (
    <div className="page">
      <div className="no-print report-controls">
        <h1>Employee Assign Report</h1>
        <select value={empId} onChange={(e) => changeEmployee(e.target.value)}>
          {employees.map((e) => (
            <option key={e.empId} value={e.empId}>{e.empId} — {e.empName}</option>
          ))}
        </select>
        <button type="button" onClick={() => window.print()}>Print</button>
      </div>
      <p className="no-print report-note">
        Trainer details, times, hours and ratings are typed here just for printing — they aren't saved.
        Date is the T (training) start date.
      </p>

      {!employee ? (
        <p>No employees yet.</p>
      ) : (
        <div className="sheet">
          <div className="sheet-banner">
            {logoOk ? (
              <img src="/logo.png" alt="" onError={() => setLogoOk(false)} />
            ) : (
              <span />
            )}
            <span>Skill Matrix</span>
          </div>

          <table className="sheet-table">
            <tbody>
              <tr><th colSpan={4} className="sheet-section">General Information</th></tr>
              <tr>
                <td className="sheet-label">Employee&apos;s Name</td>
                <td>{employee.empName} ({employee.empId})</td>
                <td className="sheet-label">Trainer&apos;s Name</td>
                <td><input value={info.trainerName} onChange={(e) => setInfo({ ...info, trainerName: e.target.value })} /></td>
              </tr>
              <tr>
                <td className="sheet-label">Job Title</td>
                <td><input value={info.jobTitle} onChange={(e) => setInfo({ ...info, jobTitle: e.target.value })} /></td>
                <td className="sheet-label">Trainer&apos;s Job Title</td>
                <td><input value={info.trainerJob} onChange={(e) => setInfo({ ...info, trainerJob: e.target.value })} /></td>
              </tr>
              <tr>
                <td className="sheet-label">Department</td>
                <td>{employee.department?.deptName ?? ''}</td>
                <td className="sheet-label">Contact Information</td>
                <td><input value={info.trainerContact} onChange={(e) => setInfo({ ...info, trainerContact: e.target.value })} /></td>
              </tr>
            </tbody>
          </table>

          <table className="sheet-table">
            <thead>
              <tr><th colSpan={8} className="sheet-section">Training Details</th></tr>
              <tr className="sheet-colhead">
                <th>#</th>
                <th>Training Activity</th>
                <th>Date</th>
                <th>From (Time)</th>
                <th>To (Time)</th>
                <th>Total Hours</th>
                <th>Rating</th>
                <th>Stage</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rowCount }, (_, i) => {
                const r = stations[i]
                const inputs = (r && rowInputs[r.workStationCode]) || {}
                const letter = r ? RANK_LETTER[stageRank(r)] : null
                return (
                  <tr key={i}>
                    <td className="c">{i + 1}</td>
                    <td>
                      {r ? `${r.workStation?.workStationName ?? r.workStationCode} — ${r.area?.areaName ?? r.areaCode}` : ''}
                    </td>
                    <td className="c">{r ? fmtDate(r.tStartDate) : ''}</td>
                    <td>{r && <input type="time" value={inputs.from || ''} onChange={(e) => setRow(r.workStationCode, { from: e.target.value })} />}</td>
                    <td>{r && <input type="time" value={inputs.to || ''} onChange={(e) => setRow(r.workStationCode, { to: e.target.value })} />}</td>
                    <td className="c">{r ? hoursBetween(inputs.from, inputs.to) : ''}</td>
                    <td>{r && <input type="number" min="1" max="5" value={inputs.rating || ''} onChange={(e) => setRow(r.workStationCode, { rating: e.target.value })} />}</td>
                    <td className="c">
                      {letter && (
                        <span className={`stage-chip stage-${letter}`}><strong>{letter.toUpperCase()}</strong></span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <table className="sheet-table">
            <thead>
              <tr><th colSpan={EVAL.length} className="sheet-section">Performance Evaluation</th></tr>
              <tr className="sheet-colhead">
                {EVAL.map(([key, label]) => <th key={key}>{label}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                {EVAL.map(([key]) => (
                  <td key={key}>
                    <input type="number" min="1" max="5" value={evals[key] || ''}
                      onChange={(e) => setEvals({ ...evals, [key]: e.target.value })} />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
