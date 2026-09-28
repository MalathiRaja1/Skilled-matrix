import { useEffect, useState } from 'react'
import api from '../api/client'
import StageCell from '../components/StageCell'

export default function Report() {
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('')

  useEffect(() => {
    api.get('/reports/employee-skill-matrix').then((res) => setRows(res.data))
  }, [])

  const filtered = rows.filter((r) =>
    `${r.empId} ${r.empName}`.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="page">
      <h1>Employee Skill Matrix Report</h1>
      <input
        className="filter-input"
        placeholder="Filter by employee ID or name…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Emp ID</th><th>Emp Name</th><th>Area</th><th>Work Station</th>
              <th>T</th><th>U</th><th>A</th><th>C</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i}>
                <td>{r.empId}</td>
                <td>{r.empName}</td>
                <td>{r.areaName}</td>
                <td>{r.workStationName}</td>
                <td><StageCell stage="t" checked={r.t} start={r.tStartDate} end={r.tEndDate} /></td>
                <td><StageCell stage="u" checked={r.u} start={r.uStartDate} end={r.uEndDate} /></td>
                <td><StageCell stage="a" checked={r.a} start={r.aStartDate} /></td>
                <td><StageCell stage="c" checked={r.c} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
