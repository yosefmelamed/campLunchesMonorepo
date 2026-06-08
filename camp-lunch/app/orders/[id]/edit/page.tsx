'use client'
import OrderForm from '@/components/OrderForm'
export default function EditOrderPage({ params }: { params: { id: string } }) {
  return <OrderForm orderId={params.id} />
}
