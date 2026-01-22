import { Column } from "@/domain/column";
import { Row, RowValues } from "@/domain/row";
import { TablesRepository } from "@/repositories/tablesRepository";
import { validateCell } from "@/validators/validateCell";
import { validateRow } from "@/validators/validateRow";

export class TableService {
  constructor(private readonly repo: TablesRepository) {}

  getColumns(tableId: string) {
    const table = this.repo.getTable(tableId);
    if (!table) {
      return { ok: false as const, error: "TABLE_NOT_FOUND" } as const;
    }

    return {
      ok: true as const,
      tableId: table.id,
      columns: table.columns,
    };
  }

  addColumn(tableId: string, payload: Column) {
    const res = this.repo.addColumn(tableId, payload);
    if (res === "TABLE_NOT_FOUND") {
      return { ok: false as const, error: "TABLE_NOT_FOUND" } as const;
    }
    if (res === "COLUMN_EXISTS") {
      return { ok: false as const, error: "COLUMN_EXISTS" } as const;
    }

    return { ok: true as const, column: payload };
  }

  deleteColumn(tableId: string, columnKey: string) {
    const res = this.repo.deleteColumn(tableId, columnKey);
    if (res === "TABLE_NOT_FOUND") {
      return { ok: false as const, error: "TABLE_NOT_FOUND" } as const;
    }
    if (res === "COLUMN_NOT_FOUND") {
      return { ok: false as const, error: "COLUMN_NOT_FOUND" } as const;
    }

    return { ok: true as const };
  }

  getRows(tableId: string) {
    const table = this.repo.getTable(tableId);
    if (!table) {
      return { ok: false as const, error: "TABLE_NOT_FOUND" } as const;
    }

    return {
      ok: true as const,
      rows: table.rows.map((r) => ({ id: r.id, ...r.values })),
    };
  }

  addRow(tableId: string, values: RowValues) {
    const table = this.repo.getTable(tableId);
    if (!table) {
      return { ok: false as const, error: "TABLE_NOT_FOUND" } as const;
    }

    const validation = validateRow(table.columns, values);
    if (!validation.ok) {
      return {
        ok: false as const,
        error: "VALIDATION_ERROR" as const,
        details: validation.errors,
      };
    }

    const row = this.repo.addRow(tableId, values)!;

    return { ok: true as const, row };
  }

  deleteRow(tableId: string, rowId: string) {
    const table = this.repo.getTable(tableId);
    if (!table) {
      return { ok: false as const, error: "TABLE_NOT_FOUND" } as const;
    }

    const deleted = this.repo.deleteRow(tableId, rowId);
    if (deleted === null) {
      return { ok: false as const, error: "TABLE_NOT_FOUND" } as const;
    }
    if (deleted === false) {
      return { ok: false as const, error: "ROW_NOT_FOUND" } as const;
    }

    return { ok: true as const };
  }

  updateCell(
    tableId: string,
    rowId: string,
    columnKey: string,
    value: unknown
  ) {
    const table = this.repo.getTable(tableId);
    if (!table) {
      return { ok: false as const, error: "TABLE_NOT_FOUND" } as const;
    }

    const column = table.columns.find((c) => c.key === columnKey);
    if (!column) {
      return { ok: false as const, error: "COLUMN_NOT_FOUND" } as const;
    }

    const err = validateCell(column, value);
    if (err) {
      return {
        ok: false as const,
        error: "VALIDATION_ERROR" as const,
        details: [err],
      };
    }

    const updated = this.repo.updateCell(tableId, rowId, columnKey, value);
    if (!updated) {
      return { ok: false as const, error: "ROW_NOT_FOUND" } as const;
    }

    return { ok: true as const, row: updated };
  }

  reset() {
    this.repo.reset();
  }
}
