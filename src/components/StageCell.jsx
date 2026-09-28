export const fmtDate = (v) => (v ? String(v).slice(0, 10).split('-').reverse().join('-') : '')

// Coloured chip for one stage (T / U / A / C) of an assignment row.
export default function StageCell({ stage, checked, start, end }) {
  if (!checked) return <span className="stage-empty">—</span>

  let text = ''
  if (stage === 't' || stage === 'u') text = `${fmtDate(start)} → ${end ? fmtDate(end) : 'ongoing'}`
  if (stage === 'a') text = `from ${fmtDate(start)}`
  if (stage === 'c') text = 'Approved'

  return (
    <span className={`stage-chip stage-${stage}`}>
      <strong>{stage.toUpperCase()}</strong>
      {text && <small>{text}</small>}
    </span>
  )
}
