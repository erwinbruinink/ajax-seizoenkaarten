import { existsSync } from 'node:fs'
if (existsSync('.env')) process.loadEnvFile('.env')

import { db } from '../server/db'
import { users, matches, seatAllocations } from '../server/db/schema'
import { hashPin } from '../server/utils/pin'

function requiredEnv(key: string) {
  const val = process.env[key]
  if (!val) {
    throw new Error(`Ontbrekende env var ${key}. Zet deze in .env voordat je seedt (zie .env.example).`)
  }
  return val
}

async function main() {
  console.log('Seeding database...')

  // --- Users -----------------------------------------------------------
  const userSeeds = [
    { name: 'Erwin', role: 'ADMIN' as const, pin: requiredEnv('ADMIN_ERWIN_PIN') },
    { name: 'Sharon', role: 'ADMIN' as const, pin: requiredEnv('ADMIN_SHARON_PIN') },
    { name: 'Nova', role: 'CHILD' as const, pin: requiredEnv('CHILD_NOVA_PIN') },
    { name: 'Noor', role: 'CHILD' as const, pin: requiredEnv('CHILD_NOOR_PIN') },
    { name: 'Stijn', role: 'CHILD' as const, pin: requiredEnv('CHILD_STIJN_PIN') },
    { name: 'Vrienden', role: 'FRIEND' as const, pin: requiredEnv('FRIENDS_PIN') }
  ]

  const insertedUsers: Record<string, number> = {}

  for (const u of userSeeds) {
    const pinHash = await hashPin(u.pin)
    const [row] = await db.insert(users).values({ name: u.name, role: u.role, pinHash }).returning()
    insertedUsers[u.name] = row.id
    console.log(`  user: ${u.name} (${u.role})`)
  }

  // --- Matches + seat allocations ---------------------------------------
  // Kickoff times were not specified in the source data - default to 20:00,
  // correct the exact aftraptijd per wedstrijd later via het beheerpaneel.
  type SeatSpec = { name: string; kind: 'user' | 'guest' } | null

  const fixtures: {
    date: string
    opponent: string
    competition: string
    finished?: boolean
    seat302: SeatSpec
    seat303: SeatSpec
    seat302Pending?: boolean
    seat303Pending?: boolean
  }[] = [
    { date: '2026-08-16', opponent: 'sc Heerenveen', competition: 'Eredivisie', finished: true, seat302: null, seat303: null },
    { date: '2026-08-27', opponent: 'FC Sion', competition: 'UEFA Conference League (Play-off)', seat302: { name: 'Sharon', kind: 'user' }, seat303: { name: 'Stijn', kind: 'user' } },
    { date: '2026-09-05', opponent: 'PSV', competition: 'Eredivisie', seat302: { name: 'Erwin', kind: 'user' }, seat303: { name: 'Stijn', kind: 'user' } },
    { date: '2026-09-15', opponent: 'Willem II', competition: 'Eredivisie', seat302: { name: 'Erwin', kind: 'user' }, seat303: { name: 'Stijn', kind: 'user' } },
    { date: '2026-09-19', opponent: 'Excelsior', competition: 'Eredivisie', seat302: null, seat303: { name: 'John', kind: 'guest' } },
    { date: '2026-10-10', opponent: 'N.E.C.', competition: 'Eredivisie', seat302: { name: 'Erwin', kind: 'user' }, seat303: { name: 'Joe', kind: 'guest' } },
    { date: '2026-10-31', opponent: 'AZ', competition: 'Eredivisie', seat302: { name: 'Erwin', kind: 'user' }, seat303: { name: 'Sharon', kind: 'user' } },
    { date: '2026-11-21', opponent: 'ADO Den Haag', competition: 'KNVB Beker', seat302: { name: 'Jeroen', kind: 'guest' }, seat302Pending: true, seat303: null },
    { date: '2026-12-05', opponent: 'FC Utrecht', competition: 'Eredivisie', seat302: { name: 'Erwin', kind: 'user' }, seat303: { name: 'Noor', kind: 'user' } },
    { date: '2026-12-12', opponent: 'SC Cambuur', competition: 'Eredivisie', seat302: { name: 'Erwin', kind: 'user' }, seat303: { name: 'Roelof', kind: 'guest' } },
    { date: '2027-01-16', opponent: 'FC Groningen', competition: 'Eredivisie', seat302: null, seat303: null },
    { date: '2027-01-23', opponent: 'Telstar', competition: 'Eredivisie', seat302: null, seat303: null },
    { date: '2027-02-20', opponent: 'Go Ahead Eagles', competition: 'Eredivisie', seat302: null, seat303: null },
    { date: '2027-02-27', opponent: 'Feyenoord', competition: 'Eredivisie', seat302: { name: 'Erwin', kind: 'user' }, seat303: { name: 'Stijn', kind: 'user' } },
    { date: '2027-03-13', opponent: 'PEC Zwolle', competition: 'Eredivisie', seat302: null, seat303: null },
    { date: '2027-04-03', opponent: 'FC Twente', competition: 'Eredivisie', seat302: { name: 'Erwin', kind: 'user' }, seat303: { name: 'Nova', kind: 'user' } },
    { date: '2027-05-01', opponent: 'Fortuna Sittard', competition: 'Eredivisie', seat302: null, seat303: null },
    { date: '2027-05-16', opponent: 'Sparta Rotterdam', competition: 'Eredivisie', seat302: null, seat303: null }
  ]

  for (const fx of fixtures) {
    const [match] = await db
      .insert(matches)
      .values({
        opponent: fx.opponent,
        competition: fx.competition,
        dateTime: new Date(`${fx.date}T20:00:00`),
        isHome: true,
        status: fx.finished ? 'FINISHED' : 'SCHEDULED'
      })
      .returning()

    console.log(`  match: ${fx.opponent} (${fx.date})`)

    const seatSpecs: [number, SeatSpec, boolean | undefined][] = [
      [302, fx.seat302, fx.seat302Pending],
      [303, fx.seat303, fx.seat303Pending]
    ]

    for (const [seatNumber, spec, pending] of seatSpecs) {
      if (!spec) continue
      await db.insert(seatAllocations).values({
        matchId: match.id,
        seatNumber,
        userId: spec.kind === 'user' ? insertedUsers[spec.name] ?? null : null,
        guestName: spec.kind === 'guest' ? spec.name : null,
        status: pending ? 'PENDING' : 'CONFIRMED',
        ticketTransferred: false
      })
    }
  }

  console.log('Seed complete.')
  process.exit(0)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
