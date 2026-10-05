import { useEffect, useState } from 'react'
import api from '../api/client'
import StageCell from '../components/StageCell'
import ExportBar from '../components/ExportBar'
import Loader from '../components/Loader'

export default function Report() {
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/reports/employee-skill-matrix')
      .then((res) => setRows(res.data))
      .finally(() => setLoading(false))
  }, [])

  const filtered = rows.filter((r) =>
    `${r.empId} ${r.empName}`.toLowerCase().includes(filter.toLowerCase())
  )

  const exportRows = filtered.map((r) => ({
    empId: r.empId,
    empName: r.empName,
    area: r.areaName,
    station: r.workStationName,
    t: r.t ? 'Yes' : 'No',
    u: r.u ? 'Yes' : 'No',
    a: r.a ? 'Yes' : 'No',
    c: r.c ? 'Yes' : 'No'
  }))

  return (
    <div className="page">
      <h1>Employee Skill Matrix Report</h1>
      <input
        className="filter-input"
        placeholder="Filter by employee ID or name…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <ExportBar
        title="Employee Skill Matrix Report"
        columns={[
          { key: 'empId', label: 'Emp ID' },
          { key: 'empName', label: 'Emp Name' },
          { key: 'area', label: 'Area' },
          { key: 'station', label: 'Work Station' },
          { key: 't', label: 'T' },
          { key: 'u', label: 'U' },
          { key: 'a', label: 'A' },
          { key: 'c', label: 'C' }
        ]}
        rows={exportRows}
      />

      <div className="card table-wrap">
        {loading ? (
          <Loader />
        ) : (
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
        )}
      </div>
    </div>
  )
}
