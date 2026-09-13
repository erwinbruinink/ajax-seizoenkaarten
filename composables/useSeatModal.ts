export interface SeatModalTarget {
  matchId: number
  seatNumber: number
}

export function useSeatModal() {
  const target = useState<SeatModalTarget | null>('seat-modal-target', () => null)

  function open(matchId: number, seatNumber: number) {
    target.value = { matchId, seatNumber }
  }
  function close() {
    target.value = null
  }

  return { target, open, close }
}
