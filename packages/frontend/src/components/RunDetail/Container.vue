<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import SelectButton from "primevue/selectbutton";
import type { RaceRunSummary } from "shared";

import { useRunDetail } from "./useRunDetail";

import { ResultsTable } from "@/components/ResultsTable";
import { useSDK } from "@/plugins/sdk";
import { statusCodeSummary, strategyLabel, timingRange } from "@/utils/format";

defineOptions({ name: "RunDetail" });

const { summary } = defineProps<{ summary: RaceRunSummary }>();
const emit = defineEmits<{ back: []; deleted: [] }>();

const sdk = useSDK();
const { groupIndex, groupOptions, rows, confirmDelete } = useRunDetail(
  summary.id,
  () => emit("deleted"),
);
</script>

<template>
  <div class="h-full flex flex-col gap-1 min-h-0">
    <Card
      class="h-fit"
      :pt="{
        body: { class: 'h-fit p-0 flex flex-col' },
        content: { class: 'h-fit flex flex-col' },
      }"
    >
      <template #content>
        <div class="flex items-center gap-3 p-4">
          <div class="flex flex-col min-w-0">
            <span class="text-base font-medium text-surface-100">
              {{ summary.label ?? summary.target.host }}
            </span>
            <span class="truncate text-xs text-surface-400">
              {{ strategyLabel(summary.strategy) }} |
              {{ summary.requestCount }} x {{ summary.groupCount }} |
              {{ statusCodeSummary(summary.codeCounts) }} |
              {{ timingRange(summary.minMs, summary.maxMs) }}
            </span>
          </div>
          <div class="ml-auto flex items-center gap-2">
            <Button
              icon="fas fa-arrow-left"
              label="Back"
              severity="secondary"
              outlined
              size="small"
              @click="emit('back')"
            />
            <Button
              icon="fas fa-trash"
              severity="danger"
              text
              size="small"
              aria-label="Delete run"
              @click="confirmDelete"
            />
          </div>
        </div>
      </template>
    </Card>

    <Card
      class="flex-1 min-h-0"
      :pt="{
        root: { style: 'display: flex; flex-direction: column; height: 100%;' },
        body: { class: 'flex-1 p-0 flex flex-col min-h-0' },
        content: { class: 'flex-1 flex flex-col min-h-0' },
      }"
    >
      <template #content>
        <div v-if="groupOptions.length > 1" class="flex-shrink-0 p-2">
          <SelectButton
            v-model="groupIndex"
            :options="groupOptions"
            option-label="label"
            option-value="value"
            :allow-empty="false"
            :pt="{ root: { style: 'border-color: var(--p-surface-700)' } }"
          />
        </div>
        <div class="flex-1 min-h-0">
          <ResultsTable :sdk="sdk" :rows="rows" />
        </div>
      </template>
    </Card>
  </div>
</template>
