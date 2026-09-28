import api from './client'

// Readable message from an API error (server message, validation errors, or a fallback).
export const errorMessage = (err, fallback) => {
  const data = err.response?.data
  if (data?.message) return data.message
  if (data?.errors) return Object.values(data.errors).flat().join(' ')
  if (err.response?.status === 500) return 'Server error — check the backend console for details.'
  return fallback
}

// Small password dialog. Resolves to the typed password, or null if cancelled.
export function askPassword({
  title = 'Confirm delete',
  message = 'Enter the delete password to continue.',
  confirmLabel = 'Delete'
} = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay'
    overlay.innerHTML = `
      <form class="modal-card">
        <h3></h3>
        <p></p>
        <input type="password" placeholder="Password" autocomplete="off" />
        <div class="modal-actions">
          <button type="button" class="btn-secondary">Cancel</button>
          <button type="submit"></button>
        </div>
      </form>`
    overlay.querySelector('h3').textContent = title
    overlay.querySelector('p').textContent = message
    overlay.querySelector('button[type=submit]').textContent = confirmLabel
    document.body.appendChild(overlay)

    const form = overlay.querySelector('form')
    const input = overlay.querySelector('input')
    const close = (value) => {
      overlay.remove()
      resolve(value)
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault()
      close(input.value)
    })
    overlay.querySelector('.btn-secondary').addEventListener('click', () => close(null))
    overlay.addEventListener('mousedown', (e) => {
      if (e.target === overlay) close(null)
    })
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close(null)
    })
    input.focus()
  })
}

// Asks for the delete password, then deletes. Returns false if cancelled.
// Throws on failure (wrong password -> 403, record in use -> 409).
export async function deleteWithPassword(path) {
  const password = await askPassword()
  if (password === null) return false
  await api.delete(path, { headers: { 'X-Delete-Password': password } })
  return true
}

// Same, for a protected GET (used to view a user's password). Returns null if cancelled.
export async function getWithPassword(path, prompt) {
  const password = await askPassword(prompt)
  if (password === null) return null
  const res = await api.get(path, { headers: { 'X-Delete-Password': password } })
  return res.data
}

// Shrinks a photo to at most `maxSize` px (JPEG) before upload, so photos stay small in the
// database and the dashboard loads fast. Falls back to the original file if anything fails.
export async function shrinkImage(file, maxSize = 600) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
    return blob ? new File([blob], 'photo.jpg', { type: 'image/jpeg' }) : file
  } catch {
    return file
  }
}
