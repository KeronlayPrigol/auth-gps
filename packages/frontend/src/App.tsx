import { useState, useEffect } from 'react'
import { MapView } from './components/MapView'
import { LoginForm } from './components/LoginForm'
import { StatusPanel } from './components/StatusPanel'
import { ZoneConfig } from './components/ZoneConfig'
import { IPConfig } from './components/IPConfig'
import { AuthForm } from './components/AuthForm'
import {
  fetchIPInfo,
  fetchAllowedZone,
  fetchAllowedIPs,
  verifyLocation,
  updateZone,
  updateAllowedIPs,
  register,
  login,
  fetchMe,
  setAuthToken,
} from './services/api'
import type { AllowedZone, AuthUser } from './services/api'

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6_371_000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

const TOKEN_KEY = 'authgps_token'

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<AuthUser | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  const [simulatedIP, setSimulatedIP] = useState<string>('')
  const [allowedIPs, setAllowedIPs] = useState<string[]>([])
  const [zone, setZone] = useState<AllowedZone | null>(null)
  const [userPos, setUserPos] = useState<[number, number] | null>(null)
  const [gpsAllowed, setGpsAllowed] = useState<boolean | null>(null)
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setAuthChecked(true)
      return
    }
    setAuthToken(token)
    fetchMe()
      .then(({ user }) => setUser(user))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setAuthToken(null)
        setToken(null)
      })
      .finally(() => setAuthChecked(true))
  }, [token])

  useEffect(() => {
    if (!user) return

    Promise.all([fetchIPInfo(), fetchAllowedZone(), fetchAllowedIPs()]).then(([ip, z, ips]) => {
      setSimulatedIP(ip.ip)
      setZone(z)
      setAllowedIPs(ips.allowedIPs)
      setInitializing(false)
    })

    navigator.geolocation.getCurrentPosition(
      pos => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      err => {
        setGpsError(err.code === 1 ? 'Permissão negada' : 'Indisponível')
        setGpsAllowed(false)
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }, [user])

  useEffect(() => {
    if (!userPos || !zone) return
    const dist = haversine(userPos[0], userPos[1], zone.lat, zone.lng)
    setDistanceMeters(dist)
    setGpsAllowed(dist <= zone.radiusMeters)
  }, [userPos, zone])

  const ipAllowed = initializing ? null : allowedIPs.includes(simulatedIP.trim())
  const isAdmin = user?.role === 'admin'

  const handleAuthSubmit = async (username: string, password: string, mode: 'login' | 'register') => {
    const result = mode === 'login' ? await login(username, password) : await register(username, password)
    localStorage.setItem(TOKEN_KEY, result.token)
    setAuthToken(result.token)
    setToken(result.token)
    setUser(result.user)
  }

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setAuthToken(null)
    setToken(null)
    setUser(null)
    setLoginSuccess(null)
    setLoginError(null)
  }

  const handleZoneUpdate = async (newZone: AllowedZone) => {
    const updated = await updateZone(newZone)
    setZone(updated)
    setLoginSuccess(null)
    setLoginError(null)
  }

  const handleIPsUpdate = async (ips: string[]) => {
    const updated = await updateAllowedIPs(ips)
    setAllowedIPs(updated.allowedIPs)
    setLoginSuccess(null)
    setLoginError(null)
  }

  const handleVerifyLocation = async () => {
    setLoginLoading(true)
    setLoginError(null)
    try {
      const result = await verifyLocation(userPos?.[0] ?? null, userPos?.[1] ?? null, simulatedIP.trim())
      setGpsAllowed(result.checks.gps)
      if (result.distanceMeters !== null) setDistanceMeters(result.distanceMeters)
      setLoginSuccess(`Acesso liberado para ${user?.username}!`)
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: string; checks?: { ip: boolean; gps: boolean }; distanceMeters?: number | null } } }).response?.data
      if (data?.checks) {
        setGpsAllowed(data.checks.gps)
        if (data.distanceMeters !== null && data.distanceMeters !== undefined)
          setDistanceMeters(data.distanceMeters)
      }
      setLoginError(data?.error ?? 'Erro de conexão com o servidor.')
    } finally {
      setLoginLoading(false)
    }
  }

  if (!authChecked) return null

  if (!user) {
    return <AuthForm onSubmit={handleAuthSubmit} />
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">🔒</div>
          <div>
            <h1 className="brand">AuthGPS</h1>
            <p className="brand-sub">Acesso Corporativo Seguro</p>
          </div>
        </div>

        <div className="user-badge">
          <span>👤 {user.username}</span>
          <span className="role-tag">{user.role}</span>
          <button type="button" className="btn-secondary" onClick={handleLogout}>Sair</button>
        </div>

        <div className="divider" />

        <StatusPanel
          ip={simulatedIP}
          onIPChange={ip => { setSimulatedIP(ip); setLoginSuccess(null); setLoginError(null) }}
          ipAllowed={ipAllowed}
          gpsAllowed={gpsAllowed}
          distanceMeters={distanceMeters}
          gpsError={gpsError}
          initializing={initializing}
        />

        {isAdmin && (
          <>
            <div className="divider" />
            <ZoneConfig zone={zone} userPos={userPos} onUpdate={handleZoneUpdate} />
            <div className="divider" />
            <IPConfig
              currentIP={simulatedIP.trim()}
              allowedIPs={allowedIPs}
              onUpdate={handleIPsUpdate}
            />
          </>
        )}

        <div className="divider" />

        <LoginForm
          onLogin={handleVerifyLocation}
          loading={loginLoading}
          error={loginError}
          success={loginSuccess}
        />
      </aside>

      <main className="map-wrapper">
        <MapView userPos={userPos} zone={zone} gpsAllowed={gpsAllowed} />
      </main>
    </div>
  )
}
