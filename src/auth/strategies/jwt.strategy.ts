import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
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

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Set current organization from JWT payload
    const currentOrganization = user.userOrganizations.find(
      uo => uo.organizationId === payload.organizationId,
    );

    if (!currentOrganization) {
      throw new UnauthorizedException('Invalid organization context');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      currentOrganizationId: payload.organizationId,
      currentRole: currentOrganization.role,
      organizations: user.userOrganizations.map(uo => ({
        id: uo.organizationId,
        name: uo.organization.name,
        slug: uo.organization.slug,
        role: uo.role,
      })),
    };
  }
}