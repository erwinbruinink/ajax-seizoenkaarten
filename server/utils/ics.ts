function toIcsDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeIcsText(text: string) {
  return text.replace(/[\\,;]/g, (m) => '\\' + m).replace(/\n/g, '\\n')
}

export function buildMatchIcs(match: {
  id: number
  opponent: string
  competition: string
  dateTime: Date
}) {
  const start = new Date(match.dateTime)
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000) // 2 hour block
  const now = new Date()

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ajax Seizoenkaarten//Vak 123//NL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:ajax-match-${match.id}@vak123`,
    `DTSTAMP:${toIcsDate(now)}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeIcsText(`Ajax - ${match.opponent} (${match.competition})`)}`,
    `LOCATION:${escapeIcsText('Johan Cruijff ArenA, Vak 123, Rij 3')}`,
    `DESCRIPTION:${escapeIcsText(`Stoel 302 & 303. Parkeren: P3 Mikado.`)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Ajax wedstrijd over 2 uur',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ]

  return lines.join('\r\n')
}
