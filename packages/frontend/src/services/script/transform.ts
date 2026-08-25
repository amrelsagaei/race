import { HttpForge } from "ts-http-forge";

export type TransformInput = {
  raw: string;
  index: number;
  count: number;
  group: number;
};

export type TransformResult =
  | { ok: true; values: string[] }
  | { ok: false; error: string };

function forge(raw: string) {
  return HttpForge.create(raw);
}

function wireLength(text: string): number {
  const encoder = new TextEncoder();
  let total = 0;
  for (const codepoint of text) {
    const value = codepoint.codePointAt(0) ?? 0;
    total += value <= 0xff ? 1 : encoder.encode(codepoint).length;
  }
  return total;
}

function fixContentLength(raw: string): string {
  const built = HttpForge.create(raw).build();
  const separator = built.indexOf("\r\n\r\n");
  const body = separator === -1 ? "" : built.slice(separator + 4);
  return HttpForge.create(built)
    .setHeader("Content-Length", String(wireLength(body)))
    .build();
}

const AsyncFunction = Object.getPrototypeOf(async () => {
  await Promise.resolve();
}).constructor as new (
  ...args: string[]
) => (...args: unknown[]) => Promise<unknown>;

export async function applyTransform(
  script: string,
  inputs: TransformInput[],
): Promise<TransformResult> {
  try {
    const fn = new AsyncFunction("forge", "fixContentLength", "input", script);
    const values: string[] = [];
    for (const input of inputs) {
      const output = await fn(forge, fixContentLength, input);
      if (typeof output !== "string") {
        return {
          ok: false,
          error: `Transform must return a string (request ${input.index})`,
        };
      }
      values.push(output);
    }
    return { ok: true, values };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
