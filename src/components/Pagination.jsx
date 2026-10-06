export default function Pagination({ page, total, pageSize = 10, onChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (total === 0) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  // show at most 5 page numbers around the current page
  const start = Math.max(1, Math.min(page - 2, pages - 4))
  const nums = []
  for (let n = start; n <= Math.min(pages, start + 4); n++) nums.push(n)

  return (
    <div className="pager">
      <span className="pager-info">Showing {from}–{to} of {total}</span>
      <div className="pager-btns">
        <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)}>‹ Prev</button>
        {nums.map((n) => (
          <button
            key={n}
            type="button"
            className={n === page ? 'active' : ''}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
        <button type="button" disabled={page === pages} onClick={() => onChange(page + 1)}>Next ›</button>
      </div>
    </div>
  )
}