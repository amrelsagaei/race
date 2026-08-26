<script setup lang="ts">
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import SelectButton from "primevue/selectbutton";
import type { StrategyEnum } from "shared";

import FieldHint from "./FieldHint.vue";

defineOptions({ name: "RaceSettingsPane" });

const HINTS = {
  requests:
    "How many requests are fired together in one burst. This is the size of the race itself.",
  groups:
    "How many times the burst is repeated. Each group is a fresh, separately synchronised burst.",
  delay:
    "How long to wait between groups. It does not affect timing inside a burst, only the gap between them.",
  timeout:
    "How long to wait for a burst's responses before giving up on it and moving on.",
  strategy:
    "Last-byte sync holds every request open and releases the final bytes together. Single packet puts the whole burst in one TCP packet over HTTP/2. Sequential sends them one after another as a control run.",
  label: "An optional name to help you recognise this run in the history.",
};

defineProps<{
  strategyOptions: Array<{
    label: string;
    value: StrategyEnum;
    disabled: boolean;
  }>;
  strategyNote: string | undefined;
  totalRequests: number;
  isLarge: boolean;
}>();

const requestCount = defineModel<number>("requestCount", { required: true });
const groupCount = defineModel<number>("groupCount", { required: true });
const betweenGroupDelayMs = defineModel<number>("betweenGroupDelayMs", {
  required: true,
});
const timeoutMs = defineModel<number>("timeoutMs", { required: true });
const strategy = defineModel<StrategyEnum>("strategy", { required: true });
const label = defineModel<string>("label", { required: true });

const numberFields = [
  {
    id: "race-requests",
    text: "Requests per burst",
    hint: HINTS.requests,
    model: requestCount,
    min: 2,
    max: 500,
  },
  {
    id: "race-groups",
    text: "Groups (bursts)",
    hint: HINTS.groups,
    model: groupCount,
    min: 1,
    max: 100,
  },
  {
    id: "race-delay",
    text: "Between-group delay (ms)",
    hint: HINTS.delay,
    model: betweenGroupDelayMs,
    min: 0,
    max: 600000,
  },
  {
    id: "race-timeout",
    text: "Per-burst timeout (ms)",
    hint: HINTS.timeout,
    model: timeoutMs,
    min: 100,
    max: 600000,
  },
];
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid grid-cols-2 gap-3">
      <div
        v-for="field in numberFields"
        :key="field.id"
        class="flex flex-col gap-1"
      >
        <label
          :for="field.id"
          class="flex items-center gap-1.5 text-sm text-surface-300"
        >
          {{ field.text }}
          <FieldHint :text="field.hint" />
        </label>
        <InputNumber
          v-model="field.model.value"
          :input-id="field.id"
          :allow-empty="false"
          :min="field.min"
          :max="field.max"
          :max-fraction-digits="0"
          class="w-full"
        />
      </div>
    </div>

    <small v-if="isLarge" class="text-yellow-500">
      This will fire and store {{ totalRequests.toLocaleString() }} requests.
      Large runs use more disk in the project history.
    </small>

    <div class="flex flex-col gap-2">
      <label class="flex items-center gap-1.5 text-sm text-surface-300">
        Strategy
        <FieldHint :text="HINTS.strategy" />
      </label>
      <div class="flex items-center gap-3">
        <SelectButton
          v-model="strategy"
          :options="strategyOptions"
          option-label="label"
          option-value="value"
          option-disabled="disabled"
          :allow-empty="false"
          :pt="{
            root: {
              style: 'width: fit-content; border-color: var(--p-surface-700)',
            },
          }"
        />
        <small v-if="strategyNote !== undefined" class="text-surface-400">
          {{ strategyNote }}
        </small>
      </div>
    </div>

    <div class="flex flex-col gap-1">
      <label
        for="race-label"
        class="flex items-center gap-1.5 text-sm text-surface-300"
      >
        Label (optional)
        <FieldHint :text="HINTS.label" />
      </label>
      <InputText
        id="race-label"
        v-model="label"
        maxlength="120"
        class="w-full"
      />
    </div>
  </div>
</template>
