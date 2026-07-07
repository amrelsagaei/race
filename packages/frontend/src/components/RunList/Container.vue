<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import type { RaceRunSummary } from "shared";

import { useRunList } from "./useRunList";

import {
  formatDate,
  statusClass,
  statusCodeSummary,
  strategyLabel,
  timingRange,
} from "@/utils/format";

defineOptions({ name: "RunList" });

const emit = defineEmits<{ open: [summary: RaceRunSummary] }>();

const { store, runningId, confirmDelete, confirmClear, cancelRun } =
  useRunList();
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
      <template #header>
        <div class="flex items-center justify-between">
          <div class="p-4">
            <h2 class="text-lg font-semibold">Race</h2>
            <p class="text-sm text-gray-400">
              Race condition runs and their captured results.
            </p>
          </div>
          <div class="flex items-center gap-2 px-4">
            <Button
              label="Refresh"
              icon="fas fa-rotate"
              size="small"
              @click="store.load"
            />
            <Button
              label="Clear all"
              icon="fas fa-trash"
              severity="danger"
              outlined
              size="small"
              :disabled="store.runs.length === 0"
              @click="confirmClear"
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
        content: { class: 'flex-1 flex flex-col overflow-hidden min-h-0' },
      }"
    >
      <template #content>
        <div class="flex-1 min-h-0 overflow-auto">
          <div
            v-if="store.runs.length === 0"
            class="flex h-full flex-col items-center justify-center gap-2 p-6 text-surface-500"
          >
            <i class="fas fa-flag-checkered text-3xl" />
            <span>
              No race runs yet. Right-click a request and choose Race it.
            </span>
          </div>
          <DataTable
            v-else
            :value="store.runs"
            striped-rows
            size="small"
            data-key="id"
            :pt="{ table: { class: 'w-full' } }"
          >
            <Column header="Target">
              <template #body="{ data }">
                <div class="flex flex-col">
                  <span class="font-medium text-surface-100">
                    {{ data.label ?? data.target.host }}
                  </span>
                  <span class="text-xs text-surface-400">
                    {{ data.target.host }}:{{ data.target.port }} ({{
                      data.requestCount
                    }}
                    x {{ data.groupCount }})
                  </span>
                </div>
              </template>
            </Column>
            <Column header="Strategy" style="width: 9rem">
              <template #body="{ data }">
                <span class="text-sm">{{ strategyLabel(data.strategy) }}</span>
              </template>
            </Column>
            <Column header="Status" style="width: 8rem">
              <template #body="{ data }">
                <span
                  :class="[
                    'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs',
                    statusClass(data.status),
                  ]"
                >
                  <i
                    v-if="data.status === 'running'"
                    class="fas fa-spinner fa-spin"
                  />
                  {{ data.status }}
                </span>
              </template>
            </Column>
            <Column header="Responses" style="width: 7rem">
              <template #body="{ data }">
                <span class="font-mono text-xs">
                  {{ data.completedCount }}/{{ data.entryCount }}
                </span>
              </template>
            </Column>
            <Column header="Codes">
              <template #body="{ data }">
                <span class="font-mono text-xs text-surface-300">
                  {{ statusCodeSummary(data.codeCounts) }}
                </span>
              </template>
            </Column>
            <Column header="Timing" style="width: 8rem">
              <template #body="{ data }">
                <span class="font-mono text-xs text-surface-300">
                  {{ timingRange(data.minMs, data.maxMs) }}
                </span>
              </template>
            </Column>
            <Column header="Created" style="width: 12rem">
              <template #body="{ data }">
                <span class="text-xs text-surface-400">
                  {{ formatDate(data.createdAt) }}
                </span>
              </template>
            </Column>
            <Column style="width: 8rem">
              <template #body="{ data }">
                <div class="flex justify-end gap-1">
                  <Button
                    v-if="data.id === runningId"
                    icon="fas fa-stop"
                    severity="danger"
                    text
                    size="small"
                    aria-label="Cancel run"
                    @click="cancelRun"
                  />
                  <Button
                    icon="fas fa-eye"
                    severity="contrast"
                    text
                    size="small"
                    aria-label="View run"
                    @click="emit('open', data)"
                  />
                  <Button
                    icon="fas fa-trash"
                    severity="danger"
                    text
                    size="small"
                    aria-label="Delete run"
                    @click="confirmDelete(data)"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </template>
    </Card>
  </div>
</template>
