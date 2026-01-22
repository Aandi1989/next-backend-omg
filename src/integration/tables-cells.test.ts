import { PATCH } from "@/app/api/v1/tables/[tableId]/rows/[rowId]/cells/route";
import { addRow, resetInMemoryDb } from "@/services/inMemoryDb";

describe("PATCH /api/v1/tables/:tableId/rows/:rowId/cells", () => {
  beforeEach(() => {
    resetInMemoryDb();
  });

  test("+ PATCH updates a single cell with valid input data", async () => {
    const row = addRow("demo", {
      name: "cell test",
      price: 10,
      status: "NEW",
      createdAt: "2024-01-01T00:00:00Z",
    });

    const body = { price: 55 };
    const req = new Request(
      `http://localhost/api/v1/tables/demo/rows/${row.id}/cells`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }
    );
    const ctx = {
      params: Promise.resolve({ tableId: "demo", rowId: row.id }),
    } as const;

    const res = await PATCH(req, ctx);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.id).toBe(row.id);
    expect(json.price).toBe(55);
  });

  test("- PATCH failed cell update with invalid data", async () => {
    const row = addRow("demo", {
      name: "cell test",
      price: 10,
      status: "NEW",
      createdAt: "2024-01-01T00:00:00Z",
    });

    const body = { price: "invalid" };
    const req = new Request(
      `http://localhost/api/v1/tables/demo/rows/${row.id}/cells`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }
    );
    const ctx = {
      params: Promise.resolve({ tableId: "demo", rowId: row.id }),
    } as const;

    const res = await PATCH(req, ctx);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("VALIDATION_ERROR");
  });
});
