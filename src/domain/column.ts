export type ColumnType =
  | "string"
  | "number"
  | "enum"
  | "timestamp"
  | "object"
  | "array";

export type ColumnRules = {
  // basic rules (so far minimal)
  min?: number;
  max?: number;
  regex?: string; // string for compiling then into RegExp
};

export type Column = {
  key: string;          // unique key in the table, for instance "status"
  title: string;        // readable name
  type: ColumnType;
  required: boolean;

  // only for enum
  enumValues?: string[];

  // for additional rules
  rules?: ColumnRules;
};
