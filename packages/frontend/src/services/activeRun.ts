import { ref } from "vue";

const activeRunId = ref<string | undefined>(undefined);
const progress = ref(0);
let aborted = false;
let active = false;

export const activeRun = {
  activeRunId,
  progress,
  begin(): void {
    active = true;
    aborted = false;
    activeRunId.value = undefined;
    progress.value = 0;
  },
  setRunId(runId: string): void {
    activeRunId.value = runId;
  },
  reportProgress(): void {
    progress.value += 1;
  },
  abort(): void {
    aborted = true;
  },
  finish(): void {
    active = false;
    activeRunId.value = undefined;
    aborted = false;
  },
  isActive(): boolean {
    return active;
  },
  shouldAbort(): boolean {
    return aborted;
  },
};
