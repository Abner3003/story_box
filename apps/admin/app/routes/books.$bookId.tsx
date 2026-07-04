import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/cloudflare'
import { json, redirect } from '@remix-run/cloudflare'
import { Form, Link, useLoaderData, useNavigation } from '@remix-run/react'

import { getBook, getPdfUrl, getReviewerName, reviewBook } from '../lib/api.server'
import { formatDate, formatStatus } from '../lib/format'

export async function loader({ context, params }: LoaderFunctionArgs) {
  const bookId = params.bookId
  if (!bookId) {
    throw new Response('Book id is required', { status: 400 })
  }

  const book = await getBook(bookId, context)
  const pdfUrl = book.pdfUrl ?? (await getPdfUrl(bookId, context))

  return json({
    book: {
      ...book,
      pdfUrl,
    },
    reviewerName: getReviewerName(context),
  })
}

export async function action({ context, params, request }: ActionFunctionArgs) {
  const bookId = params.bookId
  if (!bookId) {
    throw new Response('Book id is required', { status: 400 })
  }

  const formData = await request.formData()
  const action = String(formData.get('action') ?? '')
  const notes = String(formData.get('notes') ?? '').trim()
  const reviewedBy = String(formData.get('reviewedBy') ?? getReviewerName(context))

  if (action !== 'approve' && action !== 'reject') {
    return json({ error: 'action inválida' }, { status: 400 })
  }

  await reviewBook(bookId, { action, reviewed_by: reviewedBy, notes: notes || undefined }, context)
  return redirect(`/books/${bookId}`)
}

export default function BookReviewRoute() {
  const { book, reviewerName } = useLoaderData<typeof loader>()
  const navigation = useNavigation()
  const isBusy = navigation.state !== 'idle'
  const pages = book.storyJson?.pages ?? []

  return (
    <main className="shell">
      <section className="hero">
        <div className="toolbar">
          <div className="stack">
            <div className="eyebrow">Revisão de Livro</div>
            <h1 className="title">{book.title ?? 'Livro sem título'}</h1>
            <p className="subtitle">
              {book.childName ?? 'Cliente não identificado'} · <span className={`status ${book.status}`}>{formatStatus(book.status)}</span>
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
            {pages.length ? (
              pages.map((page) => (
                <article className="page-card" key={page.page_number}>
                  <div className="page-meta">
                    <strong>Página {page.page_number}</strong>
                    <span className="muted">{page.image_storage_path ? 'Imagem gerada' : 'Sem imagem'}</span>
                  </div>
                  <p>{page.text}</p>
                  <p className="muted">{page.illustration_prompt}</p>
                </article>
              ))
            ) : (
              <p className="muted">Este livro ainda não tem páginas estruturadas.</p>
            )}
          </div>
        </section>

        <aside className="panel">
          <h2>Ação de curadoria</h2>
          <p className="muted">Reviewer atual: {reviewerName}</p>

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

          <Form method="post" className="stack">
            <input type="hidden" name="reviewedBy" value={reviewerName} />
            <label className="stack">
              <span>Notas de revisão</span>
              <textarea className="textarea" name="notes" placeholder="Escreva observações para o time, se houver." />
            </label>

            <div className="actions">
              <button className="button" type="submit" name="action" value="approve" disabled={isBusy}>
                Aprovar
              </button>
              <button className="button danger" type="submit" name="action" value="reject" disabled={isBusy}>
                Rejeitar
              </button>
            </div>
          </Form>

          <div className="separator" />

          <div className="stack">
            <strong>Metadados</strong>
            <span className="muted">Collection: {book.collectionId}</span>
            <span className="muted">Child: {book.childId}</span>
            <span className="muted">Revisado por: {book.reviewedBy ?? '—'}</span>
            <span className="muted">Revisado em: {formatDate(book.reviewedAt)}</span>
            <span className="muted">Notas: {book.reviewNotes ?? '—'}</span>
          </div>
        </aside>
      </div>
    </main>
  )
}
