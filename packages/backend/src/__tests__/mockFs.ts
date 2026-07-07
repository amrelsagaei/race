import { vi } from "vitest";

const fileSystem = new Map<string, string>();

export function createMockFs() {
  fileSystem.clear();

  return {
    access: vi.fn((filePath: string) => {
      if (!fileSystem.has(filePath)) {
        throw new Error(`ENOENT: ${filePath}`);
      }
    }),
    readFile: vi.fn((filePath: string) => fileSystem.get(filePath)),
    writeFile: vi.fn((filePath: string, data: string) => {
      fileSystem.set(filePath, data);
    }),
    rename: vi.fn((oldPath: string, newPath: string) => {
      const content = fileSystem.get(oldPath);
      if (content !== undefined) {
        fileSystem.set(newPath, content);
        fileSystem.delete(oldPath);
      }
    }),
    mkdir: vi.fn(),
    rm: vi.fn((filePath: string) => {
      fileSystem.delete(filePath);
    }),
    _store: fileSystem,
  };
}
