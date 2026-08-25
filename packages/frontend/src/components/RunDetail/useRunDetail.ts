import { useConfirm } from "primevue/useconfirm";
import type { RaceGroup } from "shared";
import { computed, onMounted, ref, watch } from "vue";

import { activeRun } from "@/services/activeRun";
import { groupToRows } from "@/services/rows";
import type { ResultRow } from "@/services/types";
import { useRunsStore } from "@/stores/runs";
import { confirmDanger } from "@/utils/confirm";

export function useRunDetail(runId: string, onDeleted: () => void) {
  const store = useRunsStore();
  const confirm = useConfirm();
  const groups = ref<RaceGroup[]>([]);
  const groupIndex = ref(0);

  const rows = computed<ResultRow[]>(() => {
    const group = groups.value[groupIndex.value];
    return group === undefined ? [] : groupToRows(group, 0);
  });

  const groupOptions = computed(() =>
    groups.value.map((group, index) => ({
      label: `Group ${group.index + 1}`,
      value: index,
    })),
  );

  function confirmDelete(): void {
    confirmDanger(confirm, {
      header: "Delete run",
      message: "Delete this race run? This cannot be undone.",
      acceptLabel: "Delete",
      onAccept: () => {
        void removeRun();
      },
    });
  }
  async function removeRun(): Promise<void> {
    if (await store.remove(runId)) {
      onDeleted();
    }
  }

  async function load(): Promise<void> {
    const run = await store.getRun(runId);
    if (run !== undefined) {
      groups.value = run.groups;
    }
  }

  onMounted(() => {
    void load();
  });
  watch(activeRun.progress, () => {
    void load();
  });

  return { groupIndex, groupOptions, rows, confirmDelete };
}
