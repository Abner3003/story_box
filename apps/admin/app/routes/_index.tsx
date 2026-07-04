import { Link, useSearchParams } from '@remix-run/react'
import { useEffect, useMemo, useState } from 'react'

import { loadBooks, saveBooks, touchBook, type BookRecord } from '../data/books.js'
import { formatDate, formatStatus } from '../lib/format.js'

const PAGE_SIZE = 10

function statusClass(status: string) {
  return status
}

export default function IndexRoute() {
  const [books, setBooks] = useState<BookRecord[]>(() => loadBooks())
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)

  useEffect(() => {
    saveBooks(books)
  }, [books])

  const pagedBooks = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return books.slice(start, start + PAGE_SIZE)
  }, [books, page])

  const hasPrev = page > 1
  const hasNext = page * PAGE_SIZE < books.length

  function reviewBook(bookId: string, action: 'approve' | 'reject') {
    setBooks((current) =>
      touchBook(current, bookId, {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedBy: 'admin-local',
        reviewedAt: new Date().toISOString(),
        reviewNotes: action === 'approve' ? 'Approved locally in static SPA mode.' : 'Rejected locally in static SPA mode.',
      }),
    )
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="eyebrow">StoryBox Admin</div>
        <h1 className="title">Livros gerados para revisão</h1>
        <p className="subtitle">
          Portal estático em SPA mode. As alterações ficam salvas apenas neste navegador, sem backend nesta versão.
        </p>

        <div className="toolbar">
          <span className="pill">
            Página <strong>{page}</strong>
          </span>

          <nav aria-label="Paginação">
            <button
              className={`button secondary ${!hasPrev ? 'disabled' : ''}`}
              type="button"
              onClick={() => hasPrev && setSearchParams({ page: String(page - 1) })}
              disabled={!hasPrev}
            >
              Anterior
            </button>
            <button
              className={`button secondary ${!hasNext ? 'disabled' : ''}`}
              type="button"
              onClick={() => hasNext && setSearchParams({ page: String(page + 1) })}
              disabled={!hasNext}
            >
              Próxima
            </button>
          </nav>
        </div>
      </section>

      <section className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Livro</th>
              <th>Status</th>
              <th>Atualizado</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {pagedBooks.map((book) => (
              <tr key={book.id}>
                <td>
                  <div className="stack">
                    <strong>{book.childName}</strong>
                    <span className="muted">Livro #{book.id}</span>
                  </div>
                </td>
                <td>
                  <div className="stack">
                    <strong>{book.title}</strong>
                    <span className="muted">{book.referenceMonth}</span>
                  </div>
                </td>
                <td>
                  <span className={`status ${statusClass(book.status)}`}>{formatStatus(book.status)}</span>
                </td>
                <td>
                  <div className="stack">
                    <span>{formatDate(book.updatedAt)}</span>
                    <span className="muted">{formatDate(book.createdAt)}</span>
                  </div>
                </td>
                <td>
                  <div className="actions">
                    <button className="button" type="button" onClick={() => reviewBook(book.id, 'approve')}>
                      Aprovar
                    </button>

                    <Link className="button secondary" to={`/books/${book.id}`}>
                      Revisar página
                    </Link>

                    {book.pdfUrl ? (
                      <a className="button secondary" href={book.pdfUrl} target="_blank" rel="noreferrer">
                        Download PDF
                      </a>
                    ) : (
                      <span className="pill">PDF indisponível</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {!pagedBooks.length ? (
              <tr>
                <td colSpan={5}>
                  <p className="muted">Nenhum livro encontrado para esta página.</p>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </main>
  )
}
