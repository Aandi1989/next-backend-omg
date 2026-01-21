export type RowValues = {
  // key = column.key, value = user's data
  [columnKey: string]: unknown;
};

export type Row = {
  id: string;
  tableId: string;

  values: RowValues;
};
