import { err, ok, type Result } from "shared";

import type { TransformInput, TransformResult } from "./transform";
import InlineWorker from "./worker?worker&inline";

import { getErrorMessage } from "@/utils/errors";

export function runTransform(
  inputs: TransformInput[],
  script: string,
  timeoutMs: number,
): Promise<Result<string[]>> {
  return new Promise((resolve) => {
    let worker: InstanceType<typeof InlineWorker>;
    try {
      worker = new InlineWorker();
    } catch (error) {
      resolve(err(getErrorMessage(error)));
      return;
    }

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

    worker.onmessage = (event: MessageEvent<TransformResult>) => {
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
