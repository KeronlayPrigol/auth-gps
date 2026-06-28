import { useState } from 'react'

interface Props {
  onSubmit: (username: string, password: string, mode: 'login' | 'register') => Promise<void>
}

export function AuthForm({ onSubmit }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSubmit(username.trim(), password, mode)
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: string } } }).response?.data
      setError(data?.error ?? 'Erro de conexão com o servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <form className="login-form auth-form" onSubmit={handleSubmit}>
        <div className="sidebar-header">
          <div className="logo">🔒</div>
          <div>
            <h1 className="brand">AuthGPS</h1>
            <p className="brand-sub">{mode === 'login' ? 'Entrar na conta' : 'Criar conta'}</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label htmlFor="username">Usuário</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="seu.usuario"
            autoComplete="username"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="mín. 6 caracteres"
            minLength={6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
          />
        </div>

        <button type="submit" className="btn-login" disabled={loading}>
          {loading ? 'Enviando...' : mode === 'login' ? 'Entrar' : 'Cadastrar'}
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
        >
          {mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
        </button>

        <p className="demo-hint">Novas contas nascem com permissão de usuário comum.</p>
      </form>
    </div>
  )
}
