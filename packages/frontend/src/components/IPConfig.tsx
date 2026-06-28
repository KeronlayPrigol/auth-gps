import { useState } from 'react'

interface Props {
  currentIP: string | null
  allowedIPs: string[]
  onUpdate: (ips: string[]) => Promise<void>
}

export function IPConfig({ currentIP, allowedIPs, onUpdate }: Props) {
  const [open, setOpen] = useState(false)
  const [newIP, setNewIP] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const saveIPs = async (ips: string[]) => {
    setSaving(true)
    try {
      await onUpdate(ips)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const addIP = async (ip: string) => {
    const trimmed = ip.trim()
    if (!trimmed || allowedIPs.includes(trimmed)) return
    await saveIPs([...allowedIPs, trimmed])
    setNewIP('')
  }

  const removeIP = async (ip: string) => {
    setSaving(true)
    try {
      await onUpdate(allowedIPs.filter(i => i !== ip))
    } finally {
      setSaving(false)
    }
  }

  const currentIPInList = currentIP ? allowedIPs.includes(currentIP) : false

  return (
    <div className="zone-config">
      <button className="zone-config-toggle" onClick={() => setOpen(o => !o)}>
        <span>🌐 IPs Permitidos</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="zone-config-body">
          <div className="ip-list">
            {allowedIPs.length === 0 && (
              <p className="ip-empty">Nenhum IP na lista. Todos os acessos serão bloqueados por IP.</p>
            )}
            {allowedIPs.map(ip => (
              <div key={ip} className="ip-item">
                <span className={`status-value mono${ip === currentIP ? ' ip-current' : ''}`}>
                  {ip}{ip === currentIP ? ' (você)' : ''}
                </span>
                <button
                  className="btn-remove"
                  onClick={() => removeIP(ip)}
                  disabled={saving}
                  title="Remover IP"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {currentIP && !currentIPInList && (
            <button
              className="btn-secondary"
              type="button"
              onClick={() => addIP(currentIP)}
              disabled={saving}
            >
              ➕ Adicionar meu IP ({currentIP})
            </button>
          )}

          <div className="ip-add-row">
            <input
              type="text"
              placeholder="Ex: 192.168.1.100"
              value={newIP}
              onChange={e => setNewIP(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addIP(newIP)}
            />
            <button
              className={`btn-apply${saved ? ' btn-apply--saved' : ''}`}
              type="button"
              onClick={() => addIP(newIP)}
              disabled={saving || !newIP.trim()}
            >
              {saved ? '✓' : 'Adicionar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
