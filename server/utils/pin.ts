import bcrypt from 'bcryptjs'

// Plain module (no h3/Nuxt auto-imports) so it can be used both from
// server API routes and from standalone scripts (seed.ts, migrate.ts).
export async function hashPin(pin: string) {
  return bcrypt.hash(pin, 10)
}

export async function verifyPin(pin: string, hash: string) {
  return bcrypt.compare(pin, hash)
}
