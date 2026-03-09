export interface PaginationMeta {
  currentPage: number;
  perPage: number;
  totalPages: number;
  totalData: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  details?: string[];
  error?: string;
  status?: number;
}

export interface ApiQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  filter?: Record<string, any>;
  [key: string]: any;
}
