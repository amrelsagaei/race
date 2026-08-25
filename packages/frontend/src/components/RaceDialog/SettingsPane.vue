<script setup lang="ts">
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import SelectButton from "primevue/selectbutton";
import type { StrategyEnum } from "shared";

defineOptions({ name: "RaceSettingsPane" });

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
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid grid-cols-2 gap-3">
      <div class="flex flex-col gap-1">
        <label for="race-requests" class="text-sm text-surface-300">
          Requests per burst
        </label>
        <InputNumber
          v-model="requestCount"
          input-id="race-requests"
          :allow-empty="false"
          :min="2"
          class="w-full"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label for="race-groups" class="text-sm text-surface-300">
          Groups (bursts)
        </label>
        <InputNumber
          v-model="groupCount"
          input-id="race-groups"
          :allow-empty="false"
          :min="1"
          class="w-full"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label for="race-delay" class="text-sm text-surface-300">
          Between-group delay (ms)
        </label>
        <InputNumber
          v-model="betweenGroupDelayMs"
          input-id="race-delay"
          :allow-empty="false"
          :min="0"
          class="w-full"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label for="race-timeout" class="text-sm text-surface-300">
          Per-burst timeout (ms)
        </label>
        <InputNumber
          v-model="timeoutMs"
          input-id="race-timeout"
          :allow-empty="false"
          :min="0"
          class="w-full"
        />
      </div>
    </div>

    <small v-if="isLarge" class="text-yellow-500">
      This will fire and store {{ totalRequests }} requests. Large runs use more
      disk in the project history.
    </small>

    <div class="flex flex-col gap-2">
      <label class="text-sm text-surface-300">Strategy</label>
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
      <label for="race-label" class="text-sm text-surface-300">
        Label (optional)
      </label>
      <InputText v-model="label" input-id="race-label" class="w-full" />
    </div>
  </div>
</template>
