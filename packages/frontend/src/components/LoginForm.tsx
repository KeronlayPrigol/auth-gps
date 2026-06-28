
interface Props {
  onLogin: () => Promise<void>
  loading: boolean
  error: string | null
  success: string | null
}

export function LoginForm({ onLogin, loading, error, success }: Props) {

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onLogin()
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <button
        type="submit"
        className="btn-login"
        disabled={loading || !!success}
      >
        {loading ? 'Verificando...' : success ? '✓ Acesso Liberado' : 'Entrar'}
      </button>
    </form>
  )
}
