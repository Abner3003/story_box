export interface AbacatePayPlan {
  id: string
  name: string
  description?: string
  amount: number
  interval: string
  isRecurring: boolean
  imageUrl?: string | null
}

export interface AbacatePayProduct {
  id: string
  externalId?: string
  name: string
  description?: string
  price: number
  currency?: string
  cycle: string | null
  status: string
  imageUrl?: string | null
}

export interface BillingCustomer {
  name: string
  email?: string
  phone: string
}

export interface CreateCheckoutInput {
  planId: string
  customer: BillingCustomer
  metadata?: Record<string, string>
}

