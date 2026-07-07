import { defineStore } from "pinia";
import type { RaceRun, RaceRunSummary } from "shared";
import { ref } from "vue";

import { activeRun } from "@/services/activeRun";
import type { FrontendSDK } from "@/types";

export const useRunsStore = defineStore("race.runs", () => {
  const sdk = ref<FrontendSDK>();
  const runs = ref<RaceRunSummary[]>([]);

  async function load(): Promise<void> {
    if (sdk.value === undefined) {
      return;
    }
    const result = await sdk.value.backend.listRuns();
    if (result.kind === "Ok") {
      runs.value = result.value;
    }
  }

  async function remove(runId: string): Promise<void> {
    if (sdk.value === undefined) {
      return;
    }
    if (activeRun.activeRunId.value === runId) {
      activeRun.abort();
    }
    const result = await sdk.value.backend.deleteRun(runId);
    if (result.kind === "Error") {
      sdk.value.window.showToast(result.error, { variant: "error" });
      return;
    }
    sdk.value.window.showToast("Run deleted", { variant: "success" });
    await load();
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
    await load();
  }

  async function getRun(runId: string): Promise<RaceRun | undefined> {
    if (sdk.value === undefined) {
      return undefined;
    }
    const result = await sdk.value.backend.getRun(runId);
    return result.kind === "Ok" ? result.value : undefined;
  }

  function initialize(frontendSdk: FrontendSDK): void {
    sdk.value = frontendSdk;
    frontendSdk.backend.onEvent("project:changed", () => {
      void load();
    });
    void load();
  }

  return { runs, load, remove, clear, getRun, initialize };
});
