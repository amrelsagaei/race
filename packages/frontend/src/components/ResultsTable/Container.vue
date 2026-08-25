<script setup lang="ts">
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import Splitter from "primevue/splitter";
import SplitterPanel from "primevue/splitterpanel";
import { ref, watch } from "vue";

import ResultEditors from "./ResultEditors.vue";

import type { ResultRow } from "@/services/types";
import type { FrontendSDK } from "@/types";

defineOptions({ name: "RaceResultsTable" });

const props = defineProps<{ sdk: FrontendSDK; rows: ResultRow[] }>();

const selected = ref<ResultRow>();
watch(
  () => props.rows,
  (rows) => {
    if (selected.value === undefined || !rows.includes(selected.value)) {
      selected.value = rows[0];
    }
  },
  { immediate: true },
);

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
          striped-rows
          size="small"
          :pt="{ table: { class: 'w-full' } }"
        >
          <Column field="index" header="#" style="width: 4rem" />
          <Column header="Method" style="width: 6rem">
            <template #body="{ data }">
              <span class="font-mono text-xs">{{ data.method }}</span>
            </template>
          </Column>
          <Column header="Path">
            <template #body="{ data }">
              <span class="font-mono text-xs">{{ data.path }}</span>
            </template>
          </Column>
          <Column header="Status" style="width: 5rem">
            <template #body="{ data }">
              <span
                :class="['font-mono text-xs', statusCodeClass(data.status)]"
              >
                {{ data.status ?? "..." }}
              </span>
            </template>
          </Column>
          <Column header="Length" style="width: 6rem">
            <template #body="{ data }">
              <span class="font-mono text-xs text-surface-400">
                {{ data.length ?? "" }}
              </span>
            </template>
          </Column>
          <Column header="Time" style="width: 6rem">
            <template #body="{ data }">
              <span class="font-mono text-xs text-surface-400">
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
      <ResultEditors
        :sdk="sdk"
        :request-raw="selected?.requestRaw ?? ''"
        :response-raw="selected?.responseRaw ?? ''"
      />
    </SplitterPanel>
  </Splitter>
</template>
