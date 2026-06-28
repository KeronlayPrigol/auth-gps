import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import express from 'express'
import request from 'supertest'
import authRouter from './auth'
import { User } from '../models/User'
import { config } from '../config'

let mongo: MongoMemoryServer

const app = express()
app.set('trust proxy', 1)
app.use(express.json())
app.use('/api/auth', authRouter)

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())
}, 60_000)

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

beforeEach(async () => {
  await User.deleteMany({})
  config.allowedIPs = ['127.0.0.1', '::ffff:127.0.0.1']
  config.allowedZone = { lat: -27, lng: -50, radiusMeters: 50 }
  config.authMode = 'BOTH'
})

async function registerUser(username: string, password = 'senha123') {
  const res = await request(app).post('/api/auth/register').send({ username, password })
  return res.body.token as string
}

describe('register/login', () => {
  it('cria usuário com role "user" mesmo se o client tentar mandar role=admin', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', password: 'senha123', role: 'admin' })
    expect(res.status).toBe(201)
    expect(res.body.user.role).toBe('user')
  })

  it('rejeita login com senha errada', async () => {
    await registerUser('bob')
    const res = await request(app).post('/api/auth/login').send({ username: 'bob', password: 'errada' })
    expect(res.status).toBe(401)
  })

  it('loga com sucesso e retorna um token', async () => {
    await registerUser('carol')
    const res = await request(app).post('/api/auth/login').send({ username: 'carol', password: 'senha123' })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeTypeOf('string')
  })
})

describe('autorização por role', () => {
  it('bloqueia usuário comum de alterar a zona GPS', async () => {
    const token = await registerUser('dave')
    const res = await request(app)
      .put('/api/auth/zone')
      .set('Authorization', `Bearer ${token}`)
      .send({ lat: 1, lng: 1, radiusMeters: 10 })
    expect(res.status).toBe(403)
  })

  it('bloqueia usuário comum de alterar a allowlist de IPs', async () => {
    const token = await registerUser('erin')
    const res = await request(app)
      .put('/api/auth/ips')
      .set('Authorization', `Bearer ${token}`)
      .send({ allowedIPs: ['1.2.3.4'] })
    expect(res.status).toBe(403)
  })

  it('permite admin alterar a zona GPS', async () => {
    await registerUser('frank')
    await User.updateOne({ username: 'frank' }, { role: 'admin' })
    const loginRes = await request(app).post('/api/auth/login').send({ username: 'frank', password: 'senha123' })
    const res = await request(app)
      .put('/api/auth/zone')
      .set('Authorization', `Bearer ${loginRes.body.token}`)
      .send({ lat: 1, lng: 1, radiusMeters: 10 })
    expect(res.status).toBe(200)
  })

  it('bloqueia requisição sem token nas rotas protegidas', async () => {
    const res = await request(app).get('/api/auth/zone')
    expect(res.status).toBe(401)
  })
})

describe('verify-location — captura de IP real', () => {
  it('ignora X-Forwarded-For forjado quando vem de além do proxy confiável', async () => {
    const token = await registerUser('grace')
    // Simula um atacante mandando dois IPs no header: <ip-forjado>, <ip-do-proxy-real>.
    // Com trust proxy=1, o Express deve considerar só o IP imediatamente antes do proxy confiável.
    const res = await request(app)
      .post('/api/auth/verify-location')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Forwarded-For', '127.0.0.1, 203.0.113.77')
      .send({ lat: -27, lng: -50 })
    // O "salto confiável" é o proxy, então o IP relevante é 203.0.113.77 (não está na allowlist).
    expect(res.body.checks.ip).toBe(false)
  })

  it('header X-Simulated-IP é ignorado quando allowIpSimulation está desabilitado', async () => {
    config.allowIpSimulation = false
    // Remove o loopback da allowlist pra garantir que um eventual "sucesso" só
    // poderia vir do header forjado, nunca do IP real de teste.
    config.allowedIPs = ['203.0.113.250']
    const token = await registerUser('heidi')
    const res = await request(app)
      .post('/api/auth/verify-location')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Simulated-IP', '203.0.113.250')
      .send({ lat: -27, lng: -50 })
    expect(res.body.checks.ip).toBe(false)
  })

  it('bloqueia acesso sem token mesmo com IP e GPS corretos', async () => {
    const res = await request(app).post('/api/auth/verify-location').send({ lat: -27, lng: -50 })
    expect(res.status).toBe(401)
  })
})
