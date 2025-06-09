export function formatDatePoland(date: number): string {
  const dateFormat: Intl.DateTimeFormat = new Intl.DateTimeFormat('PL', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return dateFormat.format(date);
}