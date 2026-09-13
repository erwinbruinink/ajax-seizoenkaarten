import { eq } from 'drizzle-orm'
import { db } from '~/server/db'
import { matches } from '~/server/db/schema'
import { buildMatchIcs } from '~/server/utils/ics'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const [match] = await db.select().from(matches).where(eq(matches.id, id)).limit(1)

  if (!match) throw createError({ statusCode: 404, statusMessage: 'Wedstrijd niet gevonden' })

  const ics = buildMatchIcs(match)

  setHeader(event, 'Content-Type', 'text/calendar; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="ajax-${match.opponent.replace(/\s+/g, '-').toLowerCase()}.ics"`)

  return ics
})
