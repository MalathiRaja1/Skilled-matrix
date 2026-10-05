import { exportExcel, exportPdf, printRows } from '../api/exportUtils'

export default function ExportBar({ title, columns, rows }) {
  if (!rows || rows.length === 0) return null

  return (
    <div className="export-bar">
      <button type="button" className="export-btn excel" onClick={() => exportExcel(title, columns, rows)}>
        Excel
      </button>
      <button type="button" className="export-btn pdf" onClick={() => exportPdf(title, columns, rows)}>
        PDF
      </button>
      <button type="button" className="export-btn print" onClick={() => printRows(title, columns, rows)}>
        Print
      </button>
    </div>
  )
}
