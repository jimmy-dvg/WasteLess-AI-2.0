export type SseEvent = {
  event: string;
  data: string;
};

export async function* streamSse(response: Response): AsyncGenerator<SseEvent, void, unknown> {
  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const chunk = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const parsed = parseSseChunk(chunk);
      if (parsed) yield parsed;
      boundary = buffer.indexOf("\n\n");
    }
  }

  if (buffer.trim()) {
    const parsed = parseSseChunk(buffer);
    if (parsed) yield parsed;
  }
}

function parseSseChunk(chunk: string): SseEvent | null {
  let event = "message";
  let data = "";

  chunk
    .split("\n")
    .map((line) => line.trim())
    .forEach((line) => {
      if (!line) return;
      if (line.startsWith(":")) return;
      if (line.startsWith("event:")) {
        event = line.replace("event:", "").trim();
      } else if (line.startsWith("data:")) {
        data += line.replace("data:", "").trim();
      }
    });

  if (!data) return null;
  return { event, data };
}

export async function* streamJsonLines(response: Response): AsyncGenerator<string, void, unknown> {
  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf("\n");
    while (boundary !== -1) {
      const line = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 1);
      if (line) yield line;
      boundary = buffer.indexOf("\n");
    }
  }

  if (buffer.trim()) {
    yield buffer.trim();
  }
}
