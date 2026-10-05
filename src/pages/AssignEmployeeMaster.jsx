import { useEffect, useState } from 'react'
import api from '../api/client'
import { confirmEditPassword, deleteWithPassword, errorMessage } from '../api/helpers'
import StageCell from '../components/StageCell'
import ExportBar from '../components/ExportBar'
import Loader from '../components/Loader'

const today = () => {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
const toInput = (v) => (v ? String(v).slice(0, 10) : '')
const toApi = (v) => (v ? `${v}T00:00:00Z` : null)

const blank = {
  empId: '', areaCode: '', workStationCode: '',
  t: false, tStartDate: '', tEndDate: '',
  u: false, uStartDate: '', uEndDate: '',
  a: false, aStartDate: '',
  c: false
}

// Keeps the T -> U -> A -> C chain consistent: a stage is cleared as soon as the
// stage before it is no longer finished, and unticked stages lose their dates.
const normalize = (f) => {
  const n = { ...f }
  const now = today()
  if (!n.t) { n.tStartDate = ''; n.tEndDate = '' }
  if (!(n.t && n.tEndDate && n.tEndDate <= now)) n.u = false
  if (!n.u) { n.uStartDate = ''; n.uEndDate = '' }
  if (!(n.u && n.uEndDate && n.uEndDate <= now)) n.a = false
  if (!n.a) n.aStartDate = ''
  if (!(n.a && n.aStartDate)) n.c = false
  return n
}

export default function AssignEmployeeMaster() {
  const [rows, setRows] = useState([])
  const [employees, setEmployees] = useState([])
  const [areas, setAreas] = useState([])
  const [workStations, setWorkStations] = useState([])
  const [form, setForm] = useState(blank)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const loadRows = () => {
    setLoading(true)
    api.get('/assignemployees')
      .then((res) => setRows(res.data))
      .catch(() => setError('Could not load assignments.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadRows()
    api.get('/employees').then((r) => setEmployees(r.data)).catch(() => {})
    api.get('/areas').then((r) => setAreas(r.data)).catch(() => {})
    api.get('/workstations').then((r) => setWorkStations(r.data)).catch(() => {})
  }, [])

  const change = (patch) => setForm((f) => normalize({ ...f, ...patch }))

  // What is unlocked right now
  const now = today()
  const tDone = form.t && !!form.tEndDate && form.tEndDate <= now
  const uDone = form.u && !!form.uEndDate && form.uEndDate <= now
  const canU = tDone
  const canA = uDone
  const canC = form.a && !!form.aStartDate

  const stationOptions = workStations.filter((w) => !form.areaCode || w.areaCode === form.areaCode)

  const reset = () => {
    setEditingId(null)
    setForm(blank)
  }

  // Edit is password-locked: ask first, only load the row into the form if it checks out.
  const tryEdit = async (row) => {
    setError('')
    try {
      const ok = await confirmEditPassword()
      if (ok) startEdit(row)
    } catch (err) {
      setError(errorMessage(err, 'Incorrect password.'))
    }
  }

  const startEdit = (row) => {
    setEditingId(row.id)
    setError('')
    setForm({
      empId: row.empId, areaCode: row.areaCode, workStationCode: row.workStationCode,
      t: !!row.t, tStartDate: toInput(row.tStartDate), tEndDate: toInput(row.tEndDate),
      u: !!row.u, uStartDate: toInput(row.uStartDate), uEndDate: toInput(row.uEndDate),
      a: !!row.a, aStartDate: toInput(row.aStartDate),
      c: !!row.c
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.empId || !form.areaCode || !form.workStationCode)
      return setError('Select the employee, area and work station.')
    if (form.t && !form.tStartDate) return setError('Enter the T start date.')
    if (form.u && !form.uStartDate) return setError('Enter the U start date.')
    if (form.a && !form.aStartDate) return setError('Enter the A start date.')

    const payload = {
      ...(editingId !== null ? { id: editingId } : {}),
      empId: form.empId,
      areaCode: form.areaCode,
      workStationCode: form.workStationCode,
      t: form.t, tStartDate: toApi(form.tStartDate), tEndDate: toApi(form.tEndDate),
      u: form.u, uStartDate: toApi(form.uStartDate), uEndDate: toApi(form.uEndDate),
      a: form.a, aStartDate: toApi(form.aStartDate),
      c: form.c
    }

    try {
      if (editingId !== null) await api.put(`/assignemployees/${editingId}`, payload)
      else await api.post('/assignemployees', payload)
      reset()
      loadRows()
    } catch (err) {
      setError(errorMessage(err, 'Save failed.'))
    }
  }

  const remove = async (id) => {
    setError('')
    try {
      const done = await deleteWithPassword(`/assignemployees/${id}`)
      if (done) loadRows()
    } catch (err) {
      setError(errorMessage(err, 'Delete failed.'))
    }
  }

  return (
    <div className="page">
      <h1>Assign Employee Master</h1>

      <form className="card" onSubmit={submit}>
        <div className="form-grid">
          <label>
            Employee<span className="required-star">*</span>
            <select value={form.empId} onChange={(e) => change({ empId: e.target.value })}>
              <option value="">-- Select --</option>
              {employees.map((e) => (
                <option key={e.empId} value={e.empId}>{e.empId} — {e.empName}</option>
              ))}
            </select>
          </label>
          <label>
            Area<span className="required-star">*</span>
            <select
              value={form.areaCode}
              onChange={(e) => change({ areaCode: e.target.value, workStationCode: '' })}
            >
              <option value="">-- Select --</option>
              {areas.map((a) => (
                <option key={a.areaCode} value={a.areaCode}>{a.areaCode} — {a.areaName}</option>
              ))}
            </select>
          </label>
          <label>
            Work Station<span className="required-star">*</span>
            <select
              value={form.workStationCode}
              onChange={(e) => change({ workStationCode: e.target.value })}
            >
              <option value="">-- Select --</option>
              {stationOptions.map((w) => (
                <option key={w.workStationCode} value={w.workStationCode}>
                  {w.workStationCode} — {w.workStationName}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="stage-row">
          {/* T */}
          <div className="stage-box stage-t">
            <label className="stage-title">
              <input type="checkbox" checked={form.t} onChange={(e) => change({ t: e.target.checked })} />
              <span><strong>T</strong> Training plan<small>Primary / secondary job</small></span>
            </label>
            <div className="stage-dates">
              <label>
                Start date
                <input type="date" value={form.tStartDate} disabled={!form.t}
                  onChange={(e) => change({ tStartDate: e.target.value })} />
              </label>
              <label>
                End date
                <input type="date" value={form.tEndDate} disabled={!form.t}
                  min={form.tStartDate || undefined}
                  onChange={(e) => change({ tEndDate: e.target.value })} />
              </label>
            </div>
          </div>

          {/* U */}
          <div className={`stage-box stage-u ${!canU && !form.u ? 'locked' : ''}`}>
            <label className="stage-title">
              <input type="checkbox" checked={form.u} disabled={!canU && !form.u}
                onChange={(e) => change({ u: e.target.checked })} />
              <span><strong>U</strong> Under training<small>Perform under supervision</small></span>
            </label>
            <div className="stage-dates">
              <label>
                Start date
                <input type="date" value={form.uStartDate} disabled={!form.u}
                  min={form.tEndDate || undefined}
                  onChange={(e) => change({ uStartDate: e.target.value })} />
              </label>
              <label>
                End date
                <input type="date" value={form.uEndDate} disabled={!form.u}
                  min={form.uStartDate || undefined}
                  onChange={(e) => change({ uEndDate: e.target.value })} />
              </label>
            </div>
            {!canU && !form.u && (
              <p className="stage-hint">
                {form.t ? 'Unlocks once the T end date has been reached.' : 'Unlocks after T is completed.'}
              </p>
            )}
          </div>

          {/* A */}
          <div className={`stage-box stage-a ${!canA && !form.a ? 'locked' : ''}`}>
            <label className="stage-title">
              <input type="checkbox" checked={form.a} disabled={!canA && !form.a}
                onChange={(e) => change({ a: e.target.checked })} />
              <span><strong>A</strong> Authorised<small>Authorised to perform task</small></span>
            </label>
            <div className="stage-dates">
              <label>
                Start date
                <input type="date" value={form.aStartDate} disabled={!form.a}
                  min={form.uEndDate || undefined}
                  onChange={(e) => change({ aStartDate: e.target.value })} />
              </label>
            </div>
            {!canA && !form.a && (
              <p className="stage-hint">
                {form.u ? 'Unlocks once the U end date has been reached.' : 'Unlocks after U is completed.'}
              </p>
            )}
          </div>

          {/* C */}
          <div className={`stage-box stage-c ${!canC && !form.c ? 'locked' : ''}`}>
            <label className="stage-title">
              <input type="checkbox" checked={form.c} disabled={!canC && !form.c}
                onChange={(e) => change({ c: e.target.checked })} />
              <span><strong>C</strong> Competent<small>Competent to train others</small></span>
            </label>
            <p className="stage-hint">
              {form.c ? 'Approved.' : canC ? 'Tick to approve this person.' : 'Unlocks after the A start date is entered.'}
            </p>
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: 16 }}>
          <button type="submit">{editingId !== null ? 'Update' : 'Add'}</button>
          {editingId !== null && <button type="button" onClick={reset}>Cancel</button>}
        </div>
        {error && <p className="error" style={{ marginTop: 10 }}>{error}</p>}
      </form>

      <ExportBar
        title="Assign Employee Master"
        columns={[
          { key: 'emp', label: 'Employee' },
          { key: 'area', label: 'Area' },
          { key: 'station', label: 'Work Station' },
          { key: 't', label: 'T' },
          { key: 'u', label: 'U' },
          { key: 'a', label: 'A' },
          { key: 'c', label: 'C' }
        ]}
        rows={rows.map((r) => ({
          emp: `${r.empId} — ${r.employee?.empName ?? ''}`,
          area: r.area?.areaName ?? r.areaCode,
          station: r.workStation?.workStationName ?? r.workStationCode,
          t: r.t ? 'Yes' : 'No',
          u: r.u ? 'Yes' : 'No',
          a: r.a ? 'Yes' : 'No',
          c: r.c ? 'Yes' : 'No'
        }))}
      />

      <div className="card table-wrap">
        {loading ? (
          <Loader />
        ) : rows.length === 0 ? (
          <p>No assignments yet — add the first one above.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Employee</th><th>Area</th><th>Work Station</th>
                <th>T</th><th>U</th><th>A</th><th>C</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.empId} — {r.employee?.empName}</td>
                  <td>{r.area?.areaName ?? r.areaCode}</td>
                  <td>{r.workStation?.workStationName ?? r.workStationCode}</td>
                  <td><StageCell stage="t" checked={r.t} start={r.tStartDate} end={r.tEndDate} /></td>
                  <td><StageCell stage="u" checked={r.u} start={r.uStartDate} end={r.uEndDate} /></td>
                  <td><StageCell stage="a" checked={r.a} start={r.aStartDate} /></td>
                  <td><StageCell stage="c" checked={r.c} /></td>
                  <td className="row-actions">
                    <button onClick={() => tryEdit(r)}>Edit</button>
                    <button onClick={() => remove(r.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
