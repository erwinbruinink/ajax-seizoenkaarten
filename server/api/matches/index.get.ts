import { asc } from 'drizzle-orm'
import { db } from '~/server/db'
import { matches } from '~/server/db/schema'

export default defineEventHandler(async () => {
  const rows = await db.query.matches.findMany({
    orderBy: [asc(matches.dateTime)],
    with: {
      seatAllocations: {
        with: {
          user: { columns: { id: true, name: true, role: true } }
        }
      }
    }
  })
  return rows
})
