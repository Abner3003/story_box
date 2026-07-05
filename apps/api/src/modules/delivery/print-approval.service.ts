import type { Subscriber } from '@storybox/db'
import { sendButtons, sendText } from '../../lib/whatsapp.js'
import { updateBookStatus } from '../admin/admin.repository.js'
import { startUpsell } from '../onboarding/upsell.service.js'
import { findBookAwaitingApproval } from './delivery.repository.js'

// Prioriza detectar negativa — cobre não só o botão, mas qualquer variação
// escrita (ex: "não aprovei", "quero ajustar algo", "ficou errado").
const REJECT_RE = /^print_approval_no$|\b(não|nao|num|recus\w*|rejeit\w*|ajust\w*|mud\w*|corrig\w*|errad\w*|ruim|problema)\w*/i
const APPROVE_RE = /^print_approval_yes$|\b(sim|aprovado|aprovada|perfeito|isso|top)\b/i

export async function findPendingPrintApproval(subscriberId: string) {
  return findBookAwaitingApproval(subscriberId)
}

export async function handlePrintApprovalReply(bookId: string, subscriber: Subscriber, content: string): Promise<void> {
  const trimmed = content.trim()
  const phone = subscriber.phone

  if (REJECT_RE.test(trimmed)) {
    await updateBookStatus(bookId, { status: 'ready_for_review', review_notes: `Assinante não aprovou a impressão: "${trimmed}"` })
    await sendText(
      phone,
      'Entendido! Nossa equipe vai entrar em contato com você para ajustar o que for preciso antes de seguir pra impressão. 💛',
    )
    return
  }

  if (APPROVE_RE.test(trimmed)) {
    await updateBookStatus(bookId, { status: 'print_approved' })
    await sendText(
      phone,
      '🎁 Show! Estamos preparando a entrega do seu livro impresso com muito carinho. Assim que ele for enviado, te avisamos por aqui!',
    )

    // Comprou um livro impresso único (não é assinante recorrente) — depois
    // de aprovar, aproveita o momento pra convidar a conhecer os planos de
    // assinatura.
    if (!subscriber.is_recurring) {
      await startUpsell(subscriber)
    }
    return
  }

  await sendButtons(phone, 'Só confirmando: esse livro ficou aprovado pra impressão?', [
    { id: 'print_approval_yes', title: 'Sim, aprovado!' },
    { id: 'print_approval_no', title: 'Não, quero ajustar' },
  ])
}
