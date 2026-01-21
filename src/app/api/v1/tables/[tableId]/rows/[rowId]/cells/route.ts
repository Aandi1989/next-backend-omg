import { NextResponse } from "next/server";
import { getTable, updateCell } from "@/services/inMemoryDb";
import { validateCell } from "@/validators/validateCell";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ tableId: string; rowId: string }> }
) {
  const { tableId, rowId } = await ctx.params;

  const table = getTable(tableId);
  if (!table) {
    return NextResponse.json(
      { error: "TABLE_NOT_FOUND", message: `Table "${tableId}" not found` },
      { status: 404 }
    );
  }

  const row = table.rows.find((r) => r.id === rowId);
  if (!row) {
    return NextResponse.json(
      { error: "ROW_NOT_FOUND", message: `Row "${rowId}" not found` },
      { status: 404 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "BAD_JSON", message: "Request body must be valid JSON" },
      { status: 400 }
    );
  }

  // Body must be an object with exactly ONE key
  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body) ||
    Object.keys(body).length !== 1
  ) {
    return NextResponse.json(
      {
        error: "BAD_REQUEST",
        message: "Body must contain exactly one field to update",
      },
      { status: 400 }
    );
  }

  const [columnKey] = Object.keys(body);
  const value = (body as Record<string, unknown>)[columnKey];

  const column = table.columns.find((c) => c.key === columnKey);
  if (!column) {
    return NextResponse.json(
      { error: "COLUMN_NOT_FOUND", message: `Column "${columnKey}" not found` },
      { status: 404 }
    );
  }

  const err = validateCell(column, value);
  if (err) {
    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        message: "Incorrect input data",
        details: [err],
      },
      { status: 400 }
    );
  }

  const updated = updateCell(tableId, rowId, columnKey, value);
  if (!updated) {
    return NextResponse.json(
      { error: "ROW_NOT_FOUND", message: `Row "${rowId}" not found` },
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      id: updated.id,
      ...updated.values,
    },
    { status: 200 }
  );
}
