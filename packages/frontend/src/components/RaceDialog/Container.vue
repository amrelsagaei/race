<script setup lang="ts">
import type { RaceBaseRequest, RaceRunConfig } from "shared";
import { onBeforeUnmount, onMounted, ref } from "vue";

import ConfigForm from "./ConfigForm.vue";
import ResultsView from "./ResultsView.vue";
import { useRaceRun } from "./useRaceRun";

import { isHttp2Enabled } from "@/services/http2";
import { openRun } from "@/services/selection";
import type { FrontendSDK } from "@/types";

defineOptions({ name: "RaceDialog" });

const props = defineProps<{ sdk: FrontendSDK; baseRequest: RaceBaseRequest }>();
const emit = defineEmits<{ close: [] }>();

const { phase, rows, summary, errorMessage, running, start, stop, reset } =
  useRaceRun(props.sdk);

const http2Enabled = ref(false);

async function loadHttp2(): Promise<void> {
  http2Enabled.value = await isHttp2Enabled(props.sdk);
}

onMounted(() => {
  void loadHttp2();
});

function onRun(payload: { config: RaceRunConfig; raw: string }): void {
  void start({ ...props.baseRequest, raw: payload.raw }, payload.config);
}

function onInvalid(): void {
  props.sdk.window.showToast("Fill in every field before running", {
    variant: "warning",
  });
}

function openHistory(): void {
  openRun.value = summary.value;
  props.sdk.navigation.goTo("/race");
  emit("close");
}

onBeforeUnmount(() => {
  stop();
});
</script>

<template>
  <div class="plugin--race">
    <div
      :class="[
        'flex flex-col min-h-0',
        phase === 'config'
          ? 'w-[720px] max-w-[92vw]'
          : 'w-[1080px] h-[680px] max-w-[92vw] max-h-[86vh]',
      ]"
    >
      <ConfigForm
        v-show="phase === 'config'"
        :base-request="props.baseRequest"
        :http2-enabled="http2Enabled"
        @run="onRun"
        @invalid="onInvalid"
      />
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
  </div>
</template>
