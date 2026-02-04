'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

type Testimonial = { id: string; text: string; author: string }

export default function AdminTestimonialsClient() {
  const [items, setItems] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetch('/api/testimonials')
      .then((r) => r.json())
      .then((data) => { if (mounted) setItems(data) })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
    return () => { mounted = false }
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('Ta bort den här rekommendationen?')) return
    const res = await fetch('/api/testimonials', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    if (res.ok) setItems((s) => s.filter((it) => it.id !== id))
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin — Testimonials</h1>
        <Link href="/" className="text-sm text-slate-600 hover:underline">Tillbaka</Link>
      </div>

      <div className="mt-6">
        {loading ? (
          <p>Laddar…</p>
        ) : (
          <div className="space-y-4">
            {items.map((it) => (
              <div key={it.id} className="p-4 border rounded flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm">{it.text}</p>
                  <div className="text-xs mt-2 text-slate-500">— {it.author}</div>
                </div>
                <div>
                  <button onClick={() => handleDelete(it.id)} className="text-sm text-red-600">Ta bort</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
