import {
  err,
  type RaceBaseRequest,
  type RaceRunConfig,
  type RaceRunSummary,
  type Result,
} from "shared";

import { activeRun } from "./activeRun";
import { ensureRaceCollection } from "./collection";
import { TRANSFORM_TIMEOUT_MS } from "./constants";
import { runBurst } from "./pipeline";
import { runTransform } from "./script";
import { sleepUntilAborted } from "./timing";
import type { ProgressCallback, RaceControls } from "./types";

import type { FrontendSDK } from "@/types";
import { getErrorMessage } from "@/utils/errors";

export async function runRace(
  sdk: FrontendSDK,
  baseRequest: RaceBaseRequest,
  config: RaceRunConfig,
  controls: RaceControls,
  onProgress: ProgressCallback | undefined,
): Promise<Result<RaceRunSummary>> {
  const script = config.jsHook;
  if (script !== undefined && script.trim() !== "") {
    const preflight = await runTransform(
      [
        {
          raw: baseRequest.raw,
          index: 0,
          count: config.requestCount,
          group: 0,
        },
      ],
      script,
      TRANSFORM_TIMEOUT_MS,
    );
    if (preflight.kind === "Error") {
      return err(preflight.error);
    }
  }

  const collectionId = await ensureRaceCollection(sdk);
  return runGroups(
    sdk,
    baseRequest,
    config,
    controls,
    onProgress,
    script,
    collectionId,
  );
}

async function runGroups(
  sdk: FrontendSDK,
  baseRequest: RaceBaseRequest,
  config: RaceRunConfig,
  controls: RaceControls,
  onProgress: ProgressCallback | undefined,
  script: string | undefined,
  collectionId: string | undefined,
): Promise<Result<RaceRunSummary>> {
  const created = await sdk.backend.persistRun({
    config,
    target: baseRequest.connection,
    label: config.label,
  });
  if (created.kind === "Error") {
    return created;
  }
  const runId = created.value.id;
  activeRun.setRunId(runId);

  let responded = false;
  try {
    let incomplete = false;
    for (let index = 0; index < config.groupCount; index++) {
      if (controls.shouldAbort()) {
        return await sdk.backend.updateStatus(runId, "cancelled");
      }
      const burst = await runBurst(sdk, {
        baseRequest,
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
        await sdk.backend.updateStatus(runId, responded ? "partial" : "failed");
        return err(burst.error);
      }
      const appended = await sdk.backend.appendGroup(runId, burst.value);
      if (appended.kind === "Error") {
        await sdk.backend.updateStatus(runId, responded ? "partial" : "failed");
        return err(appended.error);
      }
      activeRun.reportProgress();
      for (const entry of burst.value.entries) {
        if (entry.response === undefined) {
          incomplete = true;
        } else {
          responded = true;
        }
      }
      if (index < config.groupCount - 1 && config.betweenGroupDelayMs > 0) {
        await sleepUntilAborted(
          config.betweenGroupDelayMs,
          controls.shouldAbort,
        );
      }
    }
    if (controls.shouldAbort()) {
      return await sdk.backend.updateStatus(runId, "cancelled");
    }
    if (!responded) {
      return await sdk.backend.updateStatus(runId, "failed");
    }
    return await sdk.backend.updateStatus(
      runId,
      incomplete ? "partial" : "completed",
    );
  } catch (error) {
    await sdk.backend.updateStatus(runId, responded ? "partial" : "failed");
    return err(getErrorMessage(error));
  }
}
