export const idParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string' },
  },
} as const

export const subscriptionSchema = {
  type: 'object',
  required: ['id', 'name', 'plan', 'status', 'createdAt', 'updatedAt'],
  properties: {
    id:        { type: 'string' },
    name:      { type: 'string' },
    plan:      { type: 'string' },
    status:    { type: 'string', enum: ['active', 'inactive', 'pending'] },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
  additionalProperties: false,
} as const

export const onboardingSchema = {
  type: 'object',
  required: ['id', 'name', 'completed', 'createdAt', 'updatedAt'],
  properties: {
    id:        { type: 'string' },
    name:      { type: 'string' },
    completed: { type: 'boolean' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
  additionalProperties: false,
} as const

export const whatsappStatusSchema = {
  type: 'object',
  required: ['connected', 'lastSyncedAt'],
  properties: {
    connected:     { type: 'boolean' },
    phoneNumberId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    lastSyncedAt:  { type: 'string' },
  },
  additionalProperties: false,
} as const

export const sendWhatsAppMessageBodySchema = {
  type: 'object',
  required: ['to', 'message'],
  properties: {
    to:      { type: 'string' },
    message: { type: 'string' },
  },
  additionalProperties: false,
} as const

export const sendWhatsAppMessageResponseSchema = {
  type: 'object',
  required: ['ok', 'data'],
  properties: {
    ok:   { type: 'boolean' },
    data: { type: 'object', additionalProperties: true },
  },
  additionalProperties: false,
} as const

export const metaObjectBodySchema = {
  type: 'object',
  required: ['object', 'entry'],
  example: {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '123456789',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '5511999999999', phone_number_id: '987654321' },
              contacts: [{ profile: { name: 'João Silva' }, wa_id: '5511988887777' }],
              messages: [
                {
                  from: '5511988887777',
                  id: 'wamid.abc123',
                  timestamp: '1700000000',
                  type: 'text',
                  text: { body: 'Olá!' },
                },
              ],
            },
          },
        ],
      },
    ],
  },
  properties: {
    object: { type: 'string' },
    entry: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'changes'],
        properties: {
          id: { type: 'string' },
          changes: {
            type: 'array',
            items: {
              type: 'object',
              required: ['field', 'value'],
              properties: {
                field: { type: 'string' },
                value: {
                  type: 'object',
                  required: ['messaging_product', 'metadata'],
                  properties: {
                    messaging_product: { type: 'string' },
                    metadata: {
                      type: 'object',
                      required: ['display_phone_number', 'phone_number_id'],
                      properties: {
                        display_phone_number: { type: 'string' },
                        phone_number_id:      { type: 'string' },
                      },
                      additionalProperties: true,
                    },
                    contacts: {
                      type: 'array',
                      items: {
                        type: 'object',
                        required: ['wa_id'],
                        properties: {
                          profile: {
                            type: 'object',
                            required: ['name'],
                            properties: { name: { type: 'string' } },
                            additionalProperties: true,
                          },
                          wa_id: { type: 'string' },
                        },
                        additionalProperties: true,
                      },
                    },
                    messages: {
                      type: 'array',
                      items: {
                        type: 'object',
                        required: ['from', 'id', 'timestamp', 'type'],
                        properties: {
                          from:      { type: 'string' },
                          id:        { type: 'string' },
                          timestamp: { type: 'string' },
                          type:      { type: 'string' },
                          text:      { type: 'object', required: ['body'], properties: { body: { type: 'string' } }, additionalProperties: true },
                          image:     { type: 'object', additionalProperties: true },
                          audio:     { type: 'object', additionalProperties: true },
                          video:     { type: 'object', additionalProperties: true },
                          document:  { type: 'object', additionalProperties: true },
                          sticker:   { type: 'object', additionalProperties: true },
                          interactive: { type: 'object', additionalProperties: true },
                        },
                        additionalProperties: true,
                      },
                    },
                    statuses: {
                      type: 'array',
                      items: { type: 'object', additionalProperties: true },
                    },
                  },
                  additionalProperties: true,
                },
              },
              additionalProperties: true,
            },
          },
        },
        additionalProperties: true,
      },
    },
  },
  additionalProperties: true,
} as const

export const webhookResponseSchema = {
  type: 'object',
  required: ['received'],
  properties: {
    received: { type: 'boolean' },
  },
  additionalProperties: true,
} as const
