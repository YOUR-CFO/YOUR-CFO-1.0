import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

// Core modules
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { RolesModule } from './roles/roles.module';

// Financial modules
import { TransactionsModule } from './transactions/transactions.module';
import { CategoriesModule } from './categories/categories.module';
import { BudgetsModule } from './budgets/budgets.module';
import { ReportsModule } from './reports/reports.module';

// AI and integrations
import { AiModule } from './ai/ai.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { NotificationsModule } from './notifications/notifications.module';

// Common modules
import { CommonModule } from './common/common.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';

// Guards and interceptors
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { OrganizationContextGuard } from './common/guards/organization-context.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

// Filters
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

// Config
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB) || 0,
      },
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 100,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),
    
    // Core modules
    PrismaModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    RolesModule,
    
    // Financial modules
    TransactionsModule,
    CategoriesModule,
    BudgetsModule,
    ReportsModule,
    
    // AI and integrations
    AiModule,
    IntegrationsModule,
    NotificationsModule,
    
    // Common modules
    CommonModule,
    AuditLogsModule,
  ],
  providers: [
    // Global guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: OrganizationContextGuard,
    },
    
    // Global interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    
    // Global filters
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}