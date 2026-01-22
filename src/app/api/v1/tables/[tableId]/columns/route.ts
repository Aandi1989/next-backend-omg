import { NextResponse } from "next/server";
import { tableService } from "@/services";
import { validateColumnPayload } from "@/validators/validateColumnPayload";


export async function GET(
    _req: Request,
    ctx: { params: Promise<{ tableId: string }> }
) {
    const { tableId } = await ctx.params;

    const result = tableService.getColumns(tableId);
    if (!result.ok) {
        return NextResponse.json(
            { error: "TABLE_NOT_FOUND", message: `Table "${tableId}" not found` },
            { status: 404 }
        );
    }

    return NextResponse.json(
        {
            tableId: result.tableId,
            columns: result.columns,
        },
        { status: 200 }
    );
}



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

    const validation = validateColumnPayload(body);
    if (!validation.ok) {
        return NextResponse.json(
            { error: "BAD_REQUEST", message: validation.message },
            { status: 400 }
        );
    }

    const res = tableService.addColumn(tableId, validation.column);

    if (!res.ok && res.error === "TABLE_NOT_FOUND") {
        return NextResponse.json(
            { error: "TABLE_NOT_FOUND", message: `Table "${tableId}" not found` },
            { status: 404 }
        );
    }

    if (!res.ok && res.error === "COLUMN_EXISTS") {
        return NextResponse.json(
            { error: "COLUMN_EXISTS", message: `Column "${validation.column.key}" already exists` },
            { status: 409 }
        );
    }

    return NextResponse.json(
        { ok: true, column: validation.column },
        { status: 201 }
    );
}


