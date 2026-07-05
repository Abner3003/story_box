export function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatStatus(value?: string | null) {
  if (!value) return '—'
  return value.replaceAll('_', ' ')
}
