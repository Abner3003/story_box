import { useState, type FormEvent } from 'react'

type LoginCardProps = {
  error?: string | null
  loading?: boolean
  onSubmit: (input: { apiKey: string }) => Promise<void> | void
}

export function LoginCard({ error, loading, onSubmit }: LoginCardProps) {
  const [apiKey, setApiKey] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit({ apiKey })
  }

  return (
    <main className="shell">
      <section className="hero auth-hero">
        <div className="eyebrow">StoryBox Admin</div>
        <h1 className="title">Acesso administrativo</h1>
        <p className="subtitle">
          Entre com a API key do backend. A chave fica salva em cookie e é enviada no header `x-admin-key`.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="stack">
            <span className="muted">API key</span>
            <input
              className="field field-block"
              type="password"
              placeholder="cfut_..."
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
            />
          </label>

          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          {error ? <p className="error">{error}</p> : null}
        </form>
      </section>
    </main>
  )
}
