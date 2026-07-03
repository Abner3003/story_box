import type { FastifyPluginAsync } from 'fastify'
import { createCheckout, formatPlanAmount, getPlans } from '../modules/billing/billing.service.js'

export const billingRouter: FastifyPluginAsync = async (app) => {
  app.get('/plans', {
    schema: {
      tags: ['Billing'],
      summary: 'Lista planos cadastrados no AbacatePay',
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id:       { type: 'string' },
              name:     { type: 'string' },
              amount:   { type: 'number' },
              interval: { type: 'string' },
              label:    { type: 'string' },
            },
            required: ['id', 'name', 'amount', 'interval', 'label'],
          },
        },
      },
    },
  }, async () => {
    const plans = await getPlans()
    return plans.map((plan) => ({
      ...plan,
      label: `${plan.name} - ${formatPlanAmount(plan.amount)}/${plan.interval}`,
    }))
  })

  app.post<{
    Body: {
      planId: string
      isRecurring: boolean
      customer: {
        name: string
        email?: string
        phone: string
        taxId?: string
      }
    }
  }>('/checkout', {
    schema: {
      tags: ['Billing'],
      summary: 'Cria checkout/link de pagamento na AbacatePay',
      body: {
        type: 'object',
        properties: {
          planId: { type: 'string' },
          isRecurring: { type: 'boolean' },
          customer: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string' },
              phone: { type: 'string' },
              taxId: { type: 'string' },
            },
            required: ['name', 'phone'],
          },
        },
        required: ['planId', 'isRecurring', 'customer'],
      },
      response: {
        200: {
          type: 'object',
          properties: { url: { type: 'string' } },
          required: ['url'],
        },
      },
    },
  }, async (req) => {
    const checkout = await createCheckout({
      planId: req.body.planId,
      isRecurring: req.body.isRecurring,
      customer: req.body.customer,
    })

    return { url: checkout.checkout_url }
  })
}
