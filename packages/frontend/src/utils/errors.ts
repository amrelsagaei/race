const FRIENDLY: Array<[RegExp, string]> = [
  [/^Unknown run:/, "The run was removed while it was still going"],
  [
    /TaskInProgressUserError/,
    "Caido is already running another replay task, wait for it to finish",
  ],
  [
    /Invalid string length/,
    "The captured traffic was too large to store, try fewer requests per burst",
  ],
];

export function getErrorMessage(error: unknown): string {
  return toFriendly(error instanceof Error ? error.message : String(error));
}

export function toFriendly(message: string): string {
  const match = FRIENDLY.find(([pattern]) => pattern.test(message));
  return match === undefined ? message : match[1];
}
