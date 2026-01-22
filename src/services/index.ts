import { InMemoryTablesRepository } from "@/repositories/inMemoryTablesRepository";
import { TableService } from "./tableService";

const tablesRepo = new InMemoryTablesRepository();
export const tableService = new TableService(tablesRepo);

export function resetInMemoryDb() {
  tablesRepo.reset();
}
