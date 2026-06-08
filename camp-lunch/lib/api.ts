const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const api = {
  // Sites
  getSites: () => req<any[]>('/api/sites'),
  createSite: (data: any) => req('/api/sites', { method: 'POST', body: JSON.stringify(data) }),
  updateSite: (id: string, data: any) => req(`/api/sites/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSite: (id: string) => req(`/api/sites/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: () => req<any[]>('/api/categories'),
  createCategory: (data: any) => req('/api/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: any) => req(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: string) => req(`/api/categories/${id}`, { method: 'DELETE' }),

  // Menu Items
  getMenuItems: () => req<any[]>('/api/menu-items'),
  createMenuItem: (data: any) => req('/api/menu-items', { method: 'POST', body: JSON.stringify(data) }),
  updateMenuItem: (id: string, data: any) => req(`/api/menu-items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMenuItem: (id: string) => req(`/api/menu-items/${id}`, { method: 'DELETE' }),

  // Menus
  getMenus: () => req<any[]>('/api/menus'),
  createMenu: (data: any) => req('/api/menus', { method: 'POST', body: JSON.stringify(data) }),
  updateMenu: (id: string, data: any) => req(`/api/menus/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMenu: (id: string) => req(`/api/menus/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return req<any[]>(`/api/orders${qs}`)
  },
  getOrder: (id: string) => req<any>(`/api/orders/${id}`),
  createOrder: (data: any) => req('/api/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrder: (id: string, data: any) => req(`/api/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateOrderStatus: (id: string, status: string) => req(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteOrder: (id: string) => req(`/api/orders/${id}`, { method: 'DELETE' }),

  // Bulk Orders
  getBulkOrders: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return req<any[]>(`/api/bulk-orders${qs}`)
  },
  getBulkOrder: (id: string) => req<any>(`/api/bulk-orders/${id}`),
  createBulkOrder: (data: any) => req('/api/bulk-orders', { method: 'POST', body: JSON.stringify(data) }),
  updateBulkOrder: (id: string, data: any) => req(`/api/bulk-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateBulkOrderStatus: (id: string, status: string) => req(`/api/bulk-orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteBulkOrder: (id: string) => req(`/api/bulk-orders/${id}`, { method: 'DELETE' }),

  // Item Totals (aggregation)
  getItemTotals: (params: { from: string; to: string; siteId?: string }) => {
    const qs = '?' + new URLSearchParams(params as any).toString()
    return req<any>(`/api/item-totals${qs}`)
  },

  // Bulk coverage for a site/date (used in order form)
  getBulkCoverage: (siteId: string, date: string) =>
    req<Record<string, number>>(`/api/bulk-coverage?siteId=${siteId}&date=${date}`),

  // Delivery sheet
  getDeliverySheet: (date: string) => req<any>(`/api/delivery-sheet?date=${date}`),

  // Seed
  seed: () => req('/api/seed', { method: 'POST' }),
}
