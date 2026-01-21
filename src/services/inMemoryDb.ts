import { Column } from "@/domain/column";
import { Row, RowValues } from "@/domain/row";

export type TableRecord = {
  id: string;
  name: string;
  columns: Column[];
  rows: Row[];
};


// Imitation of DB just for the test
const tables = new Map<string, TableRecord>();

// Create one example table, to check if POST works 
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

export function getTable(tableId: string): TableRecord | null {
  return tables.get(tableId) ?? null;
}

export function addRow(tableId: string, values: RowValues): Row {
  const table = tables.get(tableId);
  if (!table) {
    throw new Error(`Table "${tableId}" not found`);
  }

  const row: Row = {
    id: crypto.randomUUID(),
    tableId,
    values,
  };

  table.rows.push(row);
  return row;
}


export function updateCell(
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


export function deleteRow(tableId: string, rowId: string): boolean | null {
  const table = tables.get(tableId);
  if (!table) return null;

  const before = table.rows.length;
  table.rows = table.rows.filter((r) => r.id !== rowId);

  return table.rows.length !== before;
}


export type AddColumnResult =
  | { ok: true }
  | { ok: false; error: "TABLE_NOT_FOUND" | "COLUMN_EXISTS" };

export function addColumn(tableId: string, column: Column): AddColumnResult {
  const table = tables.get(tableId);
  if (!table) return { ok: false, error: "TABLE_NOT_FOUND" };

  if (table.columns.some((c) => c.key === column.key)) {
    return { ok: false, error: "COLUMN_EXISTS" };
  }

  table.columns.push(column);
  return { ok: true };
}


export type DeleteColumnResult =
  | { ok: true }
  | { ok: false; error: "TABLE_NOT_FOUND" | "COLUMN_NOT_FOUND" };

export function deleteColumn(
  tableId: string,
  columnKey: string
): DeleteColumnResult {
  const table = tables.get(tableId);
  if (!table) return { ok: false, error: "TABLE_NOT_FOUND" };

  const before = table.columns.length;
  table.columns = table.columns.filter((c) => c.key !== columnKey);

  if (table.columns.length === before) {
    return { ok: false, error: "COLUMN_NOT_FOUND" };
  }

  // Remove value from all rows
  for (const row of table.rows) {
    delete row.values[columnKey];
  }

  return { ok: true };
}

