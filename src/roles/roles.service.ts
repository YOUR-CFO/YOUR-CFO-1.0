import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/services/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class RolesService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async findByName(name: string) {
    const role = await this.prisma.role.findUnique({
      where: { name },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async getAllRoles() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(createRoleDto: {
    name: string;
    description?: string;
    permissions: string[];
    isSystem?: boolean;
  }) {
    // Check if role with this name already exists
    const existingRole = await this.prisma.role.findUnique({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException('Role with this name already exists');
    }

    const role = await this.prisma.role.create({
      data: {
        name: createRoleDto.name,
        description: createRoleDto.description,
        permissions: createRoleDto.permissions,
        isSystem: createRoleDto.isSystem || false,
      },
    });

    // Emit role created event
    this.eventEmitter.emit('role.created', {
      roleId: role.id,
      name: role.name,
    });

    return role;
  }

  async update(id: string, updateRoleDto: {
    name?: string;
    description?: string;
    permissions?: string[];
  }) {
    const role = await this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
    });

    // Clear cache
    await this.cacheService.del(`role:${id}`);

    // Emit role updated event
    this.eventEmitter.emit('role.updated', {
      roleId: id,
      name: role.name,
    });

    return role;
  }

  async delete(id: string) {
    // Check if role is being used
    const roleUsage = await this.prisma.userOrganization.count({
      where: { roleId: id, isActive: true },
    });

    if (roleUsage > 0) {
      throw new ConflictException('Cannot delete role that is currently assigned to users');
    }

    const role = await this.prisma.role.delete({
      where: { id },
    });

    // Clear cache
    await this.cacheService.del(`role:${id}`);

    // Emit role deleted event
    this.eventEmitter.emit('role.deleted', {
      roleId: id,
      name: role.name,
    });

    return role;
  }

  async getRolePermissions(roleId: string): Promise<string[]> {
    const role = await this.findById(roleId);
    return role.permissions as string[];
  }

  async hasPermission(roleId: string, permission: string): Promise<boolean> {
    const permissions = await this.getRolePermissions(roleId);
    return permissions.includes(permission);
  }

  async hasAnyPermission(roleId: string, permissions: string[]): Promise<boolean> {
    const rolePermissions = await this.getRolePermissions(roleId);
    return permissions.some(permission => rolePermissions.includes(permission));
  }

  async hasAllPermissions(roleId: string, permissions: string[]): Promise<boolean> {
    const rolePermissions = await this.getRolePermissions(roleId);
    return permissions.every(permission => rolePermissions.includes(permission));
  }

  async getSystemRoles() {
    return this.prisma.role.findMany({
      where: { isSystem: true },
      orderBy: { name: 'asc' },
    });
  }

  async initializeSystemRoles() {
    const systemRoles = [
      {
        name: 'Owner',
        description: 'Full access to all organization features',
        permissions: [
          'organizations:*',
          'users:*',
          'roles:*',
          'transactions:*',
          'categories:*',
          'budgets:*',
          'reports:*',
          'ai:*',
          'integrations:*',
          'notifications:*',
          'audit-logs:read',
        ],
        isSystem: true,
      },
      {
        name: 'Finance Manager',
        description: 'Can manage financial data and generate reports',
        permissions: [
          'organizations:read',
          'users:read',
          'transactions:*',
          'categories:*',
          'budgets:*',
          'reports:*',
          'ai:read',
          'integrations:read',
          'notifications:read',
        ],
        isSystem: true,
      },
      {
        name: 'Accountant',
        description: 'Can manage transactions and categories',
        permissions: [
          'organizations:read',
          'transactions:*',
          'categories:*',
          'budgets:read',
          'reports:read',
          'ai:read',
        ],
        isSystem: true,
      },
      {
        name: 'Viewer',
        description: 'Read-only access to organization data',
        permissions: [
          'organizations:read',
          'transactions:read',
          'categories:read',
          'budgets:read',
          'reports:read',
          'ai:read',
        ],
        isSystem: true,
      },
    ];

    for (const roleData of systemRoles) {
      try {
        await this.create(roleData);
      } catch (error) {
        // Role might already exist, skip
        console.log(`System role ${roleData.name} already exists or error:`, error.message);
      }
    }

    return { message: 'System roles initialized successfully' };
  }
}