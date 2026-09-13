import { db } from '~/server/db'
import { matches } from '~/server/db/schema'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<{
    opponent: string
    competition: string
    dateTime: string
    status?: 'SCHEDULED' | 'FINISHED'
  }>(event)

  if (!body?.opponent?.trim() || !body?.dateTime) {
    throw createError({ statusCode: 400, statusMessage: 'Tegenstander en datum/tijd zijn verplicht' })
  }

  const [created] = await db
    .insert(matches)
    .values({
      opponent: body.opponent.trim(),
      competition: body.competition?.trim() || 'Eredivisie',
      dateTime: new Date(body.dateTime),
      isHome: true,
      status: body.status || 'SCHEDULED'
    })
    .returning()

  return created
})
