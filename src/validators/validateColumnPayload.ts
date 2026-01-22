import { Column, ColumnType } from "@/domain/column";

export type ValidateColumnPayloadResult =
  | { ok: true; column: Column }
  | { ok: false; message: string };

export function validateColumnPayload(body: unknown): ValidateColumnPayloadResult {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, message: "Request body must be a JSON object" };
  }

  const { key, title, type, required, enumValues, rules } = body as Record<string, unknown>;

  if (typeof key !== "string" || key.trim() === "") {
    return { ok: false, message: `"key" must be a non-empty string` };
  }

  if (typeof title !== "string" || title.trim() === "") {
    return { ok: false, message: `"title" must be a non-empty string` };
  }

  const allowedTypes: ColumnType[] = ["string", "number", "enum", "timestamp", "object", "array"];
  if (typeof type !== "string" || !allowedTypes.includes(type as ColumnType)) {
    return {
      ok: false,
      message: `"type" must be one of: ${allowedTypes.join(", ")}`,
    };
  }

  if (typeof required !== "boolean") {
    return { ok: false, message: `"required" must be boolean` };
  }

  if (type === "enum") {
    if (!Array.isArray(enumValues) || enumValues.some((v) => typeof v !== "string")) {
      return {
        ok: false,
        message: `"enumValues" must be string[] for enum columns`,
      };
    }
  }

  if (rules !== undefined) {
    if (typeof rules !== "object" || rules === null || Array.isArray(rules)) {
      return { ok: false, message: `"rules" must be an object` };
    }

    const { min, max, regex, ...rest } = rules as Record<string, unknown>;

    if (Object.keys(rest).length > 0) {
      return {
        ok: false,
        message: `"rules" contains unsupported fields`,
      };
    }

    if (min !== undefined && typeof min !== "number") {
      return { ok: false, message: `"rules.min" must be a number` };
    }

    if (max !== undefined && typeof max !== "number") {
      return { ok: false, message: `"rules.max" must be a number` };
    }

    if (regex !== undefined && typeof regex !== "string") {
      return { ok: false, message: `"rules.regex" must be a string` };
    }
  }

  const column: Column = {
    key,
    title,
    type: type as ColumnType,
    required,
    enumValues: type === "enum" ? (enumValues as string[]) : undefined,
    rules: rules as Column["rules"],
  };

  return { ok: true, column };
}
