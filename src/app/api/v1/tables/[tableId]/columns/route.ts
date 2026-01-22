import { NextResponse } from "next/server";
import { tableService } from "@/services";
import { Column, ColumnType } from "@/domain/column";


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

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
        return NextResponse.json(
            { error: "BAD_REQUEST", message: "Request body must be a JSON object" },
            { status: 400 }
        );
    }

    const { key, title, type, required, enumValues, rules } = body as any;

    if (typeof key !== "string" || key.trim() === "") {
        return NextResponse.json(
            { error: "BAD_REQUEST", message: `"key" must be a non-empty string` },
            { status: 400 }
        );
    }

    if (typeof title !== "string" || title.trim() === "") {
        return NextResponse.json(
            { error: "BAD_REQUEST", message: `"title" must be a non-empty string` },
            { status: 400 }
        );
    }

    const allowedTypes: ColumnType[] = ["string", "number", "enum", "timestamp", "object", "array"];
    if (typeof type !== "string" || !allowedTypes.includes(type as ColumnType)) {
        return NextResponse.json(
            { error: "BAD_REQUEST", message: `"type" must be one of: ${allowedTypes.join(", ")}` },
            { status: 400 }
        );
    }

    if (typeof required !== "boolean") {
        return NextResponse.json(
            { error: "BAD_REQUEST", message: `"required" must be boolean` },
            { status: 400 }
        );
    }

    if (type === "enum") {
        if (!Array.isArray(enumValues) || enumValues.some((v) => typeof v !== "string")) {
            return NextResponse.json(
                { error: "BAD_REQUEST", message: `"enumValues" must be string[] for enum columns` },
                { status: 400 }
            );
        }
    }

    if (rules !== undefined) {
        if (typeof rules !== "object" || rules === null || Array.isArray(rules)) {
            return NextResponse.json(
                { error: "BAD_REQUEST", message: `"rules" must be an object` },
                { status: 400 }
            );
        }

        const { min, max, regex, ...rest } = rules as any;

        if (Object.keys(rest).length > 0) {
            return NextResponse.json(
                {
                    error: "BAD_REQUEST",
                    message: `"rules" contains unsupported fields`,
                },
                { status: 400 }
            );
        }

        if (min !== undefined && typeof min !== "number") {
            return NextResponse.json(
                { error: "BAD_REQUEST", message: `"rules.min" must be a number` },
                { status: 400 }
            );
        }

        if (max !== undefined && typeof max !== "number") {
            return NextResponse.json(
                { error: "BAD_REQUEST", message: `"rules.max" must be a number` },
                { status: 400 }
            );
        }

        if (regex !== undefined && typeof regex !== "string") {
            return NextResponse.json(
                { error: "BAD_REQUEST", message: `"rules.regex" must be a string` },
                { status: 400 }
            );
        }
    }

    const columnType = type as ColumnType;

    const column: Column = {
        key,
        title,
        type: columnType,
        required,
        enumValues: type === "enum" ? enumValues : undefined,
        rules,
    };

    const res = tableService.addColumn(tableId, column);

    if (!res.ok && res.error === "TABLE_NOT_FOUND") {
        return NextResponse.json(
            { error: "TABLE_NOT_FOUND", message: `Table "${tableId}" not found` },
            { status: 404 }
        );
    }

    if (!res.ok && res.error === "COLUMN_EXISTS") {
        return NextResponse.json(
            { error: "COLUMN_EXISTS", message: `Column "${key}" already exists` },
            { status: 409 }
        );
    }

    return NextResponse.json(
        { ok: true, column },
        { status: 201 }
    );
}




