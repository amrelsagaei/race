import { useConfirm } from "primevue/useconfirm";
import type { RaceGroup } from "shared";
import { computed, onMounted, ref } from "vue";

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
    await store.remove(runId);
    onDeleted();
  }

  onMounted(async () => {
    const run = await store.getRun(runId);
    if (run !== undefined) {
      groups.value = run.groups;
    }
  });

  return { groupIndex, groupOptions, rows, confirmDelete };
}
