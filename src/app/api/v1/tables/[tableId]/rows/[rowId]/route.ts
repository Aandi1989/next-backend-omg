import { NextResponse } from "next/server";
import { tableService } from "@/services";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ tableId: string; rowId: string }> }
) {
  const { tableId, rowId } = await ctx.params;

  const result = tableService.deleteRow(tableId, rowId);
  if (!result.ok && result.error === "TABLE_NOT_FOUND") {
    return NextResponse.json(
      { error: "TABLE_NOT_FOUND", message: `Table "${tableId}" not found` },
      { status: 404 }
    );
  }

  if (!result.ok && result.error === "ROW_NOT_FOUND") {
    return NextResponse.json(
      { error: "ROW_NOT_FOUND", message: `Row "${rowId}" not found` },
      { status: 404 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
