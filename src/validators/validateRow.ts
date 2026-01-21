import { Column } from "@/domain/column";
import { RowValues } from "@/domain/row";
import { validateCell, ValidationError } from "./validateCell";

export type ValidateRowResult =
    | { ok: true }
    | { ok: false; errors: ValidationError[] };

export function validateRow(columns: Column[], values: RowValues): ValidateRowResult {
    const errors: ValidationError[] = [];

    // 1)  Validate each column defined field
    for (const column of columns) {
        const value = values[column.key];
        const error = validateCell(column, value);

        if (error) {
            errors.push(error);
        }
    }

    // 2) Forbid extra fields, that are nt defined in columns
    const allowedKeys = new Set(columns.map((c) => c.key));

    for (const key of Object.keys(values)) {
        if (!allowedKeys.has(key)) {
            errors.push({
                field: key,
                code:  "UNKNOWN_FIELD",
                message: `Field "${key}" is not defined in table columns`,
            });
        }
    }

    // final result
    if (errors.length > 0) {
        return { ok: false, errors };
    }

    return { ok: true };
}
