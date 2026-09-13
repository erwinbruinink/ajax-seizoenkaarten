import { eq } from 'drizzle-orm'
import { db } from '~/server/db'
import { users } from '~/server/db/schema'
import { setSessionCookie } from '~/server/utils/auth'
import { verifyPin } from '~/server/utils/pin'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ userId: number; pin: string; displayName?: string }>(event)

  if (!body?.userId || !body?.pin) {
    throw createError({ statusCode: 400, statusMessage: 'Selecteer een profiel en voer een pincode in' })
  }

  const [user] = await db.select().from(users).where(eq(users.id, body.userId)).limit(1)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Onbekend profiel' })
  }

  const valid = await verifyPin(String(body.pin), user.pinHash)
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Onjuiste pincode' })
  }

  if (user.role === 'FRIEND' && !body.displayName?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Vul je naam in' })
  }

  const displayName = user.role === 'FRIEND' ? body.displayName!.trim() : user.name

  await setSessionCookie(event, {
    userId: user.id,
    name: user.name,
    role: user.role,
    displayName
  })

  return { userId: user.id, name: user.name, role: user.role, displayName }
})
