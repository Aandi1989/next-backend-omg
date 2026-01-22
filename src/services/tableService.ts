import { Column } from "@/domain/column";
import { RowValues } from "@/domain/row";
import { TablesRepository } from "@/repositories/tablesRepository";
import { logger } from "@/lib/logger";
import { validateCell } from "@/validators/validateCell";
import { validateRow } from "@/validators/validateRow";

export class TableService {
  constructor(private readonly repo: TablesRepository) {}

  getColumns(tableId: string) {
    const table = this.repo.getTable(tableId);
    if (!table) {
      logger.warn("Table not found when reading columns", { tableId });
      return { ok: false as const, error: "TABLE_NOT_FOUND" } as const;
    }

    logger.info("Fetched table columns", { tableId });
    return {
      ok: true as const,
      tableId: table.id,
      columns: table.columns,
    };
  }

  addColumn(tableId: string, payload: Column) {
    const res = this.repo.addColumn(tableId, payload);
    if (res === "TABLE_NOT_FOUND") {
      logger.warn("Table not found when adding column", { tableId, columnKey: payload.key });
      return { ok: false as const, error: "TABLE_NOT_FOUND" } as const;
    }
    if (res === "COLUMN_EXISTS") {
      logger.warn("Column already exists", { tableId, columnKey: payload.key });
      return { ok: false as const, error: "COLUMN_EXISTS" } as const;
    }

    logger.info("Column added", { tableId, columnKey: payload.key });
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
      logger.warn("Table not found when fetching rows", { tableId });
      return { ok: false as const, error: "TABLE_NOT_FOUND" } as const;
    }

    logger.info("Fetched table rows", { tableId, rowsCount: table.rows.length });
    return {
      ok: true as const,
      rows: table.rows.map((r) => ({ id: r.id, ...r.values })),
    };
  }

  addRow(tableId: string, values: RowValues) {
    const table = this.repo.getTable(tableId);
    if (!table) {
      logger.warn("Table not found when adding row", { tableId });
      return { ok: false as const, error: "TABLE_NOT_FOUND" } as const;
    }

    const validation = validateRow(table.columns, values);
    if (!validation.ok) {
      logger.warn("Row validation failed", { tableId, errors: validation.errors });
      return {
        ok: false as const,
        error: "VALIDATION_ERROR" as const,
        details: validation.errors,
      };
    }

    const row = this.repo.addRow(tableId, values)!;
    logger.info("Row added", { tableId, rowId: row.id });

    return { ok: true as const, row };
  }

  deleteRow(tableId: string, rowId: string) {
    const table = this.repo.getTable(tableId);
    if (!table) {
      logger.warn("Table not found when deleting row", { tableId, rowId });
      return { ok: false as const, error: "TABLE_NOT_FOUND" } as const;
    }

    const deleted = this.repo.deleteRow(tableId, rowId);
    if (deleted === null) {
      logger.warn("Table not found during deleteRow operation", { tableId, rowId });
      return { ok: false as const, error: "TABLE_NOT_FOUND" } as const;
    }
    if (deleted === false) {
      logger.warn("Row not found during deleteRow operation", { tableId, rowId });
      return { ok: false as const, error: "ROW_NOT_FOUND" } as const;
    }

    logger.info("Row deleted", { tableId, rowId });
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
      logger.warn("Table not found when updating cell", { tableId, rowId, columnKey });
      return { ok: false as const, error: "TABLE_NOT_FOUND" } as const;
    }

    const column = table.columns.find((c) => c.key === columnKey);
    if (!column) {
      logger.warn("Column not found when updating cell", { tableId, rowId, columnKey });
      return { ok: false as const, error: "COLUMN_NOT_FOUND" } as const;
    }

    const err = validateCell(column, value);
    if (err) {
      logger.warn("Cell validation failed", { tableId, rowId, columnKey, error: err });
      return {
        ok: false as const,
        error: "VALIDATION_ERROR" as const,
        details: [err],
      };
    }

    const updated = this.repo.updateCell(tableId, rowId, columnKey, value);
    if (!updated) {
      logger.warn("Row not found when updating cell", { tableId, rowId, columnKey });
      return { ok: false as const, error: "ROW_NOT_FOUND" } as const;
    }

    logger.info("Cell updated", { tableId, rowId, columnKey });
    return { ok: true as const, row: updated };
  }

  reset() {
    this.repo.reset();
    logger.info("Tables repository reset");
  }
}
