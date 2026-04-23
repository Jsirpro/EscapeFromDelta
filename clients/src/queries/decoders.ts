import { SCHEMA_VERSION } from "../types";

export interface AccountInfoLike {
  owner: string;
  data: unknown;
}

export class DecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DecodeError";
  }
}

export function assertOwner(account: AccountInfoLike, expectedOwner: string): void {
  if (account.owner !== expectedOwner) {
    throw new DecodeError("wrong-owner");
  }
}

export function assertObject(value: unknown): asserts value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new DecodeError("malformed-account-data");
  }
}

export function assertSchemaVersion(value: Record<string, unknown>): void {
  if (value.schemaVersion !== SCHEMA_VERSION) {
    throw new DecodeError("unknown-schema-version");
  }
}

export function decodeJsonAccount<T>(
  account: AccountInfoLike,
  expectedOwner: string,
  refine: (value: Record<string, unknown>) => T,
): T {
  assertOwner(account, expectedOwner);
  assertObject(account.data);
  assertSchemaVersion(account.data);
  return refine(account.data);
}

export function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new DecodeError(`invalid-${field}`);
  }
  return value;
}

export function requireNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new DecodeError(`invalid-${field}`);
  }
  return value;
}

export function requireArray(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new DecodeError(`invalid-${field}`);
  }
  return value;
}
