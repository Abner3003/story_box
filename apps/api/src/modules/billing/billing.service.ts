import { getSupabaseClient } from '@storybox/db'
import type { AbacatePayPlan, AbacatePayProduct, CreateCheckoutInput } from './billing.models.js'

const ABACATEPAY_BASE_URL = 'https://api.abacatepay.com/v2'
const PLAN_IMAGES_BUCKET = 'storybox-assets'
const PLAN_IMAGE_SIGNED_URL_TTL = 60 * 60 * 24 * 7 // 7 dias

async function getPlanImageUrl(productId: string): Promise<string | null> {
  try {
    const db = getSupabaseClient()
    const { data, error } = await db.storage
      .from(PLAN_IMAGES_BUCKET)
      .createSignedUrl(`${productId}.png`, PLAN_IMAGE_SIGNED_URL_TTL)
    if (error || !data) return null
    return data.signedUrl
  } catch {
    return null
  }
}

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

  // Assinaturas recorrentes primeiro, compras avulsas (sem cycle) por último
  const activeProducts = products
    .filter((product) => product.status === 'ACTIVE')
    .sort((a, b) => Number(!a.cycle) - Number(!b.cycle))

  return Promise.all(
    activeProducts.map(async (product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      amount: product.price,
      interval: product.cycle ? (CYCLE_LABELS[product.cycle] ?? product.cycle.toLowerCase()) : 'pagamento único',
      isRecurring: Boolean(product.cycle),
      imageUrl: await getPlanImageUrl(product.id),
    })),
  )
}

async function getOrCreateCustomer(customer: CreateCheckoutInput['customer']): Promise<string | null> {
  if (!customer.email) return null

  const payload = await requestAbacatePay('/customers/create', {
    method: 'POST',
    body: JSON.stringify({
      email: customer.email,
      name: customer.name,
      cellphone: customer.phone,
      taxId: customer.taxId,
    }),
  })

  return (payload as { data?: { id?: string } } | null)?.data?.id ?? null
}

export async function createCheckout(input: CreateCheckoutInput): Promise<{ checkout_url: string; customerId: string | null }> {
  const customerId = await getOrCreateCustomer(input.customer)

  // Assinaturas só aceitam CARD e exigem produto com ciclo definido;
  // compras avulsas usam o checkout comum (PIX + CARD).
  const endpoint = input.isRecurring ? '/subscriptions/create' : '/checkouts/create'

  const payload = await requestAbacatePay(endpoint, {
    method: 'POST',
    body: JSON.stringify({
      items: [{ id: input.planId, quantity: 1 }],
      ...(customerId ? { customerId } : {}),
      metadata: {
        phone: input.customer.phone,
        name: input.customer.name,
        email: input.customer.email,
        planId: input.planId,
        ...input.metadata,
      },
    }),
  })

  const url = (payload as { data?: { url?: string } } | null)?.data?.url
  if (!url) {
    throw new Error('Resposta inválida da AbacatePay ao criar checkout')
  }

  return { checkout_url: url, customerId }
}

export function formatPlanAmount(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount / 100)
}
