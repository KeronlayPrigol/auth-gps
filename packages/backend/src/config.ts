import 'dotenv/config'

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3001'),
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/authgps',
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret',
    expiresIn: '8h',
  },
  allowedZone: {
    lat: parseFloat(process.env.ALLOWED_LAT ?? '-27.030152238922874'),
    lng: parseFloat(process.env.ALLOWED_LNG ?? '-50.91802860502803'),
    radiusMeters: parseInt(process.env.ALLOWED_RADIUS_METERS ?? '50'),
  },
  allowedIPs: (process.env.ALLOWED_IPS ?? '127.0.0.1,::1,::ffff:127.0.0.1')
    .split(',')
    .map(ip => ip.trim()),
  authMode: (process.env.AUTH_MODE ?? 'BOTH') as 'BOTH' | 'GPS' | 'IP' | 'EITHER',
  // Permite forçar um IP "simulado" via header X-Simulated-IP, só pra testar
  // localmente sem precisar de VPN. NUNCA habilitar em produção.
  allowIpSimulation: process.env.NODE_ENV !== 'production' && process.env.ALLOW_IP_SIMULATION === 'true',
  // Quantos hops de proxy confiável existem na frente do backend (Railway/Render = 1).
  // Usado pelo Express pra decidir até onde confiar no X-Forwarded-For.
  trustProxyHops: parseInt(process.env.TRUST_PROXY_HOPS ?? '1'),
  // Origem permitida pro CORS. Em produção, defina como a URL do frontend.
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
}
