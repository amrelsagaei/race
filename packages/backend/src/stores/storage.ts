import { access, mkdir, readFile, rename, rm, writeFile } from "fs/promises";
import path from "path";

import { requireSDK } from "../sdk";

function getBasePath(): string {
  return requireSDK().meta.path();
}

export function getProjectDir(projectId: string | undefined): string {
  return path.join(getBasePath(), "projects", projectId ?? "default");
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readJson<T>(filePath: string): Promise<T | undefined> {
  if (!(await exists(filePath))) {
    return undefined;
  }
  try {
    const data = await readFile(filePath, "utf-8");
    return JSON.parse(data) as T;
  } catch {
    return undefined;
  }
}

let writeSequence = 0;

export async function writeJson<T>(filePath: string, data: T): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  writeSequence += 1;
  const tempPath = `${filePath}.${writeSequence}.tmp`;
  try {
    await writeFile(tempPath, JSON.stringify(data, undefined, 2));
    await rename(tempPath, filePath);
  } catch (error) {
    await rm(tempPath, { force: true });
    throw error;
  }
}
