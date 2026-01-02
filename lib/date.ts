/**
 * Format a Date object for use in date input fields (YYYY-MM-DD).
 */
export function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the Date representing the start (Monday) of the current week.
 */
export function getStartOfCurrentWeek() {
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay(); // 0 (Sunday) - 6 (Saturday)
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust so Monday is first day
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Returns the Date representing the end (Sunday) of the current week.
 */
export function getEndOfCurrentWeek() {
  const start = getStartOfCurrentWeek();
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Normalize an arbitrary date string to YYYY-MM-DD when possible.
 */
export function normalizeDateInput(value?: string) {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) {
    return isoMatch[1];
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return formatDateInput(parsed);
}
