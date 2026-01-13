import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationsService } from './organizations.service';

@ApiTags('Organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user organizations' })
  @ApiResponse({
    status: 200,
    description: 'Organizations retrieved successfully',
  })
  async getUserOrganizations(@Request() req) {
    return this.organizationsService.getUserOrganizations(req.user.id);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current organization' })
  @ApiResponse({
    status: 200,
    description: 'Current organization retrieved successfully',
  })
  async getCurrentOrganization(@Request() req) {
    return this.organizationsService.findById(req.user.currentOrganizationId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get organization statistics' })
  @ApiResponse({
    status: 200,
    description: 'Organization statistics retrieved successfully',
  })
  async getOrganizationStats(@Request() req) {
    return this.organizationsService.getOrganizationStats(req.user.currentOrganizationId);
  }

  @Get('members')
  @ApiOperation({ summary: 'Get organization members' })
  @ApiResponse({
    status: 200,
    description: 'Organization members retrieved successfully',
  })
  async getOrganizationMembers(@Request() req) {
    return this.organizationsService.getOrganizationMembers(req.user.currentOrganizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new organization' })
  @ApiResponse({
    status: 201,
    description: 'Organization created successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Organization with this name already exists',
  })
  async createOrganization(
    @Request() req,
    @Body() createOrganizationDto: {
      name: string;
      description?: string;
      logo?: string;
      website?: string;
      industry?: string;
      size?: string;
      country?: string;
      timezone?: string;
      currency?: string;
      fiscalYearEnd?: string;
    },
  ) {
    return this.organizationsService.create({
      ...createOrganizationDto,
      ownerId: req.user.id,
    });
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update organization settings' })
  @ApiResponse({
    status: 200,
    description: 'Organization settings updated successfully',
  })
  async updateOrganizationSettings(
    @Request() req,
    @Body() settings: {
      name?: string;
      description?: string;
      logo?: string;
      website?: string;
      industry?: string;
      size?: string;
      country?: string;
      timezone?: string;
      currency?: string;
      fiscalYearEnd?: string;
    },
  ) {
    return this.organizationsService.updateOrganizationSettings(
      req.user.currentOrganizationId,
      settings,
    );
  }

  @Post('members')
  @ApiOperation({ summary: 'Add member to organization' })
  @ApiResponse({
    status: 201,
    description: 'Member added successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'User already belongs to this organization',
  })
  async addMember(
    @Request() req,
    @Body() addMemberDto: {
      userId: string;
      roleId: string;
    },
  ) {
    return this.organizationsService.addMember(req.user.currentOrganizationId, {
      ...addMemberDto,
      invitedById: req.user.id,
    });
  }

  @Put('members/:userId/role')
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOperation({ summary: 'Update member role' })
  @ApiResponse({
    status: 200,
    description: 'Member role updated successfully',
  })
  async updateMemberRole(
    @Request() req,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() updateRoleDto: {
      roleId: string;
    },
  ) {
    return this.organizationsService.updateMemberRole(
      req.user.currentOrganizationId,
      userId,
      updateRoleDto.roleId,
    );
  }

  @Delete('members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOperation({ summary: 'Remove member from organization' })
  @ApiResponse({
    status: 204,
    description: 'Member removed successfully',
  })
  async removeMember(
    @Request() req,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.organizationsService.removeMember(
      req.user.currentOrganizationId,
      userId,
    );
  }
}