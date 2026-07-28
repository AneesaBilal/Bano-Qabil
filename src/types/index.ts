export * from "./database.types";

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
}

export interface ApiError {
  message: string;
  code?: string;
}
