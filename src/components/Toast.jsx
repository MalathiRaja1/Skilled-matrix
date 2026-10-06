import { useEffect } from 'react'

export default function Toast({ message, type = 'error', onClose }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [message, onClose])

  if (!message) return null

  return (
    <div className={`toast ${type}`} role="alert">
      <span className="toast-icon">{type === 'error' ? '!' : '✓'}</span>
      <span className="toast-text">{message}</span>
      <button type="button" className="toast-close" onClick={onClose} aria-label="Close">×</button>
    </div>
  )
}