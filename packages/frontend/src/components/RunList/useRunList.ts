import { useConfirm } from "primevue/useconfirm";
import type { RaceRunSummary } from "shared";
import { computed, onMounted, watch } from "vue";

import { activeRun } from "@/services/activeRun";
import { useRunsStore } from "@/stores/runs";
import { confirmDanger } from "@/utils/confirm";

export function useRunList() {
  const store = useRunsStore();
  const confirm = useConfirm();
  const runningId = computed(() => activeRun.activeRunId.value);

  function confirmDelete(summary: RaceRunSummary): void {
    confirmDanger(confirm, {
      header: "Delete run",
      message: `Delete this race run against ${summary.target.host}? This cannot be undone.`,
      acceptLabel: "Delete",
      onAccept: () => {
        void store.remove(summary.id);
      },
    });
  }

  function confirmClear(): void {
    confirmDanger(confirm, {
      header: "Clear runs",
      message:
        runningId.value === undefined
          ? "Delete all race runs? This cannot be undone."
          : "A race is still running. Delete all runs and stop it? This cannot be undone.",
      acceptLabel: "Delete all",
      onAccept: () => {
        void store.clear();
      },
    });
  }

  function cancelRun(): void {
    activeRun.abort();
  }

  onMounted(() => {
    void store.load();
  });
  watch([runningId, activeRun.progress], () => {
    void store.load();
  });

  return { store, runningId, confirmDelete, confirmClear, cancelRun };
}
