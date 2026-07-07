import { HttpForge } from "ts-http-forge";

type TransformInput = { raw: string; index: number; count: number };

function forge(raw: string) {
  return HttpForge.create(raw);
}

function fixContentLength(raw: string): string {
  const instance = HttpForge.create(raw);
  const body = instance.getBody() ?? "";
  return instance.setHeader("Content-Length", String(body.length)).build();
}

const ctx = globalThis as unknown as {
  onmessage: (event: {
    data: { script: string; inputs: TransformInput[] };
  }) => void;
  postMessage: (message: unknown) => void;
};

const AsyncFunction = Object.getPrototypeOf(async () => {
  await Promise.resolve();
}).constructor as new (
  ...args: string[]
) => (...args: unknown[]) => Promise<unknown>;

ctx.onmessage = async (event) => {
  const { script, inputs } = event.data;
  try {
    const fn = new AsyncFunction("forge", "fixContentLength", "input", script);
    const values: string[] = [];
    for (const input of inputs) {
      const output = await fn(forge, fixContentLength, input);
      if (typeof output !== "string") {
        ctx.postMessage({
          ok: false,
          error: `Transform must return a string (request ${input.index})`,
        });
        return;
      }
      values.push(output);
    }
    ctx.postMessage({ ok: true, values });
  } catch (e) {
    ctx.postMessage({
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }
};
