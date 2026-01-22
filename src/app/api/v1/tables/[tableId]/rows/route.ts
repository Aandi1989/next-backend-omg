import { NextResponse } from "next/server";
import { tableService } from "@/services";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ tableId: string }> }
) {
  const { tableId } = await ctx.params;

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

  const result = tableService.addRow(tableId, values);
  if (!result.ok) {
    if (result.error === "TABLE_NOT_FOUND") {
      return NextResponse.json(
        { error: "TABLE_NOT_FOUND", message: `Table "${tableId}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        message: "Invalid input data",
        details: result.details,
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      row: result.row,
    },
    { status: 201 }
  );
}



export async function GET(
  _req: Request,
  ctx: { params: Promise<{ tableId: string }> }
) {
  const { tableId } = await ctx.params;

  const result = tableService.getRows(tableId);
  if (!result.ok) {
    return NextResponse.json(
      { error: "TABLE_NOT_FOUND", message: `Table "${tableId}" not found` },
      { status: 404 }
    );
  }

  return NextResponse.json(result.rows, { status: 200 });
}
