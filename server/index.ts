import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// ─── SITES ───────────────────────────────────────────────────────────────────

app.get('/api/sites', async (req, res) => {
  try {
    const sites = await prisma.site.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { orders: true } } }
    })
    res.json(sites)
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.post('/api/sites', async (req, res) => {
  try {
    const site = await prisma.site.create({ data: req.body })
    res.json(site)
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.put('/api/sites/:id', async (req, res) => {
  try {
    const site = await prisma.site.update({ where: { id: req.params.id }, data: req.body })
    res.json(site)
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.delete('/api/sites/:id', async (req, res) => {
  try {
    await prisma.site.update({ where: { id: req.params.id }, data: { isActive: false } })
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

// ─── MENU CATEGORIES ─────────────────────────────────────────────────────────

app.get('/api/categories', async (_req, res) => {
  try {
    const cats = await prisma.menuCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { menuItems: { where: { isActive: true }, orderBy: { name: 'asc' } } }
    })
    res.json(cats)
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.post('/api/categories', async (req, res) => {
  try {
    const cat = await prisma.menuCategory.create({ data: req.body })
    res.json(cat)
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.put('/api/categories/:id', async (req, res) => {
  try {
    const cat = await prisma.menuCategory.update({ where: { id: req.params.id }, data: req.body })
    res.json(cat)
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.delete('/api/categories/:id', async (req, res) => {
  try {
    await prisma.menuCategory.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

// ─── MENU ITEMS ───────────────────────────────────────────────────────────────

app.get('/api/menu-items', async (_req, res) => {
  try {
    const items = await prisma.menuItem.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }]
    })
    res.json(items)
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.post('/api/menu-items', async (req, res) => {
  try {
    const item = await prisma.menuItem.create({
      data: req.body,
      include: { category: true }
    })
    res.json(item)
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.put('/api/menu-items/:id', async (req, res) => {
  try {
    const item = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: req.body,
      include: { category: true }
    })
    res.json(item)
  } catch (e) { res.status(500).json({ error: String(e) }) }
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
    const menus = await prisma.menu.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { orders: true } } }
    })
    res.json(menus)
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.post('/api/menus', async (req, res) => {
  try {
    const menu = await prisma.menu.create({ data: req.body })
    res.json(menu)
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.put('/api/menus/:id', async (req, res) => {
  try {
    const menu = await prisma.menu.update({ where: { id: req.params.id }, data: req.body })
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

app.get('/api/orders', async (req, res) => {
  try {
    const { siteId, status, from, to } = req.query as Record<string, string>
    const where: any = {}
    if (siteId) where.siteId = siteId
    if (status) where.status = status as OrderStatus
    if (from || to) {
      where.deliveryDate = {}
      if (from) where.deliveryDate.gte = new Date(from)
      if (to) where.deliveryDate.lte = new Date(to)
    }
    const orders = await prisma.order.findMany({
      where,
      include: {
        site: true,
        menu: true,
        items: { include: { menuItem: { include: { category: true } } } }
      },
      orderBy: { deliveryDate: 'asc' }
    })
    res.json(orders)
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        site: true,
        menu: true,
        items: { include: { menuItem: { include: { category: true } } } }
      }
    })
    if (!order) return res.status(404).json({ error: 'Not found' })
    res.json(order)
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.post('/api/orders', async (req, res) => {
  try {
    const { items, ...orderData } = req.body
    const order = await prisma.order.create({
      data: {
        ...orderData,
        deliveryDate: new Date(orderData.deliveryDate),
        items: { create: items }
      },
      include: {
        site: true,
        menu: true,
        items: { include: { menuItem: { include: { category: true } } } }
      }
    })
    res.json(order)
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.put('/api/orders/:id', async (req, res) => {
  try {
    const { items, ...orderData } = req.body
    if (orderData.deliveryDate) orderData.deliveryDate = new Date(orderData.deliveryDate)
    // Replace all items if provided
    const update: any = { ...orderData }
    if (items) {
      update.items = {
        deleteMany: {},
        create: items
      }
    }
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: update,
      include: {
        site: true,
        menu: true,
        items: { include: { menuItem: { include: { category: true } } } }
      }
    })
    res.json(order)
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
      include: { site: true, menu: true }
    })
    res.json(order)
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

app.delete('/api/orders/:id', async (req, res) => {
  try {
    await prisma.order.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

// ─── DELIVERY SHEET (bulk summary) ───────────────────────────────────────────

app.get('/api/delivery-sheet', async (req, res) => {
  try {
    const { date } = req.query as { date: string }
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)

    const orders = await prisma.order.findMany({
      where: {
        deliveryDate: { gte: start, lte: end },
        status: { not: 'CANCELLED' }
      },
      include: {
        site: true,
        menu: true,
        items: { include: { menuItem: { include: { category: true } } } }
      },
      orderBy: [{ site: { name: 'asc' } }]
    })

    // Aggregate totals across all orders for the day
    const totals: Record<string, { name: string; category: string; qty: number; bulkQty: number; unitLabel: string }> = {}
    for (const order of orders) {
      for (const item of order.items) {
        const key = item.menuItemId
        if (!totals[key]) {
          totals[key] = {
            name: item.menuItem.name,
            category: item.menuItem.category.name,
            qty: 0,
            bulkQty: item.menuItem.bulkQty,
            unitLabel: item.menuItem.unitLabel
          }
        }
        totals[key].qty += item.quantity
      }
    }

    res.json({ orders, totals: Object.values(totals).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)) })
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

// ─── SEED ─────────────────────────────────────────────────────────────────────

app.post('/api/seed', async (_req, res) => {
  try {
    // Categories
    const cats = await Promise.all([
      prisma.menuCategory.upsert({ where: { id: 'cat-entree' }, update: {}, create: { id: 'cat-entree', name: 'Entrees', sortOrder: 1 } }),
      prisma.menuCategory.upsert({ where: { id: 'cat-side' }, update: {}, create: { id: 'cat-side', name: 'Sides', sortOrder: 2 } }),
      prisma.menuCategory.upsert({ where: { id: 'cat-snack' }, update: {}, create: { id: 'cat-snack', name: 'Snacks', sortOrder: 3 } }),
      prisma.menuCategory.upsert({ where: { id: 'cat-drink' }, update: {}, create: { id: 'cat-drink', name: 'Beverages', sortOrder: 4 } }),
    ])

    // Items
    await Promise.all([
      prisma.menuItem.upsert({ where: { id: 'item-pizza' }, update: {}, create: { id: 'item-pizza', name: 'Cheese Pizza Slice', categoryId: 'cat-entree', unitLabel: 'per box of 8', bulkQty: 8, price: 18.00 } }),
      prisma.menuItem.upsert({ where: { id: 'item-hotdog' }, update: {}, create: { id: 'item-hotdog', name: 'Hot Dog', categoryId: 'cat-entree', unitLabel: 'per pack of 12', bulkQty: 12, price: 14.00 } }),
      prisma.menuItem.upsert({ where: { id: 'item-sandwich' }, update: {}, create: { id: 'item-sandwich', name: 'Turkey Sandwich', categoryId: 'cat-entree', unitLabel: 'each', bulkQty: 1, price: 5.50 } }),
      prisma.menuItem.upsert({ where: { id: 'item-chips' }, update: {}, create: { id: 'item-chips', name: 'Chips (Lays)', categoryId: 'cat-snack', unitLabel: 'per case of 36', bulkQty: 36, price: 22.00 } }),
      prisma.menuItem.upsert({ where: { id: 'item-fruit' }, update: {}, create: { id: 'item-fruit', name: 'Apple', categoryId: 'cat-snack', unitLabel: 'per case of 48', bulkQty: 48, price: 28.00 } }),
      prisma.menuItem.upsert({ where: { id: 'item-juice' }, update: {}, create: { id: 'item-juice', name: 'Apple Juice Box', categoryId: 'cat-drink', unitLabel: 'per case of 40', bulkQty: 40, price: 24.00 } }),
      prisma.menuItem.upsert({ where: { id: 'item-water' }, update: {}, create: { id: 'item-water', name: 'Water Bottle', categoryId: 'cat-drink', unitLabel: 'per case of 24', bulkQty: 24, price: 12.00 } }),
      prisma.menuItem.upsert({ where: { id: 'item-salad' }, update: {}, create: { id: 'item-salad', name: 'Garden Salad', categoryId: 'cat-side', unitLabel: 'each', bulkQty: 1, price: 3.50 } }),
      prisma.menuItem.upsert({ where: { id: 'item-corn' }, update: {}, create: { id: 'item-corn', name: 'Corn on the Cob', categoryId: 'cat-side', unitLabel: 'per dozen', bulkQty: 12, price: 8.00 } }),
    ])

    // Menus
    await Promise.all([
      prisma.menu.upsert({ where: { id: 'menu-a' }, update: {}, create: { id: 'menu-a', name: 'Menu A — Pizza Day', description: 'Pizza, chips, juice' } }),
      prisma.menu.upsert({ where: { id: 'menu-b' }, update: {}, create: { id: 'menu-b', name: 'Menu B — Hot Dog Day', description: 'Hot dogs, corn, water' } }),
      prisma.menu.upsert({ where: { id: 'menu-c' }, update: {}, create: { id: 'menu-c', name: 'Menu C — Sandwich Day', description: 'Turkey sandwiches, salad, fruit' } }),
    ])

    // Sites
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
