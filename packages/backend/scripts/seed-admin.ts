/**
 * Cria (ou promove) um usuário admin. Rodar manualmente, nunca exposto via API.
 * Uso: yarn seed-admin <usuario> <senha>
 */
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { config } from '../src/config'
import { User } from '../src/models/User'

async function main() {
  const [username, password] = process.argv.slice(2)
  if (!username || !password || password.length < 6) {
    console.error('Uso: yarn seed-admin <usuario> <senha (mín. 6 caracteres)>')
    process.exit(1)
  }

  await mongoose.connect(config.mongoUri)

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await User.findOneAndUpdate(
    { username: username.trim().toLowerCase() },
    { $set: { passwordHash, role: 'admin' } },
    { upsert: true, new: true },
  )

  console.log(`✅ Admin pronto: ${user.username}`)
  await mongoose.disconnect()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
