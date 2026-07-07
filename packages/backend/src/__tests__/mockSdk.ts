import { vi } from "vitest";

export function createMockSDK() {
  return {
    console: {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    },
    meta: {
      path: vi.fn().mockReturnValue("/tmp/race-test"),
    },
    api: {
      send: vi.fn(),
      register: vi.fn(),
    },
    projects: {
      getCurrent: vi.fn().mockResolvedValue(undefined),
    },
  };
}
