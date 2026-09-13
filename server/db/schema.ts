import { pgTable, serial, text, varchar, timestamp, boolean, integer, pgEnum, numeric } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'CHILD', 'FRIEND'])
export const matchStatusEnum = pgEnum('match_status', ['SCHEDULED', 'FINISHED'])
export const seatStatusEnum = pgEnum('seat_status', ['PENDING', 'CONFIRMED', 'RESALE'])

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  role: userRoleEnum('role').notNull(),
  pinHash: varchar('pin_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  opponent: varchar('opponent', { length: 100 }).notNull(),
  competition: varchar('competition', { length: 100 }).notNull().default('Eredivisie'),
  dateTime: timestamp('date_time', { withTimezone: true }).notNull(),
  isHome: boolean('is_home').notNull().default(true),
  status: matchStatusEnum('status').notNull().default('SCHEDULED'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

export const seatAllocations = pgTable('seat_allocations', {
  id: serial('id').primaryKey(),
  matchId: integer('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
  seatNumber: integer('seat_number').notNull(), // 302 or 303
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  guestName: varchar('guest_name', { length: 100 }),
  status: seatStatusEnum('status').notNull().default('PENDING'),
  ticketTransferred: boolean('ticket_transferred').notNull().default(false),
  resalePrice: numeric('resale_price', { precision: 8, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const matchesRelations = relations(matches, ({ many }) => ({
  seatAllocations: many(seatAllocations)
}))

export const seatAllocationsRelations = relations(seatAllocations, ({ one }) => ({
  match: one(matches, { fields: [seatAllocations.matchId], references: [matches.id] }),
  user: one(users, { fields: [seatAllocations.userId], references: [users.id] })
}))

export const usersRelations = relations(users, ({ many }) => ({
  seatAllocations: many(seatAllocations)
}))

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Match = typeof matches.$inferSelect
export type NewMatch = typeof matches.$inferInsert
export type SeatAllocation = typeof seatAllocations.$inferSelect
export type NewSeatAllocation = typeof seatAllocations.$inferInsert
