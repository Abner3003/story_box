import { useState, type FormEvent } from 'react'

type LoginCardProps = {
  error?: string | null
  loading?: boolean
  onSubmit: (input: { username: string; password: string; apiKey: string }) => Promise<void> | void
}

const DEFAULT_USERNAME = import.meta.env.VITE_ADMIN_USERNAME?.trim() || 'abner3003'
const DEFAULT_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD?.trim() || 'Wefcvb58960906@'

export function LoginCard({ error, loading, onSubmit }: LoginCardProps) {
  const [username, setUsername] = useState(DEFAULT_USERNAME)
  const [password, setPassword] = useState(DEFAULT_PASSWORD)
  const [apiKey, setApiKey] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit({ username, password, apiKey })
  }

  return (
    <main className="shell">
      <section className="hero auth-hero">
        <div className="eyebrow">StoryBox Admin</div>
        <h1 className="title">Acesso administrativo</h1>
        <p className="subtitle">
          Entre com seu usuário, senha e a API key do backend. A chave fica salva em cookie e é enviada no header `x-admin-key`.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="stack">
            <span className="muted">Usuário</span>
            <input className="field field-block" value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>

          <label className="stack">
            <span className="muted">Senha</span>
            <input
              className="field field-block"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

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
