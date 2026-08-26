<script setup lang="ts">
import Card from "primevue/card";

defineOptions({ name: "RacePageBody" });

const { scroll = false } = defineProps<{ scroll?: boolean }>();
</script>

<template>
  <Card
    class="flex-1 min-h-0"
    :pt="{
      root: { style: 'display: flex; flex-direction: column; height: 100%;' },
      body: { class: 'flex-1 p-0 flex flex-col min-h-0' },
      content: {
        class: scroll
          ? 'flex-1 flex flex-col overflow-hidden min-h-0'
          : 'flex-1 flex flex-col min-h-0',
      },
    }"
  >
    <template #content>
      <slot />
    </template>
  </Card>
</template>
