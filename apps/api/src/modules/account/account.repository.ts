import { getSupabaseClient } from '@storybox/db'
import type { BookStatus } from '@storybox/db'

export async function getLatestBookForSubscriber(subscriberId: string) {
  const db = getSupabaseClient()
  const { data, error } = await db
    .from('books')
    .select('*, monthly_collections!inner(subscriber_id, reference_month), children(name)')
    .eq('monthly_collections.subscriber_id', subscriberId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

const STATUS_LABELS: Record<BookStatus, string> = {
  pending: 'na fila para começar 📋',
  generating_text: 'escrevendo a história ✍️',
  generating_images: 'criando as ilustrações 🎨',
  assembling: 'montando o livro 📖',
  ready_for_review: 'em revisão final da nossa equipe 🔍',
  approved: 'aprovado, preparando a entrega ✅',
  rejected: 'sendo refeito com carinho pela nossa equipe 💛',
  delivered_digital: 'entregue digitalmente — já deve estar aqui no seu WhatsApp! 📚',
  awaiting_print_approval: 'aguardando sua aprovação pra seguir pra impressão 🖨️',
  print_approved: 'aprovado por você — preparando a entrega com muito carinho 💛',
  sent_to_print: 'enviado para impressão 🖨️',
  delivered_physical: 'entregue na sua casa! 🎉',
}

export function describeBookStatus(status: BookStatus): string {
  return STATUS_LABELS[status] ?? status
}
