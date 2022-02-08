export function getWeekDay(date: Date = new Date(), offset = 1) {
  return (date.getDay() - offset + 7) % 7
}
