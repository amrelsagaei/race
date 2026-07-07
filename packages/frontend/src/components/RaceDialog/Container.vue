<script setup lang="ts">
import type { RaceRunConfig, RaceSeed } from "shared";
import { onBeforeUnmount } from "vue";

import ConfigForm from "./ConfigForm.vue";
import ResultsView from "./ResultsView.vue";
import { useRaceRun } from "./useRaceRun";

import { resetRaceView } from "@/services/selection";
import type { FrontendSDK } from "@/types";

defineOptions({ name: "RaceDialog" });

const props = defineProps<{ sdk: FrontendSDK; seed: RaceSeed }>();
const emit = defineEmits<{ close: [] }>();

const { phase, rows, summary, errorMessage, running, start, stop, reset } =
  useRaceRun(props.sdk);

function onRun(payload: { config: RaceRunConfig; seedRaw: string }): void {
  void start({ ...props.seed, raw: payload.seedRaw }, payload.config);
}

function openHistory(): void {
  resetRaceView();
  props.sdk.navigation.goTo("/race");
  emit("close");
}

onBeforeUnmount(() => {
  stop();
});
</script>

<template>
  <div
    :class="[
      'flex flex-col min-h-0',
      phase === 'config'
        ? 'w-[720px] max-w-[92vw]'
        : 'w-[1080px] h-[680px] max-w-[92vw] max-h-[86vh]',
    ]"
  >
    <ConfigForm v-show="phase === 'config'" :seed="props.seed" @run="onRun" />
    <ResultsView
      v-if="phase !== 'config'"
      :sdk="props.sdk"
      :rows="rows"
      :summary="summary"
      :error="errorMessage"
      :running="running"
      @stop="stop"
      @again="reset"
      @history="openHistory"
    />
  </div>
</template>
