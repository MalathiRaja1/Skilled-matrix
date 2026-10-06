import { useEffect, useState } from 'react'
import api from '../api/client'
import { confirmEditPassword, deleteWithPassword, errorMessage, shrinkImage } from '../api/helpers'
import ExportBar from './ExportBar'
import Loader from './Loader'
import Toast from './Toast'
import Pagination from './Pagination'

const PAGE_SIZE = 10

const emptyRow = (columns) =>
  Object.fromEntries(columns.map((c) => [c.key, c.type === 'checkbox' ? false : '']))

const toInputDate = (v) => (v ? String(v).slice(0, 10) : '')

const applyCase = (value, mode = 'title') => {
  if (mode === 'none') return value
  if (mode === 'upper') return value.toUpperCase()
  return value.toLowerCase().replace(/(^|\s)\S/g, (ch) => ch.toUpperCase())
}

// Keeps only letters, numbers and spaces; collapses repeated spaces
const stripSpecial = (value) =>
  value.replace(/[^A-Za-z0-9 ]/g, '').replace(/\s{2,}/g, ' ').replace(/^\s/, '')

// Turns form state into what the API expects: only the real columns (no nested
// objects that came back from GET), blanks as null, and dates as UTC timestamps
// (Postgres rejects timezone-less dates like "2026-09-27").
const buildPayload = (columns, form, idField, editingId) => {
  const payload = {}
  columns.forEach((c) => {
    const v = form[c.key]
    if (c.type === 'checkbox') payload[c.key] = !!v
    else if (v === '' || v === undefined || v === null) payload[c.key] = null
    else if (c.type === 'date') payload[c.key] = `${v}T00:00:00Z`
    else payload[c.key] = v
  })
  if (editingId !== null) payload[idField] = editingId
  return payload
}

// Plain text for exports and the table - checkboxes/photos become Yes/No,
// dates become dd-only ISO, everything else as-is.
const cellText = (c, row) => {
  if (c.type === 'checkbox') return row[c.key] ? 'Yes' : 'No'
  if (c.type === 'photo') return row[c.key] ? 'Yes' : 'No'
  if (c.type === 'date') return toInputDate(row[c.key])
  return row[c.key] ?? ''
}

export default function MasterCrudPage({ config }) {
  const { title, endpoint, idField, columns } = config
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(emptyRow(columns))
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [previews, setPreviews] = useState({}) // column key -> local blob URL, for instant feedback
  const [uploading, setUploading] = useState({}) // column key -> bool
  const [options, setOptions] = useState({}) // column key -> [{value, label}] for dropdown fields
const [page, setPage] = useState(1)
const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    columns
      .filter((c) => c.type === 'select' && c.optionsEndpoint)
      .forEach((c) => {
        api.get(`/${c.optionsEndpoint}`)
          .then((res) => {
            const opts = res.data.map((row) => ({
              value: row[c.optionValue],
              label: `${row[c.optionValue]} — ${row[c.optionLabel]}`
            }))
            setOptions((o) => ({ ...o, [c.key]: opts }))
          })
          .catch(() => {})
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = () => {
    setLoading(true)
    api.get(`/${endpoint}`)
      .then((res) => setRows(res.data))
      .catch(() => setError('Could not load data.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [endpoint])

  const startEdit = (row) => {
    setEditingId(row[idField])
    setForm(
      Object.fromEntries(
        columns.map((c) => [
          c.key,
          c.type === 'date'
            ? toInputDate(row[c.key])
            : row[c.key] ?? (c.type === 'checkbox' ? false : '')
        ])
      )
    )
    setPreviews({})
    setError('')
  }
useEffect(() => {
  const last = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  if (page > last) setPage(last)
}, [rows.length, page])


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

  const cancelEdit = () => {
    setEditingId(null)
    setForm(emptyRow(columns))
    setPreviews({})
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    // Every field is mandatory (marked with * in the form).
    for (const c of columns) {
      if (c.type === 'checkbox') continue
      const value = form[c.key]
      if (value === '' || value === null || value === undefined) {
        return setError(`${c.label} is required.`)
      }
    }

    for (const c of columns) {
      if (c.type === 'phone') {
        const len = c.maxLength || 10
        const value = (form[c.key] || '').trim()
        if (!/^\d+$/.test(value) || value.length !== len) {
          return setError(`${c.label} must be exactly ${len} digits.`)
        }
      }
    }

    const payload = buildPayload(columns, form, idField, editingId)
    try {
      if (editingId !== null) {
        await api.put(`/${endpoint}/${editingId}`, payload)
      } else {
        await api.post(`/${endpoint}`, payload)
      }
      cancelEdit()
      load()
    } catch (err) {
      setError(errorMessage(err, 'Save failed.'))
    }
  }

  const remove = async (id) => {
    setError('')
    try {
      const done = await deleteWithPassword(`/${endpoint}/${id}`)
      if (done) load()
    } catch (err) {
      setError(errorMessage(err, 'Delete failed.'))
    }
  }

  // Dropdown choices: a fixed list (c.choices) or rows loaded from another master.
  // A saved value that is no longer in the list is still shown so it isn't lost.
  const selectOptions = (c) => {
    const base = c.choices
      ? c.choices.map((v) => ({ value: v, label: v }))
      : options[c.key] || []
    const current = form[c.key]
    return current && !base.some((o) => o.value === current)
      ? [{ value: current, label: String(current) }, ...base]
      : base
  }

  const handlePhotoChange = async (key, file) => {
    if (!file) return
    setPreviews((p) => ({ ...p, [key]: URL.createObjectURL(file) }))
    setUploading((u) => ({ ...u, [key]: true }))
    setError('')

    const data = new FormData()
    data.append('file', await shrinkImage(file))

    try {
      const res = await api.post('/uploads', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setForm((f) => ({ ...f, [key]: res.data.url }))
    } catch (err) {
      setError(errorMessage(err, 'Photo upload failed.'))
    } finally {
      setUploading((u) => ({ ...u, [key]: false }))
    }
  }

const exportRows = rows.map((row) =>
  Object.fromEntries(
    columns.map((c) => [c.key, c.type === 'photo' ? row[c.key] || '' : cellText(c, row)])
  )
)
  return (
<div className="master-form-card">
  <div className="master-form-title">
    {title}
  </div>
        <form className="master-form" onSubmit={submit}>

    {/* FIELDS */}
    <div className="master-fields">

      {columns.map((c) => (
        <div className="master-field" key={c.key}>

          <label className="master-field-label">
            {c.label}

            {c.type !== 'checkbox' && (
              <span className="required-star">*</span>
            )}
          </label>


          <div className="master-field-control">

            {/* CHECKBOX */}
            {c.type === 'checkbox' && (
              <input
                type="checkbox"
                checked={!!form[c.key]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [c.key]: e.target.checked
                  })
                }
              />
            )}


            {/* PHOTO */}
            {c.type === 'photo' && (
              <div className="master-photo-field">

                <img
                  className="master-photo-preview"
                  src={
                    previews[c.key] ||
                    form[c.key] ||
                    undefined
                  }
                  alt=""
                  style={{
                    display:
                      previews[c.key] ||
                      form[c.key]
                        ? 'block'
                        : 'none'
                  }}
                />

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  onChange={(e) =>
                    handlePhotoChange(
                      c.key,
                      e.target.files?.[0]
                    )
                  }
                />

                {uploading[c.key] && (
                  <span className="uploading-hint">
                    Uploading…
                  </span>
                )}

              </div>
            )}


            {/* SELECT */}
            {c.type === 'select' && (
              <select
                value={form[c.key] ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [c.key]: e.target.value
                  })
                }
              >
                <option value="">
                  -- Select --
                </option>

                {selectOptions(c).map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
            )}


            {/* TEXT / DATE / PHONE */}
            {c.type !== 'checkbox' &&
              c.type !== 'photo' &&
              c.type !== 'select' && (
                <input
                  type={
                    c.type === 'date'
                      ? 'date'
                      : 'text'
                  }

                  inputMode={
                    c.type === 'phone'
                      ? 'numeric'
                      : undefined
                  }

                  maxLength={
                    c.type === 'phone'
                      ? c.maxLength || 10
                      : undefined
                  }

                placeholder={
  c.type === 'phone'
    ? `${c.maxLength || 10}-digit number`
    : c.type === 'date'
      ? undefined
      : c.placeholder || `Enter ${c.label.toLowerCase()}`
}

                  value={form[c.key] ?? ''}

                  disabled={
                    c.editableOnCreateOnly &&
                    editingId !== null
                  }

                  onChange={(e) => {

                    let v = e.target.value

if (c.type === 'phone') {
  v = v
    .replace(/\D/g, '')
    .slice(0, c.maxLength || 10)
} else if (c.type !== 'date') {
  v = applyCase(stripSpecial(v), c.textCase)
}
                    setForm({
                      ...form,
                      [c.key]: v
                    })
                  }}
                />
              )}

          </div>

        </div>
      ))}

    </div>


    {/* BUTTONS */}
    <div className="master-form-actions">

      <button
        type="submit"
        className="master-save-btn"
      >
        {editingId !== null
          ? 'Update'
          : 'Save'} ✓
      </button>


      <button
        type="button"
        className="master-clear-btn"
        onClick={cancelEdit}
      >
        Clear ↻
      </button>

    </div>


    {/* ERROR */}
  <Toast message={error} onClose={() => setError('')} />

  </form>

      <ExportBar title={title} columns={columns} rows={exportRows} />

        <div className="card table-wrap">
        {loading ? (
          <Loader />
        ) : rows.length === 0 ? (
          <p>No records yet — add the first one above.</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  {columns.map((c) => <th key={c.key}>{c.label}</th>)}
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, i) => (
                  <tr key={row[idField] ?? i}>
                    {columns.map((c) => (
                      <td key={c.key}>
                        {c.type === 'checkbox' && (row[c.key] ? '✓' : '')}
                        {c.type === 'photo' && row[c.key] && (
                          <img className="photo-thumb" src={row[c.key]} alt="" />
                        )}
                        {c.type === 'date' && toInputDate(row[c.key])}
                        {c.type !== 'checkbox' && c.type !== 'photo' && c.type !== 'date' &&
                          String(row[c.key] ?? '')}
                      </td>
                    ))}
                    <td>
                      <div className="row-actions">
                        <button type="button" className="icon-btn edit" title="Edit" onClick={() => tryEdit(row)}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                          </svg>
                        </button>
                        <button type="button" className="icon-btn delete" title="Delete" onClick={() => remove(row[idField])}>
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
