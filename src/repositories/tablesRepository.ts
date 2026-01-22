import { Column } from "@/domain/column";
import { Row, RowValues } from "@/domain/row";

export type TableRecord = {
  id: string;
  name: string;
  columns: Column[];
  rows: Row[];
};

export interface TablesRepository {
  getTable(id: string): TableRecord | null;
  listColumns(tableId: string): Column[] | null;
  listRows(tableId: string): Row[] | null;
  addRow(tableId: string, values: RowValues): Row | null;
  updateCell(
    tableId: string,
    rowId: string,
    columnKey: string,
    value: unknown
  ): Row | null;
  deleteRow(tableId: string, rowId: string): boolean | null;
  addColumn(tableId: string, column: Column): "ok" | "TABLE_NOT_FOUND" | "COLUMN_EXISTS";
  deleteColumn(
    tableId: string,
    columnKey: string
  ): "ok" | "TABLE_NOT_FOUND" | "COLUMN_NOT_FOUND";
  reset(): void;
}
