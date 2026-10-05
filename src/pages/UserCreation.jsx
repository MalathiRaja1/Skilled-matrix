import { useEffect, useState } from 'react'
import api from '../api/client'
import { deleteWithPassword, errorMessage, getWithPassword } from '../api/helpers'
import ExportBar from '../components/ExportBar'
import Loader from '../components/Loader'

const blank = { deptCode: '', userName: '', password: '', confirmPassword: '', status: 'Active' }

export default function UserCreation() {
  const [departments, setDepartments] = useState([])
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(blank)
  const [revealed, setRevealed] = useState({}) // user id -> password text (after "Show")
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)

  const loadUsers = () =>
    api.get('/auth/users')
      .then((res) => setUsers(res.data))
      .catch(() => setError('Could not load users.'))
      .finally(() => setLoading(false))

  useEffect(() => {
    api.get('/departments').then((res) => setDepartments(res.data))
    loadUsers()
  }, [])

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
    <div className="page">
      <h1>User Creation</h1>

      <form className="card form-grid" onSubmit={submit}>
        <label>
          Department<span className="required-star">*</span>
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
        </label>

        <label>
          Username<span className="required-star">*</span>
          <input
            type="text"
            value={form.userName}
            onChange={(e) => setForm({ ...form, userName: e.target.value })}
          />
        </label>

        <label>
          Password<span className="required-star">*</span>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>

        <label>
          Confirm Password<span className="required-star">*</span>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          />
        </label>

        <label>
          Status<span className="required-star">*</span>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </label>

        <div className="form-actions">
          <button type="submit">Create User</button>
        </div>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
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

      <div className="card">
        {loading ? (
          <Loader />
        ) : users.length === 0 ? (
          <p>No active users.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Username</th>
                <th>Status</th>
                <th>Password</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
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
                  <td className="row-actions">
                    <button onClick={() => remove(u.id)}>Delete</button>
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
