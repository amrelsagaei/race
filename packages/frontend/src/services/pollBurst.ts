import {
  DEFAULT_TIMEOUT_MS,
  POLL_INTERVAL_MS,
  SESSION_KIND_PIPELINE,
} from "./constants";
import { sleep } from "./timing";
import type { BurstEntry, PollResult } from "./types";

import type { FrontendSDK } from "@/types";

function toIso(value: Date | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export async function pollUntilComplete(
  sdk: FrontendSDK,
  entryId: string,
  timeoutMs: number,
  onPoll: ((entries: BurstEntry[]) => void) | undefined,
  shouldAbort: () => boolean,
): Promise<PollResult> {
  const deadline =
    Date.now() + (timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS);
  let entries: BurstEntry[] = [];
  let pipelineError: string | undefined;

  for (;;) {
    const result = await sdk.graphql.replayEntry({
      id: entryId,
      sessionKind: SESSION_KIND_PIPELINE,
    });
    const entry = result?.replayEntry;
    if (
      entry !== null &&
      entry !== undefined &&
      entry.__typename === "ReplayEntryHttpOnePipeline"
    ) {
      pipelineError = entry.error ?? undefined;
      entries = entry.httpEntries.map((httpEntry) => {
        const request = httpEntry.request;
        const response = request?.response;
        const connection = httpEntry.connection;
        return {
          requestRaw: request?.raw ?? httpEntry.raw,
          connection: {
            host: connection.host,
            port: connection.port,
            isTls: connection.isTLS,
            sni: connection.SNI ?? undefined,
          },
          method: request?.method ?? undefined,
          path: request?.path ?? undefined,
          responseId: response?.id ?? undefined,
          statusCode: response?.statusCode ?? undefined,
          roundtripTime: response?.roundtripTime ?? undefined,
          length: response?.length ?? undefined,
          error: httpEntry.error ?? undefined,
          sentAt: toIso(request?.createdAt ?? undefined),
        };
      });
      if (onPoll !== undefined) {
        onPoll(entries);
      }
      const settled =
        entries.length > 0 &&
        entries.every(
          (current) =>
            current.responseId !== undefined || current.error !== undefined,
        );
      if (settled) {
        return { entries, timedOut: false, aborted: false, pipelineError };
      }
    }
    if (shouldAbort()) {
      return { entries, timedOut: true, aborted: true, pipelineError };
    }
    if (Date.now() >= deadline) {
      return { entries, timedOut: true, aborted: false, pipelineError };
    }
    await sleep(POLL_INTERVAL_MS);
  }
}
