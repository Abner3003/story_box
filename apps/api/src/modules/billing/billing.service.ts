import type { AbacatePayPlan, AbacatePayProduct, CreateCheckoutInput } from './billing.models.js'

const ABACATEPAY_BASE_URL = 'https://api.abacatepay.com/v2'

const CYCLE_LABELS: Record<string, string> = {
  WEEKLY: 'semana',
  MONTHLY: 'mês',
  SEMIANNUALLY: 'semestre',
  ANNUALLY: 'ano',
}

async function requestAbacatePay(path: string, init: RequestInit = {}) {
  const apiKey = process.env.ABACATEPAY_API_KEY

  if (!apiKey) {
    throw new Error('ABACATEPAY_API_KEY is obrigatória')
  }

  const response = await fetch(`${ABACATEPAY_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })

  const raw = await response.text()

  if (!response.ok) {
    throw new Error(`AbacatePay error ${response.status}: ${raw}`)
  }

  if (!raw) return null

  try {
    return JSON.parse(raw) as unknown
  } catch {
    return raw
  }
}

function normalizeProducts(payload: unknown): AbacatePayProduct[] {
  if (payload && typeof payload === 'object' && 'data' in payload && Array.isArray((payload as { data: unknown }).data)) {
    return (payload as { data: AbacatePayProduct[] }).data
  }
  return []
}

export async function getPlans(): Promise<AbacatePayPlan[]> {
  const payload = await requestAbacatePay('/products/list', { method: 'GET' })
  const products = normalizeProducts(payload)

  return products
    .filter((product) => product.status === 'ACTIVE' && product.cycle)
    .map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      amount: product.price,
      interval: CYCLE_LABELS[product.cycle as string] ?? (product.cycle as string).toLowerCase(),
      imageUrl: product.imageUrl,
    }))
}

export async function createCheckout(input: CreateCheckoutInput): Promise<{ checkout_url: string }> {
  const payload = await requestAbacatePay('/subscriptions/checkout', {
    method: 'POST',
    body: JSON.stringify({
      plan_id: input.planId,
      customer: {
        name: input.customer.name,
        email: input.customer.email,
        cellphone: input.customer.phone,
      },
      metadata: {
        phone: input.customer.phone,
        planId: input.planId,
        ...input.metadata,
      },
    }),
  })

  if (!payload || typeof payload !== 'object' || typeof (payload as { checkout_url?: unknown }).checkout_url !== 'string') {
    throw new Error('Resposta inválida da AbacatePay ao criar checkout')
  }

  return { checkout_url: (payload as { checkout_url: string }).checkout_url }
}

export function formatPlanAmount(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount / 100)
}
