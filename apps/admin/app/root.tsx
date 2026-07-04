import type { LinksFunction, MetaFunction } from '@remix-run/cloudflare'
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from '@remix-run/react'

import stylesheet from './styles/global.css?url'

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: stylesheet }]

export const meta: MetaFunction = () => [
  { title: 'StoryBox Admin' },
  {
    name: 'description',
    content: 'Portal administrativo para revisar livros gerados e aprovar entregas.',
  },
]

export default function App() {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}
