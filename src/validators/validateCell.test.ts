import { validateCell } from "./validateCell";
import { Column } from "@/domain/column";

describe("validateCell", () => {
  test("returns REQUIRED error when value is missing and column.required=true", () => {
    const col: Column = {
      key: "name",
      title: "Name",
      type: "string",
      required: true,
    };

    const err = validateCell(col, undefined);

    expect(err).not.toBeNull();
    expect(err?.code).toBe("REQUIRED");
    expect(err?.field).toBe("name");
  });

  test("returns TYPE_MISMATCH when number column receives string", () => {
    const col: Column = {
      key: "price",
      title: "Price",
      type: "number",
      required: true,
    };

    const err = validateCell(col, "100");

    expect(err).not.toBeNull();
    expect(err?.code).toBe("TYPE_MISMATCH");
    expect(err?.field).toBe("price");
  });

  test("returns ENUM error when enum value is not allowed", () => {
    const col: Column = {
      key: "status",
      title: "Status",
      type: "enum",
      required: true,
      enumValues: ["NEW", "PAID"],
    };

    const err = validateCell(col, "CANCELED");

    expect(err).not.toBeNull();
    expect(err?.code).toBe("ENUM");
    expect(err?.field).toBe("status");
    expect(err?.allowed).toEqual(["NEW", "PAID"]);
  });

  test("returns TIMESTAMP_ISO8601 when timestamp is not ISO-8601", () => {
    const col: Column = {
      key: "createdAt",
      title: "Created At",
      type: "timestamp",
      required: true,
    };

    const err = validateCell(col, "21-01-2026 10:00");

    expect(err).not.toBeNull();
    expect(err?.code).toBe("TIMESTAMP_ISO8601");
    expect(err?.field).toBe("createdAt");
  });
});
