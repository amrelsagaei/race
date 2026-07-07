import { err, ok, type RaceGroup, type Result } from "shared";

import { buildRaceGroup } from "./capture";
import { toGraphqlStrategy, TRANSFORM_TIMEOUT_MS } from "./constants";
import { pollUntilComplete } from "./pollBurst";
import { buildRequestSources } from "./sources";
import type { BurstEntry, BurstParams, LiveResult } from "./types";

import type { FrontendSDK } from "@/types";

export async function runBurst(
  sdk: FrontendSDK,
  params: BurstParams,
): Promise<Result<RaceGroup>> {
  const sources = await buildRequestSources(
    params.seed,
    params.count,
    params.script,
    TRANSFORM_TIMEOUT_MS,
  );
  if (sources.kind === "Error") {
    return sources;
  }

  const created = await sdk.graphql.createReplayPipelineHttpOneSession({
    input: {
      collectionId: params.collectionId,
      requestSources: sources.value,
      settings: { strategy: toGraphqlStrategy(params.strategy) },
    },
  });
  const session = created.createReplayPipelineHttpOneSession.session;
  if (session === null || session === undefined) {
    return err("Pipeline session creation returned no session");
  }
  const sessionId = session.id;

  const entryId = await startAndGetEntryId(sdk, sessionId, params.count);
  if (entryId.kind === "Error") {
    await deleteSession(sdk, sessionId);
    return entryId;
  }

  const startedAt = new Date().toISOString();
  const onPoll =
    params.onProgress === undefined
      ? undefined
      : (entries: BurstEntry[]) => {
          params.onProgress?.(entries.map(toLiveResult));
        };
  const poll = await pollUntilComplete(
    sdk,
    entryId.value,
    params.timeoutMs,
    onPoll,
    params.shouldAbort,
  );
  const group = await buildRaceGroup(sdk, params.index, startedAt, poll);
  await deleteSession(sdk, sessionId);
  return ok(group);
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
  };
}

async function startAndGetEntryId(
  sdk: FrontendSDK,
  sessionId: string,
  count: number,
): Promise<Result<string>> {
  const started = await sdk.graphql.startReplayTask({ sessionId });
  const payload = started.startReplayTask;
  if (payload.error !== null && payload.error !== undefined) {
    return err(`Failed to start pipeline: ${payload.error.__typename}`);
  }
  const task = payload.task;
  if (task === null || task === undefined) {
    return err("Starting the pipeline returned no task");
  }
  const entry = task.replayEntry;
  if (
    entry === null ||
    entry === undefined ||
    entry.__typename !== "ReplayEntryHttpOnePipeline"
  ) {
    return err("The pipeline task did not return an HTTP pipeline entry");
  }
  if (entry.httpEntries.length !== count) {
    return err(
      `Expected ${count} requests but the pipeline created ${entry.httpEntries.length}`,
    );
  }
  return ok(entry.id);
}

async function deleteSession(
  sdk: FrontendSDK,
  sessionId: string,
): Promise<void> {
  await sdk.graphql.deleteReplaySessions({ ids: [sessionId] });
}
