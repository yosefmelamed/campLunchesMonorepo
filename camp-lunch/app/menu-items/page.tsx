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
  const [error, setError] = useState('')

  const load = () => api.getCategories().then(setCategories).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openNewItem = () => {
    setEditingItem(null)
    setForm({ name: '', description: '', unitLabel: 'each', bulkQty: '1', price: '0', categoryId: categories[0]?.id || '' })
    setError('')
    setShowForm(true)
  }
  const openEditItem = (item: any) => {
    setEditingItem(item)
    setForm({ ...item, bulkQty: String(item.bulkQty), price: String(item.price), categoryId: item.categoryId })
    setError('')
    setShowForm(true)
  }
  const openNewCat = () => { setEditingCat(null); setCatForm({ name: '', sortOrder: categories.length + 1 }); setError(''); setShowCatForm(true) }
  const openEditCat = (c: any) => { setEditingCat(c); setCatForm({ name: c.name, sortOrder: c.sortOrder }); setError(''); setShowCatForm(true) }

  const handleSaveItem = async () => {
    if (!form.name || !form.categoryId) { setError('Name and category are required.'); return }
    setSaving(true)
    const data = { ...form, bulkQty: parseInt(form.bulkQty) || 1, price: parseFloat(form.price) || 0 }
    try {
      if (editingItem) await api.updateMenuItem(editingItem.id, data)
      else await api.createMenuItem(data)
      setShowForm(false); load()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`Archive item "${name}"?`)) return
    await api.deleteMenuItem(id)
    load()
  }

  const handleSaveCat = async () => {
    if (!catForm.name) { setError('Category name is required.'); return }
    setSaving(true)
    try {
      if (editingCat) await api.updateCategory(editingCat.id, catForm)
      else await api.createCategory(catForm)
      setShowCatForm(false); load()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleDeleteCat = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"? This will fail if any items are assigned to it.`)) return
    try {
      await api.deleteCategory(id)
      load()
    } catch (e: any) { alert(e.message) }
  }

  const UNIT_PRESETS = ['each', 'per dozen', 'per case of 12', 'per case of 24', 'per case of 36', 'per case of 40', 'per case of 48', 'per case of 96', 'per box of 8', 'per pack of 12', 'per bag']

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Items</h1>
          <p className="text-sm text-gray-400 mt-0.5">Items with bulk packaging are tracked in both individual and bulk units.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openNewCat} className="px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
            + Category
          </button>
          <button onClick={openNewItem} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700">
            ➕ Add Item
          </button>
        </div>
      </div>

      {/* Item modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editingItem ? 'Edit Item' : 'New Item'}</h2>
            </div>
            <div className="px-6 py-5 space-y-3">
              {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
                <select value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                  <option value="">Select…</option>
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
                  <label className="block text-xs font-medium text-gray-600 mb-1">Bulk Unit Label</label>
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
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 text-xs text-emerald-700">
                  💡 Ordered in batches of <strong>{form.bulkQty}</strong>, labeled as "<strong>{form.unitLabel}</strong>"
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveItem} disabled={saving} className="flex-1 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium">
                {saving ? 'Saving…' : 'Save Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category modal */}
      {showCatForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && setShowCatForm(false)}>
          <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editingCat ? 'Edit Category' : 'New Category'}</h2>
            </div>
            <div className="px-6 py-5 space-y-3">
              {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
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
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowCatForm(false)} className="flex-1 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg">Cancel</button>
              <button onClick={handleSaveCat} disabled={saving} className="flex-1 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? <div className="text-gray-400 py-8 text-center">Loading…</div> : (
        <div className="space-y-5">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-700">{cat.name}</h2>
                <div className="flex gap-2">
                  <button onClick={() => openEditCat(cat)} className="text-xs text-gray-400 hover:text-blue-600 px-2 py-1 rounded hover:bg-white">Edit</button>
                  <button onClick={() => handleDeleteCat(cat.id, cat.name)} className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded hover:bg-white">Delete</button>
                </div>
              </div>
              {(cat.menuItems || []).length === 0 ? (
                <div className="px-5 py-6 text-center text-gray-400 text-sm">No items in this category.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-50">
                    <tr>
                      {['Item', 'Bulk Unit', 'Per Bulk', 'Price', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(cat.menuItems || []).map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50 group">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          {item.description && <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{item.unitLabel}</td>
                        <td className="px-4 py-3 text-gray-500">{item.bulkQty}</td>
                        <td className="px-4 py-3 text-gray-500">${Number(item.price).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditItem(item)} className="text-xs text-gray-500 hover:text-blue-600 underline">Edit</button>
                            <button onClick={() => handleDeleteItem(item.id, item.name)} className="text-xs text-gray-400 hover:text-red-500 underline">Archive</button>
                          </div>
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
