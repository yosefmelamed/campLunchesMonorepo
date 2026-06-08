'use client'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'

interface Props { orderId?: string }

export default function OrderForm({ orderId }: Props) {
  const router = useRouter()
  const [sites, setSites] = useState<any[]>([])
  const [menus, setMenus] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [siteId, setSiteId] = useState('')
  const [menuId, setMenuId] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [itemMap, setItemMap] = useState<Record<string, number>>({})
  // menuItemId -> qty already covered by a bulk pre-order for this site+date
  const [bulkCoverage, setBulkCoverage] = useState<Record<string, number>>({})

  // Load initial data
  useEffect(() => {
    Promise.all([api.getSites(), api.getMenus(), api.getCategories()]).then(([s, m, c]) => {
      setSites(s.filter((x: any) => x.isActive))
      setMenus(m.filter((x: any) => x.isActive))
      setCategories(c)
    }).then(async () => {
      if (orderId) {
        const o = await api.getOrder(orderId)
        setSiteId(o.siteId)
        setMenuId(o.menuId)
        setDeliveryDate(o.deliveryDate.split('T')[0])
        setNotes(o.notes || '')
        const map: Record<string, number> = {}
        for (const item of o.items) map[item.menuItemId] = item.quantity
        setItemMap(map)
      }
    }).finally(() => setLoading(false))
  }, [orderId])

  // Fetch bulk coverage whenever site+date changes
  useEffect(() => {
    if (siteId && deliveryDate) {
      api.getBulkCoverage(siteId, deliveryDate).then(setBulkCoverage).catch(() => setBulkCoverage({}))
    } else {
      setBulkCoverage({})
    }
  }, [siteId, deliveryDate])

  // When a menu is selected, auto-populate from template (new orders only)
  const handleMenuChange = useCallback((newMenuId: string) => {
    setMenuId(newMenuId)
    if (orderId) return // don't override on edit
    const menu = menus.find((m: any) => m.id === newMenuId)
    if (!menu?.templateItems?.length) return
    const map: Record<string, number> = {}
    for (const ti of menu.templateItems) {
      map[ti.menuItemId] = ti.defaultQty
    }
    setItemMap(map)
  }, [menus, orderId])

  const allItems = categories.flatMap((c: any) => c.menuItems || [])

  const setQty = (id: string, val: string) => {
    const n = parseInt(val) || 0
    setItemMap(prev =>
      n > 0 ? { ...prev, [id]: n }
             : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== id))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!siteId || !menuId || !deliveryDate) { setError('Please fill in all required fields.'); return }
    const items = Object.entries(itemMap).map(([menuItemId, quantity]) => {
      const item = allItems.find((i: any) => i.id === menuItemId)
      const covered = bulkCoverage[menuItemId] || 0
      return { menuItemId, quantity, unitPrice: item?.price ?? 0, isBulkCovered: covered >= quantity }
    })
    if (items.length === 0) { setError('Add at least one item to the order.'); return }
    setSaving(true)
    try {
      if (orderId) {
        await api.updateOrder(orderId, { siteId, menuId, deliveryDate, notes, items })
      } else {
        await api.createOrder({ siteId, menuId, deliveryDate, notes, items })
      }
      router.push('/orders')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-64 text-gray-400">
      <div className="text-center"><div className="text-3xl mb-2">⏳</div><p>Loading…</p></div>
    </div>
  )

  const totalItems = Object.values(itemMap).reduce((a, b) => a + b, 0)
  const hasCoverage = Object.keys(bulkCoverage).length > 0
  const selectedMenu = menus.find((m: any) => m.id === menuId)

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{orderId ? 'Edit Order' : 'New Order'}</h1>
        <button type="button" onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
      </div>

      {error && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Order Details */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
        <h2 className="font-semibold text-gray-800 mb-4">Order Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site <span className="text-red-400">*</span></label>
            <select value={siteId} onChange={e => setSiteId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
              <option value="">Select a site…</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Menu <span className="text-red-400">*</span></label>
            <select value={menuId} onChange={e => handleMenuChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
              <option value="">Select a menu…</option>
              {menus.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            {selectedMenu?.description && (
              <p className="text-xs text-gray-400 mt-1">{selectedMenu.description}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date <span className="text-red-400">*</span></label>
            <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="Special instructions…" />
          </div>
        </div>
      </div>

      {/* Bulk coverage banner */}
      {hasCoverage && (
        <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
          <div className="flex items-center gap-2 font-semibold mb-2">
            <span>📦</span> Bulk Pre-Orders Active for This Site & Date
          </div>
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(bulkCoverage).map(([itemId, qty]) => {
              const item = allItems.find((i: any) => i.id === itemId)
              if (!item) return null
              return (
                <div key={itemId} className="flex items-center justify-between text-xs bg-white/60 rounded-lg px-3 py-1.5">
                  <span className="text-blue-700">{item.name}</span>
                  <span className="font-semibold text-blue-900">{qty} pre-ordered</span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-blue-600 mt-2">Items with sufficient bulk coverage are shown in blue below — their quantity in this order can be set to 0.</p>
        </div>
      )}

      {/* Items */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-800">Items</h2>
            {!orderId && menuId && (
              <p className="text-xs text-gray-400 mt-0.5">Pre-filled from menu template. Adjust as needed.</p>
            )}
          </div>
          {totalItems > 0 && (
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full font-medium">
              {totalItems} total units
            </span>
          )}
        </div>

        {categories.map((cat: any) => (
          cat.menuItems?.length > 0 && (
            <div key={cat.id} className="mb-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 pb-1 border-b border-gray-100">{cat.name}</h3>
              <div className="space-y-2">
                {cat.menuItems.map((item: any) => {
                  const qty = itemMap[item.id] || 0
                  const covered = bulkCoverage[item.id] || 0
                  const remaining = Math.max(0, qty - covered)
                  const fullyMet = covered > 0 && covered >= qty && qty > 0
                  const partiallyMet = covered > 0 && covered < qty && qty > 0

                  return (
                    <div key={item.id} className={`flex items-center gap-4 px-4 py-3 rounded-lg border transition-colors ${
                      fullyMet ? 'border-blue-200 bg-blue-50' :
                      partiallyMet ? 'border-amber-200 bg-amber-50' :
                      qty > 0 ? 'border-emerald-200 bg-emerald-50' :
                      'border-gray-100 bg-gray-50'
                    }`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-800">{item.name}</span>
                          {item.bulkQty > 1 && (
                            <span className="text-xs text-gray-400 bg-white border border-gray-100 px-2 py-0.5 rounded-full">
                              {item.unitLabel}
                            </span>
                          )}
                          {fullyMet && (
                            <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                              ✓ fully covered by bulk
                            </span>
                          )}
                          {partiallyMet && (
                            <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                              {covered} covered · {remaining} still needed
                            </span>
                          )}
                        </div>
                        {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {qty > 0 && item.bulkQty > 1 && (
                          <span className="text-xs text-emerald-600 whitespace-nowrap">
                            → {Math.ceil(qty / item.bulkQty)} {item.unitLabel}
                          </span>
                        )}
                        <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden">
                          <button type="button" onClick={() => setQty(item.id, String(Math.max(0, qty - 1)))}
                            className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 text-sm font-medium">−</button>
                          <input
                            type="number" min={0} value={qty || ''}
                            onChange={e => setQty(item.id, e.target.value)}
                            className="w-14 text-center text-sm py-1.5 focus:outline-none"
                            placeholder="0"
                          />
                          <button type="button" onClick={() => setQty(item.id, String(qty + 1))}
                            className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 text-sm font-medium">+</button>
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

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()}
          className="px-5 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="px-6 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium">
          {saving ? 'Saving…' : orderId ? 'Save Changes' : 'Create Order'}
        </button>
      </div>
    </form>
  )
}
