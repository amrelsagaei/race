import { err, ok, type Result, type StrategyEnum } from "shared";

import {
  pipelineSettingsCandidates,
  SESSION_CLEANUP_ATTEMPTS,
  SESSION_CLEANUP_RETRY_MS,
} from "./constants";
import { sleep } from "./timing";
import type { RequestSource } from "./types";

import type { FrontendSDK } from "@/types";

const NO_SESSION =
  "Caido rejected the pipeline request. Update Race, or Caido, so both speak the same pipeline schema.";
const NO_DATA = "Caido returned no data for the pipeline request";
const NO_SINGLE_PACKET =
  "Caido rejected the single packet attack. Enable HTTP/2 in Caido, or choose another strategy.";

type StartedBurst = { entryId: string; taskId: string };

type SessionInput = Parameters<
  FrontendSDK["graphql"]["createReplayPipelineHttpOneSession"]
>[0]["input"];

export async function createSession(
  sdk: FrontendSDK,
  strategy: StrategyEnum,
  collectionId: string | undefined,
  requestSources: RequestSource[],
): Promise<Result<string>> {
  for (const settings of pipelineSettingsCandidates(strategy)) {
    const sessionId = await trySession(sdk, {
      collectionId,
      requestSources,
      settings,
    });
    if (sessionId !== undefined) {
      return ok(sessionId);
    }
  }
  return err(strategy === "SinglePacketAttack" ? NO_SINGLE_PACKET : NO_SESSION);
}

async function trySession(
  sdk: FrontendSDK,
  input: SessionInput,
): Promise<string | undefined> {
  try {
    const created = await sdk.graphql.createReplayPipelineHttpOneSession({
      input,
    });
    const session = created?.createReplayPipelineHttpOneSession.session;
    return session === null || session === undefined ? undefined : session.id;
  } catch {
    return undefined;
  }
}

export async function startBurst(
  sdk: FrontendSDK,
  sessionId: string,
  count: number,
): Promise<Result<StartedBurst>> {
  const started = await sdk.graphql.startReplayTask({ sessionId });
  const payload = started?.startReplayTask;
  if (payload === undefined) {
    return err(NO_DATA);
  }
  if (payload.error !== null && payload.error !== undefined) {
    return err(`Failed to start the pipeline: ${payload.error.__typename}`);
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
  return ok({ entryId: entry.id, taskId: task.id });
}

export async function cancelBurst(
  sdk: FrontendSDK,
  taskId: string,
): Promise<void> {
  try {
    await sdk.graphql.cancelTask({ id: taskId });
  } catch {
    return;
  }
}

export async function deleteSession(
  sdk: FrontendSDK,
  sessionId: string,
): Promise<void> {
  if (await tryDeleteSession(sdk, sessionId)) {
    return;
  }
  void retryDeleteSession(sdk, sessionId);
}

async function retryDeleteSession(
  sdk: FrontendSDK,
  sessionId: string,
): Promise<void> {
  for (let attempt = 0; attempt < SESSION_CLEANUP_ATTEMPTS; attempt++) {
    await sleep(SESSION_CLEANUP_RETRY_MS);
    if (await tryDeleteSession(sdk, sessionId)) {
      return;
    }
  }
}

async function tryDeleteSession(
  sdk: FrontendSDK,
  sessionId: string,
): Promise<boolean> {
  try {
    const result = await sdk.graphql.deleteReplaySessions({ ids: [sessionId] });
    const deleted = result?.deleteReplaySessions.deletedIds ?? [];
    return deleted.includes(sessionId);
  } catch {
    return false;
  }
}
