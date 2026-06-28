import express from 'express'
import cors from 'cors'
import { config } from './config'
import { connectDB } from './db'
import authRouter from './routes/auth'

const app = express()

// Confia em N hops de proxy reverso (Railway/Render = 1) pra resolver req.ip
// corretamente a partir de X-Forwarded-For, sem aceitar valores forjados pelo cliente.
app.set('trust proxy', config.trustProxyHops)

app.use(cors({ origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',') }))
app.use(express.json())
app.use('/api/auth', authRouter)

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

connectDB()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`\n🔒 AuthGPS Backend → http://localhost:${config.port}`)
      console.log(`📍 Zona permitida: ${config.allowedZone.lat}, ${config.allowedZone.lng} (raio: ${config.allowedZone.radiusMeters}m)`)
      console.log(`🌐 IPs permitidos: ${config.allowedIPs.join(', ')}`)
      console.log(`🔑 Modo: ${config.authMode}`)
      console.log(`🛰️  Simulação de IP via header: ${config.allowIpSimulation ? 'HABILITADA (dev)' : 'desabilitada'}\n`)
    })
  })
  .catch(err => {
    console.error('Falha ao conectar no MongoDB:', err)
    process.exit(1)
  })
