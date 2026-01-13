import { Injectable, UnauthorizedException, ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { EncryptionService } from '../common/services/encryption.service';
import { CacheService } from '../common/services/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private encryptionService: EncryptionService,
    private cacheService: CacheService,
    private eventEmitter: EventEmitter2,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.password) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (isPasswordValid) {
        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.id,
      organizationId: user.currentOrganizationId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user.id);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Emit login event for audit logging
    this.eventEmitter.emit('user.login', {
      userId: user.id,
      organizationId: user.currentOrganizationId,
      ip: user.ip,
      userAgent: user.userAgent,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        currentOrganizationId: user.currentOrganizationId,
      },
    };
  }

  async register(registerDto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName?: string;
  }) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    // Create user with organization
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        userOrganizations: {
          create: {
            organization: {
              create: {
                name: registerDto.organizationName || `${registerDto.firstName}'s Organization`,
                slug: this.generateOrganizationSlug(registerDto.organizationName || `${registerDto.firstName}'s Organization`),
                currency: 'USD',
                timezone: 'UTC',
              },
            },
            role: {
              connect: { name: 'Owner' },
            },
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

    // Emit registration event
    this.eventEmitter.emit('user.registered', {
      userId: user.id,
      organizationId: user.userOrganizations[0].organizationId,
    });

    return this.login(user);
  }

  async refreshTokens(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken);
      
      // Check if refresh token exists in database
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Get user
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new tokens
      const newAccessToken = this.jwtService.sign({
        email: user.email,
        sub: user.id,
        organizationId: user.currentOrganizationId,
      });

      const newRefreshToken = await this.generateRefreshToken(user.id);

      // Delete old refresh token
      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          currentOrganizationId: user.currentOrganizationId,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      // Delete specific refresh token
      await this.prisma.refreshToken.deleteMany({
        where: { 
          token: refreshToken,
          userId: userId,
        },
      });
    } else {
      // Delete all refresh tokens for user
      await this.prisma.refreshToken.deleteMany({
        where: { userId: userId },
      });
    }

    // Clear cache entries for user
    await this.cacheService.del(`user:${userId}`);

    // Emit logout event
    this.eventEmitter.emit('user.logout', {
      userId: userId,
    });

    return { message: 'Logged out successfully' };
  }

  async validateOAuthLogin(profile: any, provider: string) {
    let user = await this.usersService.findByOAuthId(profile.id, provider);

    if (!user) {
      // Create new user with OAuth
      user = await this.prisma.user.create({
        data: {
          email: profile.emails[0].value,
          firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || '',
          lastName: profile.name?.familyName || profile.displayName?.split(' ')[1] || '',
          avatar: profile.photos?.[0]?.value,
          ...(provider === 'google' && { googleId: profile.id }),
          ...(provider === 'microsoft' && { microsoftId: profile.id }),
          userOrganizations: {
            create: {
              organization: {
                create: {
                  name: `${profile.displayName || 'New User'}'s Organization`,
                  slug: this.generateOrganizationSlug(`${profile.displayName || 'New User'}'s Organization`),
                  currency: 'USD',
                  timezone: 'UTC',
                },
              },
              role: {
                connect: { name: 'Owner' },
              },
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

      this.eventEmitter.emit('user.registered', {
        userId: user.id,
        organizationId: user.userOrganizations[0].organizationId,
      });
    }

    return user;
  }

  async switchOrganization(userId: string, organizationId: string) {
    // Verify user belongs to organization
    const userOrg = await this.prisma.userOrganization.findFirst({
      where: {
        userId: userId,
        organizationId: organizationId,
        isActive: true,
      },
    });

    if (!userOrg) {
      throw new UnauthorizedException('User does not belong to this organization');
    }

    // Update user's current organization
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { currentOrganizationId: organizationId },
      include: {
        userOrganizations: {
          where: { organizationId: organizationId },
          include: {
            organization: true,
            role: true,
          },
        },
      },
    });

    // Generate new tokens with new organization context
    const payload = { 
      email: user.email, 
      sub: user.id,
      organizationId: organizationId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(userId);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        currentOrganizationId: organizationId,
      },
    };
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = this.encryptionService.generateRandomToken(64);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  private generateOrganizationSlug(name: string): string {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    return `${slug}-${crypto.randomBytes(4).toString('hex')}`;
  }
}