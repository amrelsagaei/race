<script setup lang="ts">
import { ref } from "vue";

defineOptions({ name: "RaceFieldHint" });

defineProps<{ text: string }>();

const open = ref(false);
</script>

<template>
  <span class="relative inline-flex items-center">
    <i
      class="fas fa-circle-info cursor-help text-surface-500 hover:text-surface-300"
      tabindex="0"
      @mouseenter="open = true"
      @mouseleave="open = false"
      @focus="open = true"
      @blur="open = false"
    />
    <span
      v-if="open"
      class="absolute left-4 top-5 z-50 w-64 rounded border border-surface-700 bg-surface-900 p-2 text-xs font-normal normal-case leading-snug text-surface-200 shadow-lg"
    >
      {{ text }}
    </span>
  </span>
</template>
