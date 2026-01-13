import { Injectable, NotFoundException, ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/services/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class OrganizationsService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findById(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async findBySlug(slug: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async create(createOrganizationDto: {
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
    ownerId: string;
  }) {
    // Generate unique slug
    const slug = this.generateSlug(createOrganizationDto.name);

    // Check if slug already exists
    const existingOrg = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      throw new ConflictException('Organization with this name already exists');
    }

    // Create organization with owner
    const organization = await this.prisma.organization.create({
      data: {
        ...createOrganizationDto,
        slug,
        userOrganizations: {
          create: {
            userId: createOrganizationDto.ownerId,
            role: {
              connect: { name: 'Owner' },
            },
          },
        },
      },
    });

    // Emit organization created event
    this.eventEmitter.emit('organization.created', {
      organizationId: organization.id,
      ownerId: createOrganizationDto.ownerId,
    });

    return organization;
  }

  async update(id: string, updateOrganizationDto: {
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
  }) {
    const organization = await this.prisma.organization.update({
      where: { id },
      data: updateOrganizationDto,
    });

    // Clear cache
    await this.cacheService.del(`organization:${id}`);

    return organization;
  }

  async delete(id: string) {
    // Soft delete
    const organization = await this.prisma.organization.update({
      where: { id },
      data: { 
        isActive: false,
        deletedAt: new Date(),
      },
    });

    // Clear cache
    await this.cacheService.del(`organization:${id}`);

    // Emit organization deleted event
    this.eventEmitter.emit('organization.deleted', {
      organizationId: id,
    });

    return organization;
  }

  async getOrganizationStats(organizationId: string) {
    const [
      totalUsers,
      totalTransactions,
      totalCategories,
      totalBudgets,
      totalReports,
      totalAiInsights,
    ] = await Promise.all([
      this.prisma.userOrganization.count({
        where: { organizationId, isActive: true },
      }),
      this.prisma.transaction.count({
        where: { organizationId, isActive: true },
      }),
      this.prisma.category.count({
        where: { organizationId, isActive: true },
      }),
      this.prisma.budget.count({
        where: { organizationId, isActive: true },
      }),
      this.prisma.report.count({
        where: { organizationId, isActive: true },
      }),
      this.prisma.aiInsight.count({
        where: { organizationId, deletedAt: null },
      }),
    ]);

    return {
      totalUsers,
      totalTransactions,
      totalCategories,
      totalBudgets,
      totalReports,
      totalAiInsights,
    };
  }

  async getOrganizationMembers(organizationId: string) {
    const members = await this.prisma.userOrganization.findMany({
      where: { 
        organizationId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        role: true,
      },
      orderBy: { joinedAt: 'desc' },
    });

    return members.map(member => ({
      id: member.user.id,
      email: member.user.email,
      firstName: member.user.firstName,
      lastName: member.user.lastName,
      avatar: member.user.avatar,
      role: member.role,
      joinedAt: member.joinedAt,
      lastLoginAt: member.user.lastLoginAt,
    }));
  }

  async addMember(organizationId: string, addMemberDto: {
    userId: string;
    roleId: string;
    invitedById: string;
  }) {
    // Check if user already belongs to organization
    const existingMembership = await this.prisma.userOrganization.findFirst({
      where: {
        userId: addMemberDto.userId,
        organizationId: organizationId,
        isActive: true,
      },
    });

    if (existingMembership) {
      throw new ConflictException('User already belongs to this organization');
    }

    // Add member
    const membership = await this.prisma.userOrganization.create({
      data: {
        userId: addMemberDto.userId,
        organizationId: organizationId,
        roleId: addMemberDto.roleId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        role: true,
      },
    });

    // Emit member added event
    this.eventEmitter.emit('organization.member.added', {
      organizationId,
      userId: addMemberDto.userId,
      roleId: addMemberDto.roleId,
      invitedById: addMemberDto.invitedById,
    });

    return membership;
  }

  async removeMember(organizationId: string, userId: string) {
    // Soft delete membership
    const membership = await this.prisma.userOrganization.update({
      where: {
        userId_organizationId: {
          userId: userId,
          organizationId: organizationId,
        },
      },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    // Emit member removed event
    this.eventEmitter.emit('organization.member.removed', {
      organizationId,
      userId,
    });

    return membership;
  }

  async updateMemberRole(organizationId: string, userId: string, roleId: string) {
    const membership = await this.prisma.userOrganization.update({
      where: {
        userId_organizationId: {
          userId: userId,
          organizationId: organizationId,
        },
      },
      data: { roleId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        role: true,
      },
    });

    // Emit member role updated event
    this.eventEmitter.emit('organization.member.role.updated', {
      organizationId,
      userId,
      roleId,
    });

    return membership;
  }

  async getOrganizationSettings(organizationId: string) {
    const organization = await this.findById(organizationId);
    
    return {
      name: organization.name,
      description: organization.description,
      logo: organization.logo,
      website: organization.website,
      industry: organization.industry,
      size: organization.size,
      country: organization.country,
      timezone: organization.timezone,
      currency: organization.currency,
      fiscalYearEnd: organization.fiscalYearEnd,
    };
  }

  async updateOrganizationSettings(organizationId: string, settings: {
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
  }) {
    return this.update(organizationId, settings);
  }

  private generateSlug(name: string): string {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    return `${slug}-${Date.now().toString(36)}`;
  }
}