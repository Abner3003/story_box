import type { WhatsAppWebhookPayload } from './webhook.models.js'
import { findSubscriberByPhone, claimMessage } from './webhook.repository.js'
import { startOnboarding, resumeOnboarding, isOnboarding } from '../onboarding/onboarding.service.js'
import { resumeWeeklyCollection, isInWeeklyCollection } from '../onboarding/weekly-collection.service.js'
import { startAccountMenu, resumeAccountMenu, isInAccountMenu } from '../onboarding/account.service.js'
import { resumeUpsell, isInUpsell } from '../onboarding/upsell.service.js'
import { findPendingPrintApproval, handlePrintApprovalReply } from '../delivery/print-approval.service.js'
import { showTypingIndicator } from '../../lib/whatsapp.js'
import { runExclusive } from '../../lib/phone-lock.js'

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
          : msg.type === 'interactive' && msg.interactive?.button_reply
            ? msg.interactive.button_reply.id
            : msg.type === 'image' && msg.image?.id
              ? `[image:${msg.image.id}]${msg.image.caption ? `\n\n${msg.image.caption}` : ''}`
              : `[${msg.type}]`

        // A Meta reentrega o mesmo webhook se demorarmos pra responder (ex:
        // geração de imagem/estilo é lenta) — sem isso, a reentrega reprocessa
        // a mesma foto/mensagem em paralelo e corrompe o fluxo do LangGraph.
        if (!opts.simulate) {
          const isNew = await claimMessage({ message_id: msg.id, type: msg.type, content })
          if (!isNew) {
            console.log(`[webhook] mensagem ${msg.id} já processada, ignorando reentrega`)
            continue
          }
        }

        // Serializa por telefone — se a mensagem anterior desse número ainda
        // estiver sendo processada (Vision/geração de imagem pode levar
        // vários segundos), espera terminar antes de tocar no mesmo thread
        // do LangGraph. Sem isso, duas mensagens em sequência rápida rodam
        // concorrentemente e corrompem o fluxo (respostas trocadas/erradas).
        await runExclusive(phone, async () => {
          await showTypingIndicator(msg.id).catch(() => {})

          if (await isOnboarding(phone, { simulate: opts.simulate })) {
            await resumeOnboarding(phone, content, { simulate: opts.simulate })
            return
          }

          if (await isInWeeklyCollection(phone)) {
            await resumeWeeklyCollection(phone, content)
            return
          }

          if (await isInAccountMenu(phone)) {
            await resumeAccountMenu(phone, content)
            return
          }

          const subscriber = await findSubscriberByPhone(phone)

          if (!subscriber) {
            await startOnboarding(phone, { simulate: opts.simulate, name: contactName })
            return
          }

          // Checa antes do upsell: enquanto o livro estiver esperando
          // aprovação pra impressão, a próxima mensagem é resposta disso, não
          // uma escolha de plano do CTA que pode ser disparado a seguir.
          const pendingApproval = await findPendingPrintApproval(subscriber.id)
          if (pendingApproval) {
            await handlePrintApprovalReply(pendingApproval.id, subscriber, content)
            return
          }

          if (await isInUpsell(phone)) {
            await resumeUpsell(phone, content)
            return
          }

          await startAccountMenu(subscriber)
        })
      }
    }
  }
}
