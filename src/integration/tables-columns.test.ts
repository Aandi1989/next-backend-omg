import { GET } from "@/app/api/v1/tables/[tableId]/columns/route";
import { POST } from "@/app/api/v1/tables/[tableId]/columns/route";
import { DELETE as DELETE_COLUMN } from "@/app/api/v1/tables/[tableId]/columns/[columnKey]/route";
import { resetInMemoryDb } from "@/services/inMemoryDb";

describe("GET /api/v1/tables/:tableId/columns", () => {
  beforeEach(() => {
    resetInMemoryDb();
  });

  test('+ GET returns columns meta data for the seeded table', async () => {
    const req = new Request("http://localhost/api/v1/tables/demo/columns");
    const ctx = { params: Promise.resolve({ tableId: "demo" }) } as const;

    const res = await GET(req, ctx);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.tableId).toBe("demo");
    expect(Array.isArray(json.columns)).toBe(true);
    expect(json.columns.length).toBeGreaterThan(0);
    expect(json.columns[0]).toHaveProperty("key");
  });

  test("- GET returns 404 when table does not exist", async () => {
    const req = new Request("http://localhost/api/v1/tables/fakeTableId/columns");
    const ctx = { params: Promise.resolve({ tableId: "fakeTableId" }) } as const;

    const res = await GET(req, ctx);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("TABLE_NOT_FOUND");
  });
});

describe("POST /api/v1/tables/:tableId/columns", () => {
  beforeEach(() => {
    resetInMemoryDb();
  });

  test("+ POST creates a new column", async () => {
    const body = {
      key: "description",
      title: "Description",
      type: "string",
      required: false,
    };

    const req = new Request("http://localhost/api/v1/tables/demo/columns", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const ctx = { params: Promise.resolve({ tableId: "demo" }) } as const;

    const res = await POST(req, ctx);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.ok).toBe(true);
    expect(json.column.key).toBe("description");
  });

  test("- POST fails when column key already exists", async () => {
    const body = {
      key: "name",
      title: "Duplicate",
      type: "string",
      required: true,
    };

    const req = new Request("http://localhost/api/v1/tables/demo/columns", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const ctx = { params: Promise.resolve({ tableId: "demo" }) } as const;

    const res = await POST(req, ctx);
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toBe("COLUMN_EXISTS");
  });

  test("- POST fails when payload is invalid", async () => {
    const body = {
      key: "",
      title: "",
      type: "unsupported",
      required: "nope",
    } as any;

    const req = new Request("http://localhost/api/v1/tables/demo/columns", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const ctx = { params: Promise.resolve({ tableId: "demo" }) } as const;

    const res = await POST(req, ctx);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("BAD_REQUEST");
  });
});

describe("DELETE /api/v1/tables/:tableId/columns/:columnKey", () => {
  beforeEach(() => {
    resetInMemoryDb();
  });

  test("+ DELETE removes a column", async () => {
    const req = new Request("http://localhost/api/v1/tables/demo/columns/status", {
      method: "DELETE",
    });
    const ctx = {
      params: Promise.resolve({ tableId: "demo", columnKey: "status" }),
    } as const;

    const res = await DELETE_COLUMN(req, ctx);

    expect(res.status).toBe(204);
  });

  test("- DELETE returns 404 for unknown column", async () => {
    const req = new Request("http://localhost/api/v1/tables/demo/columns/missing", {
      method: "DELETE",
    });
    const ctx = {
      params: Promise.resolve({ tableId: "demo", columnKey: "missing" }),
    } as const;

    const res = await DELETE_COLUMN(req, ctx);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("COLUMN_NOT_FOUND");
  });
});
