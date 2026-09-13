import { eq } from 'drizzle-orm'
import { db } from '~/server/db'
import { seatAllocations } from '~/server/db/schema'
import { requireSession } from '~/server/utils/auth'

// Admins can free up any seat. Non-admins may only withdraw their own still-pending request.
export default defineEventHandler(async (event) => {
  const session = await requireSession(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Ongeldige aanvraag' })

  const existing = await db.query.seatAllocations.findFirst({ where: eq(seatAllocations.id, id) })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Aanvraag niet gevonden' })

  if (session.role !== 'ADMIN') {
    const isOwner =
      (session.role === 'CHILD' && existing.userId === session.userId) ||
      (session.role === 'FRIEND' && existing.guestName === session.displayName)

    if (!isOwner || existing.status !== 'PENDING') {
      throw createError({ statusCode: 403, statusMessage: 'Je kunt alleen je eigen openstaande aanvraag intrekken' })
    }
  }

  await db.delete(seatAllocations).where(eq(seatAllocations.id, id))
  return { ok: true }
})
