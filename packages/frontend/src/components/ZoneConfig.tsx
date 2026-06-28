import { useState, useEffect } from 'react'
import type { AllowedZone } from '../services/api'

interface Props {
  zone: AllowedZone | null
  userPos: [number, number] | null
  onUpdate: (zone: AllowedZone) => Promise<void>
}

export function ZoneConfig({ zone, userPos, onUpdate }: Props) {
  const [open, setOpen] = useState(false)
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [radius, setRadius] = useState('50')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (zone) {
      setLat(zone.lat.toFixed(8))
      setLng(zone.lng.toFixed(8))
      setRadius(zone.radiusMeters.toString())
    }
  }, [zone])

  const useMyPos = () => {
    if (!userPos) return
    setLat(userPos[0].toFixed(8))
    setLng(userPos[1].toFixed(8))
  }

  const handleApply = async () => {
    setSaving(true)
    try {
      await onUpdate({
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        radiusMeters: parseInt(radius),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="zone-config">
      <button className="zone-config-toggle" onClick={() => setOpen(o => !o)}>
        <span>⚙ Zona de Teste</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="zone-config-body">
          <div className="zone-row">
            <div className="form-group">
              <label>Latitude</label>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={e => setLat(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Longitude</label>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={e => setLng(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Raio (metros)</label>
            <input
              type="number"
              value={radius}
              onChange={e => setRadius(e.target.value)}
              min="50"
            />
          </div>

          {userPos && (
            <button className="btn-secondary" type="button" onClick={useMyPos}>
              📍 Usar minha posição
            </button>
          )}

          <button
            className={`btn-apply${saved ? ' btn-apply--saved' : ''}`}
            type="button"
            onClick={handleApply}
            disabled={saving}
          >
            {saving ? 'Aplicando...' : saved ? '✓ Aplicado!' : 'Aplicar'}
          </button>
        </div>
      )}
    </div>
  )
}
