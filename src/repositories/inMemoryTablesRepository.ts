import { Column } from "@/domain/column";
import { Row, RowValues } from "@/domain/row";
import { TableRecord, TablesRepository } from "./tablesRepository";

const tables = new Map<string, TableRecord>();

function seed() {
  const seedTableId = "demo";

  if (!tables.has(seedTableId)) {
    tables.set(seedTableId, {
      id: seedTableId,
      name: "Demo table",
      columns: [
        { key: "name", title: "Name", type: "string", required: true },
        { key: "price", title: "Price", type: "number", required: true, rules: { min: 0 } },
        { key: "status", title: "Status", type: "enum", required: true, enumValues: ["NEW", "PAID"] },
        { key: "createdAt", title: "Created At", type: "timestamp", required: true },
        { key: "meta", title: "Meta", type: "object", required: false },
        { key: "tags", title: "Tags", type: "array", required: false },
      ],
      rows: [],
    });
  }
}

seed();

export class InMemoryTablesRepository implements TablesRepository {
  getTable(id: string): TableRecord | null {
    return tables.get(id) ?? null;
  }

  listColumns(tableId: string): Column[] | null {
    return this.getTable(tableId)?.columns ?? null;
  }

  listRows(tableId: string): Row[] | null {
    return this.getTable(tableId)?.rows ?? null;
  }

  addRow(tableId: string, values: RowValues): Row | null {
    const table = tables.get(tableId);
    if (!table) return null;

    const row: Row = {
      id: crypto.randomUUID(),
      tableId,
      values,
    };

    table.rows.push(row);
    return row;
  }

  updateCell(
    tableId: string,
    rowId: string,
    columnKey: string,
    value: unknown
  ): Row | null {
    const table = tables.get(tableId);
    if (!table) return null;

    const row = table.rows.find((r) => r.id === rowId);
    if (!row) return null;

    row.values[columnKey] = value;
    return row;
  }

  deleteRow(tableId: string, rowId: string): boolean | null {
    const table = tables.get(tableId);
    if (!table) return null;

    const before = table.rows.length;
    table.rows = table.rows.filter((r) => r.id !== rowId);

    return table.rows.length !== before;
  }

  addColumn(tableId: string, column: Column): "ok" | "TABLE_NOT_FOUND" | "COLUMN_EXISTS" {
    const table = tables.get(tableId);
    if (!table) return "TABLE_NOT_FOUND";

    if (table.columns.some((c) => c.key === column.key)) {
      return "COLUMN_EXISTS";
    }

    table.columns.push(column);
    return "ok";
  }

  deleteColumn(
    tableId: string,
    columnKey: string
  ): "ok" | "TABLE_NOT_FOUND" | "COLUMN_NOT_FOUND" {
    const table = tables.get(tableId);
    if (!table) return "TABLE_NOT_FOUND";

    const before = table.columns.length;
    table.columns = table.columns.filter((c) => c.key !== columnKey);

    if (table.columns.length === before) {
      return "COLUMN_NOT_FOUND";
    }

    for (const row of table.rows) {
      delete row.values[columnKey];
    }

    return "ok";
  }

  reset(): void {
    tables.clear();
    seed();
  }
}
