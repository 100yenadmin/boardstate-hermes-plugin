/** Constant-time comparison for the per-spawn nonce and the operator secret. */

import { timingSafeEqual } from "node:crypto";

/** True only when `actual` equals `expected`; a missing value or a length mismatch is false. */
export function secretsEqual(actual: string | null | undefined, expected: string): boolean {
  if (typeof actual !== "string") return false;
  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);
  return (
    actualBytes.length === expectedBytes.length &&
    timingSafeEqual(actualBytes, expectedBytes)
  );
}
