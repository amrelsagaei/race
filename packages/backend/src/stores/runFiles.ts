import path from "path";

import { type RaceGroup, RaceGroupSchema } from "shared";

import { assertRunId } from "../util/ids";

import { readJson, removeFile, writeJson } from "./storage";

export function indexPath(dir: string): string {
  return path.join(dir, "index.json");
}

export function configPath(dir: string, runId: string): string {
  assertRunId(runId);
  return path.join(dir, "runs", `${runId}.json`);
}

function groupPath(dir: string, runId: string, index: number): string {
  assertRunId(runId);
  return path.join(dir, "runs", `${runId}.g${index}.json`);
}

export async function writeGroup(
  dir: string,
  runId: string,
  group: RaceGroup,
): Promise<void> {
  await writeJson(groupPath(dir, runId, group.index), group);
}

export async function readGroups(
  dir: string,
  runId: string,
  count: number,
): Promise<RaceGroup[]> {
  const groups: RaceGroup[] = [];
  for (let index = 0; index < count; index++) {
    const raw = await readJson<unknown>(groupPath(dir, runId, index));
    const parsed = RaceGroupSchema.safeParse(raw);
    if (parsed.success) {
      groups.push(parsed.data);
    }
  }
  return groups;
}

export async function removeRunFiles(
  dir: string,
  runId: string,
  groupCount: number,
): Promise<void> {
  await removeFile(configPath(dir, runId));
  for (let index = 0; index < groupCount; index++) {
    await removeFile(groupPath(dir, runId, index));
  }
}
