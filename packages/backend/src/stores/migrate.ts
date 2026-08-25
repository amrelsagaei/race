import path from "path";

import { RACE_STORE_VERSION, RaceRunSchema, type RaceRunSummary } from "shared";

import { fileExists, readJson, removeFile, writeJson } from "./storage";

type LegacyFile = { runs: unknown[] };

export async function migrateLegacyStore(dir: string): Promise<void> {
  const indexPath = path.join(dir, "index.json");
  if (await fileExists(indexPath)) {
    return;
  }
  const legacyPath = path.join(dir, "runs.json");
  const legacy = await readJson<LegacyFile>(legacyPath);
  if (legacy === undefined) {
    return;
  }

  const items = Array.isArray(legacy.runs) ? legacy.runs : [];
  const summaries: RaceRunSummary[] = [];
  let dropped = 0;
  for (const item of items) {
    const parsed = RaceRunSchema.safeParse(item);
    if (!parsed.success) {
      dropped += 1;
      continue;
    }
    const run = parsed.data;
    await writeJson(path.join(dir, "runs", `${run.summary.id}.json`), {
      config: run.config,
      groups: run.groups,
    });
    summaries.push(run.summary);
  }

  await writeJson(indexPath, { version: RACE_STORE_VERSION, summaries });
  if (dropped === 0) {
    await removeFile(legacyPath);
  }
}
