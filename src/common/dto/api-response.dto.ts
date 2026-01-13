import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({ description: 'Response status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Response data' })
  data?: T;

  @ApiProperty({ description: 'Response metadata' })
  meta?: {
    timestamp: string;
    path: string;
    method: string;
    requestId?: string;
    version?: string;
  };

  @ApiProperty({ description: 'Error details' })
  error?: {
    code?: string;
    details?: any;
    validationErrors?: Array<{
      field: string;
      message: string;
    }>;
  };

  constructor(
    success: boolean,
    message: string,
    data?: T,
    meta?: any,
    error?: any,
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.meta = meta;
    this.error = error;
  }

  static success<T>(
    message: string = 'Success',
    data?: T,
    meta?: any,
  ): ApiResponseDto<T> {
    return new ApiResponseDto(true, message, data, meta);
  }

  static error<T>(
    message: string = 'Error',
    error?: any,
    data?: T,
  ): ApiResponseDto<T> {
    return new ApiResponseDto(false, message, data, undefined, error);
  }
}