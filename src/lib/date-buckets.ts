const MS_PER_DAY = 24 * 60 * 60 * 1000;

function createUtcDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day));
}

export function getUtcStartOfDay(date: Date) {
  return createUtcDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function getUtcStartOfWeek(date: Date) {
  const startOfDay = getUtcStartOfDay(date);
  const dayOfWeek = startOfDay.getUTCDay();
  const diffToMonday = (dayOfWeek + 6) % 7;
  return new Date(startOfDay.getTime() - diffToMonday * MS_PER_DAY);
}

export function getUtcStartOfMonth(date: Date) {
  return createUtcDate(date.getUTCFullYear(), date.getUTCMonth(), 1);
}

export function getUtcStartOfYear(date: Date) {
  return createUtcDate(date.getUTCFullYear(), 0, 1);
}

export function formatUtcDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function formatUtcMonthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export function getUtcMonthBucketKey(date: Date) {
  const day = date.getUTCDate();
  const bucketDay = Math.floor((day - 1) / 7) * 7 + 1;
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(bucketDay).padStart(2, "0")}`;
}

export function listUtcWeekKeys(from: Date) {
  return Array.from({ length: 7 }, (_, index) =>
    formatUtcDateKey(new Date(from.getTime() + index * MS_PER_DAY)),
  );
}

export function listUtcMonthBucketKeys(from: Date) {
  const year = from.getUTCFullYear();
  const month = from.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const monthStr = String(month + 1).padStart(2, "0");

  return [1, 8, 15, 22, 29]
    .filter((day) => day <= lastDay)
    .map((day) => `${year}-${monthStr}-${String(day).padStart(2, "0")}`);
}

export function listUtcYearMonthKeys(from: Date) {
  return Array.from({ length: 12 }, (_, index) =>
    `${from.getUTCFullYear()}-${String(index + 1).padStart(2, "0")}-01`,
  );
}
