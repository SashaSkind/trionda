import type { SSEEvent } from '@/lib/types';

export function encodeSSE(event: SSEEvent): Uint8Array {
  // Single `data:` line per SSE message. Event discriminator lives in the
  // payload (`type` field), so the API contract isn't tied to the SSE event
  // name field.
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  return new TextEncoder().encode(payload);
}

export function makeSSEStream(
  start: (emit: (event: SSEEvent) => void, close: () => void) => Promise<void> | void
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const emit = (event: SSEEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encodeSSE(event));
        } catch {
          closed = true;
        }
      };
      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          // already closed
        }
      };
      try {
        await start(emit, close);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        emit({ type: 'error', message });
      } finally {
        close();
      }
    },
  });
}
