import { validateRow } from "./validateRow";
import { Column } from "@/domain/column";

describe("validateRow", () => {
  test("ok=true when all fields are valid", () => {
    const columns: Column[] = [
      { key: "name", title: "Name", type: "string", required: true },
      { key: "price", title: "Price", type: "number", required: true },
    ];

    const result = validateRow(columns, { name: "Book", price: 10 });

    expect(result.ok).toBe(true);
  });

  test("ok=false and contains errors for required + extra field", () => {
    const columns: Column[] = [
      { key: "name", title: "Name", type: "string", required: true },
    ];

    const result = validateRow(columns, { extra: 123 });

    expect(result.ok).toBe(false);

    if (result.ok === false) {
      // must have REQUIRED error for "name"
      expect(result.errors.some((e) => e.field === "name" && e.code === "REQUIRED")).toBe(true);

      // must have error for unknown field "extra"
      expect(result.errors.some((e) => e.field === "extra")).toBe(true);
    }
  });
});
