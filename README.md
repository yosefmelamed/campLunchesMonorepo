# ⛺ Camp Lunch CRM

A full-stack CRM for managing camp lunch programs — track menus, orders across multiple sites, bulk inventory, and delivery sheets.

## Stack

- **Next.js 14** (App Router) — frontend
- **Express** — REST API backend
- **PostgreSQL** — database
- **Prisma** — ORM + migrations
- **TypeScript** throughout

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a hosted DB like Supabase/Railway/Neon)

### 2. Clone & Install

```bash
git clone <your-repo>
cd camp-lunch
npm install
```

### 3. Configure Database

Copy `.env.example` to `.env` and fill in your PostgreSQL connection string:

```bash
cp .env.example .env
# Edit .env:
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/camp_lunch_db"
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### 4. Set Up the Database

```bash
# Push the Prisma schema to your database
npm run db:push

# (Optional) Open Prisma Studio to inspect data
npm run db:studio
```

### 5. Run the App

```bash
npm run dev
```

This starts both:
- Next.js frontend at **http://localhost:3000**
- Express API at **http://localhost:3001**

### 6. Seed Sample Data

Once the app is running, click the **"Load Sample Data"** button on the dashboard, or call:

```bash
curl -X POST http://localhost:3001/api/seed
```

This creates 4 sites, 3 menus, 9 menu items across 4 categories.

---

## Project Structure

```
camp-lunch/
├── app/                  # Next.js pages (App Router)
│   ├── page.tsx          # Dashboard
│   ├── orders/           # Order list, new, detail, edit
│   ├── delivery/         # Daily delivery sheet
│   ├── sites/            # Site management
│   ├── menus/            # Menu management
│   └── menu-items/       # Item + category management
├── components/
│   ├── Sidebar.tsx
│   └── OrderForm.tsx
├── lib/
│   ├── api.ts            # Typed API client
│   └── utils.ts          # Formatters, constants
├── server/
│   └── index.ts          # Express API (all routes)
└── prisma/
    └── schema.prisma     # Data models
```

---

## Data Model

| Model | Description |
|-------|-------------|
| `Site` | A camp location that places orders |
| `Menu` | A named menu (e.g. "Menu A — Pizza Day") |
| `MenuCategory` | Groups items (Entrees, Sides, Snacks, Beverages) |
| `MenuItem` | An orderable item with bulk packaging info |
| `Order` | A site's order for a specific date and menu |
| `OrderItem` | Line item: quantity of a MenuItem in an Order |

### Bulk Packaging

Each `MenuItem` has:
- `unitLabel` — display name for bulk unit (e.g. "per case of 24")
- `bulkQty` — how many individual units per bulk unit (e.g. 24)

So if a site orders 96 juice boxes, the system shows: **96 units → 4 × per case of 24**

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/sites` | List / create sites |
| PUT/DELETE | `/api/sites/:id` | Update / archive site |
| GET/POST | `/api/categories` | List / create categories |
| GET/POST | `/api/menu-items` | List / create menu items |
| GET/POST | `/api/menus` | List / create menus |
| GET/POST | `/api/orders` | List (filterable) / create orders |
| GET | `/api/orders/:id` | Single order detail |
| PUT | `/api/orders/:id` | Full order update |
| PATCH | `/api/orders/:id/status` | Status update only |
| DELETE | `/api/orders/:id` | Delete order |
| GET | `/api/delivery-sheet?date=YYYY-MM-DD` | All orders + totals for a date |
| POST | `/api/seed` | Load sample data |

---

## Deployment

### Database: Supabase / Railway / Neon (recommended)

1. Create a free PostgreSQL database
2. Copy the connection string to `DATABASE_URL` in your `.env`
3. Run `npm run db:push`

### Express API: Railway / Render / Fly.io

Set `PORT` and `DATABASE_URL` env vars, then deploy the `server/` directory.

### Next.js: Vercel

Set `NEXT_PUBLIC_API_URL` to your deployed Express API URL.
