'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import { STATUS_COLORS, STATUS_LABELS, ALL_STATUSES, fmt, bulkLabel } from '@/lib/utils'

function DeliverySheet() {
  const sp = useSearchParams()
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(sp.get('date') || today)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.getDeliverySheet(date).then(setData).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [date])

  const updateStatus = async (orderId: string, status: string) => {
    await api.updateOrderStatus(orderId, status)
    load()
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <h1 className="text-2xl font-bold text-gray-900">Delivery Sheet</h1>
        <div className="flex items-center gap-3">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          <button onClick={() => window.print()} className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
            🖨️ Print
          </button>
        </div>
      </div>

      <div className="print:block hidden mb-6">
        <h1 className="text-2xl font-bold">Delivery Sheet — {fmt(date)}</h1>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400">Loading…</div>
      ) : !data || data.orders.length === 0 ? (
        <div className="p-12 text-center text-gray-400 bg-white border border-gray-200 rounded-xl">
          <p className="text-4xl mb-3">🚚</p>
          <p>No deliveries for {fmt(date)}.</p>
        </div>
      ) : (
        <>
          {/* Aggregate Totals */}
          <div className="bg-white border border-gray-200 rounded-xl mb-6">
            <div className="px-6 py-4 border-b border-gray-100 bg-emerald-50 rounded-t-xl">
              <h2 className="font-bold text-emerald-800">📦 Total to Prepare — {fmt(date)}</h2>
              <p className="text-xs text-emerald-600 mt-1">{data.orders.length} orders across {new Set(data.orders.map((o: any) => o.siteId)).size} sites</p>
            </div>
            <div className="p-4">
              {(() => {
                const grouped: Record<string, any[]> = {}
                for (const t of data.totals) {
                  if (!grouped[t.category]) grouped[t.category] = []
                  grouped[t.category].push(t)
                }
                return Object.entries(grouped).map(([cat, items]) => (
                  <div key={cat} className="mb-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{cat}</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {(items as any[]).map(item => (
                        <div key={item.name} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5">
                          <span className="text-sm text-gray-800">{item.name}</span>
                          <div className="text-right">
                            <span className="text-sm font-bold text-gray-900">{item.qty}</span>
                            <span className="text-xs text-gray-400 ml-1">units</span>
                            {item.bulkQty > 1 && (
                              <div className="text-xs text-emerald-600 font-medium">
                                {Math.ceil(item.qty / item.bulkQty)} × {item.unitLabel}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              })()}
            </div>
          </div>

          {/* Per-site orders */}
          <div className="space-y-4">
            {data.orders.map((order: any) => (
              <div key={order.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-gray-900">{order.site.name}</h3>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[order.status]}`}>{STATUS_LABELS[order.status]}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{order.menu.name}</p>
                    {order.site.contactName && <p className="text-xs text-gray-400">{order.site.contactName} · {order.site.contactPhone}</p>}
                  </div>
                  <select value={order.status} onChange={e => updateStatus(order.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 print:hidden focus:outline-none">
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
                <div className="p-4 grid grid-cols-3 gap-2">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-xs text-gray-700">{item.menuItem.name}</span>
                      <div className="text-right ml-2">
                        <span className="text-sm font-semibold text-gray-900">{item.quantity}</span>
                        {item.menuItem.bulkQty > 1 && (
                          <div className="text-xs text-emerald-600">{Math.ceil(item.quantity / item.menuItem.bulkQty)} {item.menuItem.unitLabel}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {order.notes && <div className="px-5 py-2 border-t border-gray-50 text-xs text-gray-500 italic">Note: {order.notes}</div>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function DeliveryPage() {
  return <Suspense><DeliverySheet /></Suspense>
}
