class RaceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RaceError";
  }
}

export class SDKNotInitializedError extends RaceError {
  constructor() {
    super("Backend SDK is not initialized");
    this.name = "SDKNotInitializedError";
  }
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
