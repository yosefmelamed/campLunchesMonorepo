'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { STATUS_COLORS, STATUS_LABELS, ALL_STATUSES, fmt } from '@/lib/utils'

export default function BulkOrdersPage() {
  const [bulkOrders, setBulkOrders] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [allItems, setAllItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form
  const [name, setName] = useState('')
  const [siteId, setSiteId] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [itemMap, setItemMap] = useState<Record<string, number>>({})

  const load = () =>
    Promise.all([api.getBulkOrders(), api.getSites(), api.getCategories(), api.getMenuItems()])
      .then(([b, s, c, items]) => { setBulkOrders(b); setSites(s.filter((x:any)=>x.isActive)); setCategories(c); setAllItems(items) })
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditing(null); setName(''); setSiteId(''); setDeliveryDate(''); setNotes(''); setItemMap({}); setError(''); setShowForm(true)
  }
  const openEdit = async (bo: any) => {
    setEditing(bo)
    setName(bo.name); setSiteId(bo.siteId || ''); setDeliveryDate(bo.deliveryDate.split('T')[0]); setNotes(bo.notes || '')
    const map: Record<string, number> = {}
    for (const i of bo.items) map[i.menuItemId] = i.quantity
    setItemMap(map); setError(''); setShowForm(true)
  }

  const setQty = (id: string, val: string) => {
    const n = parseInt(val) || 0
    setItemMap(prev => n > 0 ? { ...prev, [id]: n } : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== id)))
  }

  const handleSave = async () => {
    if (!name || !deliveryDate) { setError('Name and delivery date are required.'); return }
    const items = Object.entries(itemMap).map(([menuItemId, quantity]) => {
      const item = allItems.find((i: any) => i.id === menuItemId)
      return { menuItemId, quantity, unitPrice: item?.price ?? 0 }
    })
    if (items.length === 0) { setError('Add at least one item.'); return }
    setSaving(true)
    const data = { name, siteId: siteId || null, deliveryDate, notes, items }
    try {
      if (editing) await api.updateBulkOrder(editing.id, data)
      else await api.createBulkOrder(data)
      setShowForm(false); load()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete bulk order "${name}"?`)) return
    await api.deleteBulkOrder(id)
    load()
  }

  const handleStatusChange = async (id: string, status: string) => {
    await api.updateBulkOrderStatus(id, status)
    load()
  }

  const totalSelected = Object.values(itemMap).reduce((a, b) => a + b, 0)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Pre-Orders</h1>
          <p className="text-sm text-gray-400 mt-0.5">Pre-ship specific items to a site (or all sites) before the weekly menu orders. These quantities are automatically deducted from menu orders.</p>
        </div>
        <button onClick={openNew} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          📦 New Bulk Order
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bg-white rounded-xl w-full max-w-xl shadow-2xl my-8">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">{editing ? 'Edit Bulk Order' : 'New Bulk Pre-Order'}</h2>
              <p className="text-xs text-gray-400 mt-0.5">Select items to pre-ship. These will show as "covered" in subsequent menu orders.</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Order Name *</label>
                  <input value={name} onChange={e => setName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="e.g. Week of June 10 — OJ + Cereal Pre-ship" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Site</label>
                  <select value={siteId} onChange={e => setSiteId(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <option value="">All Sites</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Leave blank to apply to all sites</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Date *</label>
                  <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <input value={notes} onChange={e => setNotes(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Any special instructions…" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-600">Items to Pre-Ship</label>
                  {totalSelected > 0 && (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{totalSelected} units selected</span>
                  )}
                </div>
                {categories.map((cat: any) => (
                  cat.menuItems?.length > 0 && (
                    <div key={cat.id} className="mb-3">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">{cat.name}</p>
                      <div className="space-y-1.5">
                        {(cat.menuItems as any[]).map((item: any) => {
                          const qty = itemMap[item.id] || 0
                          return (
                            <div key={item.id} className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors ${qty > 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
                              <div className="flex-1">
                                <span className={`text-sm ${qty > 0 ? 'font-medium text-gray-900' : 'text-gray-600'}`}>{item.name}</span>
                                {item.bulkQty > 1 && <span className="text-xs text-gray-400 ml-2">{item.unitLabel}</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                {qty > 0 && item.bulkQty > 1 && (
                                  <span className="text-xs text-blue-600 whitespace-nowrap">→ {Math.ceil(qty / item.bulkQty)} {item.unitLabel}</span>
                                )}
                                <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden">
                                  <button type="button" onClick={() => setQty(item.id, String(Math.max(0, qty - 1)))}
                                    className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-100 text-sm">−</button>
                                  <input type="number" min={0} value={qty || ''} onChange={e => setQty(item.id, e.target.value)}
                                    className="w-14 text-center text-sm py-1.5 focus:outline-none" placeholder="0" />
                                  <button type="button" onClick={() => setQty(item.id, String(qty + 1))}
                                    className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-100 text-sm">+</button>
                                </div>
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
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
                {saving ? 'Saving…' : 'Save Bulk Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-gray-400">Loading…</div>
      ) : bulkOrders.length === 0 ? (
        <div className="p-12 text-center text-gray-400 bg-white border border-gray-200 rounded-xl">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-medium mb-1">No bulk pre-orders yet.</p>
          <p className="text-sm">Create a bulk order to pre-ship items like OJ or cereal at the start of the week.<br/>Those quantities will automatically show as "covered" in menu orders.</p>
          <button onClick={openNew} className="mt-4 px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            Create First Bulk Order
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bulkOrders.map(bo => {
            const grouped: Record<string, any[]> = {}
            for (const item of bo.items) {
              const cat = item.menuItem.category.name
              if (!grouped[cat]) grouped[cat] = []
              grouped[cat].push(item)
            }
            return (
              <div key={bo.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-bold text-gray-900">{bo.name}</h3>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[bo.status]}`}>
                        {STATUS_LABELS[bo.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                      <span>📅 {fmt(bo.deliveryDate)}</span>
                      <span>·</span>
                      <span>📍 {bo.site ? bo.site.name : 'All Sites'}</span>
                      {bo.notes && <><span>·</span><span className="italic">{bo.notes}</span></>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <select value={bo.status} onChange={e => handleStatusChange(bo.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none">
                      {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                    <button onClick={() => openEdit(bo)}
                      className="text-xs text-gray-500 hover:text-blue-600 px-3 py-1.5 border border-gray-100 rounded-lg hover:border-blue-200">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(bo.id, bo.name)}
                      className="text-xs text-gray-400 hover:text-red-500 px-3 py-1.5 border border-gray-100 rounded-lg hover:border-red-200">
                      Delete
                    </button>
                  </div>
                </div>
                <div className="px-5 pb-4 border-t border-gray-50 pt-3">
                  {Object.entries(grouped).map(([cat, items]) => (
                    <div key={cat} className="mb-3">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">{cat}</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(items as any[]).map(item => (
                          <div key={item.id} className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                            <span className="text-sm text-gray-800">{item.menuItem.name}</span>
                            <div className="text-right ml-2">
                              <span className="text-sm font-bold text-blue-900">{item.quantity}</span>
                              <span className="text-xs text-gray-400 ml-1">units</span>
                              {item.menuItem.bulkQty > 1 && (
                                <div className="text-xs text-blue-600 font-medium">
                                  {Math.ceil(item.quantity / item.menuItem.bulkQty)} × {item.menuItem.unitLabel}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
