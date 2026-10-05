import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})

// attach the JWT (set after login) to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, drop the stale token and tell the app to go back to login.
// This used to be `window.location.href = '/login'`, which forces a full
// browser page reload (losing all React state) - that's very likely what
// looked like "reloading after login": the very first authenticated request
// that 401s for any reason would hard-reload the whole page. A custom event
// lets App.jsx navigate with React Router instead, which is a normal SPA
// transition, not a reload.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.dispatchEvent(new Event('auth:unauthorized'))
    }
    return Promise.reject(err)
  }
)

export default api
