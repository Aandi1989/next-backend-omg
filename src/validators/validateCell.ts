import { Column } from "@/domain/column";

export type ValidationErrorCode =
  | "REQUIRED"
  | "TYPE_MISMATCH"
  | "ENUM"
  | "TIMESTAMP_ISO8601"
  | "RULE_MIN"
  | "RULE_MAX"
  | "RULE_REGEX"
  | "UNKNOWN_FIELD"

export type ValidationError = {
  field: string; // column.key
  code: ValidationErrorCode;
  message: string;

  // addicional data to debug/reply
  expectedType?: string;
  actualType?: string;
  allowed?: string[];
  min?: number;
  max?: number;
  regex?: string;
};

function getActualType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value; // "string" | "number" | "boolean" | "object" | "undefined" | ...
}

function isIso8601String(value: string): boolean {
  // Simple validation for ISO-8601
  // Example: 2026-01-21T10:20:30Z or 2026-01-21T10:20:30.123Z or с +02:00
  const iso =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,9})?(Z|[+\-]\d{2}:\d{2})$/;
  return iso.test(value);
}

export function validateCell(column: Column, value: unknown): ValidationError | null {
  const field = column.key;

  // required
  if (value === undefined || value === null) {
    if (column.required) {
      return {
        field,
        code: "REQUIRED",
        message: `Поле "${field}" обязательно`,
      };
    }
    return null; // not required and empty — ок
  }

  // type checks
  switch (column.type) {
    case "string": {
      if (typeof value !== "string") {
        return {
          field,
          code: "TYPE_MISMATCH",
          message: `The field "${field}" must be a string`,
          expectedType: "string",
          actualType: getActualType(value),
        };
      }
      break;
    }

    case "number": {
      if (typeof value !== "number" || Number.isNaN(value)) {
        return {
          field,
          code: "TYPE_MISMATCH",
          message: `The field "${field}" must be a number`,
          expectedType: "number",
          actualType: getActualType(value),
        };
      }
      break;
    }

    case "enum": {
      if (typeof value !== "string") {
        return {
          field,
          code: "TYPE_MISMATCH",
          message: `The field "${field}" must be a string (enum)`,
          expectedType: "string(enum)",
          actualType: getActualType(value),
        };
      }
      const allowed = column.enumValues ?? [];
      if (!allowed.includes(value)) {
        return {
          field,
          code: "ENUM",
          message: `The field "${field}" has unexceptable value`,
          allowed,
        };
      }
      break;
    }

    case "timestamp": {
      if (typeof value !== "string") {
        return {
          field,
          code: "TYPE_MISMATCH",
          message: `The field "${field}" must be a string ISO-8601`,
          expectedType: "ISO-8601 string",
          actualType: getActualType(value),
        };
      }
      if (!isIso8601String(value)) {
        return {
          field,
          code: "TIMESTAMP_ISO8601",
          message: `The field "${field}" must be a string ISO-8601`,
        };
      }
      break;
    }

    case "object": {
      if (typeof value !== "object" || Array.isArray(value)) {
        return {
          field,
          code: "TYPE_MISMATCH",
          message: `The field "${field}" must be JSON-object`,
          expectedType: "object",
          actualType: getActualType(value),
        };
      }
      break;
    }

    case "array": {
      if (!Array.isArray(value)) {
        return {
          field,
          code: "TYPE_MISMATCH",
          message: `The field "${field}" must be JSON-array`,
          expectedType: "array",
          actualType: getActualType(value),
        };
      }
      break;
    }
  }

  // rules: min/max для number, regex для string
  if (column.rules) {
    if (column.type === "number" && typeof value === "number") {
      if (column.rules.min !== undefined && value < column.rules.min) {
        return {
          field,
          code: "RULE_MIN",
          message: `The field "${field}" must be ≥ ${column.rules.min}`,
          min: column.rules.min,
        };
      }
      if (column.rules.max !== undefined && value > column.rules.max) {
        return {
          field,
          code: "RULE_MAX",
          message: `The field "${field}"must be ≤ ${column.rules.max}`,
          max: column.rules.max,
        };
      }
    }

    if (column.type === "string" && typeof value === "string") {
      if (column.rules.regex) {
        const re = new RegExp(column.rules.regex);
        if (!re.test(value)) {
          return {
            field,
            code: "RULE_REGEX",
            message: `The field "${field}" does not match the format`,
            regex: column.rules.regex,
          };
        }
      }
    }
  }

  return null;
}
