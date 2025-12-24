import { PageInfoDto } from './page-info.dto';

export class PaginatedResponseDto<T> {
  data: T[];
  total: number;
  pageInfo: PageInfoDto;

  constructor(data: T[], total: number, pageIndex: number, pageSize: number) {
    this.data = data;
    this.total = total;
    this.pageInfo = {
      pageIndex,
      pageSize,
      totalItems: total,
      totalPages: Math.ceil(total / pageSize) || 0,
    };
  }
}
