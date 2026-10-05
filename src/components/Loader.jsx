export default function Loader({ label = 'Loading…' }) {
  return (
    <div className="loader-wrap">
      <span className="loader-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
