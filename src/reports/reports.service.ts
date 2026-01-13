import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/services/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(organizationId: string, type?: string) {
    const whereClause = {
      organizationId,
      isActive: true,
      ...(type && { type }),
    };

    const reports = await this.prisma.report.findMany({
      where: whereClause,
      include: {
        generatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reports;
  }

  async findOne(organizationId: string, id: string) {
    const report = await this.prisma.report.findFirst({
      where: {
        id,
        organizationId,
        isActive: true,
      },
      include: {
        generatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  async generateProfitLossReport(organizationId: string, generatedById: string, filters: {
    startDate: Date;
    endDate: Date;
    categoryIds?: string[];
  }) {
    const cacheKey = `report:profit-loss:${organizationId}:${JSON.stringify(filters)}`;
    
    // Try to get from cache
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get income transactions
    const incomeTransactions = await this.prisma.transaction.findMany({
      where: {
        organizationId,
        type: 'INCOME',
        date: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
        isActive: true,
        ...(filters.categoryIds && { categoryId: { in: filters.categoryIds } }),
      },
      include: {
        category: true,
      },
      orderBy: { date: 'desc' },
    });

    // Get expense transactions
    const expenseTransactions = await this.prisma.transaction.findMany({
      where: {
        organizationId,
        type: 'EXPENSE',
        date: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
        isActive: true,
        ...(filters.categoryIds && { categoryId: { in: filters.categoryIds } }),
      },
      include: {
        category: true,
      },
      orderBy: { date: 'desc' },
    });

    // Calculate totals
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount.toNumber(), 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount.toNumber(), 0);
    const netProfit = totalIncome - totalExpenses;

    // Group by category
    const incomeByCategory = this.groupByCategory(incomeTransactions);
    const expensesByCategory = this.groupByCategory(expenseTransactions);

    const reportData = {
      period: {
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
      summary: {
        totalIncome,
        totalExpenses,
        netProfit,
        profitMargin: totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0,
      },
      income: {
        total: totalIncome,
        byCategory: incomeByCategory,
        transactions: incomeTransactions,
      },
      expenses: {
        total: totalExpenses,
        byCategory: expensesByCategory,
        transactions: expenseTransactions,
      },
      generatedAt: new Date(),
    };

    // Cache for 1 hour
    await this.cacheService.set(cacheKey, JSON.stringify(reportData), 3600);

    // Save report to database
    const report = await this.prisma.report.create({
      data: {
        name: `Profit & Loss Report (${filters.startDate.toISOString().split('T')[0]} - ${filters.endDate.toISOString().split('T')[0]})`,
        type: 'PROFIT_LOSS',
        description: `Profit and Loss report for period ${filters.startDate.toISOString().split('T')[0]} to ${filters.endDate.toISOString().split('T')[0]}`,
        filters: filters,
        data: reportData,
        organizationId,
        generatedById,
      },
    });

    // Emit report generated event
    this.eventEmitter.emit('report.generated', {
      organizationId,
      reportId: report.id,
      type: 'PROFIT_LOSS',
      period: filters,
    });

    return report;
  }

  async generateCashFlowReport(organizationId: string, generatedById: string, filters: {
    startDate: Date;
    endDate: Date;
    categoryIds?: string[];
  }) {
    const cacheKey = `report:cash-flow:${organizationId}:${JSON.stringify(filters)}`;
    
    // Try to get from cache
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get all transactions for the period
    const transactions = await this.prisma.transaction.findMany({
      where: {
        organizationId,
        date: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
        isActive: true,
        ...(filters.categoryIds && { categoryId: { in: filters.categoryIds } }),
      },
      include: {
        category: true,
      },
      orderBy: { date: 'asc' },
    });

    // Group by month
    const monthlyFlow = this.groupByMonth(transactions);

    // Calculate running balance
    let runningBalance = 0;
    const monthlyFlowWithBalance = monthlyFlow.map(month => {
      const income = month.income;
      const expenses = month.expenses;
      const netFlow = income - expenses;
      runningBalance += netFlow;

      return {
        ...month,
        netFlow,
        runningBalance,
      };
    });

    const reportData = {
      period: {
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
      summary: {
        totalIncome: transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount.toNumber(), 0),
        totalExpenses: transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount.toNumber(), 0),
        netCashFlow: transactions.reduce((sum, t) => {
          return sum + (t.type === 'INCOME' ? t.amount.toNumber() : -t.amount.toNumber());
        }, 0),
      },
      monthlyFlow: monthlyFlowWithBalance,
      transactions: transactions,
      generatedAt: new Date(),
    };

    // Cache for 1 hour
    await this.cacheService.set(cacheKey, JSON.stringify(reportData), 3600);

    // Save report to database
    const report = await this.prisma.report.create({
      data: {
        name: `Cash Flow Report (${filters.startDate.toISOString().split('T')[0]} - ${filters.endDate.toISOString().split('T')[0]})`,
        type: 'CASH_FLOW',
        description: `Cash flow report for period ${filters.startDate.toISOString().split('T')[0]} to ${filters.endDate.toISOString().split('T')[0]}`,
        filters: filters,
        data: reportData,
        organizationId,
        generatedById,
      },
    });

    // Emit report generated event
    this.eventEmitter.emit('report.generated', {
      organizationId,
      reportId: report.id,
      type: 'CASH_FLOW',
      period: filters,
    });

    return report;
  }

  async generateExpenseAnalyticsReport(organizationId: string, generatedById: string, filters: {
    startDate: Date;
    endDate: Date;
    categoryIds?: string[];
  }) {
    const cacheKey = `report:expense-analytics:${organizationId}:${JSON.stringify(filters)}`;
    
    // Try to get from cache
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get expense transactions
    const expenseTransactions = await this.prisma.transaction.findMany({
      where: {
        organizationId,
        type: 'EXPENSE',
        date: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
        isActive: true,
        ...(filters.categoryIds && { categoryId: { in: filters.categoryIds } }),
      },
      include: {
        category: true,
      },
      orderBy: { date: 'desc' },
    });

    // Calculate analytics
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount.toNumber(), 0);
    const expenseByCategory = this.groupByCategory(expenseTransactions);
    const monthlyExpenses = this.groupByMonth(expenseTransactions);
    const topExpenses = expenseTransactions
      .sort((a, b) => b.amount.toNumber() - a.amount.toNumber())
      .slice(0, 10);

    // Calculate trends
    const trends = this.calculateTrends(monthlyExpenses);

    const reportData = {
      period: {
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
      summary: {
        totalExpenses,
        transactionCount: expenseTransactions.length,
        averageExpense: totalExpenses / expenseTransactions.length,
      },
      byCategory: expenseByCategory,
      monthlyBreakdown: monthlyExpenses,
      topExpenses,
      trends,
      generatedAt: new Date(),
    };

    // Cache for 1 hour
    await this.cacheService.set(cacheKey, JSON.stringify(reportData), 3600);

    // Save report to database
    const report = await this.prisma.report.create({
      data: {
        name: `Expense Analytics Report (${filters.startDate.toISOString().split('T')[0]} - ${filters.endDate.toISOString().split('T')[0]})`,
        type: 'EXPENSE_ANALYTICS',
        description: `Expense analytics report for period ${filters.startDate.toISOString().split('T')[0]} to ${filters.endDate.toISOString().split('T')[0]}`,
        filters: filters,
        data: reportData,
        organizationId,
        generatedById,
      },
    });

    // Emit report generated event
    this.eventEmitter.emit('report.generated', {
      organizationId,
      reportId: report.id,
      type: 'EXPENSE_ANALYTICS',
      period: filters,
    });

    return report;
  }

  async generateBudgetVsActualReport(organizationId: string, generatedById: string, filters: {
    startDate: Date;
    endDate: Date;
    budgetIds?: string[];
  }) {
    const cacheKey = `report:budget-vs-actual:${organizationId}:${JSON.stringify(filters)}`;
    
    // Try to get from cache
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get budgets
    const budgets = await this.prisma.budget.findMany({
      where: {
        organizationId,
        isActive: true,
        periodStart: {
          lte: filters.endDate,
        },
        periodEnd: {
          gte: filters.startDate,
        },
        ...(filters.budgetIds && { id: { in: filters.budgetIds } }),
      },
      include: {
        category: true,
      },
    });

    // Calculate actual spending for each budget
    const budgetVsActual = await Promise.all(
      budgets.map(async (budget) => {
        const whereClause = {
          organizationId,
          isActive: true,
          date: {
            gte: budget.periodStart,
            lte: budget.periodEnd,
          },
          type: 'EXPENSE',
        };

        // If budget has a specific category, filter by that category
        if (budget.categoryId) {
          whereClause['categoryId'] = budget.categoryId;
        }

        const actualSpending = await this.prisma.transaction.aggregate({
          where: whereClause,
          _sum: { amount: true },
        });

        const actualAmount = actualSpending._sum.amount?.toNumber() || 0;
        const budgetAmount = budget.amount.toNumber();
        const variance = budgetAmount - actualAmount;
        const variancePercentage = budgetAmount > 0 ? (variance / budgetAmount) * 100 : 0;

        return {
          budgetId: budget.id,
          budgetName: budget.name,
          category: budget.category,
          budgetAmount,
          actualAmount,
          variance,
          variancePercentage,
          percentageUsed: budgetAmount > 0 ? (actualAmount / budgetAmount) * 100 : 0,
        };
      }),
    );

    const reportData = {
      period: {
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
      summary: {
        totalBudgeted: budgetVsActual.reduce((sum, b) => sum + b.budgetAmount, 0),
        totalActual: budgetVsActual.reduce((sum, b) => sum + b.actualAmount, 0),
        totalVariance: budgetVsActual.reduce((sum, b) => sum + b.variance, 0),
      },
      budgetVsActual,
      generatedAt: new Date(),
    };

    // Cache for 1 hour
    await this.cacheService.set(cacheKey, JSON.stringify(reportData), 3600);

    // Save report to database
    const report = await this.prisma.report.create({
      data: {
        name: `Budget vs Actual Report (${filters.startDate.toISOString().split('T')[0]} - ${filters.endDate.toISOString().split('T')[0]})`,
        type: 'BUDGET_VS_ACTUAL',
        description: `Budget vs actual report for period ${filters.startDate.toISOString().split('T')[0]} to ${filters.endDate.toISOString().split('T')[0]}`,
        filters: filters,
        data: reportData,
        organizationId,
        generatedById,
      },
    });

    // Emit report generated event
    this.eventEmitter.emit('report.generated', {
      organizationId,
      reportId: report.id,
      type: 'BUDGET_VS_ACTUAL',
      period: filters,
    });

    return report;
  }

  async exportReport(organizationId: string, reportId: string, format: 'csv' | 'excel' | 'pdf') {
    const report = await this.findOne(organizationId, reportId);

    switch (format) {
      case 'csv':
        return this.exportToCSV(report);
      case 'excel':
        return this.exportToExcel(report);
      case 'pdf':
        return this.exportToPDF(report);
      default:
        throw new Error('Unsupported export format');
    }
  }

  private groupByCategory(transactions: any[]) {
    const grouped = {};
    transactions.forEach(transaction => {
      const categoryName = transaction.category?.name || 'Uncategorized';
      if (!grouped[categoryName]) {
        grouped[categoryName] = {
          category: transaction.category,
          total: 0,
          count: 0,
          transactions: [],
        };
      }
      grouped[categoryName].total += transaction.amount.toNumber();
      grouped[categoryName].count += 1;
      grouped[categoryName].transactions.push(transaction);
    });
    return grouped;
  }

  private groupByMonth(transactions: any[]) {
    const grouped = {};
    transactions.forEach(transaction => {
      const monthKey = transaction.date.toISOString().slice(0, 7); // YYYY-MM format
      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          month: monthKey,
          income: 0,
          expenses: 0,
          transactions: [],
        };
      }
      
      const amount = transaction.amount.toNumber();
      if (transaction.type === 'INCOME') {
        grouped[monthKey].income += amount;
      } else if (transaction.type === 'EXPENSE') {
        grouped[monthKey].expenses += amount;
      }
      grouped[monthKey].transactions.push(transaction);
    });
    return Object.values(grouped);
  }

  private calculateTrends(monthlyData: any[]) {
    if (monthlyData.length < 2) return { trend: 'stable', change: 0 };

    const recent = monthlyData[monthlyData.length - 1];
    const previous = monthlyData[monthlyData.length - 2];
    
    const change = ((recent.expenses - previous.expenses) / previous.expenses) * 100;
    
    let trend = 'stable';
    if (change > 10) trend = 'increasing';
    else if (change < -10) trend = 'decreasing';

    return { trend, change: Math.round(change * 100) / 100 };
  }

  private async exportToCSV(report: any) {
    // Implementation for CSV export
    const csvData = this.convertToCSV(report.data);
    return {
      filename: `${report.type.toLowerCase()}_report_${new Date().toISOString().split('T')[0]}.csv`,
      data: csvData,
      contentType: 'text/csv',
    };
  }

  private async exportToExcel(report: any) {
    // Implementation for Excel export
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');
    
    // Add data to worksheet based on report type
    this.populateExcelWorksheet(worksheet, report.data);
    
    const buffer = await workbook.xlsx.writeBuffer();
    return {
      filename: `${report.type.toLowerCase()}_report_${new Date().toISOString().split('T')[0]}.xlsx`,
      data: buffer,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  private async exportToPDF(report: any) {
    // Implementation for PDF export
    const doc = new PDFDocument();
    
    // Add content to PDF based on report type
    this.populatePDFDocument(doc, report.data);
    
    return {
      filename: `${report.type.toLowerCase()}_report_${new Date().toISOString().split('T')[0]}.pdf`,
      data: doc,
      contentType: 'application/pdf',
    };
  }

  private convertToCSV(data: any): string {
    // Basic CSV conversion - can be enhanced based on specific needs
    return JSON.stringify(data, null, 2);
  }

  private populateExcelWorksheet(worksheet: ExcelJS.Worksheet, data: any) {
    // Basic Excel population - can be enhanced based on specific needs
    worksheet.addRow(['Report Data']);
    worksheet.addRow([JSON.stringify(data, null, 2)]);
  }

  private populatePDFDocument(doc: PDFDocument, data: any) {
    // Basic PDF content - can be enhanced based on specific needs
    doc.fontSize(16).text('Financial Report', 100, 100);
    doc.fontSize(12).text(JSON.stringify(data, null, 2), 100, 150);
  }
}