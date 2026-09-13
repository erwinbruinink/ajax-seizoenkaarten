import { eq } from 'drizzle-orm'
import { db } from '~/server/db'
import { seatAllocations } from '~/server/db/schema'
import { requireAdmin } from '~/server/utils/auth'

// Admin-only: approve/reject requests, reassign seats, toggle ticket transfer, manage resale.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Ongeldige aanvraag' })

  const body = await readBody<{
    status?: 'PENDING' | 'CONFIRMED' | 'RESALE'
    userId?: number | null
    guestName?: string | null
    ticketTransferred?: boolean
    resalePrice?: string | null
    notes?: string | null
  }>(event)

  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (body.status !== undefined) updates.status = body.status
  if (body.userId !== undefined) updates.userId = body.userId
  if (body.guestName !== undefined) updates.guestName = body.guestName?.trim() || null
  if (body.ticketTransferred !== undefined) updates.ticketTransferred = body.ticketTransferred
  if (body.resalePrice !== undefined) updates.resalePrice = body.resalePrice || null
  if (body.notes !== undefined) updates.notes = body.notes?.trim() || null

  const [updated] = await db
    .update(seatAllocations)
    .set(updates)
    .where(eq(seatAllocations.id, id))
    .returning()

  if (!updated) throw createError({ statusCode: 404, statusMessage: 'Aanvraag niet gevonden' })

  return updated
})
