import { eq } from 'drizzle-orm'
import { db } from '~/server/db'
import { matches } from '~/server/db/schema'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Ongeldig wedstrijd-id' })

  const body = await readBody<{
    opponent?: string
    competition?: string
    dateTime?: string
    status?: 'SCHEDULED' | 'FINISHED'
  }>(event)

  const updates: Record<string, unknown> = {}
  if (body.opponent !== undefined) updates.opponent = body.opponent.trim()
  if (body.competition !== undefined) updates.competition = body.competition.trim()
  if (body.dateTime !== undefined) updates.dateTime = new Date(body.dateTime)
  if (body.status !== undefined) updates.status = body.status

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Niets om bij te werken' })
  }

  const [updated] = await db.update(matches).set(updates).where(eq(matches.id, id)).returning()

  if (!updated) throw createError({ statusCode: 404, statusMessage: 'Wedstrijd niet gevonden' })

  return updated
})
