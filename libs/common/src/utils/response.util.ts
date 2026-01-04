import { PaginatedResponseDto } from '../dto/paginated-response.dto';

/**
 * Creates a paginated response with a standardized format
 * @param data Array of items for the current page
 * @param total Total number of items across all pages
 * @param pageIndex Current page index (1-based)
 * @param pageSize Number of items per page
 * @returns PaginatedResponseDto instance
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  pageIndex: number,
  pageSize: number,
): PaginatedResponseDto<T> {
  return new PaginatedResponseDto(data, total, pageIndex, pageSize);
}
