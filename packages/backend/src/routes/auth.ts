import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { config } from '../config'
import { haversineDistance } from '../utils/distance'
import { User } from '../models/User'
import { requireAuth, requireAdmin, signAuthToken } from '../middleware/auth'

const router = Router()

function getClientIP(req: Request): string {
  // Com `trust proxy` configurado em index.ts, req.ip já respeita o número
  // certo de hops de X-Forwarded-For e ignora valores forjados pelo cliente.
  const realIP = req.ip ?? req.socket.remoteAddress ?? '0.0.0.0'

  if (config.allowIpSimulation) {
    const simulated = req.headers['x-simulated-ip']
    if (typeof simulated === 'string' && simulated.trim()) return simulated.trim()
  }

  return realIP
}

router.get('/ip', (req: Request, res: Response) => {
  const ip = getClientIP(req)
  res.json({ ip, allowed: config.allowedIPs.includes(ip) })
})

router.post('/register', async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string }
  if (!username || !password || password.length < 6) {
    res.status(400).json({ error: 'Usuário e senha (mín. 6 caracteres) são obrigatórios.' })
    return
  }

  const existing = await User.findOne({ username: username.trim().toLowerCase() })
  if (existing) {
    res.status(409).json({ error: 'Usuário já existe.' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  // role nunca vem do client — todo cadastro público nasce como "user".
  const user = await User.create({ username: username.trim().toLowerCase(), passwordHash, role: 'user' })

  const token = signAuthToken({ sub: user.id, username: user.username, role: user.role })
  res.status(201).json({ token, user: { username: user.username, role: user.role } })
})

router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string }
  if (!username || !password) {
    res.status(400).json({ error: 'Usuário e senha são obrigatórios.' })
    return
  }

  const user = await User.findOne({ username: username.trim().toLowerCase() })
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: 'Usuário ou senha inválidos.' })
    return
  }

  const token = signAuthToken({ sub: user.id, username: user.username, role: user.role })
  res.json({ token, user: { username: user.username, role: user.role } })
})

router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({ user: { username: req.user!.username, role: req.user!.role } })
})

router.get('/zone', requireAuth, (_req: Request, res: Response) => {
  res.json(config.allowedZone)
})

router.put('/zone', requireAdmin, (req: Request, res: Response) => {
  const { lat, lng, radiusMeters } = req.body as {
    lat: number
    lng: number
    radiusMeters: number
  }
  if (typeof lat !== 'number' || typeof lng !== 'number' || typeof radiusMeters !== 'number') {
    res.status(400).json({ error: 'lat, lng e radiusMeters são obrigatórios.' })
    return
  }
  config.allowedZone.lat = lat
  config.allowedZone.lng = lng
  config.allowedZone.radiusMeters = radiusMeters
  console.log(`📍 Zona atualizada por ${req.user!.username}: ${lat}, ${lng} (raio: ${radiusMeters}m)`)
  res.json(config.allowedZone)
})

router.get('/ips', requireAuth, (_req: Request, res: Response) => {
  res.json({ allowedIPs: config.allowedIPs })
})

router.put('/ips', requireAdmin, (req: Request, res: Response) => {
  const { allowedIPs } = req.body as { allowedIPs: unknown }
  if (!Array.isArray(allowedIPs) || allowedIPs.some(ip => typeof ip !== 'string')) {
    res.status(400).json({ error: 'allowedIPs deve ser uma lista de strings.' })
    return
  }
  config.allowedIPs = (allowedIPs as string[]).map(ip => ip.trim()).filter(Boolean)
  console.log(`🌐 IPs permitidos atualizados por ${req.user!.username}: ${config.allowedIPs.join(', ')}`)
  res.json({ allowedIPs: config.allowedIPs })
})

// Segundo fator: confirma que o usuário autenticado está na rede/local corretos.
router.post('/verify-location', requireAuth, (req: Request, res: Response) => {
  const { lat, lng } = req.body as { lat?: number; lng?: number }

  const ip = getClientIP(req)
  const ipAllowed = config.allowedIPs.includes(ip)
  console.log(`🔐 verify-location → ${req.user!.username} | IP: ${ip} (${ipAllowed ? 'permitido' : 'negado'}) | modo: ${config.authMode}`)

  let gpsAllowed = false
  let distanceMeters: number | null = null

  if (lat != null && lng != null) {
    distanceMeters = Math.round(
      haversineDistance(lat, lng, config.allowedZone.lat, config.allowedZone.lng),
    )
    gpsAllowed = distanceMeters <= config.allowedZone.radiusMeters
  }

  const checks = { ip: ipAllowed, gps: gpsAllowed }

  let authorized = false
  switch (config.authMode) {
    case 'BOTH':   authorized = ipAllowed && gpsAllowed; break
    case 'GPS':    authorized = gpsAllowed;              break
    case 'IP':     authorized = ipAllowed;               break
    case 'EITHER': authorized = ipAllowed || gpsAllowed; break
  }

  if (!authorized) {
    res.status(403).json({
      error: 'Acesso negado: localização ou rede não autorizada.',
      checks,
      distanceMeters,
    })
    return
  }

  res.json({ checks, distanceMeters })
})

export default router
