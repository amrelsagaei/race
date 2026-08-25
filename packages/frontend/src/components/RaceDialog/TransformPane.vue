<script setup lang="ts">
import ToggleSwitch from "primevue/toggleswitch";
import { computed } from "vue";

import { TRANSFORM_REFERENCE } from "./reference";
import ScriptEditor from "./ScriptEditor.vue";

defineOptions({ name: "RaceTransformPane" });

const model = defineModel<string>({ required: true });

const STARTER = "return input.raw;";

const enabled = computed(() => model.value.trim() !== "");
function onToggle(value: boolean): void {
  model.value = value ? STARTER : "";
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <div>
        <label class="text-sm text-surface-200">Enable transform</label>
        <p class="text-xs text-surface-400">
          Applied to each request before it is sent
        </p>
      </div>
      <ToggleSwitch :model-value="enabled" @update:model-value="onToggle" />
    </div>

    <ScriptEditor v-model="model" />
    <p class="text-xs text-surface-400">
      Return the raw request string for this index. Build it with
      forge(input.raw). Runs in a sandboxed worker.
    </p>
    <details class="text-xs">
      <summary class="cursor-pointer text-surface-400 hover:text-surface-300">
        Variables and helpers
      </summary>
      <div
        class="mt-2 flex select-text flex-col gap-1 rounded bg-surface-800 p-3"
      >
        <div v-for="entry in TRANSFORM_REFERENCE" :key="entry.name">
          <code class="font-mono text-primary-400">{{ entry.name }}</code>
          <span class="text-surface-300">: {{ entry.description }}</span>
        </div>
      </div>
    </details>
  </div>
</template>
