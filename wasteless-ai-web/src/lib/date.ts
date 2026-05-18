import { addDays, isValid, parseISO, startOfDay } from "date-fns";

export function parseDateInput(value?: string | null) {
  if (!value) return null;
  const parsed = parseISO(value);
  if (!isValid(parsed)) return null;
  return startOfDay(parsed);
}

export function getSoonWindow(date = new Date(), days = 7) {
  const today = startOfDay(date);
  return {
    today,
    soon: addDays(today, days),
  };
}
