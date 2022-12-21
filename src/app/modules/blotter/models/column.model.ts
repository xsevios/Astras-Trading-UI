import { NzTableFilterList, NzTableSortFn, NzTableSortOrder } from 'ng-zorro-antd/table';

export interface Column<T, F> {
  id: string;
  name: string;
  // sorting
  sortOrder: NzTableSortOrder | null;
  sortFn: NzTableSortFn<T> | null;
  // search with test
  searchDescription?: string;
  searchFn: ((order: T, filter: F) => boolean) | null;
  isSearchVisible: boolean;
  hasSearch: boolean;
  // filter from existing values
  listOfFilter: NzTableFilterList;
  isFilterVisible: boolean;
  hasFilter: boolean;
  tooltip?: string;
  width?: number | null;
  minWidth?: number | null;
  order?: number | null;
}
