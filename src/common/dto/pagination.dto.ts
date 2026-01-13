import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto {
  @ApiProperty({
    description: 'Page number',
    minimum: 1,
    maximum: 1000,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    description: 'Sort field',
    required: false,
  })
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiProperty({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
    required: false,
  })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Array of items' })
  data: T[];

  @ApiProperty({ description: 'Total number of items' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPrevPage: boolean;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
    this.hasNextPage = page < this.totalPages;
    this.hasPrevPage = page > 1;
  }
}