'use client'

import { useState } from 'react'

interface ExportButtonProps {
  type: 'campaigns' | 'accounts'
}

export default function ExportButton({ type }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  async function handleExport(format: 'json' | 'csv') {
    setExporting(true)
    try {
      const res = await fetch(`/api/reports?type=${type}&format=${format}`)
      if (format === 'csv') {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}.csv`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        const data = await res.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (e) {
      console.error('Export failed', e)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="relative group">
      <button
        disabled={exporting}
        className="px-3 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
      >
        {exporting ? 'Exporting...' : 'Export'}
      </button>
      <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
        <button
          onClick={() => handleExport('csv')}
          className="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-t-lg"
        >
          CSV
        </button>
        <button
          onClick={() => handleExport('json')}
          className="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-b-lg"
        >
          JSON
        </button>
      </div>
    </div>
  )
}
