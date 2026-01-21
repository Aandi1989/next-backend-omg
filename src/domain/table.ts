import { Column } from "./column";
import { Row } from "./row";

export type Table = {
  id: string;
  name: string;

  columns: Column[];
  rows: Row[];
};
