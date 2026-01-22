import { SqliteTablesRepository } from "@/repositories/sqliteTablesRepository";
import { TableService } from "./tableService";

const tablesRepo = new SqliteTablesRepository();
export const tableService = new TableService(tablesRepo);

export function resetInMemoryDb() {
  tablesRepo.reset();
}
