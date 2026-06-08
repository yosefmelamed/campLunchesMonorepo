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
  const [error, setError] = useState('')

  const load = () => api.getSites().then(setSites).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', address: '', contactName: '', contactEmail: '', contactPhone: '', notes: '' })
    setError('')
    setShowForm(true)
  }
  const openEdit = (s: any) => { setEditing(s); setForm({ name: s.name, address: s.address || '', contactName: s.contactName || '', contactEmail: s.contactEmail || '', contactPhone: s.contactPhone || '', notes: s.notes || '' }); setError(''); setShowForm(true) }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Site name is required.'); return }
    setSaving(true)
    try {
      if (editing) await api.updateSite(editing.id, form)
      else await api.createSite(form)
      setShowForm(false); load()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleArchive = async (id: string, name: string) => {
    if (!confirm(`Archive site "${name}"? It will no longer appear in new orders.`)) return
    await api.deleteSite(id); load()
  }

  const FIELDS = [
    { label: 'Site Name *', key: 'name', type: 'text', placeholder: 'Lakeside Camp' },
    { label: 'Address', key: 'address', type: 'text', placeholder: '100 Lake Rd' },
    { label: 'Contact Name', key: 'contactName', type: 'text', placeholder: 'Sarah Cohen' },
    { label: 'Phone', key: 'contactPhone', type: 'tel', placeholder: '555-0101' },
    { label: 'Email', key: 'contactEmail', type: 'email', placeholder: 'sarah@camp.org' },
    { label: 'Notes', key: 'notes', type: 'text', placeholder: 'Gate code, special instructions…' },
  ]

  const active = sites.filter(s => s.isActive)
  const archived = sites.filter(s => !s.isActive)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sites</h1>
          <p className="text-sm text-gray-400 mt-0.5">{active.length} active site{active.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700">
          ➕ Add Site
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editing ? 'Edit Site' : 'New Site'}</h2>
            </div>
            <div className="px-6 py-5 space-y-3">
              {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
              {FIELDS.map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder}
                    value={(form as any)[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium">
                {saving ? 'Saving…' : 'Save Site'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? <div className="text-gray-400 py-8 text-center">Loading…</div> : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {active.map(s => (
              <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{s.name}</h3>
                    {s.address && <p className="text-xs text-gray-400 mt-1">📍 {s.address}</p>}
                    {s.contactName && <p className="text-xs text-gray-500 mt-1.5">👤 {s.contactName}</p>}
                    {s.contactPhone && <p className="text-xs text-gray-500">📞 {s.contactPhone}</p>}
                    {s.contactEmail && <p className="text-xs text-gray-500">✉️ {s.contactEmail}</p>}
                    {s.notes && <p className="text-xs text-gray-400 mt-2 italic border-t border-gray-50 pt-2">{s.notes}</p>}
                    <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-50">
                      <span className="text-xs text-gray-400">{s._count?.orders ?? 0} orders</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{s._count?.bulkOrders ?? 0} bulk orders</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 ml-3 shrink-0">
                    <button onClick={() => openEdit(s)} className="text-xs text-gray-400 hover:text-blue-600 px-2.5 py-1.5 border border-gray-100 rounded-lg hover:border-blue-200 text-center">Edit</button>
                    <button onClick={() => handleArchive(s.id, s.name)} className="text-xs text-gray-400 hover:text-red-500 px-2.5 py-1.5 border border-gray-100 rounded-lg hover:border-red-200 text-center">Archive</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {archived.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">Archived</p>
              <div className="grid grid-cols-2 gap-3">
                {archived.map(s => (
                  <div key={s.id} className="bg-white border border-gray-100 rounded-xl p-4 opacity-60">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-600">{s.name}</h3>
                        {s.contactName && <p className="text-xs text-gray-400 mt-0.5">{s.contactName}</p>}
                      </div>
                      <button onClick={() => api.updateSite(s.id, { isActive: true }).then(load)}
                        className="text-xs text-gray-400 hover:text-emerald-600 px-2 py-1 border border-gray-100 rounded hover:border-emerald-200">
                        Restore
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
