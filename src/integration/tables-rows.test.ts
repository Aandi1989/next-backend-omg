import { GET as GET_ROWS, POST } from "@/app/api/v1/tables/[tableId]/rows/route";
import { DELETE as DELETE_ROW } from "@/app/api/v1/tables/[tableId]/rows/[rowId]/route";
import { addRow, resetInMemoryDb } from "@/services/inMemoryDb";

describe("POST /api/v1/tables/:tableId/rows", () => {
  beforeEach(() => {
    resetInMemoryDb();
  });

  test("+ POST creates a row when payload is valid", async () => {
    const payload = {
      name: "Test row",
      price: 42,
      status: "NEW",
      createdAt: "2024-01-01T10:00:00Z",
    };

    const req = new Request("http://localhost/api/v1/tables/demo/rows", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    const ctx = { params: Promise.resolve({ tableId: "demo" }) } as const;

    const res = await POST(req, ctx);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.ok).toBe(true);
    expect(json.row.id).toBeDefined();
    expect(json.row.values).toMatchObject(payload);
  });

  test("- POST with missing required field", async () => {
    const payload = {
      price: 5,
    };

    const req = new Request("http://localhost/api/v1/tables/demo/rows", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    const ctx = { params: Promise.resolve({ tableId: "demo" }) } as const;

    const res = await POST(req, ctx);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("VALIDATION_ERROR");
    expect(json.details.some((err: any) => err.field === "name")).toBe(true);
  });

  test("- POST request with invalid input data", async () => {
    const payload = {
      name: 123,
      price: "wrong",
      status: "WRONG",
      createdAt: "not-a-date",
    };

    const req = new Request("http://localhost/api/v1/tables/demo/rows", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    const ctx = { params: Promise.resolve({ tableId: "demo" }) } as const;

    const res = await POST(req, ctx);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("VALIDATION_ERROR");
    expect(json.details.length).toBeGreaterThanOrEqual(2);
  });
});

describe("GET /api/v1/tables/:tableId/rows", () => {
  beforeEach(() => {
    resetInMemoryDb();
  });

  test("+ GET returns rows", async () => {
    addRow("demo", {
      name: "list row",
      price: 20,
      status: "NEW",
      createdAt: "2024-01-01T00:00:00Z",
    });

    const req = new Request("http://localhost/api/v1/tables/demo/rows");
    const ctx = { params: Promise.resolve({ tableId: "demo" }) } as const;

    const res = await GET_ROWS(req, ctx);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBeGreaterThan(0);
  });

  test("- GET returns 404 for unknown table", async () => {
    const req = new Request("http://localhost/api/v1/tables/unknown/rows");
    const ctx = { params: Promise.resolve({ tableId: "unknown" }) } as const;

    const res = await GET_ROWS(req, ctx);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("TABLE_NOT_FOUND");
  });
});

describe("DELETE /api/v1/tables/:tableId/rows/:rowId", () => {
  beforeEach(() => {
    resetInMemoryDb();
  });

  test("+ DELETE removes existing row", async () => {
    const row = addRow("demo", {
      name: "row to delete",
      price: 10,
      status: "NEW",
      createdAt: "2024-01-01T00:00:00Z",
    });

    const req = new Request(
      `http://localhost/api/v1/tables/demo/rows/${row.id}`,
      { method: "DELETE" }
    );
    const ctx = {
      params: Promise.resolve({ tableId: "demo", rowId: row.id }),
    } as const;

    const res = await DELETE_ROW(req, ctx);

    expect(res.status).toBe(204);
  });

  test("- DELETE returns 404 when row does not exist", async () => {
    const req = new Request(
      "http://localhost/api/v1/tables/demo/rows/fakeRowId",
      { method: "DELETE" }
    );
    const ctx = {
      params: Promise.resolve({ tableId: "demo", rowId: "fakeRowId" }),
    } as const;

    const res = await DELETE_ROW(req, ctx);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("ROW_NOT_FOUND");
  });
});
