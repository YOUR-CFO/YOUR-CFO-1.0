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
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentOrganization } from '../common/decorators/current-organization.decorator';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories for organization' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  findAll(@CurrentOrganization() organizationId: string) {
    return this.categoriesService.findAll(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findOne(
    @Param('id') id: string,
    @CurrentOrganization() organizationId: string,
  ) {
    return this.categoriesService.findOne(organizationId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 409, description: 'Category with this name already exists' })
  create(
    @Body() createCategoryDto: {
      name: string;
      description?: string;
      type: 'INCOME' | 'EXPENSE';
      icon?: string;
      color?: string;
      parentId?: string;
    },
    @CurrentOrganization() organizationId: string,
  ) {
    return this.categoriesService.create(organizationId, createCategoryDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'Category with this name already exists' })
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: {
      name?: string;
      description?: string;
      icon?: string;
      color?: string;
      parentId?: string;
    },
    @CurrentOrganization() organizationId: string,
  ) {
    return this.categoriesService.update(organizationId, id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete category' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete category with transactions or budgets' })
  remove(
    @Param('id') id: string,
    @CurrentOrganization() organizationId: string,
  ) {
    return this.categoriesService.delete(organizationId, id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get category statistics' })
  @ApiResponse({ status: 200, description: 'Category statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  getStats(
    @Param('id') id: string,
    @CurrentOrganization() organizationId: string,
  ) {
    return this.categoriesService.getCategoryStats(organizationId, id);
  }

  @Post('initialize-default')
  @ApiOperation({ summary: 'Initialize default categories for organization' })
  @ApiResponse({ status: 201, description: 'Default categories initialized successfully' })
  initializeDefault(@CurrentOrganization() organizationId: string) {
    return this.categoriesService.initializeDefaultCategories(organizationId);
  }
}