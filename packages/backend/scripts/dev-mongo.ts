/**
 * MongoDB descartável em memória pra dev local sem precisar instalar/rodar mongod.
 * Uso: yarn dev:db   (depois aponte MONGODB_URI do .env pra URI impressa no console)
 * Não usar em produção — os dados somem quando o processo termina.
 */
import { MongoMemoryServer } from 'mongodb-memory-server'

async function main() {
  const mongo = await MongoMemoryServer.create()
  console.log(`\n🧪 MongoDB de dev rodando em memória.`)
  console.log(`   Adicione ao seu .env: MONGODB_URI=${mongo.getUri()}\n`)
  console.log('   (Ctrl+C pra encerrar)')

  process.on('SIGINT', async () => {
    await mongo.stop()
    process.exit(0)
  })
}

main()
