<script setup lang="ts">
import Button from "primevue/button";
import SelectButton from "primevue/selectbutton";
import type { RaceBaseRequest, RaceRunConfig } from "shared";
import { computed, ref } from "vue";

import SettingsPane from "./SettingsPane.vue";
import TransformPane from "./TransformPane.vue";
import { useBaseRequestEditor } from "./useBaseRequestEditor";
import { useRaceConfig } from "./useRaceConfig";

defineOptions({ name: "RaceConfigForm" });

const props = defineProps<{
  baseRequest: RaceBaseRequest;
  http2Enabled: boolean;
}>();
const emit = defineEmits<{
  run: [payload: { config: RaceRunConfig; raw: string }];
  invalid: [];
}>();

const {
  requestCount,
  groupCount,
  betweenGroupDelayMs,
  timeoutMs,
  strategy,
  jsHook,
  label,
  strategyOptions,
  strategyNote,
  totalRequests,
  isLarge,
  buildConfig,
} = useRaceConfig(() => props.http2Enabled);

const {
  host: editorHost,
  read: readRequest,
  edited: requestEdited,
} = useBaseRequestEditor(props.baseRequest.raw);

const steps: Array<"settings" | "request" | "script"> = [
  "settings",
  "request",
  "script",
];
const tab = ref<"settings" | "request" | "script">("settings");
const tabOptions = [
  { label: "Settings", value: "settings" },
  { label: "Base request", value: "request" },
  { label: "Transform", value: "script" },
];

const stepIndex = computed(() => steps.indexOf(tab.value));
function goNext(): void {
  const next = steps[stepIndex.value + 1];
  if (next !== undefined) {
    tab.value = next;
  }
}
function goPrev(): void {
  const prev = steps[stepIndex.value - 1];
  if (prev !== undefined) {
    tab.value = prev;
  }
}

const segmentBorder = { root: { style: "border-color: var(--p-surface-700)" } };

function onRun(): void {
  const config = buildConfig();
  if (config === undefined) {
    emit("invalid");
    return;
  }
  emit("run", { config, raw: readRequest() });
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <SelectButton
      v-model="tab"
      :options="tabOptions"
      option-label="label"
      option-value="value"
      :allow-empty="false"
      class="w-full"
      :pt="segmentBorder"
    />

    <SettingsPane
      v-show="tab === 'settings'"
      v-model:request-count="requestCount"
      v-model:group-count="groupCount"
      v-model:between-group-delay-ms="betweenGroupDelayMs"
      v-model:timeout-ms="timeoutMs"
      v-model:strategy="strategy"
      v-model:label="label"
      :strategy-options="strategyOptions"
      :strategy-note="strategyNote"
      :total-requests="totalRequests"
      :is-large="isLarge"
    />

    <div v-show="tab === 'request'" class="flex flex-col gap-1">
      <div class="flex items-baseline justify-between gap-3">
        <label class="text-sm text-surface-300">
          Edit the request that will be fired.
        </label>
        <small v-if="requestEdited" class="text-yellow-500">
          <i class="fas fa-triangle-exclamation" />
          Content-Length is not recalculated. Fix it here, or call
          fixContentLength in the Transform tab.
        </small>
      </div>
      <div
        ref="editorHost"
        class="h-80 border border-surface-700 rounded overflow-hidden [&>*]:h-full"
      />
    </div>

    <TransformPane v-show="tab === 'script'" v-model="jsHook" />

    <div class="flex justify-end gap-2 pt-3">
      <Button
        v-if="stepIndex > 0"
        label="Back"
        severity="secondary"
        outlined
        @click="goPrev"
      />
      <Button
        v-if="stepIndex < steps.length - 1"
        label="Next"
        @click="goNext"
      />
      <Button v-else label="Run" @click="onRun" />
    </div>
  </div>
</template>
