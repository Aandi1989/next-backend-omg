import { NextResponse } from "next/server";
import { validateRow } from "@/validators/validateRow";
import { addRow, getTable } from "@/services/inMemoryDb";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ tableId: string }> }
) {
  const { tableId } = await ctx.params;

  const table = getTable(tableId);
  if (!table) {
    return NextResponse.json(
      { error: "TABLE_NOT_FOUND", message: `Table "${tableId}" not found` },
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

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json(
      {
        error: "BAD_REQUEST",
        message: "Request body must be a JSON object",
      },
      { status: 400 }
    );
  }

  const values = body as Record<string, unknown>;

  const validation = validateRow(table.columns, values);

  if (!validation.ok) {
    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        message: "Invalid input data",
        details: validation.errors,
      },
      { status: 400 }
    );
  }

  const row = addRow(tableId, values);

  return NextResponse.json(
    {
      ok: true,
      row,
    },
    { status: 201 }
  );
}



export async function GET(
  _req: Request,
  ctx: { params: Promise<{ tableId: string }> }
) {
  const { tableId } = await ctx.params;

  const table = getTable(tableId);
  if (!table) {
    return NextResponse.json(
      { error: "TABLE_NOT_FOUND", message: `Table "${tableId}" not found` },
      { status: 404 }
    );
  }

  const rows = table.rows.map((r) => ({
    id: r.id,
    ...r.values,
  }));

  return NextResponse.json(rows, { status: 200 });
}

