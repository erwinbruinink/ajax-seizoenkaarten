import { db } from '~/server/db'
import { users } from '~/server/db/schema'

// Public list of login-selectable profiles - never exposes pin hashes.
export default defineEventHandler(async () => {
  const rows = await db.select({ id: users.id, name: users.name, role: users.role }).from(users)
  return rows
})
