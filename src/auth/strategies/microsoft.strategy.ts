import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-microsoft';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('oauth.microsoft.clientId'),
      clientSecret: configService.get<string>('oauth.microsoft.clientSecret'),
      callbackURL: '/api/v1/auth/microsoft/callback',
      scope: ['user.read'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const user = await this.authService.validateOAuthLogin(profile, 'microsoft');
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
}