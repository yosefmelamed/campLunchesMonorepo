export const STATUS_COLORS: Record<string, string> = {
  PENDING:    'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED:  'bg-blue-100 text-blue-800 border-blue-200',
  PREPARING:  'bg-orange-100 text-orange-800 border-orange-200',
  IN_TRANSIT: 'bg-purple-100 text-purple-800 border-purple-200',
  DELIVERED:  'bg-green-100 text-green-800 border-green-200',
  CANCELLED:  'bg-gray-100 text-gray-500 border-gray-200',
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING:    'Pending',
  CONFIRMED:  'Confirmed',
  PREPARING:  'Preparing',
  IN_TRANSIT: 'In Transit',
  DELIVERED:  'Delivered',
  CANCELLED:  'Cancelled',
}

export const ALL_STATUSES = Object.keys(STATUS_LABELS)

export function fmt(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export function fmtDateInput(date: string | Date) {
  return new Date(date).toISOString().split('T')[0]
}

export function bulkLabel(qty: number, bulkQty: number, unitLabel: string) {
  if (bulkQty === 1) return `${qty} ${unitLabel}`
  const bulkUnits = Math.ceil(qty / bulkQty)
  return `${qty} units (${bulkUnits} × ${unitLabel})`
}
