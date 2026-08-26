<script setup lang="ts">
import Card from "primevue/card";

defineOptions({ name: "RacePageHeader" });
</script>

<template>
  <Card
    class="h-fit"
    :pt="{
      body: { class: 'h-fit p-0 flex flex-col' },
      content: { class: 'h-fit flex flex-col' },
    }"
  >
    <template #content>
      <slot />
    </template>
  </Card>
</template>
