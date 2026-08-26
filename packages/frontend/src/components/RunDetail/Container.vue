<script setup lang="ts">
import Button from "primevue/button";
import SelectButton from "primevue/selectbutton";
import type { RaceRunSummary } from "shared";

import { useRunDetail } from "./useRunDetail";

import { PageBody } from "@/components/PageBody";
import { PageHeader } from "@/components/PageHeader";
import { ResultsTable } from "@/components/ResultsTable";
import { useSDK } from "@/plugins/sdk";
import {
  runStatusLabel,
  statusClass,
  statusCodeSummary,
  strategyLabel,
  timingRange,
} from "@/utils/format";

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
    <PageHeader>
      <div class="flex items-center gap-3 p-4">
        <div class="flex flex-col min-w-0">
          <span class="text-base font-medium text-surface-100">
            {{ summary.label ?? summary.target.host }}
          </span>
          <span class="truncate text-xs text-surface-400">
            {{ strategyLabel(summary.strategy) }} | {{ summary.requestCount }} x
            {{ summary.groupCount }} |
            {{ statusCodeSummary(summary.codeCounts) }} |
            {{ timingRange(summary.minMs, summary.maxMs) }}
          </span>
        </div>
        <span
          :class="[
            'ml-auto flex-shrink-0 rounded px-2 py-0.5 text-xs',
            statusClass(summary.status),
          ]"
        >
          {{ runStatusLabel(summary.status) }}
        </span>
        <div class="flex items-center gap-2">
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
    </PageHeader>

    <PageBody>
      <div v-if="groupOptions.length > 1" class="flex-shrink-0 p-2">
        <SelectButton
          v-model="groupIndex"
          :options="groupOptions"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          :pt="{
            root: {
              class: 'flex-wrap',
              style: 'border-color: var(--p-surface-700)',
            },
          }"
        />
      </div>
      <div class="flex-1 min-h-0">
        <ResultsTable :sdk="sdk" :rows="rows" />
      </div>
    </PageBody>
  </div>
</template>
