import { useEffect, useState } from 'react'
import api from '../api/client'
import { deleteWithPassword, errorMessage, getWithPassword } from '../api/helpers'
import ExportBar from '../components/ExportBar'
import Loader from '../components/Loader'
import Toast from '../components/Toast'
import Pagination from '../components/Pagination'
const PAGE_SIZE = 10

const blank = { deptCode: '', userName: '', password: '', confirmPassword: '', status: 'Active' }

export default function UserCreation() {
  const [departments, setDepartments] = useState([])
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(blank)
  const [revealed, setRevealed] = useState({}) // user id -> password text (after "Show")
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
const [page, setPage] = useState(1)


const pageUsers = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const loadUsers = () =>
    api.get('/auth/users')
      .then((res) => setUsers(res.data))
      .catch(() => setError('Could not load users.'))
      .finally(() => setLoading(false))

  useEffect(() => {
    api.get('/departments').then((res) => setDepartments(res.data))
    loadUsers()
  }, [])

useEffect(() => {
  const last = Math.max(1, Math.ceil(users.length / PAGE_SIZE))
  if (page > last) setPage(last)
}, [users.length, page])




  const reset = () => {
    setForm(blank)
    setError('')
    setSuccess('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.deptCode) return setError('Select a department.')
    if (!form.userName.trim()) return setError('Enter a username.')
    if (!form.password) return setError('Enter a password.')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.')
    if (!form.status) return setError('Select a status.')

    try {
      await api.post('/auth/register', form)
      setSuccess(`User "${form.userName}" created.`)
      setForm(blank)
      loadUsers()
    } catch (err) {
      setError(errorMessage(err, 'Could not create user.'))
    }
  }

  const remove = async (id) => {
    setError('')
    setSuccess('')
    try {
      const done = await deleteWithPassword(`/auth/users/${id}`)
      if (done) loadUsers()
    } catch (err) {
      setError(errorMessage(err, 'Delete failed.'))
    }
  }

  const reveal = async (id) => {
    setError('')
    try {
      const data = await getWithPassword(`/auth/users/${id}/password`, {
        title: 'View password',
        message: 'Enter the admin password to view this password.',
        confirmLabel: 'View'
      })
      if (data) setRevealed((r) => ({ ...r, [id]: data.password }))
    } catch (err) {
      setError(errorMessage(err, 'Could not load the password.'))
    }
  }

  const hide = (id) =>
    setRevealed((r) => {
      const { [id]: _hidden, ...rest } = r
      return rest
    })

  return (
    <div className="master-form-card">
      <div className="master-form-title">User Creation</div>

      <form className="master-form" onSubmit={submit}>
        <div className="master-fields">
          <div className="master-field">
            <label className="master-field-label">
              Department<span className="required-star">*</span>
            </label>
            <div className="master-field-control">
              <select
                value={form.deptCode}
                onChange={(e) => setForm({ ...form, deptCode: e.target.value })}
              >
                <option value="">-- Select --</option>
                {departments.map((d) => (
                  <option key={d.deptCode} value={d.deptCode}>
                    {d.deptCode} — {d.deptName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="master-field">
            <label className="master-field-label">
              Username<span className="required-star">*</span>
            </label>
            <div className="master-field-control">
             <input
  type="text"
  name="new-user-name"
  autoComplete="off"
  readOnly
  onFocus={(e) => e.target.removeAttribute('readonly')}
  value={form.userName}
  onChange={(e) => setForm({ ...form, userName: e.target.value })}
/>
            </div>
          </div>

          <div className="master-field">
            <label className="master-field-label">
              Status<span className="required-star">*</span>
            </label>
            <div className="master-field-control">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="master-field">
            <label className="master-field-label">
              Password<span className="required-star">*</span>
            </label>
            <div className="master-field-control">
            <input
  type="password"
  name="new-user-password"
  autoComplete="new-password"
  readOnly
  onFocus={(e) => e.target.removeAttribute('readonly')}
  value={form.password}
  onChange={(e) => setForm({ ...form, password: e.target.value })}
/>
            </div>
          </div>

          <div className="master-field">
            <label className="master-field-label">
              Confirm Password<span className="required-star">*</span>
            </label>
            <div className="master-field-control">
              <input
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="master-form-actions">
          <button type="submit" className="master-save-btn">Save ✓</button>
          <button type="button" className="master-clear-btn" onClick={reset}>Clear ↻</button>
        </div>

<Toast message={error} onClose={() => setError('')} />
<Toast message={success} type="success" onClose={() => setSuccess('')} />
      </form>

      <ExportBar
        title="Users"
        columns={[
          { key: 'dept', label: 'Department' },
          { key: 'userName', label: 'Username' },
          { key: 'status', label: 'Status' }
        ]}
        rows={users.map((u) => ({ dept: `${u.deptCode} — ${u.deptName}`, userName: u.userName, status: u.status }))}
      />

      <div className="card table-wrap">
        {loading ? (
          <Loader />
        ) : users.length === 0 ? (
          <p>No active users.</p>
        ) : (
           <>
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Username</th>
                <th>Status</th>
                <th>Password</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
          {pageUsers.map((u) => ( 
                <tr key={u.id}>
                  <td>{u.deptCode} — {u.deptName}</td>
                  <td>{u.userName}</td>
                  <td>{u.status}</td>
                  <td>
                    {revealed[u.id] !== undefined ? (
                      <>
                        <code>{revealed[u.id]}</code>{' '}
                        <button type="button" className="link-btn" onClick={() => hide(u.id)}>Hide</button>
                      </>
                    ) : u.hasPassword ? (
                      <>
                        <span className="pw-mask">••••••••</span>{' '}
                        <button type="button" className="link-btn" onClick={() => reveal(u.id)}>Show</button>
                      </>
                    ) : (
                      <span className="muted">not stored</span>
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="icon-btn delete" title="Delete" onClick={() => remove(u.id)}>
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
<Pagination page={page} total={users.length} pageSize={PAGE_SIZE} onChange={setPage} />         </>
        )}
      </div>
    </div>
  )
}
