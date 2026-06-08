'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function MenusPage() {
  const [menus, setMenus] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  const load = () => api.getMenus().then(setMenus).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setForm({ name: '', description: '' }); setShowForm(true) }
  const openEdit = (m: any) => { setEditing(m); setForm(m); setShowForm(true) }

  const handleSave = async () => {
    if (!form.name) return
    setSaving(true)
    if (editing) await api.updateMenu(editing.id, form)
    else await api.createMenu(form)
    setSaving(false)
    setShowForm(false)
    load()
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Menus</h1>
        <button onClick={openNew} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700">➕ Add Menu</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-bold text-gray-900 mb-4">{editing ? 'Edit Menu' : 'New Menu'}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Menu Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? <div className="text-gray-400">Loading…</div> : (
        <div className="space-y-3">
          {menus.map(m => (
            <div key={m.id} className={`bg-white border rounded-xl p-5 flex items-center justify-between ${!m.isActive ? 'opacity-50' : 'border-gray-200'}`}>
              <div>
                <h3 className="font-semibold text-gray-900">{m.name}</h3>
                {m.description && <p className="text-sm text-gray-500 mt-0.5">{m.description}</p>}
                <p className="text-xs text-gray-400 mt-1">{m._count?.orders ?? 0} orders</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(m)} className="text-sm text-gray-400 hover:text-blue-600 px-3 py-1.5 border border-gray-100 rounded-lg hover:border-blue-200">Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
