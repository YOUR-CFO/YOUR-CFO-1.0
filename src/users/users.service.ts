import { Injectable, NotFoundException, ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/services/encryption.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userOrganizations: {
          where: { isActive: true },
          include: {
            organization: true,
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...result } = user;
    return result;
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        userOrganizations: {
          where: { isActive: true },
          include: {
            organization: true,
            role: true,
          },
        },
      },
    });

    return user;
  }

  async findByOAuthId(oauthId: string, provider: string) {
    const where = provider === 'google' ? { googleId: oauthId } : { microsoftId: oauthId };
    
    const user = await this.prisma.user.findUnique({
      where,
      include: {
        userOrganizations: {
          where: { isActive: true },
          include: {
            organization: true,
            role: true,
          },
        },
      },
    });

    return user;
  }

  async update(id: string, updateUserDto: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    isActive?: boolean;
  }) {
    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      include: {
        userOrganizations: {
          where: { isActive: true },
          include: {
            organization: true,
            role: true,
          },
        },
      },
    });

    const { password, ...result } = user;
    return result;
  }

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { password: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new HttpException('Current password is incorrect', HttpStatus.BAD_REQUEST);
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedNewPassword },
    });

    return { message: 'Password changed successfully' };
  }

  async getUserOrganizations(userId: string) {
    const userOrganizations = await this.prisma.userOrganization.findMany({
      where: { 
        userId,
        isActive: true,
      },
      include: {
        organization: true,
        role: true,
      },
    });

    return userOrganizations;
  }

  async inviteUser(inviteDto: {
    email: string;
    firstName: string;
    lastName: string;
    organizationId: string;
    roleId: string;
    invitedById: string;
  }) {
    // Check if user already exists
    const existingUser = await this.findByEmail(inviteDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create invitation token
    const invitationToken = this.encryptionService.generateRandomToken(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Create user with pending status
    const user = await this.prisma.user.create({
      data: {
        email: inviteDto.email,
        firstName: inviteDto.firstName,
        lastName: inviteDto.lastName,
        isEmailVerified: false,
        userOrganizations: {
          create: {
            organizationId: inviteDto.organizationId,
            roleId: inviteDto.roleId,
          },
        },
      },
      include: {
        userOrganizations: {
          include: {
            organization: true,
            role: true,
          },
        },
      },
    });

    // Store invitation token
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { 
          // You might want to add an invitationToken field to your User model
          // For now, we'll just return the token
        },
      }),
    ]);

    return {
      user: user,
      invitationToken: invitationToken,
      invitationUrl: `${process.env.FRONTEND_URL}/accept-invitation?token=${invitationToken}`,
    };
  }

  async acceptInvitation(token: string, password: string) {
    // This would typically involve validating the invitation token
    // and updating the user's password and status
    // For now, we'll implement a basic version
    
    // Find user by invitation token (you'd need to implement this properly)
    const user = await this.prisma.user.findFirst({
      where: { 
        // Add your invitation token logic here
      },
    });

    if (!user) {
      throw new NotFoundException('Invalid invitation token');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        isEmailVerified: true,
        isActive: true,
      },
      include: {
        userOrganizations: {
          include: {
            organization: true,
            role: true,
          },
        },
      },
    });

    const { password: _, ...result } = updatedUser;
    return result;
  }

  async getUserStats(userId: string) {
    const user = await this.findById(userId);
    
    return {
      totalOrganizations: user.userOrganizations.length,
      currentOrganization: user.userOrganizations.find(uo => 
        uo.organizationId === user.currentOrganizationId
      ),
      roles: user.userOrganizations.map(uo => ({
        organizationId: uo.organizationId,
        organizationName: uo.organization.name,
        role: uo.role.name,
      })),
    };
  }
}