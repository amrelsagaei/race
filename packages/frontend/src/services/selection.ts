import type { RaceRunSummary } from "shared";
import { ref } from "vue";

export const openRun = ref<RaceRunSummary>();

export function resetRaceView(): void {
  openRun.value = undefined;
}
