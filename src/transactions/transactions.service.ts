import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/services/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaginationDto, PaginatedResponseDto } from '../common/dto/pagination.dto';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(organizationId: string, createTransactionDto: {
    amount: number;
    currency: string;
    description: string;
    notes?: string;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    status?: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
    date: Date;
    reference?: string;
    externalId?: string;
    attachment?: string;
    isRecurring?: boolean;
    recurringPattern?: string;
    categoryId: string;
    createdById: string;
  }) {
    // Verify category belongs to organization
    const category = await this.prisma.category.findFirst({
      where: {
        id: createTransactionDto.categoryId,
        organizationId: organizationId,
        isActive: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found or does not belong to organization');
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        ...createTransactionDto,
        organizationId,
      },
      include: {
        category: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Clear cache for organization transactions
    await this.cacheService.del(`transactions:${organizationId}:*`);

    // Emit transaction created event
    this.eventEmitter.emit('transaction.created', {
      organizationId,
      transactionId: transaction.id,
      amount: transaction.amount,
      type: transaction.type,
      categoryId: transaction.categoryId,
      createdById: transaction.createdById,
    });

    return transaction;
  }

  async findAll(organizationId: string, paginationDto: PaginationDto, filters?: {
    type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    status?: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
    categoryId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    amountMin?: number;
    amountMax?: number;
    search?: string;
  }) {
    const cacheKey = `transactions:${organizationId}:${JSON.stringify(paginationDto)}:${JSON.stringify(filters)}`;
    
    // Try to get from cache
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const where = {
      organizationId,
      isActive: true,
      ...(filters?.type && { type: filters.type }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.categoryId && { categoryId: filters.categoryId }),
      ...(filters?.dateFrom && { date: { gte: filters.dateFrom } }),
      ...(filters?.dateTo && { date: { lte: filters.dateTo } }),
      ...(filters?.amountMin && { amount: { gte: filters.amountMin } }),
      ...(filters?.amountMax && { amount: { lte: filters.amountMax } }),
      ...(filters?.search && {
        OR: [
          { description: { contains: filters.search, mode: 'insensitive' } },
          { notes: { contains: filters.search, mode: 'insensitive' } },
          { reference: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          category: true,
          createdBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { [paginationDto.sortBy]: paginationDto.sortOrder },
        skip: paginationDto.skip,
        take: paginationDto.limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    const result = new PaginatedResponseDto(transactions, total, paginationDto.page, paginationDto.limit);

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, JSON.stringify(result), 300);

    return result;
  }

  async findOne(organizationId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id,
        organizationId,
        isActive: true,
      },
      include: {
        category: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async update(organizationId: string, id: string, updateTransactionDto: {
    amount?: number;
    currency?: string;
    description?: string;
    notes?: string;
    type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    status?: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
    date?: Date;
    reference?: string;
    externalId?: string;
    attachment?: string;
    isRecurring?: boolean;
    recurringPattern?: string;
    categoryId?: string;
  }) {
    // Verify transaction belongs to organization
    const existingTransaction = await this.prisma.transaction.findFirst({
      where: {
        id,
        organizationId,
        isActive: true,
      },
    });

    if (!existingTransaction) {
      throw new NotFoundException('Transaction not found');
    }

    // If category is being updated, verify it belongs to organization
    if (updateTransactionDto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: updateTransactionDto.categoryId,
          organizationId: organizationId,
          isActive: true,
        },
      });

      if (!category) {
        throw new NotFoundException('Category not found or does not belong to organization');
      }
    }

    const transaction = await this.prisma.transaction.update({
      where: { id },
      data: updateTransactionDto,
      include: {
        category: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Clear cache
    await this.cacheService.del(`transactions:${organizationId}:*`);

    // Emit transaction updated event
    this.eventEmitter.emit('transaction.updated', {
      organizationId,
      transactionId: transaction.id,
      changes: updateTransactionDto,
    });

    return transaction;
  }

  async delete(organizationId: string, id: string) {
    // Verify transaction belongs to organization
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id,
        organizationId,
        isActive: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Soft delete
    await this.prisma.transaction.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    // Clear cache
    await this.cacheService.del(`transactions:${organizationId}:*`);

    // Emit transaction deleted event
    this.eventEmitter.emit('transaction.deleted', {
      organizationId,
      transactionId: id,
    });

    return { message: 'Transaction deleted successfully' };
  }

  async getTransactionSummary(organizationId: string, dateFrom?: Date, dateTo?: Date) {
    const where = {
      organizationId,
      isActive: true,
      ...(dateFrom && { date: { gte: dateFrom } }),
      ...(dateTo && { date: { lte: dateTo } }),
    };

    const [
      incomeStats,
      expenseStats,
      transferStats,
      monthlyTrend,
      categoryBreakdown,
    ] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { ...where, type: 'INCOME' },
        _sum: { amount: true },
        _count: { _all: true },
        _avg: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...where, type: 'EXPENSE' },
        _sum: { amount: true },
        _count: { _all: true },
        _avg: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...where, type: 'TRANSFER' },
        _sum: { amount: true },
        _count: { _all: true },
        _avg: { amount: true },
      }),
      this.prisma.transaction.groupBy({
        by: ['type'],
        where,
        _sum: { amount: true },
        _count: { _all: true },
        orderBy: { date: 'desc' },
      }),
      this.prisma.transaction.groupBy({
        by: ['categoryId'],
        where,
        _sum: { amount: true },
        _count: { _all: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
    ]);

    // Get category names for breakdown
    const categoryIds = categoryBreakdown.map(cb => cb.categoryId);
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, color: true, icon: true },
    });

    const categoryMap = new Map(categories.map(c => [c.id, c]));

    return {
      income: {
        total: incomeStats._sum.amount?.toNumber() || 0,
        count: incomeStats._count._all,
        average: incomeStats._avg.amount?.toNumber() || 0,
      },
      expenses: {
        total: expenseStats._sum.amount?.toNumber() || 0,
        count: expenseStats._count._all,
        average: expenseStats._avg.amount?.toNumber() || 0,
      },
      transfers: {
        total: transferStats._sum.amount?.toNumber() || 0,
        count: transferStats._count._all,
        average: transferStats._avg.amount?.toNumber() || 0,
      },
      netProfit: (incomeStats._sum.amount?.toNumber() || 0) - (expenseStats._sum.amount?.toNumber() || 0),
      categoryBreakdown: categoryBreakdown.map(cb => ({
        categoryId: cb.categoryId,
        categoryName: categoryMap.get(cb.categoryId)?.name || 'Unknown',
        categoryColor: categoryMap.get(cb.categoryId)?.color,
        categoryIcon: categoryMap.get(cb.categoryId)?.icon,
        total: cb._sum.amount?.toNumber() || 0,
        count: cb._count._all,
      })),
    };
  }

  async bulkCreate(organizationId: string, transactions: Array<{
    amount: number;
    currency: string;
    description: string;
    notes?: string;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    status?: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
    date: Date;
    reference?: string;
    externalId?: string;
    categoryId: string;
    createdById: string;
  }>) {
    const results = [];
    const errors = [];

    for (let i = 0; i < transactions.length; i++) {
      try {
        const transaction = await this.create(organizationId, transactions[i]);
        results.push({ index: i, transaction, success: true });
      } catch (error) {
        errors.push({
          index: i,
          error: error.message,
          success: false,
        });
      }
    }

    return {
      results,
      errors,
      total: transactions.length,
      successful: results.length,
      failed: errors.length,
    };
  }

  async importFromCSV(organizationId: string, csvData: any[], createdById: string) {
    const transactions = csvData.map(row => ({
      amount: parseFloat(row.amount) || 0,
      currency: row.currency || 'USD',
      description: row.description || '',
      notes: row.notes,
      type: row.type?.toUpperCase() as 'INCOME' | 'EXPENSE' | 'TRANSFER' || 'EXPENSE',
      status: row.status?.toUpperCase() as 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED' || 'COMPLETED',
      date: new Date(row.date) || new Date(),
      reference: row.reference,
      externalId: row.externalId,
      categoryId: row.categoryId,
      createdById,
    }));

    return this.bulkCreate(organizationId, transactions);
  }
}