import type { WhatsAppWebhookPayload } from './webhook.models.js'
import { findSubscriberByPhone, logInboundMessage } from './webhook.repository.js'
import { startOnboarding, resumeOnboarding, isOnboarding } from '../onboarding/onboarding.service.js'

export async function handleWhatsAppWebhook(
  payload: WhatsAppWebhookPayload,
  opts: { simulate?: boolean } = {},
): Promise<void> {
  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      const { messages } = change.value
      if (!messages?.length) continue

      const contactName = change.value.contacts?.[0]?.profile?.name ?? ''

      for (const msg of messages) {
        const phone = `+${msg.from}`
        const content = msg.type === 'text'
          ? (msg.text?.body ?? '')
          : msg.type === 'image' && msg.image?.id
            ? `[image:${msg.image.id}]`
            : `[${msg.type}]`

        const subscriber = await findSubscriberByPhone(phone)

        if (!subscriber) {
          if (await isOnboarding(phone, { simulate: opts.simulate })) {
            await resumeOnboarding(phone, content, { simulate: opts.simulate })
          } else {
            await startOnboarding(phone, { simulate: opts.simulate, name: contactName })
          }
          continue
        }

        await logInboundMessage({
          subscriber_id: subscriber.id,
          message_id:    msg.id,
          direction:     'inbound',
          type:          msg.type,
          content,
        })

        // TODO: enfileirar no inboundQueue para o agente LangGraph processar
      }
    }
  }
}
