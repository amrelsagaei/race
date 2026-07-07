<script setup lang="ts">
import Button from "primevue/button";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import SelectButton from "primevue/selectbutton";
import type { RaceRunConfig, RaceSeed } from "shared";
import { computed, ref } from "vue";

import TransformPane from "./TransformPane.vue";
import { useRaceConfig } from "./useRaceConfig";
import { useSeedEditor } from "./useSeedEditor";

defineOptions({ name: "RaceConfigForm" });

const props = defineProps<{ seed: RaceSeed }>();
const emit = defineEmits<{
  run: [payload: { config: RaceRunConfig; seedRaw: string }];
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
  totalRequests,
  isLarge,
  buildConfig,
} = useRaceConfig();

const { host: seedHost, read: readSeed } = useSeedEditor(props.seed.raw);

const steps: Array<"settings" | "seed" | "script"> = [
  "settings",
  "seed",
  "script",
];
const tab = ref<"settings" | "seed" | "script">("settings");
const tabOptions = [
  { label: "Settings", value: "settings" },
  { label: "Seed request", value: "seed" },
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
  if (config !== undefined) {
    emit("run", { config, seedRaw: readSeed() });
  }
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

    <div v-show="tab === 'settings'" class="flex flex-col gap-4">
      <div class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm text-surface-300">Requests per burst</label>
          <InputNumber v-model="requestCount" :min="2" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm text-surface-300">Groups (bursts)</label>
          <InputNumber v-model="groupCount" :min="1" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm text-surface-300"
            >Between-group delay (ms)</label
          >
          <InputNumber v-model="betweenGroupDelayMs" :min="0" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm text-surface-300">Per-burst timeout (ms)</label>
          <InputNumber v-model="timeoutMs" :min="0" class="w-full" />
        </div>
      </div>

      <small v-if="isLarge" class="text-yellow-500">
        This will fire and store {{ totalRequests }} requests. Large runs use
        more disk in the project history.
      </small>

      <div class="flex flex-col gap-2">
        <label class="text-sm text-surface-300">Strategy</label>
        <SelectButton
          v-model="strategy"
          :options="strategyOptions"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          :pt="{
            root: {
              style: 'width: fit-content; border-color: var(--p-surface-700)',
            },
          }"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm text-surface-300">Label (optional)</label>
        <InputText v-model="label" class="w-full" />
      </div>
    </div>

    <div v-show="tab === 'seed'" class="flex flex-col gap-1">
      <label class="text-sm text-surface-300">
        Edit the request that will be fired.
      </label>
      <div
        ref="seedHost"
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
