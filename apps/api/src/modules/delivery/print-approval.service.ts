import { sendButtons, sendText } from '../../lib/whatsapp.js'
import { updateBookStatus } from '../admin/admin.repository.js'
import { findBookAwaitingApproval } from './delivery.repository.js'

const APPROVE_RE = /^(print_approval_yes|sim|aprovado|1)$/i
const REJECT_RE = /^(print_approval_no|não|nao|2)$/i

export async function findPendingPrintApproval(subscriberId: string) {
  return findBookAwaitingApproval(subscriberId)
}

export async function handlePrintApprovalReply(bookId: string, phone: string, content: string): Promise<void> {
  const trimmed = content.trim()

  if (APPROVE_RE.test(trimmed)) {
    await updateBookStatus(bookId, { status: 'print_approved' })
    await sendText(
      phone,
      '🎁 Show! Estamos preparando a entrega do seu livro impresso com muito carinho. Assim que ele for enviado, te avisamos por aqui!',
    )
    return
  }

  if (REJECT_RE.test(trimmed)) {
    await sendText(
      phone,
      'Entendido! Vou avisar nossa equipe pra dar uma olhada com você antes de seguir pra impressão. 💛',
    )
    return
  }

  await sendButtons(phone, 'Só confirmando: esse livro ficou aprovado pra impressão?', [
    { id: 'print_approval_yes', title: 'Sim, aprovado!' },
    { id: 'print_approval_no', title: 'Não, quero ajustar' },
  ])
}
