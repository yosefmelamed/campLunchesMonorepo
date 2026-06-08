'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/',              icon: '🏠', label: 'Dashboard' },
  { href: '/orders',        icon: '📋', label: 'Orders' },
  { href: '/orders/new',    icon: '➕', label: 'New Order' },
  { href: '/delivery',      icon: '🚚', label: 'Delivery Sheet' },
  { href: '/sites',         icon: '📍', label: 'Sites' },
  { href: '/menus',         icon: '🍽️', label: 'Menus' },
  { href: '/menu-items',    icon: '🥪', label: 'Menu Items' },
]

export default function Sidebar() {
  const path = usePathname()
  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⛺</span>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">Camp Lunch</p>
            <p className="text-xs text-gray-400">CRM</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, icon, label }) => {
          const active = path === href || (href !== '/' && path.startsWith(href) && href !== '/orders/new')
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}>
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400 text-center">
        Camp Lunch Program
      </div>
    </aside>
  )
}
