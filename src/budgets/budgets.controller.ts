import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentOrganization } from '../common/decorators/current-organization.decorator';

@ApiTags('Budgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all budgets for organization' })
  @ApiResponse({ status: 200, description: 'Budgets retrieved successfully' })
  findAll(@CurrentOrganization() organizationId: string) {
    return this.budgetsService.findAll(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get budget by ID' })
  @ApiResponse({ status: 200, description: 'Budget retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  findOne(
    @Param('id') id: string,
    @CurrentOrganization() organizationId: string,
  ) {
    return this.budgetsService.findOne(organizationId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new budget' })
  @ApiResponse({ status: 201, description: 'Budget created successfully' })
  @ApiResponse({ status: 409, description: 'Budget with this name already exists' })
  create(
    @Body() createBudgetDto: {
      name: string;
      description?: string;
      amount: number;
      currency?: string;
      type: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
      periodStart: Date;
      periodEnd: Date;
      alertThreshold?: number;
      categoryId?: string;
    },
    @CurrentOrganization() organizationId: string,
  ) {
    return this.budgetsService.create(organizationId, createBudgetDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update budget' })
  @ApiResponse({ status: 200, description: 'Budget updated successfully' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  @ApiResponse({ status: 409, description: 'Budget with this name already exists' })
  update(
    @Param('id') id: string,
    @Body() updateBudgetDto: {
      name?: string;
      description?: string;
      amount?: number;
      currency?: string;
      type?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
      periodStart?: Date;
      periodEnd?: Date;
      alertThreshold?: number;
      categoryId?: string;
    },
    @CurrentOrganization() organizationId: string,
  ) {
    return this.budgetsService.update(organizationId, id, updateBudgetDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete budget' })
  @ApiResponse({ status: 200, description: 'Budget deleted successfully' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  remove(
    @Param('id') id: string,
    @CurrentOrganization() organizationId: string,
  ) {
    return this.budgetsService.delete(organizationId, id);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get budget trends' })
  @ApiResponse({ status: 200, description: 'Budget trends retrieved successfully' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
  getTrends(
    @Query('categoryId') categoryId: string,
    @CurrentOrganization() organizationId: string,
  ) {
    return this.budgetsService.getBudgetTrends(organizationId, categoryId);
  }

  @Post('check-alerts')
  @ApiOperation({ summary: 'Check budget alerts' })
  @ApiResponse({ status: 200, description: 'Budget alerts checked successfully' })
  checkAlerts(@CurrentOrganization() organizationId: string) {
    return this.budgetsService.checkBudgetAlerts(organizationId);
  }
}