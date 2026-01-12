import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

// Services
import { EncryptionService } from './services/encryption.service';
import { FileUploadService } from './services/file-upload.service';
import { CacheService } from './services/cache.service';
import { EmailService } from './services/email.service';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { OrganizationContextGuard } from './guards/organization-context.guard';

// Decorators
import { CurrentUser } from './decorators/current-user.decorator';
import { CurrentOrganization } from './decorators/current-organization.decorator';
import { Roles } from './decorators/roles.decorator';

// Interceptors
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

// Filters
import { GlobalExceptionFilter } from './filters/global-exception.filter';

// Pipes
import { ValidationPipe } from './pipes/validation.pipe';

// DTOs
import { PaginationDto } from './dto/pagination.dto';
import { ApiResponseDto } from './dto/api-response.dto';

@Module({
  imports: [
    WinstonModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        level: configService.get<string>('logging.level', 'info'),
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        ),
        defaultMeta: { service: 'virtual-ai-cfo' },
        transports: [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple(),
            ),
          }),
          new winston.transports.File({
            filename: configService.get<string>('logging.file', 'logs/app.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
        ],
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    // Services
    EncryptionService,
    FileUploadService,
    CacheService,
    EmailService,
    
    // Guards
    JwtAuthGuard,
    RolesGuard,
    OrganizationContextGuard,
    
    // Decorators (as providers for dependency injection)
    CurrentUser,
    CurrentOrganization,
    Roles,
    
    // Interceptors
    TransformInterceptor,
    LoggingInterceptor,
    
    // Filters
    GlobalExceptionFilter,
    
    // Pipes
    ValidationPipe,
  ],
  exports: [
    // Services
    EncryptionService,
    FileUploadService,
    CacheService,
    EmailService,
    
    // Guards
    JwtAuthGuard,
    RolesGuard,
    OrganizationContextGuard,
    
    // Decorators
    CurrentUser,
    CurrentOrganization,
    Roles,
    
    // Interceptors
    TransformInterceptor,
    LoggingInterceptor,
    
    // Filters
    GlobalExceptionFilter,
    
    // Pipes
    ValidationPipe,
    
    // DTOs
    PaginationDto,
    ApiResponseDto,
  ],
})
export class CommonModule {}