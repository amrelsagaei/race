import {
  err,
  ok,
  type RaceGroup,
  RaceGroupSchema,
  type RaceRun,
  type RaceRunInput,
  RaceRunInputSchema,
  type RaceRunSummary,
  type Result,
  type RunStatus,
  RunStatusEnumSchema,
} from "shared";

import { getErrorMessage } from "../errors";
import { runStore } from "../stores";
import type { BackendSDK } from "../types";

export const apiListRuns = (_sdk: BackendSDK): Result<RaceRunSummary[]> =>
  ok(runStore.list());

export const apiGetRun = (
  _sdk: BackendSDK,
  runId: string,
): Result<RaceRun | undefined> => ok(runStore.get(runId));

export const apiPersistRun = async (
  _sdk: BackendSDK,
  input: RaceRunInput,
): Promise<Result<RaceRunSummary>> => {
  const parsed = RaceRunInputSchema.safeParse(input);
  if (!parsed.success) {
    return err("The race configuration failed validation");
  }
  try {
    return ok(await runStore.create(parsed.data));
  } catch (error) {
    return err(getErrorMessage(error));
  }
};

export const apiAppendGroup = async (
  _sdk: BackendSDK,
  runId: string,
  group: RaceGroup,
): Promise<Result<void>> => {
  const parsed = RaceGroupSchema.safeParse(group);
  if (!parsed.success) {
    return err("The race group failed validation");
  }
  try {
    await runStore.appendGroup(runId, parsed.data);
    return ok(undefined);
  } catch (error) {
    return err(getErrorMessage(error));
  }
};

export const apiUpdateStatus = async (
  _sdk: BackendSDK,
  runId: string,
  status: RunStatus,
): Promise<Result<RaceRunSummary>> => {
  const parsed = RunStatusEnumSchema.safeParse(status);
  if (!parsed.success) {
    return err("Invalid run status");
  }
  try {
    return ok(await runStore.updateStatus(runId, parsed.data));
  } catch (error) {
    return err(getErrorMessage(error));
  }
};

export const apiDeleteRun = async (
  _sdk: BackendSDK,
  runId: string,
): Promise<Result<void>> => {
  try {
    await runStore.remove(runId);
    return ok(undefined);
  } catch (error) {
    return err(getErrorMessage(error));
  }
};

export const apiClearRuns = async (_sdk: BackendSDK): Promise<Result<void>> => {
  try {
    await runStore.clear();
    return ok(undefined);
  } catch (error) {
    return err(getErrorMessage(error));
  }
};
