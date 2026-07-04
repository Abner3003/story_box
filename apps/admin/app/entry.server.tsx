import type { AppLoadContext, EntryContext } from '@remix-run/cloudflare'
import { RemixServer } from '@remix-run/react'
import { renderToReadableStream } from 'react-dom/server.browser'

export default async function handleRequest(
  request: Request,
  statusCode: number,
  headers: Headers,
  remixContext: EntryContext,
  _loadContext: AppLoadContext,
) {
  const body = await renderToReadableStream(
    <RemixServer context={remixContext} url={request.url} />,
    {
      signal: request.signal,
      onError(error) {
        console.error(error)
      },
    },
  )

  headers.set('Content-Type', 'text/html')
  return new Response(body, {
    headers,
    status: statusCode,
  })
}
