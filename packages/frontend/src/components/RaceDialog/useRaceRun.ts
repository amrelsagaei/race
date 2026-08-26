import type { RaceBaseRequest, RaceRunConfig, RaceRunSummary } from "shared";
import { computed, ref } from "vue";

import { activeRun } from "@/services/activeRun";
import { runRace } from "@/services/engine";
import { runToRows } from "@/services/rows";
import type { LiveResult, ResultRow } from "@/services/types";
import type { FrontendSDK } from "@/types";
import { getErrorMessage, toFriendly } from "@/utils/errors";

function liveToRow(result: LiveResult): ResultRow {
  return {
    index: result.index + 1,
    method: result.method ?? "",
    path: result.path ?? "",
    status: result.statusCode,
    length: result.length,
    time: result.roundtripTime,
    sentAt: result.sentAt,
    error: result.error,
    requestRaw: "",
    responseRaw: "",
  };
}

export function useRaceRun(sdk: FrontendSDK) {
  const phase = ref<"config" | "running" | "done">("config");
  const rows = ref<ResultRow[]>([]);
  const summary = ref<RaceRunSummary>();
  const errorMessage = ref<string>();

  const running = computed(() => phase.value === "running");

  async function start(
    baseRequest: RaceBaseRequest,
    config: RaceRunConfig,
  ): Promise<void> {
    phase.value = "running";
    rows.value = [];
    summary.value = undefined;
    errorMessage.value = undefined;

    let projectChanged = false;
    let handle: { stop: () => void } | undefined;
    const collected: ResultRow[][] = [];

    try {
      activeRun.begin();
      handle = sdk.backend.onEvent("project:changed", () => {
        projectChanged = true;
      });
      const result = await runRace(
        sdk,
        baseRequest,
        config,
        { shouldAbort: () => activeRun.shouldAbort() || projectChanged },
        (update) => {
          collected[update.groupIndex] = update.results.map(liveToRow);
          rows.value = collected
            .flat()
            .map((row, index) => ({ ...row, index: index + 1 }));
        },
      );
      if (result.kind === "Error") {
        errorMessage.value = toFriendly(result.error);
      } else {
        summary.value = result.value;
      }
      await refreshRows(activeRun.activeRunId.value);
    } catch (error) {
      errorMessage.value = getErrorMessage(error);
    } finally {
      handle?.stop();
      activeRun.finish();
      phase.value = "done";
    }
  }

  async function refreshRows(runId: string | undefined): Promise<void> {
    if (runId === undefined) {
      return;
    }
    const run = await sdk.backend.getRun(runId);
    if (run.kind === "Ok" && run.value !== undefined) {
      rows.value = runToRows(run.value);
    }
  }

  function stop(): void {
    activeRun.abort();
  }
  function reset(): void {
    phase.value = "config";
  }

  return {
    phase,
    rows,
    summary,
    errorMessage,
    running,
    start,
    stop,
    reset,
  };
}
