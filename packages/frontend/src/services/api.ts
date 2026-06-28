import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' })

export function setAuthToken(token: string | null) {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  else delete api.defaults.headers.common['Authorization']
}

export interface IPInfo {
  ip: string
  allowed: boolean
}

export interface AllowedZone {
  lat: number
  lng: number
  radiusMeters: number
}

export interface AuthUser {
  username: string
  role: 'user' | 'admin'
}

export interface AuthResult {
  token: string
  user: AuthUser
}

export interface VerifyLocationResult {
  checks: { ip: boolean; gps: boolean }
  distanceMeters: number | null
}

export interface ApiError {
  error: string
  checks?: { ip: boolean; gps: boolean }
  distanceMeters?: number | null
}

export async function register(username: string, password: string): Promise<AuthResult> {
  const { data } = await api.post<AuthResult>('/auth/register', { username, password })
  return data
}

export async function login(username: string, password: string): Promise<AuthResult> {
  const { data } = await api.post<AuthResult>('/auth/login', { username, password })
  return data
}

export async function fetchMe(): Promise<{ user: AuthUser }> {
  const { data } = await api.get<{ user: AuthUser }>('/auth/me')
  return data
}

export async function fetchIPInfo(): Promise<IPInfo> {
  const { data } = await api.get<IPInfo>('/auth/ip')
  return data
}

export async function fetchAllowedZone(): Promise<AllowedZone> {
  const { data } = await api.get<AllowedZone>('/auth/zone')
  return data
}

export async function updateZone(zone: AllowedZone): Promise<AllowedZone> {
  const { data } = await api.put<AllowedZone>('/auth/zone', zone)
  return data
}

export async function verifyLocation(
  lat: number | null,
  lng: number | null,
  simulatedIP?: string,
): Promise<VerifyLocationResult> {
  const headers: Record<string, string> = {}
  if (simulatedIP) headers['x-simulated-ip'] = simulatedIP
  const { data } = await api.post<VerifyLocationResult>('/auth/verify-location', { lat, lng }, { headers })
  return data
}

export interface IPsConfig {
  allowedIPs: string[]
}

export async function fetchAllowedIPs(): Promise<IPsConfig> {
  const { data } = await api.get<IPsConfig>('/auth/ips')
  return data
}

export async function updateAllowedIPs(allowedIPs: string[]): Promise<IPsConfig> {
  const { data } = await api.put<IPsConfig>('/auth/ips', { allowedIPs })
  return data
}
