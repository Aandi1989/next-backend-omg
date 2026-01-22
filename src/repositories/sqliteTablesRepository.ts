import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { Column } from "@/domain/column";
import { Row, RowValues } from "@/domain/row";
import { TableRecord, TablesRepository } from "./tablesRepository";

type ColumnRow = {
  key: string;
  title: string;
  type: string;
  required: number;
  enum_values: string | null;
  rules: string | null;
};

type TableRow = {
  id: string;
  name: string;
};

type RowRow = {
  id: string;
  table_id: string;
  values_json: string;
};

export class SqliteTablesRepository implements TablesRepository {
  private db: Database.Database;

  constructor(dbFilePath = "data/app.db") {
    const dir = path.dirname(dbFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.db = new Database(dbFilePath);
    this.db.pragma("foreign_keys = ON");
    this.initialize();
  }

  private initialize() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tables (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS columns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_id TEXT NOT NULL,
        key TEXT NOT NULL,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        required INTEGER NOT NULL,
        enum_values TEXT,
        rules TEXT,
        UNIQUE(table_id, key),
        FOREIGN KEY(table_id) REFERENCES tables(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS rows (
        id TEXT PRIMARY KEY,
        table_id TEXT NOT NULL,
        values_json TEXT NOT NULL,
        FOREIGN KEY(table_id) REFERENCES tables(id) ON DELETE CASCADE
      );
    `);

    const count = this.db.prepare("SELECT COUNT(*) as count FROM tables").get() as { count: number };
    if (count.count === 0) {
      this.seed();
    }
  }

  private seed() {
    const insertTable = this.db.prepare("INSERT INTO tables (id, name) VALUES (?, ?)");
    insertTable.run("demo", "Demo table");

    const insertColumn = this.db.prepare(`
      INSERT INTO columns (table_id, key, title, type, required, enum_values, rules)
      VALUES (@table_id, @key, @title, @type, @required, @enum_values, @rules)
    `);

    const columns: Column[] = [
      { key: "name", title: "Name", type: "string", required: true },
      { key: "price", title: "Price", type: "number", required: true, rules: { min: 0 } },
      { key: "status", title: "Status", type: "enum", required: true, enumValues: ["NEW", "PAID"] },
      { key: "createdAt", title: "Created At", type: "timestamp", required: true },
      { key: "meta", title: "Meta", type: "object", required: false },
      { key: "tags", title: "Tags", type: "array", required: false },
    ];

    const toJson = (value: unknown) => (value === undefined ? null : JSON.stringify(value));

    for (const col of columns) {
      insertColumn.run({
        table_id: "demo",
        key: col.key,
        title: col.title,
        type: col.type,
        required: col.required ? 1 : 0,
        enum_values: toJson(col.enumValues),
        rules: toJson(col.rules),
      });
    }
  }

  private mapColumns(rows: ColumnRow[]): Column[] {
    return rows.map((row) => ({
      key: row.key,
      title: row.title,
      type: row.type as Column["type"],
      required: Boolean(row.required),
      enumValues: row.enum_values ? (JSON.parse(row.enum_values) as string[]) : undefined,
      rules: row.rules ? (JSON.parse(row.rules) as Column["rules"]) : undefined,
    }));
  }

  private mapRows(rows: RowRow[]): Row[] {
    return rows.map((row) => ({
      id: row.id,
      tableId: row.table_id,
      values: JSON.parse(row.values_json) as RowValues,
    }));
  }

  getTable(id: string): TableRecord | null {
    const table = this.db.prepare("SELECT id, name FROM tables WHERE id = ?").get(id) as TableRow | undefined;
    if (!table) return null;

    const columns = this.db
      .prepare("SELECT key, title, type, required, enum_values, rules FROM columns WHERE table_id = ?")
      .all(id) as ColumnRow[];
    const rows = this.db
      .prepare("SELECT id, table_id, values_json FROM rows WHERE table_id = ?")
      .all(id) as RowRow[];

    return {
      id: table.id,
      name: table.name,
      columns: this.mapColumns(columns),
      rows: this.mapRows(rows),
    };
  }

  listColumns(tableId: string): Column[] | null {
    const table = this.getTable(tableId);
    return table ? table.columns : null;
  }

  listRows(tableId: string): Row[] | null {
    const table = this.getTable(tableId);
    return table ? table.rows : null;
  }

  addRow(tableId: string, values: RowValues): Row | null {
    const table = this.db.prepare("SELECT id FROM tables WHERE id = ?").get(tableId) as TableRow | undefined;
    if (!table) return null;

    const id = crypto.randomUUID();
    this.db
      .prepare("INSERT INTO rows (id, table_id, values_json) VALUES (?, ?, ?)")
      .run(id, tableId, JSON.stringify(values));

    return { id, tableId, values };
  }

  updateCell(tableId: string, rowId: string, columnKey: string, value: unknown): Row | null {
    const row = this.db
      .prepare("SELECT id, table_id, values_json FROM rows WHERE table_id = ? AND id = ?")
      .get(tableId, rowId) as RowRow | undefined;
    if (!row) return null;

    const parsed = JSON.parse(row.values_json) as RowValues;
    parsed[columnKey] = value;

    this.db
      .prepare("UPDATE rows SET values_json = ? WHERE id = ?")
      .run(JSON.stringify(parsed), rowId);

    return { id: rowId, tableId, values: parsed };
  }

  deleteRow(tableId: string, rowId: string): boolean | null {
    const table = this.db.prepare("SELECT id FROM tables WHERE id = ?").get(tableId) as TableRow | undefined;
    if (!table) return null;

    const result = this.db.prepare("DELETE FROM rows WHERE id = ? AND table_id = ?").run(rowId, tableId);
    return result.changes > 0;
  }

  addColumn(tableId: string, column: Column): "ok" | "TABLE_NOT_FOUND" | "COLUMN_EXISTS" {
    const table = this.db.prepare("SELECT id FROM tables WHERE id = ?").get(tableId) as TableRow | undefined;
    if (!table) return "TABLE_NOT_FOUND";

    const existing = this.db
      .prepare("SELECT 1 FROM columns WHERE table_id = ? AND key = ?")
      .get(tableId, column.key);
    if (existing) return "COLUMN_EXISTS";

    this.db
      .prepare(
        `INSERT INTO columns (table_id, key, title, type, required, enum_values, rules)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        tableId,
        column.key,
        column.title,
        column.type,
        column.required ? 1 : 0,
        column.enumValues ? JSON.stringify(column.enumValues) : null,
        column.rules ? JSON.stringify(column.rules) : null
      );

    return "ok";
  }

  deleteColumn(
    tableId: string,
    columnKey: string
  ): "ok" | "TABLE_NOT_FOUND" | "COLUMN_NOT_FOUND" {
    const table = this.db.prepare("SELECT id FROM tables WHERE id = ?").get(tableId) as TableRow | undefined;
    if (!table) return "TABLE_NOT_FOUND";

    const result = this.db
      .prepare("DELETE FROM columns WHERE table_id = ? AND key = ?")
      .run(tableId, columnKey);

    if (result.changes === 0) {
      return "COLUMN_NOT_FOUND";
    }

    const rows = this.db
      .prepare("SELECT id, table_id, values_json FROM rows WHERE table_id = ?")
      .all(tableId) as RowRow[];
    const update = this.db.prepare("UPDATE rows SET values_json = ? WHERE id = ?");

    for (const row of rows) {
      const values = JSON.parse(row.values_json) as RowValues;
      if (columnKey in values) {
        delete values[columnKey];
        update.run(JSON.stringify(values), row.id);
      }
    }

    return "ok";
  }

  reset(): void {
    this.db.exec(`
      DELETE FROM rows;
      DELETE FROM columns;
      DELETE FROM tables;
    `);
    this.seed();
  }
}
