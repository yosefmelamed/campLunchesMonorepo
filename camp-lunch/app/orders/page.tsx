'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { STATUS_COLORS, STATUS_LABELS, ALL_STATUSES, fmt } from '@/lib/utils'
import Link from 'next/link'

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterSite, setFilterSite] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  const load = () => {
    const params: any = {}
    if (filterSite) params.siteId = filterSite
    if (filterStatus) params.status = filterStatus
    if (filterFrom) params.from = filterFrom
    if (filterTo) params.to = filterTo
    setLoading(true)
    api.getOrders(params).then(setOrders).finally(() => setLoading(false))
  }

  useEffect(() => { api.getSites().then(setSites) }, [])
  useEffect(() => { load() }, [filterSite, filterStatus, filterFrom, filterTo])

  const handleStatusChange = async (id: string, status: string) => {
    await api.updateOrderStatus(id, status)
    load()
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <Link href="/orders/new" className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700">
          ➕ New Order
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 grid grid-cols-4 gap-3">
        <select value={filterSite} onChange={e => setFilterSite(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400">
          <option value="">All Sites</option>
          {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400">
          <option value="">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="From" />
        <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="To" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p>No orders match your filters.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Site', 'Delivery Date', 'Menu', 'Items', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{o.site.name}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{fmt(o.deliveryDate)}</td>
                  <td className="px-4 py-3 text-gray-600">{o.menu.name}</td>
                  <td className="px-4 py-3 text-gray-500">{o.items?.length ?? 0} items</td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={e => handleStatusChange(o.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full border font-medium cursor-pointer ${STATUS_COLORS[o.status]}`}
                    >
                      {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/orders/${o.id}`} className="text-xs text-gray-500 hover:text-emerald-700 underline">View</Link>
                      <Link href={`/orders/${o.id}/edit`} className="text-xs text-gray-500 hover:text-blue-700 underline">Edit</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
