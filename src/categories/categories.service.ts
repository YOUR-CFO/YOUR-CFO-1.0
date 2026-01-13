import { Injectable, NotFoundException, ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/services/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(organizationId: string) {
    const cacheKey = `categories:${organizationId}`;
    
    // Try to get from cache
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const categories = await this.prisma.category.findMany({
      where: {
        organizationId,
        isActive: true,
        parentId: null, // Only root categories
      },
      include: {
        children: {
          where: { isActive: true },
          include: {
            children: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Cache for 1 hour
    await this.cacheService.set(cacheKey, JSON.stringify(categories), 3600);

    return categories;
  }

  async findOne(organizationId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        organizationId,
        isActive: true,
      },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
        },
        _count: {
          select: {
            transactions: true,
            budgets: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async create(organizationId: string, createCategoryDto: {
    name: string;
    description?: string;
    type: 'INCOME' | 'EXPENSE';
    icon?: string;
    color?: string;
    parentId?: string;
    isSystem?: boolean;
  }) {
    // If parentId is provided, verify it belongs to the organization
    if (createCategoryDto.parentId) {
      const parentCategory = await this.prisma.category.findFirst({
        where: {
          id: createCategoryDto.parentId,
          organizationId,
          isActive: true,
        },
      });

      if (!parentCategory) {
        throw new NotFoundException('Parent category not found');
      }
    }

    // Check if category with same name and type already exists
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        name: createCategoryDto.name,
        type: createCategoryDto.type,
        organizationId,
        isActive: true,
      },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name and type already exists');
    }

    const category = await this.prisma.category.create({
      data: {
        ...createCategoryDto,
        organizationId,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    // Clear cache
    await this.cacheService.del(`categories:${organizationId}`);

    // Emit category created event
    this.eventEmitter.emit('category.created', {
      organizationId,
      categoryId: category.id,
      name: category.name,
      type: category.type,
    });

    return category;
  }

  async update(organizationId: string, id: string, updateCategoryDto: {
    name?: string;
    description?: string;
    icon?: string;
    color?: string;
    parentId?: string;
  }) {
    // Verify category belongs to organization
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        id,
        organizationId,
        isActive: true,
      },
    });

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    // If parentId is being updated, verify it belongs to the organization
    if (updateCategoryDto.parentId) {
      const parentCategory = await this.prisma.category.findFirst({
        where: {
          id: updateCategoryDto.parentId,
          organizationId,
          isActive: true,
        },
      });

      if (!parentCategory) {
        throw new NotFoundException('Parent category not found');
      }

      // Prevent circular reference
      if (updateCategoryDto.parentId === id) {
        throw new HttpException('Category cannot be its own parent', HttpStatus.BAD_REQUEST);
      }
    }

    // Check for name conflicts
    if (updateCategoryDto.name) {
      const nameConflict = await this.prisma.category.findFirst({
        where: {
          name: updateCategoryDto.name,
          type: existingCategory.type,
          organizationId,
          isActive: true,
          NOT: { id },
        },
      });

      if (nameConflict) {
        throw new ConflictException('Category with this name and type already exists');
      }
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        parent: true,
        children: true,
      },
    });

    // Clear cache
    await this.cacheService.del(`categories:${organizationId}`);

    // Emit category updated event
    this.eventEmitter.emit('category.updated', {
      organizationId,
      categoryId: category.id,
      name: category.name,
    });

    return category;
  }

  async delete(organizationId: string, id: string) {
    // Verify category belongs to organization
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        organizationId,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            transactions: true,
            budgets: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if category has transactions, budgets, or children
    if (category._count.transactions > 0 || category._count.budgets > 0 || category._count.children > 0) {
      throw new ConflictException('Cannot delete category that has transactions, budgets, or subcategories');
    }

    // Soft delete
    await this.prisma.category.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    // Clear cache
    await this.cacheService.del(`categories:${organizationId}`);

    // Emit category deleted event
    this.eventEmitter.emit('category.deleted', {
      organizationId,
      categoryId: id,
      name: category.name,
    });

    return { message: 'Category deleted successfully' };
  }

  async getCategoryStats(organizationId: string, categoryId: string) {
    const category = await this.findOne(organizationId, categoryId);

    const [
      transactionStats,
      budgetStats,
      monthlyTrend,
    ] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: {
          categoryId,
          organizationId,
          isActive: true,
        },
        _sum: { amount: true },
        _count: { _all: true },
        _avg: { amount: true },
      }),
      this.prisma.budget.aggregate({
        where: {
          categoryId,
          organizationId,
          isActive: true,
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.transaction.groupBy({
        by: ['date'],
        where: {
          categoryId,
          organizationId,
          isActive: true,
        },
        _sum: { amount: true },
        orderBy: { date: 'desc' },
        take: 12,
      }),
    ]);

    return {
      category,
      transactions: {
        total: transactionStats._sum.amount?.toNumber() || 0,
        count: transactionStats._count._all,
        average: transactionStats._avg.amount?.toNumber() || 0,
      },
      budgets: {
        total: budgetStats._sum.amount?.toNumber() || 0,
        count: budgetStats._count._all,
      },
      monthlyTrend: monthlyTrend.map(trend => ({
        date: trend.date,
        total: trend._sum.amount?.toNumber() || 0,
      })),
    };
  }

  async getDefaultCategories() {
    return [
      // Income categories
      { name: 'Salary', type: 'INCOME', icon: '💰', color: '#10b981', isSystem: true },
      { name: 'Freelance', type: 'INCOME', icon: '💼', color: '#10b981', isSystem: true },
      { name: 'Investment', type: 'INCOME', icon: '📈', color: '#10b981', isSystem: true },
      { name: 'Business', type: 'INCOME', icon: '🏢', color: '#10b981', isSystem: true },
      { name: 'Other Income', type: 'INCOME', icon: '💵', color: '#10b981', isSystem: true },
      
      // Expense categories
      { name: 'Food & Dining', type: 'EXPENSE', icon: '🍔', color: '#ef4444', isSystem: true },
      { name: 'Transportation', type: 'EXPENSE', icon: '🚗', color: '#ef4444', isSystem: true },
      { name: 'Shopping', type: 'EXPENSE', icon: '🛍️', color: '#ef4444', isSystem: true },
      { name: 'Entertainment', type: 'EXPENSE', icon: '🎬', color: '#ef4444', isSystem: true },
      { name: 'Bills & Utilities', type: 'EXPENSE', icon: '💡', color: '#ef4444', isSystem: true },
      { name: 'Healthcare', type: 'EXPENSE', icon: '🏥', color: '#ef4444', isSystem: true },
      { name: 'Education', type: 'EXPENSE', icon: '📚', color: '#ef4444', isSystem: true },
      { name: 'Travel', type: 'EXPENSE', icon: '✈️', color: '#ef4444', isSystem: true },
      { name: 'Office Supplies', type: 'EXPENSE', icon: '📎', color: '#ef4444', isSystem: true },
      { name: 'Marketing', type: 'EXPENSE', icon: '📢', color: '#ef4444', isSystem: true },
      { name: 'Software', type: 'EXPENSE', icon: '💻', color: '#ef4444', isSystem: true },
      { name: 'Professional Services', type: 'EXPENSE', icon: '⚖️', color: '#ef4444', isSystem: true },
      { name: 'Insurance', type: 'EXPENSE', icon: '🛡️', color: '#ef4444', isSystem: true },
      { name: 'Taxes', type: 'EXPENSE', icon: '📄', color: '#ef4444', isSystem: true },
      { name: 'Other Expense', type: 'EXPENSE', icon: '💳', color: '#ef4444', isSystem: true },
    ];
  }

  async initializeDefaultCategories(organizationId: string) {
    const defaultCategories = await this.getDefaultCategories();
    const createdCategories = [];

    for (const categoryData of defaultCategories) {
      try {
        const category = await this.create(organizationId, categoryData);
        createdCategories.push(category);
      } catch (error) {
        console.log(`Default category ${categoryData.name} already exists or error:`, error.message);
      }
    }

    return createdCategories;
  }
}