import { NextResponse } from "next/server";
import { deleteRow, getTable } from "@/services/inMemoryDb";

export async function DELETE(
  _req: Request,
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

  const deleted = deleteRow(tableId, rowId);

  // deleted === null => table not found (уже проверил, но пока оставляю на всякий случай)
  if (deleted === null) {
    return NextResponse.json(
      { error: "TABLE_NOT_FOUND", message: `Table "${tableId}" not found` },
      { status: 404 }
    );
  }

  if (deleted === false) {
    return NextResponse.json(
      { error: "ROW_NOT_FOUND", message: `Row "${rowId}" not found` },
      { status: 404 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
