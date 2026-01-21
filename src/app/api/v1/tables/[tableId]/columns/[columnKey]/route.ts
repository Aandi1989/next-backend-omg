import { deleteColumn } from "@/services/inMemoryDb";
import { NextResponse } from "next/server";


export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ tableId: string; columnKey: string }> }
) {
  const { tableId, columnKey } = await ctx.params;

  const res = deleteColumn(tableId, columnKey);

  if (!res.ok && res.error === "TABLE_NOT_FOUND") {
    return NextResponse.json(
      { error: "TABLE_NOT_FOUND", message: `Table "${tableId}" not found` },
      { status: 404 }
    );
  }

  if (!res.ok && res.error === "COLUMN_NOT_FOUND") {
    return NextResponse.json(
      { error: "COLUMN_NOT_FOUND", message: `Column "${columnKey}" not found` },
      { status: 404 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
