interface Props {
  ip: string
  onIPChange: (ip: string) => void
  ipAllowed: boolean | null
  gpsAllowed: boolean | null
  distanceMeters: number | null
  gpsError: string | null
  initializing: boolean
}

export function StatusPanel({
  ip,
  onIPChange,
  ipAllowed,
  gpsAllowed,
  distanceMeters,
  gpsError,
  initializing,
}: Props) {
  return (
    <div className="status-panel">
      <h3>Verificações de Segurança</h3>

      <div className="status-item">
        <span className="status-label">🌐 Endereço IP</span>
        <div className="status-right">
          <input
            className="ip-sim-input mono"
            type="text"
            value={ip}
            onChange={e => onIPChange(e.target.value)}
            placeholder="Ex: 192.168.1.1"
            spellCheck={false}
          />
          <Badge allowed={ipAllowed} loading={initializing} />
        </div>
      </div>

      <div className="status-item">
        <span className="status-label">📍 Localização GPS</span>
        <div className="status-right">
          {gpsError ? (
            <span className="status-error">{gpsError}</span>
          ) : distanceMeters !== null ? (
            <span className="status-value">{distanceMeters}m do ponto</span>
          ) : (
            <span className="status-value">Obtendo...</span>
          )}
          <Badge
            allowed={gpsAllowed}
            loading={!gpsError && gpsAllowed === null}
          />
        </div>
      </div>
    </div>
  )
}

function Badge({
  allowed,
  loading,
}: {
  allowed: boolean | null
  loading: boolean
}) {
  if (loading || allowed === null)
    return <span className="badge badge-loading">•••</span>
  return allowed ? (
    <span className="badge badge-ok">✓ OK</span>
  ) : (
    <span className="badge badge-fail">✗ Negado</span>
  )
}
