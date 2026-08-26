<script setup lang="ts">
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import Splitter from "primevue/splitter";
import SplitterPanel from "primevue/splitterpanel";
import { ref, watch } from "vue";

import ResultEditors from "./ResultEditors.vue";

import type { ResultRow } from "@/services/types";
import type { FrontendSDK } from "@/types";
import { formatSentAt } from "@/utils/format";

defineOptions({ name: "RaceResultsTable" });

const props = defineProps<{
  sdk: FrontendSDK;
  rows: ResultRow[];
  running?: boolean;
}>();

const selected = ref<ResultRow>();
watch(
  () => props.rows,
  (rows) => {
    const current = selected.value;
    const match =
      current === undefined
        ? undefined
        : rows.find((row) => row.index === current.index);
    selected.value = match;
  },
  { immediate: true },
);

type BodyRowOptions = { context?: { selected?: boolean; index?: number } };

const HOVER = "hover:bg-surface-300/20 dark:hover:bg-surface-700/50";
const SKELETON = "block h-3 animate-pulse rounded bg-surface-600/40";

function isPending(row: ResultRow): boolean {
  return (
    props.running === true &&
    row.status === undefined &&
    row.error === undefined
  );
}

function rowClass(context: BodyRowOptions["context"]): string {
  if (context?.selected === true) {
    return `cursor-pointer ${HOVER} !bg-black/30`;
  }
  const stripe =
    (context?.index ?? 0) % 2 === 0
      ? "bg-surface-0 dark:bg-surface-800"
      : "bg-surface-50 dark:bg-surface-900";
  return `cursor-pointer ${HOVER} ${stripe}`;
}

const tablePt = {
  table: { class: "w-full table-fixed border-separate border-spacing-0" },
  bodyRow: (options: BodyRowOptions) => ({ class: rowClass(options.context) }),
};

function statusCodeClass(code: number | undefined): string {
  if (code === undefined) {
    return "text-surface-400";
  }
  if (code < 300) {
    return "text-success-400";
  }
  if (code < 400) {
    return "text-blue-400";
  }
  if (code < 500) {
    return "text-yellow-400";
  }
  return "text-red-400";
}
</script>

<template>
  <Splitter layout="vertical" class="h-full min-h-0 !border-0">
    <SplitterPanel :size="42" :min-size="15" class="min-h-0 overflow-hidden">
      <div class="h-full min-h-0 overflow-auto">
        <DataTable
          v-model:selection="selected"
          :value="rows"
          selection-mode="single"
          data-key="index"
          size="small"
          :pt="tablePt"
        >
          <Column field="index" header="#" style="width: 4rem" />
          <Column header="Method" style="width: 6rem">
            <template #body="{ data }">
              <span class="font-mono text-xs">{{ data.method }}</span>
            </template>
          </Column>
          <Column header="Path">
            <template #body="{ data }">
              <span class="block truncate font-mono text-xs" :title="data.path">
                {{ data.path }}
              </span>
            </template>
          </Column>
          <Column header="Sent at" style="width: 9rem">
            <template #body="{ data }">
              <span class="font-mono text-xs text-surface-400">
                {{ formatSentAt(data.sentAt) }}
              </span>
            </template>
          </Column>
          <Column header="Status" style="width: 5rem">
            <template #body="{ data }">
              <span
                v-if="data.status === undefined && data.error !== undefined"
                class="font-mono text-xs text-red-400"
                :title="data.error"
              >
                N/A
              </span>
              <span v-else-if="isPending(data)" :class="SKELETON" class="w-8" />
              <span
                v-else
                :class="['font-mono text-xs', statusCodeClass(data.status)]"
              >
                {{ data.status }}
              </span>
            </template>
          </Column>
          <Column header="Length" style="width: 6rem">
            <template #body="{ data }">
              <span v-if="isPending(data)" :class="SKELETON" class="w-10" />
              <span v-else class="font-mono text-xs text-surface-400">
                {{ data.length ?? "" }}
              </span>
            </template>
          </Column>
          <Column header="Time" style="width: 6rem">
            <template #body="{ data }">
              <span v-if="isPending(data)" :class="SKELETON" class="w-12" />
              <span v-else class="font-mono text-xs text-surface-400">
                {{
                  data.time !== undefined ? Math.round(data.time) + " ms" : ""
                }}
              </span>
            </template>
          </Column>
        </DataTable>
      </div>
    </SplitterPanel>
    <SplitterPanel :size="58" :min-size="20" class="min-h-0 overflow-hidden">
      <div
        v-if="selected === undefined"
        class="flex h-full flex-col items-center justify-center gap-2 text-surface-500"
      >
        <i class="fas fa-hand-pointer text-2xl" />
        <span class="text-sm">{{
          rows.length === 0 && running === true
            ? "Waiting for the first response"
            : "No request selected"
        }}</span>
      </div>
      <div v-else class="flex h-full min-h-0 flex-col">
        <div
          v-if="selected.error !== undefined"
          class="flex-shrink-0 bg-red-500/10 px-3 py-1 font-mono text-xs text-red-400"
        >
          {{ selected.error }}
        </div>
        <div class="min-h-0 flex-1">
          <ResultEditors
            :sdk="sdk"
            :request-raw="selected.requestRaw"
            :response-raw="selected.responseRaw"
          />
        </div>
      </div>
    </SplitterPanel>
  </Splitter>
</template>
