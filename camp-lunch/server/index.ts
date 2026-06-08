import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// ─── SITES ────────────────────────────────────────────────────────────────────

app.get('/api/sites', async (_req, res) => {
  try {
    const sites = await prisma.site.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { orders: true, bulkOrders: true } } }
    })
    res.json(sites)
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.post('/api/sites', async (req, res) => {
  try { res.json(await prisma.site.create({ data: req.body })) }
  catch (e) { res.status(500).json({ error: String(e) }) }
})

app.put('/api/sites/:id', async (req, res) => {
  try { res.json(await prisma.site.update({ where: { id: req.params.id }, data: req.body })) }
  catch (e) { res.status(500).json({ error: String(e) }) }
})

app.delete('/api/sites/:id', async (req, res) => {
  try {
    await prisma.site.update({ where: { id: req.params.id }, data: { isActive: false } })
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

app.get('/api/categories', async (_req, res) => {
  try {
    res.json(await prisma.menuCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { menuItems: { where: { isActive: true }, orderBy: { name: 'asc' } } }
    }))
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.post('/api/categories', async (req, res) => {
  try { res.json(await prisma.menuCategory.create({ data: req.body })) }
  catch (e) { res.status(500).json({ error: String(e) }) }
})

app.put('/api/categories/:id', async (req, res) => {
  try { res.json(await prisma.menuCategory.update({ where: { id: req.params.id }, data: req.body })) }
  catch (e) { res.status(500).json({ error: String(e) }) }
})

app.delete('/api/categories/:id', async (req, res) => {
  try {
    // Check for items first
    const count = await prisma.menuItem.count({ where: { categoryId: req.params.id } })
    if (count > 0) return res.status(400).json({ error: `Cannot delete — ${count} item(s) still use this category.` })
    await prisma.menuCategory.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

// ─── MENU ITEMS ───────────────────────────────────────────────────────────────

app.get('/api/menu-items', async (_req, res) => {
  try {
    res.json(await prisma.menuItem.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }]
    }))
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.post('/api/menu-items', async (req, res) => {
  try { res.json(await prisma.menuItem.create({ data: req.body, include: { category: true } })) }
  catch (e) { res.status(500).json({ error: String(e) }) }
})

app.put('/api/menu-items/:id', async (req, res) => {
  try { res.json(await prisma.menuItem.update({ where: { id: req.params.id }, data: req.body, include: { category: true } })) }
  catch (e) { res.status(500).json({ error: String(e) }) }
})

app.delete('/api/menu-items/:id', async (req, res) => {
  try {
    await prisma.menuItem.update({ where: { id: req.params.id }, data: { isActive: false } })
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

// ─── MENUS ────────────────────────────────────────────────────────────────────

app.get('/api/menus', async (_req, res) => {
  try {
    res.json(await prisma.menu.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { orders: true } },
        templateItems: { include: { menuItem: { include: { category: true } } } }
      }
    }))
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.post('/api/menus', async (req, res) => {
  try {
    const { templateItems, ...menuData } = req.body
    const menu = await prisma.menu.create({
      data: {
        ...menuData,
        templateItems: templateItems?.length ? { create: templateItems } : undefined
      },
      include: { templateItems: { include: { menuItem: true } } }
    })
    res.json(menu)
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.put('/api/menus/:id', async (req, res) => {
  try {
    const { templateItems, ...menuData } = req.body
    const menu = await prisma.menu.update({
      where: { id: req.params.id },
      data: {
        ...menuData,
        templateItems: templateItems !== undefined ? {
          deleteMany: {},
          create: templateItems
        } : undefined
      },
      include: { templateItems: { include: { menuItem: { include: { category: true } } } } }
    })
    res.json(menu)
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.delete('/api/menus/:id', async (req, res) => {
  try {
    await prisma.menu.update({ where: { id: req.params.id }, data: { isActive: false } })
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

// ─── ORDERS ───────────────────────────────────────────────────────────────────

const orderInclude = {
  site: true,
  menu: true,
  items: { include: { menuItem: { include: { category: true } } } }
}

app.get('/api/orders', async (req, res) => {
  try {
    const { siteId, status, from, to } = req.query as Record<string, string>
    const where: any = {}
    if (siteId) where.siteId = siteId
    if (status) where.status = status
    if (from || to) {
      where.deliveryDate = {}
      if (from) where.deliveryDate.gte = new Date(from)
      if (to) where.deliveryDate.lte = new Date(to)
    }
    res.json(await prisma.order.findMany({ where, include: orderInclude, orderBy: { deliveryDate: 'asc' } }))
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: orderInclude })
    if (!order) return res.status(404).json({ error: 'Not found' })
    res.json(order)
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.post('/api/orders', async (req, res) => {
  try {
    const { items, ...orderData } = req.body
    const order = await prisma.order.create({
      data: { ...orderData, deliveryDate: new Date(orderData.deliveryDate), items: { create: items } },
      include: orderInclude
    })
    res.json(order)
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.put('/api/orders/:id', async (req, res) => {
  try {
    const { items, ...orderData } = req.body
    if (orderData.deliveryDate) orderData.deliveryDate = new Date(orderData.deliveryDate)
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { ...orderData, items: items ? { deleteMany: {}, create: items } : undefined },
      include: orderInclude
    })
    res.json(order)
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    res.json(await prisma.order.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
      include: { site: true, menu: true }
    }))
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.delete('/api/orders/:id', async (req, res) => {
  try {
    await prisma.order.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

// ─── BULK ORDERS ──────────────────────────────────────────────────────────────

const bulkInclude = {
  site: true,
  items: { include: { menuItem: { include: { category: true } } } }
}

app.get('/api/bulk-orders', async (req, res) => {
  try {
    const { siteId, from, to } = req.query as Record<string, string>
    const where: any = {}
    if (siteId) where.siteId = siteId
    if (from || to) {
      where.deliveryDate = {}
      if (from) where.deliveryDate.gte = new Date(from)
      if (to) where.deliveryDate.lte = new Date(to)
    }
    res.json(await prisma.bulkOrder.findMany({ where, include: bulkInclude, orderBy: { deliveryDate: 'asc' } }))
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.get('/api/bulk-orders/:id', async (req, res) => {
  try {
    const b = await prisma.bulkOrder.findUnique({ where: { id: req.params.id }, include: bulkInclude })
    if (!b) return res.status(404).json({ error: 'Not found' })
    res.json(b)
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.post('/api/bulk-orders', async (req, res) => {
  try {
    const { items, ...data } = req.body
    const b = await prisma.bulkOrder.create({
      data: { ...data, deliveryDate: new Date(data.deliveryDate), items: { create: items } },
      include: bulkInclude
    })
    res.json(b)
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.put('/api/bulk-orders/:id', async (req, res) => {
  try {
    const { items, ...data } = req.body
    if (data.deliveryDate) data.deliveryDate = new Date(data.deliveryDate)
    const b = await prisma.bulkOrder.update({
      where: { id: req.params.id },
      data: { ...data, items: items ? { deleteMany: {}, create: items } : undefined },
      include: bulkInclude
    })
    res.json(b)
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.patch('/api/bulk-orders/:id/status', async (req, res) => {
  try {
    res.json(await prisma.bulkOrder.update({
      where: { id: req.params.id },
      data: { status: req.body.status }
    }))
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.delete('/api/bulk-orders/:id', async (req, res) => {
  try {
    await prisma.bulkOrder.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

// ─── ITEM AGGREGATION ─────────────────────────────────────────────────────────
// Returns per-item totals across all menu orders + bulk orders for a date range,
// broken down by source (which menus, which sites), with bulk coverage shown.

app.get('/api/item-totals', async (req, res) => {
  try {
    const { from, to, siteId } = req.query as Record<string, string>
    if (!from || !to) return res.status(400).json({ error: 'from and to required' })

    const dateRange = { gte: new Date(from), lte: new Date(to) }
    const siteFilter = siteId ? { siteId } : {}

    // All menu orders in range
    const orders = await prisma.order.findMany({
      where: { deliveryDate: dateRange, status: { not: 'CANCELLED' }, ...siteFilter },
      include: {
        site: true, menu: true,
        items: { include: { menuItem: { include: { category: true } } } }
      }
    })

    // All bulk orders in range
    const bulkOrders = await prisma.bulkOrder.findMany({
      where: { deliveryDate: dateRange, status: { not: 'CANCELLED' }, ...siteFilter },
      include: {
        site: true,
        items: { include: { menuItem: { include: { category: true } } } }
      }
    })

    // Build per-item aggregation
    type ItemAgg = {
      menuItemId: string
      name: string
      category: string
      categoryOrder: number
      unitLabel: string
      bulkQty: number
      menuOrderQty: number
      bulkOrderQty: number
      totalQty: number
      breakdown: { label: string; qty: number; type: 'menu' | 'bulk' }[]
    }
    const agg: Record<string, ItemAgg> = {}

    const ensure = (item: any) => {
      if (!agg[item.id]) {
        agg[item.id] = {
          menuItemId: item.id, name: item.name,
          category: item.category.name, categoryOrder: item.category.sortOrder,
          unitLabel: item.unitLabel, bulkQty: item.bulkQty,
          menuOrderQty: 0, bulkOrderQty: 0, totalQty: 0, breakdown: []
        }
      }
    }

    for (const order of orders) {
      for (const oi of order.items) {
        ensure(oi.menuItem)
        agg[oi.menuItemId].menuOrderQty += oi.quantity
        agg[oi.menuItemId].totalQty += oi.quantity
        agg[oi.menuItemId].breakdown.push({
          label: `${order.site.name} — ${order.menu.name} (${order.deliveryDate.toISOString().split('T')[0]})`,
          qty: oi.quantity, type: 'menu'
        })
      }
    }

    for (const bo of bulkOrders) {
      for (const bi of bo.items) {
        ensure(bi.menuItem)
        agg[bi.menuItemId].bulkOrderQty += bi.quantity
        agg[bi.menuItemId].totalQty += bi.quantity
        agg[bi.menuItemId].breakdown.push({
          label: `BULK: ${bo.name}${bo.site ? ` (${bo.site.name})` : ' (All Sites)'}`,
          qty: bi.quantity, type: 'bulk'
        })
      }
    }

    const result = Object.values(agg).sort((a, b) =>
      a.categoryOrder - b.categoryOrder || a.name.localeCompare(b.name)
    )

    res.json({ from, to, items: result, orderCount: orders.length, bulkOrderCount: bulkOrders.length })
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

// ─── DELIVERY SHEET ───────────────────────────────────────────────────────────

app.get('/api/delivery-sheet', async (req, res) => {
  try {
    const { date } = req.query as { date: string }
    const start = new Date(date); start.setHours(0, 0, 0, 0)
    const end = new Date(date); end.setHours(23, 59, 59, 999)

    const orders = await prisma.order.findMany({
      where: { deliveryDate: { gte: start, lte: end }, status: { not: 'CANCELLED' } },
      include: { site: true, menu: true, items: { include: { menuItem: { include: { category: true } } } } },
      orderBy: [{ site: { name: 'asc' } }]
    })

    const bulkOrders = await prisma.bulkOrder.findMany({
      where: { deliveryDate: { gte: start, lte: end }, status: { not: 'CANCELLED' } },
      include: { site: true, items: { include: { menuItem: { include: { category: true } } } } }
    })

    // Build bulk coverage map: menuItemId -> qty covered by bulk
    const bulkCoverage: Record<string, number> = {}
    for (const bo of bulkOrders) {
      for (const bi of bo.items) {
        bulkCoverage[bi.menuItemId] = (bulkCoverage[bi.menuItemId] || 0) + bi.quantity
      }
    }

    // Aggregate totals (menu orders only — bulk is shown separately)
    const totals: Record<string, any> = {}
    for (const order of orders) {
      for (const item of order.items) {
        const key = item.menuItemId
        if (!totals[key]) {
          totals[key] = { name: item.menuItem.name, category: item.menuItem.category.name, qty: 0, bulkQty: item.menuItem.bulkQty, unitLabel: item.menuItem.unitLabel }
        }
        totals[key].qty += item.quantity
      }
    }

    res.json({
      orders, bulkOrders, bulkCoverage,
      totals: Object.values(totals).sort((a: any, b: any) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
    })
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

// ─── COVERAGE CHECK: how much of each item is already bulk-covered for a site/date ──

app.get('/api/bulk-coverage', async (req, res) => {
  try {
    const { siteId, date } = req.query as Record<string, string>
    const start = new Date(date); start.setHours(0, 0, 0, 0)
    const end = new Date(date); end.setHours(23, 59, 59, 999)

    // Bulk orders for this site (or all-site bulk orders) on this date
    const bulkOrders = await prisma.bulkOrder.findMany({
      where: {
        deliveryDate: { gte: start, lte: end },
        status: { not: 'CANCELLED' },
        OR: [{ siteId }, { siteId: null }]
      },
      include: { items: true }
    })

    const coverage: Record<string, number> = {}
    for (const bo of bulkOrders) {
      for (const bi of bo.items) {
        coverage[bi.menuItemId] = (coverage[bi.menuItemId] || 0) + bi.quantity
      }
    }
    res.json(coverage)
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

// ─── SEED ─────────────────────────────────────────────────────────────────────

app.post('/api/seed', async (_req, res) => {
  try {
    await Promise.all([
      prisma.menuCategory.upsert({ where: { id: 'cat-entree' }, update: {}, create: { id: 'cat-entree', name: 'Entrees', sortOrder: 1 } }),
      prisma.menuCategory.upsert({ where: { id: 'cat-side' }, update: {}, create: { id: 'cat-side', name: 'Sides', sortOrder: 2 } }),
      prisma.menuCategory.upsert({ where: { id: 'cat-snack' }, update: {}, create: { id: 'cat-snack', name: 'Snacks', sortOrder: 3 } }),
      prisma.menuCategory.upsert({ where: { id: 'cat-drink' }, update: {}, create: { id: 'cat-drink', name: 'Beverages', sortOrder: 4 } }),
    ])
    await Promise.all([
      prisma.menuItem.upsert({ where: { id: 'item-pizza' }, update: {}, create: { id: 'item-pizza', name: 'Cheese Pizza Slice', categoryId: 'cat-entree', unitLabel: 'per box of 8', bulkQty: 8, price: 18.00 } }),
      prisma.menuItem.upsert({ where: { id: 'item-hotdog' }, update: {}, create: { id: 'item-hotdog', name: 'Hot Dog', categoryId: 'cat-entree', unitLabel: 'per pack of 12', bulkQty: 12, price: 14.00 } }),
      prisma.menuItem.upsert({ where: { id: 'item-sandwich' }, update: {}, create: { id: 'item-sandwich', name: 'Turkey Sandwich', categoryId: 'cat-entree', unitLabel: 'each', bulkQty: 1, price: 5.50 } }),
      prisma.menuItem.upsert({ where: { id: 'item-chips' }, update: {}, create: { id: 'item-chips', name: 'Chips (Lays)', categoryId: 'cat-snack', unitLabel: 'per case of 36', bulkQty: 36, price: 22.00 } }),
      prisma.menuItem.upsert({ where: { id: 'item-apple' }, update: {}, create: { id: 'item-apple', name: 'Apple', categoryId: 'cat-snack', unitLabel: 'per case of 48', bulkQty: 48, price: 28.00 } }),
      prisma.menuItem.upsert({ where: { id: 'item-oj' }, update: {}, create: { id: 'item-oj', name: 'Orange Juice Box', categoryId: 'cat-drink', unitLabel: 'per case of 40', bulkQty: 40, price: 24.00 } }),
      prisma.menuItem.upsert({ where: { id: 'item-water' }, update: {}, create: { id: 'item-water', name: 'Water Bottle', categoryId: 'cat-drink', unitLabel: 'per case of 24', bulkQty: 24, price: 12.00 } }),
      prisma.menuItem.upsert({ where: { id: 'item-cereal' }, update: {}, create: { id: 'item-cereal', name: 'Cereal Box (mini)', categoryId: 'cat-snack', unitLabel: 'per case of 96', bulkQty: 96, price: 32.00 } }),
      prisma.menuItem.upsert({ where: { id: 'item-salad' }, update: {}, create: { id: 'item-salad', name: 'Garden Salad', categoryId: 'cat-side', unitLabel: 'each', bulkQty: 1, price: 3.50 } }),
    ])
    // Menus with template items
    await prisma.menu.upsert({ where: { id: 'menu-a' }, update: {}, create: {
      id: 'menu-a', name: 'Menu A — Pizza Day', description: 'Pizza, chips, OJ',
      templateItems: { create: [
        { menuItemId: 'item-pizza', defaultQty: 2 },
        { menuItemId: 'item-chips', defaultQty: 1 },
        { menuItemId: 'item-oj', defaultQty: 1 },
      ]}
    }})
    await prisma.menu.upsert({ where: { id: 'menu-b' }, update: {}, create: {
      id: 'menu-b', name: 'Menu B — Hot Dog Day', description: 'Hot dogs, apple, water',
      templateItems: { create: [
        { menuItemId: 'item-hotdog', defaultQty: 3 },
        { menuItemId: 'item-apple', defaultQty: 1 },
        { menuItemId: 'item-water', defaultQty: 2 },
        { menuItemId: 'item-oj', defaultQty: 1 },
      ]}
    }})
    await prisma.menu.upsert({ where: { id: 'menu-c' }, update: {}, create: {
      id: 'menu-c', name: 'Menu C — Sandwich Day', description: 'Sandwiches, salad, OJ',
      templateItems: { create: [
        { menuItemId: 'item-sandwich', defaultQty: 30 },
        { menuItemId: 'item-salad', defaultQty: 30 },
        { menuItemId: 'item-oj', defaultQty: 1 },
        { menuItemId: 'item-chips', defaultQty: 1 },
      ]}
    }})
    await Promise.all([
      prisma.site.upsert({ where: { id: 'site-1' }, update: {}, create: { id: 'site-1', name: 'Lakeside Camp', address: '100 Lake Rd', contactName: 'Sarah Cohen', contactPhone: '555-0101' } }),
      prisma.site.upsert({ where: { id: 'site-2' }, update: {}, create: { id: 'site-2', name: 'Hillside Camp', address: '200 Hill Ave', contactName: 'Mike Levy', contactPhone: '555-0202' } }),
      prisma.site.upsert({ where: { id: 'site-3' }, update: {}, create: { id: 'site-3', name: 'Forest Camp', address: '300 Forest Dr', contactName: 'Rachel Green', contactPhone: '555-0303' } }),
      prisma.site.upsert({ where: { id: 'site-4' }, update: {}, create: { id: 'site-4', name: 'Downtown Center', address: '10 Main St', contactName: 'David Ross', contactPhone: '555-0404' } }),
    ])
    res.json({ ok: true, message: 'Seeded successfully' })
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.listen(PORT, () => console.log(`API running on :${PORT}`))
