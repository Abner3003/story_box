import { Link, useSearchParams } from '@remix-run/react'
import { useEffect, useMemo, useState } from 'react'

import { LoginCard } from '../components/login-card.js'
import { listBooks, reviewBook } from '../lib/api.client.js'
import { clearAdminApiKey, getAdminApiKey, setAdminApiKey } from '../lib/auth.client.js'
import { formatDate, formatStatus } from '../lib/format.js'
import type { AdminBookSummary } from '../lib/admin-types.js'

const PAGE_SIZE = 10

function statusClass(status: string) {
  return status || 'pending'
}

function getBookId(book: AdminBookSummary & Record<string, unknown>) {
  const fallbackId = book.book_id ?? book.bookId
  const id = typeof book.id === 'string' && book.id.trim() ? book.id : fallbackId
  return typeof id === 'string' && id.trim() ? id : null
}

export default function IndexRoute() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)

  const [sessionKey, setSessionKey] = useState(() => getAdminApiKey())
  const [books, setBooks] = useState<AdminBookSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [submittingBookId, setSubmittingBookId] = useState<string | null>(null)

  const hasPrev = page > 1
  const hasNext = books.length === PAGE_SIZE

  const authReady = Boolean(sessionKey)

  async function fetchBooks() {
    if (!authReady) return

    setLoading(true)
    setError(null)

    try {
      const data = await listBooks({ page, limit: PAGE_SIZE })
      setBooks(Array.isArray(data) ? data : [])
    } catch (cause) {
      const status = (cause as { response?: { status?: number } }).response?.status

      if (status === 401) {
        clearAdminApiKey()
        setSessionKey('')
        setAuthError('API key inválida ou expirada. Faça login novamente.')
        setBooks([])
        return
      }

      setError('Não foi possível carregar a listagem do backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchBooks()
  }, [authReady, page])

  const emptyMessage = useMemo(() => {
    if (loading) return 'Carregando livros...'
    if (error) return error
    return 'Nenhum livro encontrado para esta página.'
  }, [error, loading])

  async function handleLogin(input: { apiKey: string }) {
    if (!input.apiKey.trim()) {
      setAuthError('Informe a API key do backend.')
      return
    }

    setAdminApiKey(input.apiKey.trim())
    setSessionKey(input.apiKey.trim())
    setAuthError(null)
    setSearchParams({ page: '1' })
  }

  function logout() {
    clearAdminApiKey()
    setSessionKey('')
    setBooks([])
    setError(null)
    setAuthError(null)
  }

  async function approveBook(bookId: string) {
    setSubmittingBookId(bookId)
    setError(null)
    try {
      await reviewBook(bookId, {
        action: 'approve',
        reviewed_by: 'storybox-admin',
        notes: 'Aprovado pelo portal admin.',
      })
      await fetchBooks()
    } catch {
      setError('Não foi possível aprovar o livro.')
    } finally {
      setSubmittingBookId(null)
    }
  }

  if (!authReady) {
    return <LoginCard error={authError} loading={loading} onSubmit={handleLogin} />
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="eyebrow">StoryBox Admin</div>
        <h1 className="title">Livros gerados para revisão</h1>
        <p className="subtitle">Portal de revisão de livros gerados, com autenticação por API key.</p>

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
            <button className="button secondary" type="button" onClick={logout}>
              Sair
            </button>
          </nav>
        </div>

        {error ? <p className="error">{error}</p> : null}
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
            {books.map((book) => {
              const bookId = getBookId(book)

              if (!bookId) {
                return null
              }

              return (
                <tr key={bookId}>
                  <td>
                    <div className="stack">
                      <strong>{book.childName ?? '—'}</strong>
                      <span className="muted">Livro #{bookId}</span>
                    </div>
                  </td>
                  <td>
                    <div className="stack">
                      <strong>{book.title ?? 'Sem título'}</strong>
                      <span className="muted">{book.referenceMonth ?? '—'}</span>
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
                      <button
                        className="button"
                        type="button"
                        onClick={() => approveBook(bookId)}
                        disabled={submittingBookId === bookId}
                      >
                        {submittingBookId === bookId ? 'Aprovando...' : 'Aprovar'}
                      </button>

                      <Link className="button secondary" to={`/books/${bookId}`}>
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
              )
            })}

            {!books.length ? (
              <tr>
                <td colSpan={5}>
                  <p className="muted">{emptyMessage}</p>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </main>
  )
}
