'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function MenusPage() {
  const [menus, setMenus] = useState<any[]>([])
  const [allItems, setAllItems] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [templateMap, setTemplateMap] = useState<Record<string, number>>({}) // itemId -> defaultQty

  const load = () =>
    Promise.all([api.getMenus(), api.getCategories(), api.getMenuItems()])
      .then(([m, c, items]) => { setMenus(m); setCategories(c); setAllItems(items) })
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditing(null); setName(''); setDescription(''); setTemplateMap({}); setError(''); setShowForm(true)
  }
  const openEdit = (m: any) => {
    setEditing(m)
    setName(m.name)
    setDescription(m.description || '')
    const map: Record<string, number> = {}
    for (const ti of (m.templateItems || [])) map[ti.menuItemId] = ti.defaultQty
    setTemplateMap(map)
    setError('')
    setShowForm(true)
  }

  const setTplQty = (id: string, val: string) => {
    const n = parseInt(val) || 0
    setTemplateMap(prev =>
      n > 0 ? { ...prev, [id]: n }
             : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== id))
    )
  }

  const handleSave = async () => {
    if (!name.trim()) { setError('Menu name is required.'); return }
    setSaving(true)
    const templateItems = Object.entries(templateMap).map(([menuItemId, defaultQty]) => ({ menuItemId, defaultQty }))
    const data = { name, description, templateItems }
    try {
      if (editing) await api.updateMenu(editing.id, data)
      else await api.createMenu(data)
      setShowForm(false)
      load()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Archive menu "${name}"? It will no longer appear in new orders.`)) return
    await api.deleteMenu(id)
    load()
  }

  const toggleExpand = (id: string) => setExpandedId(prev => prev === id ? null : id)

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menus</h1>
          <p className="text-sm text-gray-400 mt-0.5">Each menu has a template of default items &amp; quantities used to pre-fill orders.</p>
        </div>
        <button onClick={openNew} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700">
          ➕ New Menu
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl my-8">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">{editing ? 'Edit Menu' : 'New Menu'}</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Menu Name *</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="Menu A — Pizza Day" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="Short summary of what's included…" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Default Items &amp; Quantities
                  <span className="font-normal text-gray-400 ml-1">— used to pre-fill order forms</span>
                </label>
                {categories.map((cat: any) => (
                  cat.menuItems?.length > 0 && (
                    <div key={cat.id} className="mb-3">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">{cat.name}</p>
                      <div className="space-y-1.5">
                        {(cat.menuItems as any[]).map((item: any) => {
                          const qty = templateMap[item.id] || 0
                          return (
                            <div key={item.id} className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-colors text-sm ${qty > 0 ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100 bg-gray-50'}`}>
                              <span className={qty > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'}>{item.name}</span>
                              <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden">
                                <button type="button" onClick={() => setTplQty(item.id, String(Math.max(0, qty - 1)))}
                                  className="px-2.5 py-1 text-gray-500 hover:bg-gray-100 text-sm">−</button>
                                <input type="number" min={0} value={qty || ''}
                                  onChange={e => setTplQty(item.id, e.target.value)}
                                  className="w-12 text-center text-sm py-1 focus:outline-none" placeholder="0" />
                                <button type="button" onClick={() => setTplQty(item.id, String(qty + 1))}
                                  className="px-2.5 py-1 text-gray-500 hover:bg-gray-100 text-sm">+</button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium">
                {saving ? 'Saving…' : 'Save Menu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {menus.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🍽️</p>
          <p>No menus yet. Create your first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {menus.map(m => {
            const isExpanded = expandedId === m.id
            const templateItems: any[] = m.templateItems || []
            return (
              <div key={m.id} className={`bg-white border rounded-xl overflow-hidden transition-all ${!m.isActive ? 'opacity-60' : 'border-gray-200'}`}>
                <div className="px-5 py-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{m.name}</h3>
                      {!m.isActive && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Archived</span>}
                    </div>
                    {m.description && <p className="text-sm text-gray-500 mt-0.5">{m.description}</p>}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">{m._count?.orders ?? 0} orders</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-400">{templateItems.length} template items</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {templateItems.length > 0 && (
                      <button onClick={() => toggleExpand(m.id)}
                        className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-50">
                        {isExpanded ? '▲ Hide' : '▼ Items'}
                      </button>
                    )}
                    <button onClick={() => openEdit(m)}
                      className="text-xs text-gray-500 hover:text-blue-600 px-3 py-1.5 border border-gray-100 rounded-lg hover:border-blue-200 transition-colors">
                      Edit
                    </button>
                    {m.isActive && (
                      <button onClick={() => handleDelete(m.id, m.name)}
                        className="text-xs text-gray-400 hover:text-red-500 px-3 py-1.5 border border-gray-100 rounded-lg hover:border-red-200 transition-colors">
                        Archive
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && templateItems.length > 0 && (
                  <div className="px-5 pb-4 border-t border-gray-50 pt-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Default Template</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {templateItems.map((ti: any) => (
                        <div key={ti.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                          <span className="text-sm text-gray-700">{ti.menuItem.name}</span>
                          <div className="text-right ml-2">
                            <span className="text-sm font-semibold text-gray-900">{ti.defaultQty}</span>
                            {ti.menuItem.bulkQty > 1 && (
                              <span className="text-xs text-gray-400 ml-1">{ti.menuItem.unitLabel}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
