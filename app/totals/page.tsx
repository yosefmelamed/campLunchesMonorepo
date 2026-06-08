'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { toInputDate, weekStart, fmtShort } from '@/lib/utils'

export default function ItemTotalsPage() {
  const today = new Date()
  const [from, setFrom] = useState(toInputDate(weekStart(today)))
  const [to, setTo] = useState(toInputDate(new Date(weekStart(today).getTime() + 6 * 86400000)))
  const [siteId, setSiteId] = useState('')
  const [sites, setSites] = useState<any[]>([])
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  useEffect(() => { api.getSites().then(setSites) }, [])

  const load = () => {
    if (!from || !to) return
    setLoading(true)
    const params: any = { from, to }
    if (siteId) params.siteId = siteId
    api.getItemTotals(params).then(setData).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [from, to, siteId])

  const grouped: Record<string, any[]> = {}
  if (data?.items) {
    for (const item of data.items) {
      if (!grouped[item.category]) grouped[item.category] = []
      grouped[item.category].push(item)
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Item Totals</h1>
          <p className="text-sm text-gray-400 mt-0.5">Aggregate quantities across all menu orders + bulk pre-orders for any date range.</p>
        </div>
        <button onClick={() => window.print()} className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 print:hidden">
          🖨️ Print
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 flex flex-wrap gap-3 items-end print:hidden">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Site</label>
          <select value={siteId} onChange={e => setSiteId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
            <option value="">All Sites</option>
            {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2 ml-auto">
          {/* Quick ranges */}
          {[
            { label: 'This Week', fn: () => { const s = weekStart(today); setFrom(toInputDate(s)); setTo(toInputDate(new Date(s.getTime() + 6*86400000))) } },
            { label: 'Next Week', fn: () => { const s = weekStart(new Date(today.getTime() + 7*86400000)); setFrom(toInputDate(s)); setTo(toInputDate(new Date(s.getTime() + 6*86400000))) } },
            { label: 'This Month', fn: () => { const s = new Date(today.getFullYear(), today.getMonth(), 1); const e = new Date(today.getFullYear(), today.getMonth()+1, 0); setFrom(toInputDate(s)); setTo(toInputDate(e)) } },
          ].map(r => (
            <button key={r.label} onClick={r.fn}
              className="px-3 py-2 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50">
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400"><div className="text-3xl mb-2">⏳</div><p>Loading…</p></div>
      ) : !data ? null : data.items.length === 0 ? (
        <div className="p-12 text-center text-gray-400 bg-white border border-gray-200 rounded-xl">
          <p className="text-3xl mb-2">📊</p>
          <p>No orders in this date range.</p>
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 mb-5 flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-emerald-600 font-medium">Date Range</p>
              <p className="text-sm font-bold text-emerald-900">{fmtShort(from)} — {fmtShort(to)}</p>
            </div>
            <div>
              <p className="text-xs text-emerald-600 font-medium">Menu Orders</p>
              <p className="text-sm font-bold text-emerald-900">{data.orderCount}</p>
            </div>
            <div>
              <p className="text-xs text-emerald-600 font-medium">Bulk Pre-Orders</p>
              <p className="text-sm font-bold text-emerald-900">{data.bulkOrderCount}</p>
            </div>
            <div>
              <p className="text-xs text-emerald-600 font-medium">Unique Items</p>
              <p className="text-sm font-bold text-emerald-900">{data.items.length}</p>
            </div>
            {siteId && <div>
              <p className="text-xs text-emerald-600 font-medium">Site Filter</p>
              <p className="text-sm font-bold text-emerald-900">{sites.find(s => s.id === siteId)?.name}</p>
            </div>}
          </div>

          {/* Per-category breakdown */}
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <h2 className="font-bold text-gray-700">{cat}</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {(items as any[]).map((item: any) => {
                  const isExpanded = expandedItem === item.menuItemId
                  const bulkNeeded = item.bulkQty > 1 ? Math.ceil(item.totalQty / item.bulkQty) : null
                  const menuPct = item.totalQty > 0 ? Math.round((item.menuOrderQty / item.totalQty) * 100) : 0

                  return (
                    <div key={item.menuItemId}>
                      <div
                        className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => setExpandedItem(isExpanded ? null : item.menuItemId)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900">{item.name}</span>
                            {item.breakdown.length > 0 && (
                              <span className="text-xs text-gray-400">{item.breakdown.length} source{item.breakdown.length !== 1 ? 's' : ''}</span>
                            )}
                          </div>
                          {/* Stacked bar showing menu vs bulk */}
                          {item.totalQty > 0 && (
                            <div className="mt-1.5 flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${menuPct}%` }} />
                              </div>
                              <span className="text-xs text-gray-400 whitespace-nowrap">
                                {item.menuOrderQty > 0 && <span className="text-emerald-600">{item.menuOrderQty} menu</span>}
                                {item.menuOrderQty > 0 && item.bulkOrderQty > 0 && <span className="text-gray-300 mx-1">+</span>}
                                {item.bulkOrderQty > 0 && <span className="text-blue-600">{item.bulkOrderQty} bulk</span>}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xl font-bold text-gray-900">{item.totalQty}</div>
                          <div className="text-xs text-gray-400">total units</div>
                          {bulkNeeded && (
                            <div className="text-xs text-emerald-600 font-semibold mt-0.5">
                              {bulkNeeded} × {item.unitLabel}
                            </div>
                          )}
                        </div>
                        <span className="text-gray-300 text-sm ml-1">{isExpanded ? '▲' : '▼'}</span>
                      </div>

                      {isExpanded && (
                        <div className="px-5 pb-3 pt-1 bg-gray-50 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Breakdown by Source</p>
                          <div className="space-y-1">
                            {item.breakdown.map((b: any, i: number) => (
                              <div key={i} className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${b.type === 'bulk' ? 'bg-blue-50 text-blue-800' : 'bg-emerald-50 text-emerald-800'}`}>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${b.type === 'bulk' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {b.type === 'bulk' ? '📦 Bulk' : '🍽️ Menu'}
                                  </span>
                                  <span>{b.label}</span>
                                </div>
                                <span className="font-bold ml-2">{b.qty}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
