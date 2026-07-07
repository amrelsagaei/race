import type { RaceRunConfig, RaceRunSummary, RaceSeed } from "shared";
import { computed, ref } from "vue";

import { activeRun } from "@/services/activeRun";
import { runRace } from "@/services/engine";
import { runToRows } from "@/services/rows";
import type { LiveResult, ResultRow } from "@/services/types";
import type { FrontendSDK } from "@/types";

function liveToRow(result: LiveResult): ResultRow {
  return {
    index: result.index + 1,
    method: result.method ?? "",
    path: result.path ?? "",
    status: result.statusCode,
    length: result.length,
    time: result.roundtripTime,
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

  async function start(seed: RaceSeed, config: RaceRunConfig): Promise<void> {
    phase.value = "running";
    rows.value = [];
    summary.value = undefined;
    errorMessage.value = undefined;
    activeRun.begin();

    let projectChanged = false;
    const handle = sdk.backend.onEvent("project:changed", () => {
      projectChanged = true;
    });

    try {
      const result = await runRace(
        sdk,
        seed,
        config,
        { shouldAbort: () => activeRun.shouldAbort() || projectChanged },
        (update) => {
          rows.value = update.results.map(liveToRow);
        },
      );
      if (result.kind === "Error") {
        errorMessage.value = result.error;
        return;
      }
      summary.value = result.value;
      const run = await sdk.backend.getRun(result.value.id);
      if (run.kind === "Ok" && run.value !== undefined) {
        rows.value = runToRows(run.value);
      }
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : String(error);
    } finally {
      handle.stop();
      activeRun.finish();
      phase.value = "done";
    }
  }

  function stop(): void {
    activeRun.abort();
  }
  function reset(): void {
    phase.value = "config";
  }

  return { phase, rows, summary, errorMessage, running, start, stop, reset };
}
