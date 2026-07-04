import { Link, useParams } from '@remix-run/react'
import { useEffect, useState } from 'react'

import { LoginCard } from '../components/login-card.js'
import { getBook, reviewBook, updateBook } from '../lib/api.client.js'
import { clearAdminApiKey, getAdminApiKey, setAdminApiKey } from '../lib/auth.client.js'
import { formatDate, formatStatus } from '../lib/format.js'
import type { AdminBookDetail } from '../lib/admin-types.js'

const EXPECTED_USERNAME = import.meta.env.VITE_ADMIN_USERNAME?.trim() || 'abner3003'
const EXPECTED_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD?.trim() || 'Wefcvb58960906@'

export default function BookReviewRoute() {
  const params = useParams()
  const bookId = params.bookId ?? ''

  const [sessionKey, setSessionKey] = useState(() => getAdminApiKey())
  const [book, setBook] = useState<AdminBookDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')

  const authReady = Boolean(sessionKey)

  async function loadBook() {
    if (!bookId || !authReady) return

    setLoading(true)
    setError(null)

    try {
      const data = await getBook(bookId)
      setBook(data)
      setTitle(data.title ?? data.storyJson?.title ?? '')
      setReviewNotes(data.reviewNotes ?? '')
    } catch (cause) {
      const status = (cause as { response?: { status?: number } }).response?.status

      if (status === 401) {
        clearAdminApiKey()
        setSessionKey('')
        setAuthError('API key inválida ou expirada. Faça login novamente.')
        return
      }

      setError('Não foi possível carregar este livro.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBook()
  }, [authReady, bookId])

  async function handleLogin(input: { username: string; password: string; apiKey: string }) {
    if (input.username.trim() !== EXPECTED_USERNAME) {
      setAuthError('Usuário inválido.')
      return
    }

    if (input.password !== EXPECTED_PASSWORD) {
      setAuthError('Senha inválida.')
      return
    }

    if (input.apiKey.trim().length === 0) {
      setAuthError('Informe a API key do backend.')
      return
    }

    setAdminApiKey(input.apiKey.trim())
    setSessionKey(input.apiKey.trim())
    setAuthError(null)
  }

  async function saveChanges() {
    if (!book) return
    setSaving(true)
    setError(null)
    try {
      const updated = await updateBook(book.id, {
        title,
        reviewNotes,
      })
      setBook(updated)
      setTitle(updated.title ?? '')
      setReviewNotes(updated.reviewNotes ?? '')
    } catch {
      setError('Não foi possível salvar as alterações.')
    } finally {
      setSaving(false)
    }
  }

  async function approve() {
    if (!book) return
    setSaving(true)
    setError(null)
    try {
      await reviewBook(book.id, {
        action: 'approve',
        reviewed_by: EXPECTED_USERNAME,
        notes: reviewNotes || 'Aprovado pelo portal admin.',
      })
      await loadBook()
    } catch {
      setError('Não foi possível aprovar este livro.')
    } finally {
      setSaving(false)
    }
  }

  async function reject() {
    if (!book) return
    setSaving(true)
    setError(null)
    try {
      await reviewBook(book.id, {
        action: 'reject',
        reviewed_by: EXPECTED_USERNAME,
        notes: reviewNotes || 'Rejeitado pelo portal admin.',
      })
      await loadBook()
    } catch {
      setError('Não foi possível rejeitar este livro.')
    } finally {
      setSaving(false)
    }
  }

  if (!authReady) {
    return <LoginCard error={authError} loading={loading} onSubmit={handleLogin} />
  }

  if (!bookId) {
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

  if (!book) {
    return (
      <main className="shell">
        <section className="panel">
          <h1 className="title" style={{ fontSize: '2rem' }}>
            {loading ? 'Carregando livro...' : 'Livro não encontrado'}
          </h1>
          {error ? <p className="error">{error}</p> : <p className="muted">Volte para a tabela e escolha outro item.</p>}
          <div className="actions">
            <Link className="button secondary" to="/">
              Voltar
            </Link>
            <button className="button secondary" type="button" onClick={loadBook} disabled={loading}>
              Recarregar
            </button>
          </div>
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
            <h1 className="title">{book.title ?? book.storyJson?.title ?? 'Sem título'}</h1>
            <p className="subtitle">
              {book.childName ?? '—'} · <span className={`status ${book.status}`}>{formatStatus(book.status)}</span>
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

        {error ? <p className="error">{error}</p> : null}
      </section>

      <div className="grid two">
        <section className="panel">
          <h2>Editar metadados</h2>

          <div className="stack">
            <label className="stack">
              <span className="muted">Título</span>
              <input className="field field-block" value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>

            <label className="stack">
              <span className="muted">Notas de revisão</span>
              <textarea
                className="textarea"
                value={reviewNotes}
                onChange={(event) => setReviewNotes(event.target.value)}
              />
            </label>
          </div>

          <div className="actions">
            <button className="button secondary" type="button" onClick={saveChanges} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button className="button" type="button" onClick={approve} disabled={saving}>
              Aprovar
            </button>
            <button className="button danger" type="button" onClick={reject} disabled={saving}>
              Rejeitar
            </button>
          </div>
        </section>

        <aside className="panel">
          <h2>Detalhes</h2>

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
            <div>
              <strong>Revisado por</strong>
              <p>{book.reviewedBy ?? '—'}</p>
            </div>
            <div>
              <strong>Revisado em</strong>
              <p>{formatDate(book.reviewedAt)}</p>
            </div>
            <div>
              <strong>Notas</strong>
              <p>{book.reviewNotes ?? '—'}</p>
            </div>
          </div>
        </aside>
      </div>

      <section className="panel">
        <h2>Páginas</h2>
        <div className="pages">
          {book.storyJson?.pages?.map((page) => (
            <article className="page-card" key={page.page_number}>
              <div className="page-meta">
                <strong>Página {page.page_number}</strong>
              </div>
              <p>{page.text}</p>
              <p className="muted">{page.illustration_prompt}</p>
            </article>
          )) ?? <p className="muted">Nenhuma página disponível.</p>}
        </div>
      </section>
    </main>
  )
}
