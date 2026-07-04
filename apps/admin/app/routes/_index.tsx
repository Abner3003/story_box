import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/cloudflare'
import { json, redirect } from '@remix-run/cloudflare'
import { Form, Link, useLoaderData, useNavigation } from '@remix-run/react'

import { getReviewerName, listBooks, reviewBook } from '../lib/api.server'
import { formatDate, formatStatus } from '../lib/format'

const PAGE_SIZE = 10

export async function loader({ context, request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1)
  const books = await listBooks(page, PAGE_SIZE + 1, context)
  const visibleBooks = books.slice(0, PAGE_SIZE)

  return json({
    books: visibleBooks,
    page,
    reviewerName: getReviewerName(context),
    hasPrev: page > 1,
    hasNext: books.length > PAGE_SIZE,
  })
}

export async function action({ context, request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const bookId = String(formData.get('bookId') ?? '')
  const action = String(formData.get('action') ?? '')
  const reviewedBy = String(formData.get('reviewedBy') ?? getReviewerName(context))
  const notes = String(formData.get('notes') ?? '').trim()
  const redirectTo = String(formData.get('redirectTo') ?? '/')

  if (!bookId || !action) {
    return json({ error: 'bookId e action são obrigatórios' }, { status: 400 })
  }

  if (action !== 'approve' && action !== 'reject') {
    return json({ error: 'action inválida' }, { status: 400 })
  }

  await reviewBook(bookId, { action, reviewed_by: reviewedBy, notes: notes || undefined }, context)
  return redirect(redirectTo)
}

export default function AdminDashboard() {
  const { books, page, hasPrev, hasNext, reviewerName } = useLoaderData<typeof loader>()
  const navigation = useNavigation()
  const isBusy = navigation.state !== 'idle'

  return (
    <main className="shell">
      <section className="hero">
        <div className="eyebrow">StoryBox Admin</div>
        <h1 className="title">Livros gerados para revisão</h1>
        <p className="subtitle">
          Tabela paginada com nome do cliente, status do livro e ações de aprovar, abrir página de revisão e baixar o
          PDF. O reviewer atual é <strong>{reviewerName}</strong>.
        </p>

        <div className="toolbar">
          <span className="pill">
            Página <strong>{page}</strong>
            {isBusy ? ' atualizando...' : ''}
          </span>

          <nav aria-label="Paginação">
            <Link className={`button secondary ${!hasPrev ? 'disabled' : ''}`} to={hasPrev ? `/?page=${page - 1}` : '#'}>
              Anterior
            </Link>
            <Link className={`button secondary ${!hasNext ? 'disabled' : ''}`} to={hasNext ? `/?page=${page + 1}` : '#'}>
              Próxima
            </Link>
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
            {books.map((book) => (
              <tr key={book.id}>
                <td>
                  <div className="stack">
                    <strong>{book.childName ?? 'Sem nome'}</strong>
                    <span className="muted">Livro #{book.id.slice(0, 8)}</span>
                  </div>
                </td>
                <td>
                  <div className="stack">
                    <strong>{book.title ?? 'Título não definido'}</strong>
                    <span className="muted">{book.referenceMonth ?? 'Coleção sem referência'}</span>
                  </div>
                </td>
                <td>
                  <span className={`status ${book.status}`}>{formatStatus(book.status)}</span>
                </td>
                <td>
                  <div className="stack">
                    <span>{formatDate(book.updatedAt)}</span>
                    <span className="muted">{formatDate(book.createdAt)}</span>
                  </div>
                </td>
                <td>
                  <div className="actions">
                    <Form method="post">
                      <input type="hidden" name="bookId" value={book.id} />
                      <input type="hidden" name="action" value="approve" />
                      <input type="hidden" name="reviewedBy" value={reviewerName} />
                      <input type="hidden" name="redirectTo" value={`/?page=${page}`} />
                      <button className="button" type="submit">
                        Aprovar
                      </button>
                    </Form>

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

            {!books.length ? (
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
