import {
  err,
  type RaceRunConfig,
  type RaceRunSummary,
  type RaceSeed,
  type Result,
} from "shared";

import { activeRun } from "./activeRun";
import { deleteRaceCollection, ensureRaceCollection } from "./collection";
import { TRANSFORM_TIMEOUT_MS } from "./constants";
import { runBurst } from "./pipeline";
import { runTransform } from "./script";
import { sleepUntilAborted } from "./timing";
import type { ProgressCallback, RaceControls } from "./types";

import type { FrontendSDK } from "@/types";

export async function runRace(
  sdk: FrontendSDK,
  seed: RaceSeed,
  config: RaceRunConfig,
  controls: RaceControls,
  onProgress: ProgressCallback | undefined,
): Promise<Result<RaceRunSummary>> {
  const script = config.jsHook;
  if (script !== undefined && script.trim() !== "") {
    const preflight = await runTransform(
      [{ raw: seed.raw, index: 0, count: config.requestCount }],
      script,
      TRANSFORM_TIMEOUT_MS,
    );
    if (preflight.kind === "Error") {
      return err(preflight.error);
    }
  }

  const collectionId = await ensureRaceCollection(sdk);
  try {
    return await runGroups(
      sdk,
      seed,
      config,
      controls,
      onProgress,
      script,
      collectionId,
    );
  } finally {
    if (collectionId !== undefined) {
      await deleteRaceCollection(sdk, collectionId);
    }
  }
}

async function runGroups(
  sdk: FrontendSDK,
  seed: RaceSeed,
  config: RaceRunConfig,
  controls: RaceControls,
  onProgress: ProgressCallback | undefined,
  script: string | undefined,
  collectionId: string | undefined,
): Promise<Result<RaceRunSummary>> {
  const created = await sdk.backend.persistRun({
    config,
    target: seed.connection,
    label: config.label,
  });
  if (created.kind === "Error") {
    return created;
  }
  const runId = created.value.id;
  activeRun.setRunId(runId);

  let incomplete = false;
  for (let index = 0; index < config.groupCount; index++) {
    if (controls.shouldAbort()) {
      return sdk.backend.updateStatus(runId, "partial");
    }
    const burst = await runBurst(sdk, {
      seed,
      count: config.requestCount,
      script,
      collectionId,
      strategy: config.strategy,
      timeoutMs: config.timeoutMs,
      index,
      shouldAbort: controls.shouldAbort,
      onProgress:
        onProgress === undefined
          ? undefined
          : (results) => {
              onProgress({
                groupIndex: index,
                groupCount: config.groupCount,
                results,
              });
            },
    });
    if (burst.kind === "Error") {
      await sdk.backend.updateStatus(runId, "failed");
      return err(burst.error);
    }
    const appended = await sdk.backend.appendGroup(runId, burst.value);
    if (appended.kind === "Error") {
      await sdk.backend.updateStatus(runId, "failed");
      return err(appended.error);
    }
    if (burst.value.entries.some((entry) => entry.response === undefined)) {
      incomplete = true;
    }
    if (index < config.groupCount - 1 && config.betweenGroupDelayMs > 0) {
      await sleepUntilAborted(config.betweenGroupDelayMs, controls.shouldAbort);
    }
  }

  return sdk.backend.updateStatus(runId, incomplete ? "partial" : "completed");
}
