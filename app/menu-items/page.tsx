'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function MenuItemsPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [showCatForm, setShowCatForm] = useState(false)
  const [editingCat, setEditingCat] = useState<any>(null)
  const [catForm, setCatForm] = useState({ name: '', sortOrder: 0 })
  const [form, setForm] = useState({ name: '', description: '', unitLabel: 'each', bulkQty: '1', price: '0', categoryId: '' })
  const [saving, setSaving] = useState(false)

  const load = () => api.getCategories().then(setCategories).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openNewItem = () => {
    setEditingItem(null)
    setForm({ name: '', description: '', unitLabel: 'each', bulkQty: '1', price: '0', categoryId: categories[0]?.id || '' })
    setShowForm(true)
  }
  const openEditItem = (item: any) => {
    setEditingItem(item)
    setForm({ ...item, bulkQty: String(item.bulkQty), price: String(item.price), categoryId: item.categoryId })
    setShowForm(true)
  }
  const openNewCat = () => { setEditingCat(null); setCatForm({ name: '', sortOrder: categories.length + 1 }); setShowCatForm(true) }
  const openEditCat = (c: any) => { setEditingCat(c); setCatForm({ name: c.name, sortOrder: c.sortOrder }); setShowCatForm(true) }

  const handleSaveItem = async () => {
    if (!form.name || !form.categoryId) return
    setSaving(true)
    const data = { ...form, bulkQty: parseInt(form.bulkQty) || 1, price: parseFloat(form.price) || 0 }
    if (editingItem) await api.updateMenuItem(editingItem.id, data)
    else await api.createMenuItem(data)
    setSaving(false); setShowForm(false); load()
  }

  const handleSaveCat = async () => {
    if (!catForm.name) return
    setSaving(true)
    if (editingCat) await api.updateCategory(editingCat.id, catForm)
    else await api.createCategory(catForm)
    setSaving(false); setShowCatForm(false); load()
  }

  const UNIT_PRESETS = ['each', 'per dozen', 'per case of 12', 'per case of 24', 'per case of 36', 'per case of 40', 'per case of 48', 'per box of 8', 'per pack of 12', 'per bag']

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Menu Items</h1>
        <div className="flex gap-2">
          <button onClick={openNewCat} className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">+ Category</button>
          <button onClick={openNewItem} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700">➕ Add Item</button>
        </div>
      </div>

      {/* Item modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-bold text-gray-900 mb-4">{editingItem ? 'Edit Item' : 'New Item'}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
                <select value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unit Label</label>
                  <select value={form.unitLabel} onChange={e => setForm(p => ({ ...p, unitLabel: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                    {UNIT_PRESETS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Units per Bulk</label>
                  <input type="number" min={1} value={form.bulkQty} onChange={e => setForm(p => ({ ...p, bulkQty: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Price per bulk unit ($)</label>
                <input type="number" step="0.01" min={0} value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              {parseInt(form.bulkQty) > 1 && (
                <div className="bg-emerald-50 rounded-lg px-3 py-2 text-xs text-emerald-700">
                  💡 Ordered in batches of {form.bulkQty} · labeled as "{form.unitLabel}"
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg">Cancel</button>
              <button onClick={handleSaveItem} disabled={saving} className="flex-1 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category modal */}
      {showCatForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={e => e.target === e.currentTarget && setShowCatForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-bold text-gray-900 mb-4">{editingCat ? 'Edit Category' : 'New Category'}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                <input value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sort Order</label>
                <input type="number" value={catForm.sortOrder} onChange={e => setCatForm(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCatForm(false)} className="flex-1 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg">Cancel</button>
              <button onClick={handleSaveCat} disabled={saving} className="flex-1 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? <div className="text-gray-400">Loading…</div> : (
        <div className="space-y-6">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-700">{cat.name}</h2>
                <button onClick={() => openEditCat(cat)} className="text-xs text-gray-400 hover:text-blue-600">Edit</button>
              </div>
              {(cat.menuItems || []).length === 0 ? (
                <div className="px-5 py-6 text-center text-gray-400 text-sm">No items in this category.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100">
                    <tr>
                      {['Item', 'Bulk Unit', 'Units/Bulk', 'Price', ''].map(h => (
                        <th key={h} className="text-left px-4 py-2 text-xs font-medium text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(cat.menuItems || []).map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          {item.description && <div className="text-xs text-gray-400">{item.description}</div>}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500">{item.unitLabel}</td>
                        <td className="px-4 py-2.5 text-gray-500">{item.bulkQty}</td>
                        <td className="px-4 py-2.5 text-gray-500">${Number(item.price).toFixed(2)}</td>
                        <td className="px-4 py-2.5">
                          <button onClick={() => openEditItem(item)} className="text-xs text-gray-400 hover:text-blue-600">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
