<script setup lang="ts">
import ConfirmDialog from "primevue/confirmdialog";

import { RunDetail } from "@/components/RunDetail";
import { RunList } from "@/components/RunList";
import { openRun } from "@/services/selection";

defineOptions({ name: "RaceApp" });
</script>

<template>
  <div class="h-full flex flex-col min-h-0">
    <ConfirmDialog />
    <div class="flex-1 min-h-0">
      <RunDetail
        v-if="openRun !== undefined"
        :key="openRun.id"
        :summary="openRun"
        @back="openRun = undefined"
        @deleted="openRun = undefined"
      />
      <RunList v-else @open="openRun = $event" />
    </div>
  </div>
</template>
