/**
 * Formats a date value safely. Handles:
 * - ISO date strings ("2025-01-15T12:00:00Z")
 * - Serialized timestamp instances or objects ({ seconds: number, nanoseconds: number } or { toDate: () => Date })
 * - Epoch timestamps (milliseconds)
 * - Standard Date objects
 * - Undefined, null, or invalid strings
 * 
 * Never throws an error; returns a fallback string if invalid.
 */
export function formatDate(
  value: any,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' },
  fallback?: string,
  locale?: string
): string {
  const isBangla =
    locale
      ? locale.startsWith('bn')
      : fallback && (fallback === 'bn-BD' || fallback === 'en-US')
        ? fallback === 'bn-BD'
        : typeof window !== 'undefined' && localStorage.getItem('elora-lang') === 'bn';

  const resolvedLocale =
    locale ||
    (fallback === 'bn-BD' || fallback === 'en-US' ? fallback : isBangla ? 'bn-BD' : 'en-US');

  const resolvedFallback =
    fallback && fallback !== 'bn-BD' && fallback !== 'en-US'
      ? fallback
      : isBangla
        ? 'সাম্প্রতিক'
        : 'Recent';

  if (!value) return resolvedFallback;

  try {
    let date: Date;

    if (value instanceof Date) {
      date = value;
    } else if (typeof value?.toDate === 'function') {
      date = value.toDate();
    } else if (typeof value?.seconds === 'number') {
      date = new Date(value.seconds * 1000);
    } else if (typeof value?._seconds === 'number') {
      date = new Date(value._seconds * 1000);
    } else if (typeof value === 'number') {
      date = new Date(value);
    } else if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return resolvedFallback;
      date = new Date(trimmed);
    } else {
      return resolvedFallback;
    }

    if (!date || isNaN(date.getTime())) {
      return resolvedFallback;
    }

    return date.toLocaleDateString(resolvedLocale, options);
  } catch {
    return resolvedFallback;
  }
}
