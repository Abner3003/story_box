import { Link, useParams } from '@remix-run/react'
import { useMemo, useState } from 'react'

import { loadBooks, touchBook } from '../data/books.js'
import { formatDate, formatStatus } from '../lib/format.js'

export default function BookReviewRoute() {
  const params = useParams()
  const bookId = params.bookId ?? ''
  const [books, setBooks] = useState(() => loadBooks())

  const book = useMemo(() => books.find((item) => item.id === bookId), [books, bookId])

  function approve() {
    if (!book) return
    setBooks((current) =>
      touchBook(current, book.id, {
        status: 'approved',
        reviewedBy: 'admin-local',
        reviewedAt: new Date().toISOString(),
        reviewNotes: 'Approved locally in static SPA mode.',
      }),
    )
  }

  function reject() {
    if (!book) return
    setBooks((current) =>
      touchBook(current, book.id, {
        status: 'rejected',
        reviewedBy: 'admin-local',
        reviewedAt: new Date().toISOString(),
        reviewNotes: 'Rejected locally in static SPA mode.',
      }),
    )
  }

  if (!book) {
    return (
      <main className="shell">
        <section className="panel">
          <h1 className="title" style={{ fontSize: '2rem' }}>
            Livro não encontrado
          </h1>
          <p className="muted">Volte para a tabela e escolha outro item.</p>
          <Link className="button" to="/">
            Voltar
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="toolbar">
          <div className="stack">
            <div className="eyebrow">Revisão de Livro</div>
            <h1 className="title">{book.title}</h1>
            <p className="subtitle">
              {book.childName} · <span className={`status ${book.status}`}>{formatStatus(book.status)}</span>
            </p>
          </div>

          <div className="actions">
            <Link className="button secondary" to="/">
              Voltar para a tabela
            </Link>
            {book.pdfUrl ? (
              <a className="button secondary" href={book.pdfUrl} target="_blank" rel="noreferrer">
                Download PDF
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid two">
        <section className="panel">
          <h2>Páginas</h2>
          <div className="pages">
            {book.storyJson.pages.map((page) => (
              <article className="page-card" key={page.page_number}>
                <div className="page-meta">
                  <strong>Página {page.page_number}</strong>
                </div>
                <p>{page.text}</p>
                <p className="muted">{page.illustration_prompt}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="panel">
          <h2>Ação de curadoria</h2>

          <div className="stack">
            <div>
              <strong>Status atual</strong>
              <p>{formatStatus(book.status)}</p>
            </div>
            <div>
              <strong>Criado em</strong>
              <p>{formatDate(book.createdAt)}</p>
            </div>
            <div>
              <strong>Atualizado em</strong>
              <p>{formatDate(book.updatedAt)}</p>
            </div>
          </div>

          <div className="separator" />

          <div className="actions">
            <button className="button" type="button" onClick={approve}>
              Aprovar
            </button>
            <button className="button danger" type="button" onClick={reject}>
              Rejeitar
            </button>
          </div>

          <div className="separator" />

          <div className="stack">
            <strong>Metadados</strong>
            <span className="muted">Revisado por: {book.reviewedBy ?? '—'}</span>
            <span className="muted">Revisado em: {formatDate(book.reviewedAt)}</span>
            <span className="muted">Notas: {book.reviewNotes ?? '—'}</span>
          </div>
        </aside>
      </div>
    </main>
  )
}
