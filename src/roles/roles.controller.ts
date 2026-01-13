import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@Controller('roles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({
    status: 200,
    description: 'Roles retrieved successfully',
  })
  async getAllRoles() {
    return this.rolesService.getAllRoles();
  }

  @Get('system')
  @ApiOperation({ summary: 'Get system roles' })
  @ApiResponse({
    status: 200,
    description: 'System roles retrieved successfully',
  })
  async getSystemRoles() {
    return this.rolesService.getSystemRoles();
  }

  @Post()
  @ApiOperation({ summary: 'Create new role' })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Role with this name already exists',
  })
  async createRole(
    @Body() createRoleDto: {
      name: string;
      description?: string;
      permissions: string[];
      isSystem?: boolean;
    },
  ) {
    return this.rolesService.create(createRoleDto);
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiResponse({
    status: 200,
    description: 'Role retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  async getRoleById(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findById(id);
  }

  @Put(':id')
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiOperation({ summary: 'Update role' })
  @ApiResponse({
    status: 200,
    description: 'Role updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: {
      name?: string;
      description?: string;
      permissions?: string[];
    },
  ) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiOperation({ summary: 'Delete role' })
  @ApiResponse({
    status: 204,
    description: 'Role deleted successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete role that is currently assigned to users',
  })
  async deleteRole(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.delete(id);
  }

  @Get(':id/permissions')
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiOperation({ summary: 'Get role permissions' })
  @ApiResponse({
    status: 200,
    description: 'Role permissions retrieved successfully',
  })
  async getRolePermissions(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.getRolePermissions(id);
  }

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize system roles' })
  @ApiResponse({
    status: 200,
    description: 'System roles initialized successfully',
  })
  async initializeSystemRoles() {
    return this.rolesService.initializeSystemRoles();
  }
}