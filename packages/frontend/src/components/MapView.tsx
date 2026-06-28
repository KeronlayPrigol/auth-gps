import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { AllowedZone } from '../services/api'

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})
L.Marker.prototype.options.icon = DefaultIcon

const userIcon = L.divIcon({
  className: '',
  html: '<div style="font-size:1.8rem;filter:drop-shadow(0 2px 4px rgba(0,0,0,.5))">📍</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

const officeIcon = L.divIcon({
  className: '',
  html: '<div style="font-size:1.8rem;filter:drop-shadow(0 2px 4px rgba(0,0,0,.5))">🏢</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

function AutoCenter({
  userPos,
  zone,
}: {
  userPos: [number, number] | null
  zone: AllowedZone | null
}) {
  const map = useMap()

  // Fly to zone whenever it changes (initial load + manual updates via ZoneConfig)
  useEffect(() => {
    if (zone) map.flyTo([zone.lat, zone.lng], 14, { duration: 1 })
  }, [zone, map])

  // Fly to user position when GPS resolves (takes priority — GPS is slower than API)
  useEffect(() => {
    if (userPos) map.flyTo(userPos, 16, { duration: 1.5 })
  }, [userPos, map])

  return null
}

interface Props {
  userPos: [number, number] | null
  zone: AllowedZone | null
  gpsAllowed: boolean | null
}

export function MapView({ userPos, zone, gpsAllowed }: Props) {
  const zoneColor = gpsAllowed === false ? '#ef4444' : '#22c55e'

  return (
    <MapContainer center={[0, 0]} zoom={2} className="map-container">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <AutoCenter userPos={userPos} zone={zone} />

      {zone && (
        <>
          <Circle
            center={[zone.lat, zone.lng]}
            radius={zone.radiusMeters}
            pathOptions={{
              color: zoneColor,
              fillColor: zoneColor,
              fillOpacity: 0.12,
              weight: 2,
            }}
          />
          <Marker position={[zone.lat, zone.lng]} icon={officeIcon}>
            <Popup>
              <strong>🏢 Zona Autorizada</strong>
              <br />
              Raio permitido: {zone.radiusMeters}m
            </Popup>
          </Marker>
        </>
      )}

      {userPos && (
        <Marker position={userPos} icon={userIcon}>
          <Popup>
            <strong>📍 Sua posição atual</strong>
            <br />
            {userPos[0].toFixed(6)}, {userPos[1].toFixed(6)}
          </Popup>
        </Marker>
      )}
    </MapContainer>
  )
}
