import ExcelJS from 'exceljs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useState } from 'react'

const abs = (u) => (u ? new URL(u, window.location.origin).href : '')

// url -> data URL (null if it can't be loaded)
const toDataUrl = async (url) => {
  if (!url) return null
  try {
    // no-store: the browser may have cached these photos earlier (from the grid's <img>)
    // without CORS headers, and would reuse that copy and fail the export
    const res = await fetch(abs(url), { mode: 'cors', cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result)
      r.onerror = () => resolve(null)
      r.readAsDataURL(blob)
    })
  } catch (err) {
    console.warn('Photo not exported:', url, err)
    return null
  }
}

// replace every photo url in rows with a data URL
const withPhotos = async (columns, rows) => {
  const photoKeys = columns.filter((c) => c.type === 'photo').map((c) => c.key)
  const images = {}
  await Promise.all(
    rows.flatMap((row, i) =>
      photoKeys.map(async (k) => {
        images[`${i}:${k}`] = await toDataUrl(row[k])
      })
    )
  )
  return { photoKeys, images }
}

const ico = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

export default function ExportBar({ title, columns, rows }) {
const [busy, setBusy] = useState(false)
 const exportExcel = async () => {
  if (busy) return
  setBusy(true)
  try {
    const { photoKeys, images } = await withPhotos(columns, rows)
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet(title.slice(0, 31))

    ws.columns = columns.map((c) => ({
      header: c.label,
      key: c.key,
      width: c.type === 'photo' ? 14 : 22
    }))
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005EB8' } }

    rows.forEach((row, i) => {
      const data = {}
      columns.forEach((c) => { data[c.key] = c.type === 'photo' ? '' : row[c.key] })
      const r = ws.addRow(data)
      if (photoKeys.length) r.height = 52

      photoKeys.forEach((k) => {
        const img = images[`${i}:${k}`]
        if (!img) return
        const ext = img.includes('image/png') ? 'png' : img.includes('image/gif') ? 'gif' : 'jpeg'
        const id = wb.addImage({ base64: img, extension: ext })
        const col = columns.findIndex((c) => c.key === k)
        ws.addImage(id, { tl: { col: col + 0.1, row: i + 1.1 }, ext: { width: 52, height: 62 } })
      })
    })

    const buf = await wb.xlsx.writeBuffer()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([buf]))
    a.download = `${title}.xlsx`
    a.click()
    URL.revokeObjectURL(a.href)
  } catch (err) {
    console.error('Excel export failed:', err)
    alert('Excel export failed: ' + (err?.message || err))
  } finally {
    setBusy(false)
  }
}

  const exportPdf = async () => {
    const { photoKeys, images } = await withPhotos(columns, rows)
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFontSize(14)
    doc.text(title, 14, 14)

    autoTable(doc, {
      startY: 20,
      head: [columns.map((c) => c.label)],
      body: rows.map((row) => columns.map((c) => (c.type === 'photo' ? '' : String(row[c.key] ?? '')))),
      headStyles: { fillColor: [0, 94, 184] },
      styles: { valign: 'middle', minCellHeight: photoKeys.length ? 16 : 8 },
      didDrawCell: (d) => {
        if (d.section !== 'body') return
        const col = columns[d.column.index]
        if (col.type !== 'photo') return
        const img = images[`${d.row.index}:${col.key}`]
        if (img) doc.addImage(img, d.cell.x + 2, d.cell.y + 1, 11, 14)
      }
    })
    doc.save(`${title}.pdf`)
  }

  const print = async () => {
    const { images } = await withPhotos(columns, rows)
    const head = columns.map((c) => `<th>${c.label}</th>`).join('')
    const body = rows
      .map((row, i) =>
        `<tr>${columns
          .map((c) =>
            c.type === 'photo'
              ? `<td>${images[`${i}:${c.key}`] ? `<img src="${images[`${i}:${c.key}`]}" style="width:36px;height:44px;object-fit:cover"/>` : ''}</td>`
              : `<td>${row[c.key] ?? ''}</td>`
          )
          .join('')}</tr>`
      )
      .join('')

    const w = window.open('', '_blank')
    w.document.write(`<html><head><title>${title}</title>
      <style>body{font-family:Segoe UI,Arial,sans-serif;padding:16px}
      table{border-collapse:collapse;width:100%;font-size:13px}
      th,td{border:1px solid #999;padding:5px 8px;text-align:left}
      th{background:#005eb8;color:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head>
      <body><h2>${title}</h2><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 300)
  }

  return (
    <div className="export-bar">
    <button
  type="button"
  className="export-btn excel"
  title={busy ? 'Exporting…' : 'Export to Excel'}
  onClick={exportExcel}
  disabled={busy}
  style={busy ? { opacity: 0.6, cursor: 'wait' } : undefined}
>
  <svg {...ico}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 8l8 8M16 8l-8 8" /></svg>
</button>
      <button type="button" className="export-btn pdf" title="Export to PDF" onClick={exportPdf}>
        <svg {...ico}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 14h6M9 17h4" /></svg>
      </button>
      <button type="button" className="export-btn print" title="Print" onClick={print}>
        <svg {...ico}><path d="M6 9V3h12v6" /><rect x="3" y="9" width="18" height="9" rx="2" /><path d="M6 14h12v7H6z" /></svg>
      </button>
    </div>
  )
}