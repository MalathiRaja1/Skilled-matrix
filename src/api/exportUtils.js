import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// columns: [{ key, label }]   rows: plain objects already in display-ready form
// (e.g. checkboxes already turned into "Yes"/"No" - see each page's own mapping).

export function exportExcel(filename, columns, rows) {
  const data = rows.map((r) => Object.fromEntries(columns.map((c) => [c.label, r[c.key]])))
  const sheet = XLSX.utils.json_to_sheet(data)
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, 'Sheet1')
  XLSX.writeFile(book, `${filename}.xlsx`)
}

export function exportPdf(title, columns, rows) {
  const doc = new jsPDF({ orientation: columns.length > 6 ? 'landscape' : 'portrait' })
  doc.setFontSize(14)
  doc.text(title, 14, 16)
  autoTable(doc, {
    startY: 22,
    head: [columns.map((c) => c.label)],
    body: rows.map((r) => columns.map((c) => String(r[c.key] ?? ''))),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 94, 184] }
  })
  doc.save(`${title.replace(/\s+/g, '_')}.pdf`)
}

export function printRows(title, columns, rows) {
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) return

  const style = `
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #1c2530; }
    h1 { font-size: 18px; margin: 0 0 14px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #999; padding: 6px 8px; text-align: left; }
    th { background: #e8eef6; }
  `
  const head = columns.map((c) => `<th>${c.label}</th>`).join('')
  const body = rows
    .map((r) => `<tr>${columns.map((c) => `<td>${r[c.key] ?? ''}</td>`).join('')}</tr>`)
    .join('')

  win.document.write(
    `<html><head><title>${title}</title><style>${style}</style></head>` +
    `<body><h1>${title}</h1><table><thead><tr>${head}</tr></thead>` +
    `<tbody>${body}</tbody></table></body></html>`
  )
  win.document.close()
  win.focus()
  win.print()
}
