import type { MatchDto } from '~/types'

export function useMatches() {
  const matches = useState<MatchDto[]>('matches', () => [])
  const pending = useState<boolean>('matches-pending', () => false)

  async function refresh() {
    pending.value = true
    try {
      matches.value = await $fetch<MatchDto[]>('/api/matches')
    } finally {
      pending.value = false
    }
  }

  const upcoming = computed(() =>
    matches.value.filter((m) => m.status === 'SCHEDULED').sort((a, b) => +new Date(a.dateTime) - +new Date(b.dateTime))
  )

  const nextMatch = computed(() => upcoming.value[0] || null)

  return { matches, pending, refresh, upcoming, nextMatch }
}

export function seatFor(match: MatchDto, seatNumber: number) {
  return match.seatAllocations.find((a) => a.seatNumber === seatNumber) || null
}

export function seatLabel(match: MatchDto, seatNumber: number) {
  const seat = seatFor(match, seatNumber)
  if (!seat) return 'Vrij'
  if (seat.status === 'PENDING') return `In afwachting: ${seat.user?.name || seat.guestName}`
  if (seat.status === 'RESALE') return `Resale${seat.resalePrice ? ` (€${seat.resalePrice})` : ''}`
  return seat.user?.name || seat.guestName || 'Toegewezen'
}

export function daysUntil(dateTime: string) {
  const diff = new Date(dateTime).getTime() - Date.now()
  return diff / (1000 * 60 * 60 * 24)
}
