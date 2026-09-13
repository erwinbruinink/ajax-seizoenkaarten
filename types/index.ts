export type UserRole = 'ADMIN' | 'CHILD' | 'FRIEND'
export type SeatStatus = 'PENDING' | 'CONFIRMED' | 'RESALE'
export type MatchStatus = 'SCHEDULED' | 'FINISHED'

export interface PublicUser {
  id: number
  name: string
  role: UserRole
}

export interface SessionInfo {
  userId: number
  name: string
  role: UserRole
  displayName: string
}

export interface SeatAllocationDto {
  id: number
  matchId: number
  seatNumber: number
  userId: number | null
  guestName: string | null
  status: SeatStatus
  ticketTransferred: boolean
  resalePrice: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  user: { id: number; name: string; role: UserRole } | null
}

export interface MatchDto {
  id: number
  opponent: string
  competition: string
  dateTime: string
  isHome: boolean
  status: MatchStatus
  seatAllocations: SeatAllocationDto[]
}

export interface StatEntry {
  name: string
  count: number
}
