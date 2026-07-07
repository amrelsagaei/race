<script setup lang="ts">
import ToggleSwitch from "primevue/toggleswitch";
import { computed } from "vue";

import ScriptEditor from "./ScriptEditor.vue";

defineOptions({ name: "RaceTransformPane" });

const model = defineModel<string>({ required: true });

const enabled = computed(() => model.value.trim() !== "");
function onToggle(value: boolean): void {
  if (!value) {
    model.value = "";
  }
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
      <div class="mt-2 space-y-1 rounded bg-surface-800 p-2 font-mono">
        <div>
          <code class="text-primary-400">input.raw</code>,
          <code class="text-primary-400">input.index</code>,
          <code class="text-primary-400">input.count</code>
        </div>
        <div>
          <code class="text-primary-400">forge(input.raw)</code>
          chainable editor, end with
          <code class="text-primary-400">.build()</code>
        </div>
        <div>
          <code class="text-primary-400">
            .method() .path() .setHeader() .addHeader() .removeHeader()
          </code>
        </div>
        <div>
          <code class="text-primary-400">
            .setQuery() .addQueryParam() .setCookie() .body() .setBodyParam()
          </code>
        </div>
        <div>
          <code class="text-primary-400">fixContentLength(raw)</code>
          recompute Content-Length
        </div>
      </div>
    </details>
  </div>
</template>
