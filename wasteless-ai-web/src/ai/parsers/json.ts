export function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function extractJsonFromText(value: string) {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return value.slice(start, end + 1);
}

export function parseJsonFromText(value: string) {
  const direct = safeJsonParse(value);
  if (direct) return direct;

  const extracted = extractJsonFromText(value);
  if (!extracted) return null;
  return safeJsonParse(extracted);
}
