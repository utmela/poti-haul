export const MAX_PRICE_GEL = 50000;
export const MAX_CAPACITY = 99;

export function sanitizeIntegerText(raw: string, max: number) {
  const digits = raw.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  const value = Number.parseInt(digits, 10);

  if (!Number.isFinite(value)) {
    return String(max);
  }

  return String(Math.min(value, max));
}

export function clampIntegerInput(
  raw: string,
  min: number,
  max: number,
  fallback = min
) {
  const text = sanitizeIntegerText(raw, max);

  if (!text) {
    return fallback;
  }

  const value = Number.parseInt(text, 10);
  return Math.min(max, Math.max(min, value));
}

