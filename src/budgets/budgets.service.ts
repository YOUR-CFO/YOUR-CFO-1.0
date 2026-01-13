import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/services/cache.service';
import { EmailService } from '../common/services/email.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BudgetsService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private emailService: EmailService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(organizationId: string) {
    const cacheKey = `budgets:${organizationId}`;
    
    // Try to get from cache
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const budgets = await this.prisma.budget.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      include: {
        category: true,
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add spent amount calculation
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await this.calculateSpentAmount(organizationId, budget);
        const percentageUsed = budget.amount.toNumber() > 0 ? (spent / budget.amount.toNumber()) * 100 : 0;
        
        return {
          ...budget,
          spent,
          percentageUsed: Math.round(percentageUsed * 100) / 100,
          remaining: budget.amount.toNumber() - spent,
        };
      }),
    );

    // Cache for 30 minutes
    await this.cacheService.set(cacheKey, JSON.stringify(budgetsWithSpent), 1800);

    return budgetsWithSpent;
  }

  async findOne(organizationId: string, id: string) {
    const budget = await this.prisma.budget.findFirst({
      where: {
        id,
        organizationId,
        isActive: true,
      },
      include: {
        category: true,
      },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    const spent = await this.calculateSpentAmount(organizationId, budget);
    const percentageUsed = budget.amount.toNumber() > 0 ? (spent / budget.amount.toNumber()) * 100 : 0;

    return {
      ...budget,
      spent,
      percentageUsed: Math.round(percentageUsed * 100) / 100,
      remaining: budget.amount.toNumber() - spent,
    };
  }

  async create(organizationId: string, createBudgetDto: {
    name: string;
    description?: string;
    amount: number;
    currency?: string;
    type: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
    periodStart: Date;
    periodEnd: Date;
    alertThreshold?: number;
    categoryId?: string;
  }) {
    // If categoryId is provided, verify it belongs to the organization
    if (createBudgetDto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: createBudgetDto.categoryId,
          organizationId,
          isActive: true,
        },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    // Check if budget with same name already exists
    const existingBudget = await this.prisma.budget.findFirst({
      where: {
        name: createBudgetDto.name,
        organizationId,
        isActive: true,
      },
    });

    if (existingBudget) {
      throw new ConflictException('Budget with this name already exists');
    }

    // Validate period dates
    if (createBudgetDto.periodStart >= createBudgetDto.periodEnd) {
      throw new ConflictException('Period start date must be before end date');
    }

    const budget = await this.prisma.budget.create({
      data: {
        ...createBudgetDto,
        amount: createBudgetDto.amount,
        currency: createBudgetDto.currency || 'USD',
        alertThreshold: createBudgetDto.alertThreshold || 80,
        organizationId,
      },
      include: {
        category: true,
      },
    });

    // Clear cache
    await this.cacheService.del(`budgets:${organizationId}`);

    // Emit budget created event
    this.eventEmitter.emit('budget.created', {
      organizationId,
      budgetId: budget.id,
      name: budget.name,
      amount: budget.amount,
      periodStart: budget.periodStart,
      periodEnd: budget.periodEnd,
    });

    return budget;
  }

  async update(organizationId: string, id: string, updateBudgetDto: {
    name?: string;
    description?: string;
    amount?: number;
    currency?: string;
    type?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
    periodStart?: Date;
    periodEnd?: Date;
    alertThreshold?: number;
    categoryId?: string;
  }) {
    // Verify budget belongs to organization
    const existingBudget = await this.prisma.budget.findFirst({
      where: {
        id,
        organizationId,
        isActive: true,
      },
    });

    if (!existingBudget) {
      throw new NotFoundException('Budget not found');
    }

    // If categoryId is being updated, verify it belongs to the organization
    if (updateBudgetDto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: updateBudgetDto.categoryId,
          organizationId,
          isActive: true,
        },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    // Check for name conflicts (if name is being updated)
    if (updateBudgetDto.name) {
      const nameConflict = await this.prisma.budget.findFirst({
        where: {
          name: updateBudgetDto.name,
          organizationId,
          isActive: true,
          NOT: { id },
        },
      });

      if (nameConflict) {
        throw new ConflictException('Budget with this name already exists');
      }
    }

    // Validate period dates (if both are provided)
    if (updateBudgetDto.periodStart && updateBudgetDto.periodEnd) {
      if (updateBudgetDto.periodStart >= updateBudgetDto.periodEnd) {
        throw new ConflictException('Period start date must be before end date');
      }
    }

    const budget = await this.prisma.budget.update({
      where: { id },
      data: updateBudgetDto,
      include: {
        category: true,
      },
    });

    // Clear cache
    await this.cacheService.del(`budgets:${organizationId}`);

    // Emit budget updated event
    this.eventEmitter.emit('budget.updated', {
      organizationId,
      budgetId: budget.id,
      name: budget.name,
      amount: budget.amount,
    });

    return budget;
  }

  async delete(organizationId: string, id: string) {
    // Verify budget belongs to organization
    const budget = await this.prisma.budget.findFirst({
      where: {
        id,
        organizationId,
        isActive: true,
      },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    // Soft delete
    await this.prisma.budget.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    // Clear cache
    await this.cacheService.del(`budgets:${organizationId}`);

    // Emit budget deleted event
    this.eventEmitter.emit('budget.deleted', {
      organizationId,
      budgetId: id,
      name: budget.name,
    });

    return { message: 'Budget deleted successfully' };
  }

  async checkBudgetAlerts(organizationId: string) {
    const budgets = await this.findAll(organizationId);
    const alerts = [];

    for (const budget of budgets) {
      if (budget.percentageUsed >= budget.alertThreshold) {
        alerts.push({
          budgetId: budget.id,
          budgetName: budget.name,
          percentageUsed: budget.percentageUsed,
          alertThreshold: budget.alertThreshold,
          spent: budget.spent,
          budgetAmount: budget.amount,
        });

        // Send email notification
        try {
          const organization = await this.prisma.organization.findUnique({
            where: { id: organizationId },
          });

          // Get users with finance manager role or higher
          const financeManagers = await this.prisma.userOrganization.findMany({
            where: {
              organizationId,
              role: {
                name: {
                  in: ['Owner', 'Finance Manager'],
                },
              },
              isActive: true,
            },
            include: {
              user: true,
            },
          });

          for (const manager of financeManagers) {
            await this.emailService.sendBudgetAlertEmail(
              manager.user.email,
              organization.name,
              budget.name,
              budget.spent,
              budget.amount.toNumber(),
              budget.percentageUsed,
            );
          }
        } catch (error) {
          console.error('Failed to send budget alert email:', error);
        }
      }
    }

    return alerts;
  }

  private async calculateSpentAmount(organizationId: string, budget: any): Promise<number> {
    const whereClause = {
      organizationId,
      isActive: true,
      date: {
        gte: budget.periodStart,
        lte: budget.periodEnd,
      },
    };

    // If budget has a specific category, filter by that category
    if (budget.categoryId) {
      whereClause['categoryId'] = budget.categoryId;
    }

    const result = await this.prisma.transaction.aggregate({
      where: whereClause,
      _sum: { amount: true },
    });

    return result._sum.amount?.toNumber() || 0;
  }

  async getBudgetTrends(organizationId: string, categoryId?: string) {
    const whereClause = {
      organizationId,
      isActive: true,
      ...(categoryId && { categoryId }),
    };

    const budgets = await this.prisma.budget.findMany({
      where: whereClause,
      orderBy: { periodStart: 'desc' },
      take: 12,
    });

    const trends = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await this.calculateSpentAmount(organizationId, budget);
        const percentageUsed = budget.amount.toNumber() > 0 ? (spent / budget.amount.toNumber()) * 100 : 0;

        return {
          budgetId: budget.id,
          name: budget.name,
          periodStart: budget.periodStart,
          periodEnd: budget.periodEnd,
          allocated: budget.amount.toNumber(),
          spent,
          percentageUsed: Math.round(percentageUsed * 100) / 100,
          remaining: budget.amount.toNumber() - spent,
        };
      }),
    );

    return trends;
  }
}