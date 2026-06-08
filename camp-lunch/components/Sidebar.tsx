'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/',              icon: '🏠', label: 'Dashboard' },
  { divider: true, label: 'ORDERS' },
  { href: '/orders',        icon: '📋', label: 'All Orders' },
  { href: '/orders/new',    icon: '➕', label: 'New Order' },
  { href: '/bulk-orders',   icon: '📦', label: 'Bulk Pre-Orders' },
  { divider: true, label: 'REPORTS' },
  { href: '/totals',        icon: '📊', label: 'Item Totals' },
  { href: '/delivery',      icon: '🚚', label: 'Delivery Sheet' },
  { divider: true, label: 'SETUP' },
  { href: '/sites',         icon: '📍', label: 'Sites' },
  { href: '/menus',         icon: '🍽️', label: 'Menus' },
  { href: '/menu-items',    icon: '🥪', label: 'Menu Items' },
]

export default function Sidebar() {
  const path = usePathname()
  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⛺</span>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">Camp Lunch</p>
            <p className="text-xs text-gray-400">CRM</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map((item, i) => {
          if ('divider' in item) {
            return (
              <div key={i} className="pt-3 pb-1 px-2">
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{item.label}</p>
              </div>
            )
          }
          const { href, icon, label } = item as any
          const active = path === href || (href !== '/' && href !== '/orders/new' && path.startsWith(href))
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}>
              <span className="text-base w-5 text-center">{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-300 text-center">
        Camp Lunch Program
      </div>
    </aside>
  )
}
