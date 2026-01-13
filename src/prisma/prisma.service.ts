import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Soft delete middleware
  async enableSoftDelete() {
    this.$use(async (params, next) => {
      if (params.action === 'delete') {
        params.action = 'update';
        params.args['data'] = { deletedAt: new Date() };
      }
      if (params.action === 'deleteMany') {
        params.action = 'updateMany';
        if (params.args.data !== undefined) {
          params.args.data['deletedAt'] = new Date();
        } else {
          params.args['data'] = { deletedAt: new Date() };
        }
      }
      if (params.action === 'findMany' || params.action === 'findUnique') {
        if (params.args.where) {
          if (params.args.where.deletedAt === undefined) {
            params.args.where['deletedAt'] = null;
          }
        } else {
          params.args['where'] = { deletedAt: null };
        }
      }
      return next(params);
    });
  }

  // Organization context for multi-tenancy
  async withOrganizationContext<T>(
    organizationId: string,
    callback: () => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      // Set organization context for this transaction
      await tx.$executeRaw`SET app.current_organization_id = ${organizationId}`;
      return callback();
    });
  }
}