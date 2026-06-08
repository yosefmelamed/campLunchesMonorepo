'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function SitesPage() {
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', address: '', contactName: '', contactEmail: '', contactPhone: '', notes: '' })
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = () => api.getSites().then(setSites).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setForm({ name: '', address: '', contactName: '', contactEmail: '', contactPhone: '', notes: '' }); setShowForm(true) }
  const openEdit = (s: any) => { setEditing(s); setForm(s); setShowForm(true) }

  const handleSave = async () => {
    if (!form.name) return
    setSaving(true)
    if (editing) await api.updateSite(editing.id, form)
    else await api.createSite(form)
    setSaving(false)
    setShowForm(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Archive this site?')) return
    await api.deleteSite(id)
    load()
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sites</h1>
        <button onClick={openNew} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700">
          ➕ Add Site
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-bold text-gray-900 mb-4">{editing ? 'Edit Site' : 'New Site'}</h2>
            <div className="space-y-3">
              {[
                { label: 'Site Name *', key: 'name', type: 'text' },
                { label: 'Address', key: 'address', type: 'text' },
                { label: 'Contact Name', key: 'contactName', type: 'text' },
                { label: 'Phone', key: 'contactPhone', type: 'tel' },
                { label: 'Email', key: 'contactEmail', type: 'email' },
                { label: 'Notes', key: 'notes', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
              ))}
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
        <div className="grid grid-cols-2 gap-4">
          {sites.map(s => (
            <div key={s.id} className={`bg-white border rounded-xl p-5 ${!s.isActive ? 'opacity-50' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{s.name}</h3>
                  {s.address && <p className="text-xs text-gray-400 mt-0.5">📍 {s.address}</p>}
                  {s.contactName && <p className="text-xs text-gray-500 mt-1">👤 {s.contactName}</p>}
                  {s.contactPhone && <p className="text-xs text-gray-500">📞 {s.contactPhone}</p>}
                  {s.contactEmail && <p className="text-xs text-gray-500">✉️ {s.contactEmail}</p>}
                  {s.notes && <p className="text-xs text-gray-400 mt-2 italic">{s.notes}</p>}
                  <p className="text-xs text-gray-400 mt-2">{s._count?.orders ?? 0} orders</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(s)} className="text-xs text-gray-400 hover:text-blue-600">Edit</button>
                  {s.isActive && <button onClick={() => handleDelete(s.id)} className="text-xs text-gray-400 hover:text-red-600">Archive</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
