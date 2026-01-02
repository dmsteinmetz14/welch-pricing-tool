import { FlowerItem } from '@/types/pricing';
import { formatDateInput, getEndOfCurrentWeek, getStartOfCurrentWeek, normalizeDateInput } from './date';

function isWithinRange(dateValue: string | null, start: string, end: string) {
  if (!dateValue) {
    return false;
  }
  return dateValue >= start && dateValue <= end;
}

export function filterFlowersByDateRange(flowers: FlowerItem[], startDate: string, endDate: string) {
  return flowers.filter((flower) => isWithinRange(normalizeDateInput(flower.date), startDate, endDate));
}

export function filterFlowersToCurrentWeek(flowers: FlowerItem[], startDate?: string, endDate?: string) {
  const rangeStart = startDate ?? formatDateInput(getStartOfCurrentWeek());
  const rangeEnd = endDate ?? formatDateInput(getEndOfCurrentWeek());
  return filterFlowersByDateRange(flowers, rangeStart, rangeEnd);
}
