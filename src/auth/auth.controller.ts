import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  HttpCode,
  HttpStatus,
  Res,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SkipAuth } from './decorators/skip-auth.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
  ) {}

  @SkipAuth()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
  })
  async register(@Body() registerDto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName?: string;
  }) {
    return this.authService.register(registerDto);
  }

  @SkipAuth()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @SkipAuth()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token successfully refreshed',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token',
  })
  async refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged out',
  })
  async logout(@Request() req, @Body('refresh_token') refreshToken?: string) {
    return this.authService.logout(req.user.id, refreshToken);
  }

  @SkipAuth()
  @Get('google')
  @ApiOperation({ summary: 'Google OAuth login' })
  @ApiResponse({
    status: 302,
    description: 'Redirect to Google OAuth',
  })
  async googleAuth(@Res() res: Response) {
    // This will be handled by GoogleStrategy
  }

  @SkipAuth()
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({
    status: 200,
    description: 'Google OAuth successful',
  })
  async googleCallback(@Request() req, @Res() res: Response) {
    const result = await this.authService.login(req.user);
    
    // Redirect to frontend with tokens
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${result.access_token}&refresh_token=${result.refresh_token}`;
    return res.redirect(redirectUrl);
  }

  @SkipAuth()
  @Get('microsoft')
  @ApiOperation({ summary: 'Microsoft OAuth login' })
  @ApiResponse({
    status: 302,
    description: 'Redirect to Microsoft OAuth',
  })
  async microsoftAuth(@Res() res: Response) {
    // This will be handled by MicrosoftStrategy
  }

  @SkipAuth()
  @Get('microsoft/callback')
  @ApiOperation({ summary: 'Microsoft OAuth callback' })
  @ApiResponse({
    status: 200,
    description: 'Microsoft OAuth successful',
  })
  async microsoftCallback(@Request() req, @Res() res: Response) {
    const result = await this.authService.login(req.user);
    
    // Redirect to frontend with tokens
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${result.access_token}&refresh_token=${result.refresh_token}`;
    return res.redirect(redirectUrl);
  }

  @Post('switch-organization')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Switch current organization' })
  @ApiResponse({
    status: 200,
    description: 'Organization successfully switched',
  })
  @ApiResponse({
    status: 401,
    description: 'User does not belong to this organization',
  })
  async switchOrganization(
    @Request() req,
    @Body('organizationId') organizationId: string,
  ) {
    return this.authService.switchOrganization(req.user.id, organizationId);
  }
}