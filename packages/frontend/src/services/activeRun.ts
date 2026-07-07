import { ref } from "vue";

const activeRunId = ref<string | undefined>(undefined);
let aborted = false;
let active = false;

export const activeRun = {
  activeRunId,
  begin(): void {
    active = true;
    aborted = false;
    activeRunId.value = undefined;
  },
  setRunId(runId: string): void {
    activeRunId.value = runId;
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
