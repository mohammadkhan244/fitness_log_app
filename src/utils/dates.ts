const TZ = 'America/New_York';

/** Current date as YYYY-MM-DD in Eastern Time. */
export function todayEST(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

/** Date N days ago as YYYY-MM-DD in Eastern Time. */
export function daysAgoEST(n: number): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(
    new Date(Date.now() - n * 24 * 60 * 60 * 1000),
  );
}
