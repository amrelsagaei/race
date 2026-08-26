import { ok, type RaceGroup, type Result } from "shared";

import { buildRaceGroup } from "./capture";
import { transformBudgetMs } from "./constants";
import { pollUntilComplete } from "./pollBurst";
import {
  cancelBurst,
  createSession,
  deleteSession,
  startBurst,
} from "./session";
import { buildRequestSources } from "./sources";
import type { BurstEntry, BurstParams, LiveResult } from "./types";

import type { FrontendSDK } from "@/types";

export async function runBurst(
  sdk: FrontendSDK,
  params: BurstParams,
): Promise<Result<RaceGroup>> {
  const sources = await buildRequestSources(
    params.baseRequest,
    params.count,
    params.index,
    params.script,
    transformBudgetMs(params.count),
  );
  if (sources.kind === "Error") {
    return sources;
  }

  const sessionId = await createSession(
    sdk,
    params.strategy,
    params.collectionId,
    sources.value,
  );
  if (sessionId.kind === "Error") {
    return sessionId;
  }

  const started = await startBurst(sdk, sessionId.value, params.count);
  if (started.kind === "Error") {
    await deleteSession(sdk, sessionId.value);
    return started;
  }

  const startedAt = new Date().toISOString();
  const onPoll =
    params.onProgress === undefined
      ? undefined
      : (entries: BurstEntry[]) => {
          params.onProgress?.(entries.map(toLiveResult));
        };
  try {
    const poll = await pollUntilComplete(
      sdk,
      started.value.entryId,
      params.timeoutMs,
      onPoll,
      params.shouldAbort,
    );
    if (poll.aborted || poll.timedOut) {
      await cancelBurst(sdk, started.value.taskId);
    }
    return ok(await buildRaceGroup(sdk, params.index, startedAt, poll));
  } finally {
    await deleteSession(sdk, sessionId.value);
  }
}

function toLiveResult(entry: BurstEntry, index: number): LiveResult {
  const status =
    entry.responseId !== undefined
      ? "received"
      : entry.error !== undefined
        ? "error"
        : "pending";
  return {
    index,
    method: entry.method,
    path: entry.path,
    status,
    statusCode: entry.statusCode,
    length: entry.length,
    roundtripTime: entry.roundtripTime,
    sentAt: entry.sentAt,
    error: entry.error,
  };
}
