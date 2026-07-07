<script setup lang="ts">
import Button from "primevue/button";
import ProgressBar from "primevue/progressbar";
import type { RaceRunSummary } from "shared";
import { computed } from "vue";

import ResultsTable from "@/components/results/ResultsTable.vue";
import type { ResultRow } from "@/services/types";
import type { FrontendSDK } from "@/types";
import { statusCodeSummary, timingRange } from "@/utils/format";

defineOptions({ name: "RaceResultsView" });

const props = defineProps<{
  sdk: FrontendSDK;
  rows: ResultRow[];
  summary: RaceRunSummary | undefined;
  error: string | undefined;
  running: boolean;
}>();
const emit = defineEmits<{ stop: []; again: []; history: [] }>();

const responded = computed(
  () => props.rows.filter((row) => row.status !== undefined).length,
);
const total = computed(() => props.rows.length);
const percent = computed(() =>
  total.value === 0 ? 0 : Math.round((responded.value / total.value) * 100),
);
</script>

<template>
  <div class="flex flex-col gap-3 h-full min-h-0">
    <div class="flex items-center gap-3 flex-shrink-0">
      <span v-if="running" class="text-sm text-surface-200">
        Running the burst
      </span>
      <span v-else-if="error !== undefined" class="text-sm text-red-400">
        {{ error }}
      </span>
      <span v-else class="text-sm text-success-300">
        {{ summary?.status === "partial" ? "Stopped" : "Completed" }}
      </span>
      <span
        v-if="!running && summary !== undefined"
        class="text-xs text-surface-400"
      >
        {{ statusCodeSummary(summary.codeCounts) }} |
        {{ timingRange(summary.minMs, summary.maxMs) }}
      </span>
      <span class="ml-auto font-mono text-xs text-surface-400">
        {{ responded }}/{{ total }} responded
      </span>
    </div>

    <ProgressBar
      v-if="running"
      :value="percent"
      :show-value="false"
      style="height: 4px"
      class="flex-shrink-0"
    />

    <div class="flex-1 min-h-0">
      <ResultsTable :sdk="sdk" :rows="rows" />
    </div>

    <div class="flex justify-end gap-2 pt-2 flex-shrink-0">
      <Button
        v-if="running"
        label="Stop"
        severity="danger"
        outlined
        @click="emit('stop')"
      />
      <template v-else>
        <Button
          label="Open in history"
          severity="secondary"
          outlined
          @click="emit('history')"
        />
        <Button label="Run again" @click="emit('again')" />
      </template>
    </div>
  </div>
</template>
