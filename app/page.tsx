'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { STATUS_COLORS, STATUS_LABELS, fmt } from '@/lib/utils'
import Link from 'next/link'

export default function Dashboard() {
  const [orders, setOrders] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getOrders(),
      api.getSites(),
    ]).then(([o, s]) => {
      setOrders(o)
      setSites(s)
    }).finally(() => setLoading(false))
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const todayOrders = orders.filter(o => o.deliveryDate?.startsWith(today))
  const pendingOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED')
  const inTransit = orders.filter(o => o.status === 'IN_TRANSIT')
  const recent = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8)

  const stats = [
    { label: "Today's Deliveries", value: todayOrders.length, color: 'bg-blue-50 text-blue-700', icon: '📅' },
    { label: 'Active Sites', value: sites.filter(s => s.isActive).length, color: 'bg-emerald-50 text-emerald-700', icon: '📍' },
    { label: 'Pending Orders', value: pendingOrders.length, color: 'bg-yellow-50 text-yellow-700', icon: '⏳' },
    { label: 'In Transit', value: inTransit.length, color: 'bg-purple-50 text-purple-700', icon: '🚚' },
  ]

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex gap-3">
          {orders.length === 0 && (
            <button onClick={async () => { await api.seed(); window.location.reload() }}
              className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg hover:bg-amber-100 transition-colors">
              🌱 Load Sample Data
            </button>
          )}
          <Link href={`/delivery?date=${today}`} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
            🚚 Today's Sheet
          </Link>
          <Link href="/orders/new" className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors">
            ➕ New Order
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className={`${s.color} rounded-xl p-5`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-3xl font-bold">{s.value}</div>
            <div className="text-sm font-medium mt-1 opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      {todayOrders.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl mb-6">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Today's Deliveries</h2>
            <Link href={`/delivery?date=${today}`} className="text-xs text-emerald-600 hover:underline">View sheet →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {todayOrders.map(o => (
              <div key={o.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <span className="font-medium text-gray-900 text-sm">{o.site.name}</span>
                  <span className="text-gray-400 text-sm ml-2">— {o.menu.name}</span>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_COLORS[o.status]}`}>{STATUS_LABELS[o.status]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Recent Orders</h2>
          <Link href="/orders" className="text-xs text-emerald-600 hover:underline">All orders →</Link>
        </div>
        {recent.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p>No orders yet.</p>
            <Link href="/orders/new" className="text-emerald-600 text-sm hover:underline mt-2 block">Create your first order →</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent.map(o => (
              <Link key={o.id} href={`/orders/${o.id}`} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 group">
                <div>
                  <span className="font-medium text-gray-900 text-sm group-hover:text-emerald-700">{o.site.name}</span>
                  <span className="text-gray-400 text-xs ml-3">{fmt(o.deliveryDate)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{o.menu.name}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_COLORS[o.status]}`}>{STATUS_LABELS[o.status]}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
// (seed button is in the dashboard component above)
