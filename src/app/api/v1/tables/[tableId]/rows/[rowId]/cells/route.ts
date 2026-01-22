import { NextResponse } from "next/server";
import { tableService } from "@/services";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ tableId: string; rowId: string }> }
) {
  const { tableId, rowId } = await ctx.params;

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

  const result = tableService.updateCell(tableId, rowId, columnKey, value);

  if (!result.ok) {
    if (result.error === "TABLE_NOT_FOUND") {
      return NextResponse.json(
        { error: "TABLE_NOT_FOUND", message: `Table "${tableId}" not found` },
        { status: 404 }
      );
    }
    if (result.error === "ROW_NOT_FOUND") {
      return NextResponse.json(
        { error: "ROW_NOT_FOUND", message: `Row "${rowId}" not found` },
        { status: 404 }
      );
    }
    if (result.error === "COLUMN_NOT_FOUND") {
      return NextResponse.json(
        { error: "COLUMN_NOT_FOUND", message: `Column "${columnKey}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        message: "Incorrect input data",
        details: result.details,
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      id: result.row.id,
      ...result.row.values,
    },
    { status: 200 }
  );
}
