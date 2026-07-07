import { err, ok, type Result } from "shared";

import InlineWorker from "./worker?worker&inline";

type TransformInput = { raw: string; index: number; count: number };
type WorkerResponse =
  | { ok: true; values: string[] }
  | { ok: false; error: string };

export function runTransform(
  inputs: TransformInput[],
  script: string,
  timeoutMs: number,
): Promise<Result<string[]>> {
  return new Promise((resolve) => {
    const worker = new InlineWorker();

    let settled = false;
    const finish = (result: Result<string[]>) => {
      if (settled) {
        return;
      }
      settled = true;
      worker.terminate();
      resolve(result);
    };

    const timer = setTimeout(
      () => finish(err(`Transform timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      clearTimeout(timer);
      const data = event.data;
      finish(data.ok ? ok(data.values) : err(data.error));
    };
    worker.onerror = (event) => {
      clearTimeout(timer);
      finish(
        err(event.message !== "" ? event.message : "Transform worker error"),
      );
    };

    worker.postMessage({ script, inputs });
  });
}
