'use client'

import React, { useEffect, useState } from 'react'

type Testimonial = {
  id: string
  text: string
  author: string
}

export default function TestimonialsClient() {
  const [items, setItems] = useState<Testimonial[]>([]) 
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const [author, setAuthor] = useState('')

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetch('/api/testimonials')
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return
        setItems(data)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
    return () => { mounted = false }
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!text || !author) return
    const res = await fetch('/api/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, author }),
    })
    if (res.ok) {
      const created = await res.json()
      setItems((s) => [created, ...s])
      setText('')
      setAuthor('')
    }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold">Testimonials</h3>
      <div className="mt-4 space-y-4">
        {loading ? (
          <p>Loading…</p>
        ) : (
          items.map((it) => (
            <blockquote key={it.id} className="p-4 border rounded">
              <p className="text-sm">{it.text}</p>
              <footer className="text-xs mt-2 text-muted-foreground">— {it.author}</footer>
            </blockquote>
          ))
        )}
      </div>

      <form onSubmit={handleAdd} className="mt-6 space-y-2">
        <div>
          <label className="block text-sm">Name</label>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} className="w-full border px-2 py-1 rounded" />
        </div>
        <div>
          <label className="block text-sm">Testimonial</label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full border px-2 py-1 rounded" />
        </div>
        <div>
          <button className="px-3 py-1 bg-sky-600 text-white rounded">Add</button>
        </div>
      </form>
    </div>
  )
}
