export type BookStatus =
  | 'pending'
  | 'generating_text'
  | 'generating_images'
  | 'assembling'
  | 'ready_for_review'
  | 'approved'
  | 'rejected'
  | 'delivered_digital'
  | 'sent_to_print'
  | 'delivered_physical'

export type StoryPage = {
  page_number: number
  text: string
  illustration_prompt: string
}

export type BookRecord = {
  id: string
  status: BookStatus
  title: string
  childName: string
  referenceMonth: string
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
  createdAt: string
  updatedAt: string
  pdfUrl?: string | null
  storyJson: {
    title: string
    moral: string
    pages: StoryPage[]
  }
}

export const initialBooks: BookRecord[] = [
  {
    id: 'book-001',
    status: 'ready_for_review',
    title: 'A Viagem do Leo',
    childName: 'Leo',
    referenceMonth: '2026-07-01',
    createdAt: '2026-07-04T16:00:00.000Z',
    updatedAt: '2026-07-04T16:34:00.000Z',
    pdfUrl: null,
    storyJson: {
      title: 'A Viagem do Leo',
      moral: 'Coragem cresce quando a gente tenta.',
      pages: [
        {
          page_number: 1,
          text: 'Leo encontrou um mapa brilhante no quintal.',
          illustration_prompt: 'A curious child discovering a glowing map in the backyard, dreamy watercolor',
        },
        {
          page_number: 2,
          text: 'Cada pista revelava um lugar novo e divertido.',
          illustration_prompt: 'A child following magical clues through a colorful forest, whimsical storybook style',
        },
        {
          page_number: 3,
          text: 'No final, Leo percebeu que o tesouro era a própria aventura.',
          illustration_prompt: 'A joyful child celebrating with friends at the end of an adventure, warm illustration',
        },
      ],
    },
  },
  {
    id: 'book-002',
    status: 'generating_images',
    title: 'A Ponte de Alice',
    childName: 'Alice',
    referenceMonth: '2026-07-01',
    createdAt: '2026-07-04T15:12:00.000Z',
    updatedAt: '2026-07-04T16:02:00.000Z',
    pdfUrl: null,
    storyJson: {
      title: 'A Ponte de Alice',
      moral: 'Juntos a travessia fica mais leve.',
      pages: [
        {
          page_number: 1,
          text: 'Alice desenhou uma ponte para ligar dois mundos.',
          illustration_prompt: 'A child drawing a magical bridge between two lands, soft pastel colors',
        },
        {
          page_number: 2,
          text: 'Os amigos ajudaram a colorir cada tijolo da ponte.',
          illustration_prompt: 'Children painting a bridge together, vibrant and friendly',
        },
      ],
    },
  },
]

const STORAGE_KEY = 'storybox-admin-books'

function isBrowser() {
  return typeof window !== 'undefined'
}

export function loadBooks(): BookRecord[] {
  if (!isBrowser()) return initialBooks

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialBooks
    const parsed = JSON.parse(raw) as BookRecord[]
    return Array.isArray(parsed) && parsed.length ? parsed : initialBooks
  } catch {
    return initialBooks
  }
}

export function saveBooks(books: BookRecord[]) {
  if (!isBrowser()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(books))
}

export function touchBook(books: BookRecord[], bookId: string, patch: Partial<BookRecord>): BookRecord[] {
  const updated = books.map((book) =>
    book.id === bookId
      ? {
          ...book,
          ...patch,
          updatedAt: new Date().toISOString(),
        }
      : book,
  )

  saveBooks(updated)
  return updated
}
