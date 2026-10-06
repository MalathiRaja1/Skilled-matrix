import { useEffect, useState } from 'react'
import api from '../api/client'
import { confirmEditPassword, deleteWithPassword, errorMessage } from '../api/helpers'
import ExportBar from '../components/ExportBar'
import Loader from '../components/Loader'
import Toast from '../components/Toast'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 10
const today = () => {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
const toInput = (v) => (v ? String(v).slice(0, 10) : '')
const toApi = (v) => (v ? `${v}T00:00:00Z` : null)
const fmt = (v) => (v ? String(v).slice(0, 10).split('-').reverse().join('-') : '')

const STAGE_LABEL = {
  t: 'Training plan',
  u: 'Under training',
  a: 'Authorised',
  c: 'Competent'
}

// Grid chip: "T (Training plan)" + dates underneath
function StageChip({ stage, checked, start, end }) {
  if (!checked) return <span className="stage-empty">—</span>
  let sub = ''
  if (stage === 't' || stage === 'u') sub = `${fmt(start)} → ${fmt(end)}`
  else if (stage === 'a') sub = `from ${fmt(start)}`
  else sub = 'Approved'
  return (
    <span className={`stage-chip stage-${stage}`}>
      <strong>{stage.toUpperCase()} ({STAGE_LABEL[stage]})</strong>
      <small>{sub}</small>
    </span>
  )
}





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

    const [page, setPage] = useState(1)
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // if the last row of a page is deleted, step back one page

    useEffect(() => {
    const last = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
    if (page > last) setPage(last)
  }, [rows.length, page])

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
    setError('')
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
    <div className="master-form-card">
      <div className="master-form-title">Assign Employee Master</div>

      <form className="master-form" onSubmit={submit}>
        <div className="master-fields">
          <div className="master-field">
            <label className="master-field-label">
              Employee<span className="required-star">*</span>
            </label>
            <div className="master-field-control">
              <select value={form.empId} onChange={(e) => change({ empId: e.target.value })}>
                <option value="">-- Select --</option>
                {employees.map((e) => (
                  <option key={e.empId} value={e.empId}>{e.empId} — {e.empName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="master-field">
            <label className="master-field-label">
              Area<span className="required-star">*</span>
            </label>
            <div className="master-field-control">
              <select
                value={form.areaCode}
                onChange={(e) => change({ areaCode: e.target.value, workStationCode: '' })}
              >
                <option value="">-- Select --</option>
                {areas.map((a) => (
                  <option key={a.areaCode} value={a.areaCode}>{a.areaCode} — {a.areaName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="master-field">
            <label className="master-field-label">
              Work Station<span className="required-star">*</span>
            </label>
            <div className="master-field-control">
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
            </div>
          </div>
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

        <div className="master-form-actions">
          <button type="submit" className="master-save-btn">
            {editingId !== null ? 'Update' : 'Save'} ✓
          </button>
          <button type="button" className="master-clear-btn" onClick={reset}>
            Clear ↻
          </button>
        </div>

        <Toast message={error} onClose={() => setError('')} />
      </form>

      <ExportBar
        title="Assign Employee Master"
        columns={[
          { key: 'emp', label: 'Employee' },
          { key: 'area', label: 'Area' },
          { key: 'station', label: 'Work Station' },
          { key: 't', label: 'T (Training plan)' },
          { key: 'u', label: 'U (Under training)' },
          { key: 'a', label: 'A (Authorised)' },
          { key: 'c', label: 'C (Competent)' }
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
          <>
          <table>
            <thead>
              <tr>
         <th>Employee</th><th>Area</th><th>Work Station</th>
<th>T (Training plan)</th>
<th>U (Under training)</th>
<th>A (Authorised)</th>
<th>C (Competent To Trained Others)</th>
<th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => (
                <tr key={r.id}>
                  <td>{r.empId} — {r.employee?.empName}</td>
                  <td>{r.area?.areaName ?? r.areaCode}</td>
                  <td>{r.workStation?.workStationName ?? r.workStationCode}</td>
                  <td><StageChip stage="t" checked={r.t} start={r.tStartDate} end={r.tEndDate} /></td>
                  <td><StageChip stage="u" checked={r.u} start={r.uStartDate} end={r.uEndDate} /></td>
                  <td><StageChip stage="a" checked={r.a} start={r.aStartDate} /></td>
                  <td><StageChip stage="c" checked={r.c} /></td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="icon-btn edit" title="Edit" onClick={() => tryEdit(r)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                        </svg>
                      </button>
                      <button type="button" className="icon-btn delete" title="Delete" onClick={() => remove(r.id)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} total={rows.length} pageSize={PAGE_SIZE} onChange={setPage} />
             </>
        )}
      </div>
    </div>
  )
}
