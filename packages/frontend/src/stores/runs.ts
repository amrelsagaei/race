import { defineStore } from "pinia";
import type { RaceRun, RaceRunSummary } from "shared";
import { ref, shallowRef } from "vue";

import { activeRun } from "@/services/activeRun";
import { resetRaceView } from "@/services/selection";
import type { FrontendSDK } from "@/types";

export const useRunsStore = defineStore("race.runs", () => {
  const sdk = shallowRef<FrontendSDK>();
  const runs = ref<RaceRunSummary[]>([]);

  async function load(): Promise<void> {
    if (sdk.value === undefined) {
      return;
    }
    const result = await sdk.value.backend.listRuns();
    if (result.kind === "Error") {
      sdk.value.window.showToast(result.error, { variant: "error" });
      return;
    }
    runs.value = result.value;
  }

  async function remove(runId: string): Promise<boolean> {
    if (sdk.value === undefined) {
      return false;
    }
    if (activeRun.activeRunId.value === runId) {
      activeRun.abort();
    }
    const result = await sdk.value.backend.deleteRun(runId);
    if (result.kind === "Error") {
      sdk.value.window.showToast(result.error, { variant: "error" });
      return false;
    }
    sdk.value.window.showToast("Run deleted", { variant: "success" });
    await load();
    return true;
  }

  async function clear(): Promise<void> {
    if (sdk.value === undefined) {
      return;
    }
    if (activeRun.isActive()) {
      activeRun.abort();
    }
    const result = await sdk.value.backend.clearRuns();
    if (result.kind === "Error") {
      sdk.value.window.showToast(result.error, { variant: "error" });
      return;
    }
    sdk.value.window.showToast("All runs deleted", { variant: "success" });
    await load();
  }

  async function getRun(runId: string): Promise<RaceRun | undefined> {
    if (sdk.value === undefined) {
      return undefined;
    }
    const result = await sdk.value.backend.getRun(runId);
    if (result.kind === "Error") {
      sdk.value.window.showToast(result.error, { variant: "error" });
      return undefined;
    }
    return result.value;
  }

  function initialize(frontendSdk: FrontendSDK): void {
    sdk.value = frontendSdk;
    frontendSdk.backend.onEvent("project:changed", () => {
      resetRaceView();
      void load();
    });
    void load();
  }

  return { runs, load, remove, clear, getRun, initialize };
});
