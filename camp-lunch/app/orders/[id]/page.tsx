'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { STATUS_COLORS, STATUS_LABELS, ALL_STATUSES, fmt } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    api.getOrder(params.id).then(setOrder).finally(() => setLoading(false))
  }, [params.id])

  const updateStatus = async (status: string) => {
    await api.updateOrderStatus(params.id, status)
    setOrder((o: any) => ({ ...o, status }))
  }

  const handleDelete = async () => {
    if (!confirm('Permanently delete this order? This cannot be undone.')) return
    await api.deleteOrder(params.id)
    router.push('/orders')
  }

  if (loading) return <div className="p-8 flex items-center justify-center h-64 text-gray-400"><div className="text-center"><div className="text-3xl mb-2">⏳</div><p>Loading…</p></div></div>
  if (!order) return <div className="p-8 text-gray-400">Order not found.</div>

  const grouped: Record<string, any[]> = {}
  for (const item of order.items) {
    const cat = item.menuItem.category.name
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(item)
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/orders" className="text-gray-400 hover:text-gray-600 text-sm">← Orders</Link>
          <span className="text-gray-200">/</span>
          <h1 className="text-lg font-bold text-gray-900">{order.site.name}</h1>
          <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_COLORS[order.status]}`}>{STATUS_LABELS[order.status]}</span>
        </div>
        <div className="flex gap-2">
          <Link href={`/orders/${order.id}/edit`} className="px-4 py-1.5 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
            ✏️ Edit
          </Link>
          <button onClick={handleDelete} className="px-4 py-1.5 border border-red-200 text-red-500 text-sm rounded-lg hover:bg-red-50">
            🗑️ Delete
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1 font-semibold">Site</p>
            <p className="font-semibold text-gray-900">{order.site.name}</p>
            {order.site.contactName && <p className="text-xs text-gray-500 mt-0.5">{order.site.contactName}</p>}
            {order.site.contactPhone && <p className="text-xs text-gray-400">{order.site.contactPhone}</p>}
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1 font-semibold">Delivery Date</p>
            <p className="font-semibold text-gray-900">{fmt(order.deliveryDate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1 font-semibold">Menu</p>
            <p className="font-semibold text-gray-900">{order.menu.name}</p>
            {order.menu.description && <p className="text-xs text-gray-400">{order.menu.description}</p>}
          </div>
          <div className="col-span-3 border-t border-gray-50 pt-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 font-semibold">Status</p>
            <select value={order.status} onChange={e => updateStatus(e.target.value)}
              className={`text-sm px-3 py-1.5 rounded-lg border font-medium cursor-pointer ${STATUS_COLORS[order.status]}`}>
              {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          {order.notes && (
            <div className="col-span-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1 font-semibold">Notes</p>
              <p className="text-gray-700 text-sm bg-gray-50 rounded-lg px-3 py-2">{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Order Items</h2>
          <span className="text-xs text-gray-400">{order.items.length} line items · {order.items.reduce((a: number, i: any) => a + i.quantity, 0)} total units</span>
        </div>
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{cat}</h3>
            <div className="space-y-1.5">
              {(items as any[]).map(item => (
                <div key={item.id} className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-800">{item.menuItem.name}</span>
                    {item.isBulkCovered && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                        bulk covered
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900">{item.quantity}</span>
                    <span className="text-xs text-gray-400 ml-1">units</span>
                    {item.menuItem.bulkQty > 1 && (
                      <span className="text-xs text-gray-400 ml-2">
                        ({Math.ceil(item.quantity / item.menuItem.bulkQty)} × {item.menuItem.unitLabel})
                      </span>
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
}
