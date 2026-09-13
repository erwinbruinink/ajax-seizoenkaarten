import { ne } from 'drizzle-orm'
import { db } from '~/server/db'
import { seatAllocations } from '~/server/db/schema'

export interface StatEntry {
  name: string
  count: number
}

export default defineEventHandler(async (): Promise<StatEntry[]> => {
  const rows = await db.query.seatAllocations.findMany({
    where: ne(seatAllocations.status, 'RESALE'),
    with: { user: { columns: { name: true } } }
  })

  const counts = new Map<string, number>()

  for (const row of rows) {
    if (row.status !== 'CONFIRMED' && row.status !== 'PENDING') continue
    const name = row.user?.name || row.guestName || 'Onbekend'
    const bucket = row.user ? name : 'Vrienden'
    counts.set(bucket, (counts.get(bucket) || 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})
