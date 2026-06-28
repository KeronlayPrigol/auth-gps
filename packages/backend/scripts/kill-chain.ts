/**
 * Demonstração de pentest acadêmico — AuthGPS
 *
 * Tenta os mesmos exploits do MVP original (spoof de IP via header, GPS forjado,
 * sequestro dos endpoints de configuração) contra o sistema já com contas de
 * usuário, roles e trust-proxy corrigido. O objetivo agora é provar que cada
 * exploit FALHA. Roda 100% local, sem expor nada à internet.
 *
 * Uso: yarn attack-demo   (com o backend já rodando em outro terminal)
 */

const BASE_URL = process.env.TARGET_URL ?? 'http://localhost:3001'

const FAKE_ATTACKER_IP = '203.0.113.77' // IP público fictício (faixa TEST-NET-3, RFC 5737)
const FAKE_ATTACKER_GPS = { lat: 40.7128, lng: -74.006 } // Nova York — bem longe da zona
const ATTACKER_USERNAME = `attacker_${Date.now()}`
const ATTACKER_PASSWORD = 'senha123'

let pass = 0
let fail = 0

function check(label: string, condition: boolean, detail: unknown) {
  const icon = condition ? '✅' : '❌'
  console.log(`  ${icon} ${label}`, detail)
  if (condition) pass++
  else fail++
}

function step(n: number, title: string) {
  console.log(`\n[${n}] ${title}`)
}

async function http(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: res.status, json: await res.json() }
}

async function main() {
  console.log('=== AuthGPS — Kill Chain (versão pós-hardening) ===')
  console.log(`Alvo: ${BASE_URL}`)
  console.log(`Atacante: usuário "${ATTACKER_USERNAME}" (role padrão "user"), IP forjado ${FAKE_ATTACKER_IP}, GPS em Nova York`)

  step(1, 'Atacante se cadastra normalmente (rota pública)')
  const register = await http('POST', '/api/auth/register', { username: ATTACKER_USERNAME, password: ATTACKER_PASSWORD })
  console.log(`  status ${register.status} ->`, register.json)
  check('cadastro nasce com role "user", mesmo sem o client mandar role', register.json.user?.role === 'user', register.json.user)
  const attackerToken = register.json.token as string

  step(2, 'Exploit A (antigo) — tentar forjar role=admin direto no /register')
  const fakeAdmin = await http('POST', '/api/auth/register', { username: `${ATTACKER_USERNAME}_2`, password: ATTACKER_PASSWORD, role: 'admin' })
  check('role=admin enviado no body é ignorado', fakeAdmin.json.user?.role === 'user', fakeAdmin.json.user)

  step(3, 'Exploit B (antigo) — acessar endpoints de config sem token')
  const noAuthZone = await http('GET', '/api/auth/zone')
  check('GET /zone sem token é bloqueado (401)', noAuthZone.status === 401, noAuthZone.json)
  const noAuthPut = await http('PUT', '/api/auth/zone', { lat: 1, lng: 1, radiusMeters: 10 })
  check('PUT /zone sem token é bloqueado (401)', noAuthPut.status === 401, noAuthPut.json)

  step(4, 'Exploit C (antigo) — usuário comum tentando agir como admin')
  const userPutZone = await http('PUT', '/api/auth/zone', { lat: FAKE_ATTACKER_GPS.lat, lng: FAKE_ATTACKER_GPS.lng, radiusMeters: 999_999_999 }, {
    Authorization: `Bearer ${attackerToken}`,
  })
  check('PUT /zone com token de usuário comum é bloqueado (403)', userPutZone.status === 403, userPutZone.json)
  const userPutIPs = await http('PUT', '/api/auth/ips', { allowedIPs: [FAKE_ATTACKER_IP] }, {
    Authorization: `Bearer ${attackerToken}`,
  })
  check('PUT /ips com token de usuário comum é bloqueado (403)', userPutIPs.status === 403, userPutIPs.json)

  step(5, 'Exploit D (antigo) — spoof de IP via X-Forwarded-For + X-Simulated-IP')
  const ipSpoofed = await http('POST', '/api/auth/verify-location', { lat: FAKE_ATTACKER_GPS.lat, lng: FAKE_ATTACKER_GPS.lng }, {
    Authorization: `Bearer ${attackerToken}`,
    'X-Forwarded-For': FAKE_ATTACKER_IP,
    'X-Simulated-IP': '127.0.0.1',
  })
  check(
    'headers forjados não concedem mais "IP permitido" (allowIpSimulation off em produção / trust-proxy correto)',
    ipSpoofed.json.checks?.ip !== true,
    ipSpoofed.json,
  )

  step(6, 'Exploit E (antigo) — GPS forjado usando a zona real (ainda funciona, é limitação conhecida)')
  const zone = await http('GET', '/api/auth/zone', undefined, { Authorization: `Bearer ${attackerToken}` })
  const gpsSpoofed = await http('POST', '/api/auth/verify-location', { lat: zone.json.lat, lng: zone.json.lng }, {
    Authorization: `Bearer ${attackerToken}`,
  })
  console.log('  status', gpsSpoofed.status, gpsSpoofed.json)
  console.log('  [nota] GPS ainda é client-supplied (API do navegador) — fora do escopo deste fix.')
  console.log('         Mitigação real exigiria geolocalização por IP/torre ou attestation de device.')

  console.log(`\n=== Resultado: ${pass} bloqueios corretos, ${fail} brechas encontradas ===`)
  if (fail > 0) process.exitCode = 1
}

main().catch(err => {
  console.error('Erro ao rodar a demo (o backend está rodando em', BASE_URL, '?):', err)
  process.exit(1)
})
