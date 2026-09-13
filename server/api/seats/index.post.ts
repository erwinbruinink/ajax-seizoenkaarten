import { and, eq } from 'drizzle-orm'
import { db } from '~/server/db'
import { seatAllocations } from '~/server/db/schema'
import { requireSession } from '~/server/utils/auth'

// Children & friends: create a PENDING request for a free seat.
// Admins: directly create a CONFIRMED (or other status) allocation, overwriting any existing one.
export default defineEventHandler(async (event) => {
  const session = await requireSession(event)

  const body = await readBody<{
    matchId: number
    seatNumber: 302 | 303
    userId?: number
    guestName?: string
    status?: 'PENDING' | 'CONFIRMED' | 'RESALE'
    notes?: string
  }>(event)

  if (!body?.matchId || ![302, 303].includes(Number(body.seatNumber))) {
    throw createError({ statusCode: 400, statusMessage: 'Match en stoelnummer (302 of 303) zijn verplicht' })
  }

  const existing = await db.query.seatAllocations.findFirst({
    where: and(eq(seatAllocations.matchId, body.matchId), eq(seatAllocations.seatNumber, body.seatNumber))
  })

  if (session.role === 'ADMIN') {
    const values = {
      matchId: body.matchId,
      seatNumber: body.seatNumber,
      userId: body.userId ?? null,
      guestName: body.guestName?.trim() || null,
      status: body.status || 'CONFIRMED',
      notes: body.notes?.trim() || null,
      updatedAt: new Date()
    }

    if (existing) {
      const [updated] = await db
        .update(seatAllocations)
        .set(values)
        .where(eq(seatAllocations.id, existing.id))
        .returning()
      return updated
    }

    const [created] = await db.insert(seatAllocations).values(values).returning()
    return created
  }

  // Non-admins: only allowed to request a genuinely free seat.
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Deze stoel is al bezet of in aanvraag' })
  }

  const [created] = await db
    .insert(seatAllocations)
    .values({
      matchId: body.matchId,
      seatNumber: body.seatNumber,
      userId: session.role === 'CHILD' ? session.userId : null,
      guestName: session.role === 'FRIEND' ? session.displayName : null,
      status: 'PENDING'
    })
    .returning()

  return created
})
