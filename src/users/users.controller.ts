import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  Request,
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
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  async getProfile(@Request() req) {
    return this.usersService.findById(req.user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
  })
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: {
      firstName?: string;
      lastName?: string;
      avatar?: string;
    },
  ) {
    return this.usersService.update(req.user.id, updateProfileDto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Current password is incorrect',
  })
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: {
      currentPassword: string;
      newPassword: string;
    },
  ) {
    return this.usersService.changePassword(
      req.user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  @Get('organizations')
  @ApiOperation({ summary: 'Get user organizations' })
  @ApiResponse({
    status: 200,
    description: 'User organizations retrieved successfully',
  })
  async getUserOrganizations(@Request() req) {
    return this.usersService.getUserOrganizations(req.user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully',
  })
  async getUserStats(@Request() req) {
    return this.usersService.getUserStats(req.user.id);
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite a new user to organization' })
  @ApiResponse({
    status: 201,
    description: 'User invited successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
  })
  async inviteUser(
    @Request() req,
    @Body() inviteUserDto: {
      email: string;
      firstName: string;
      lastName: string;
      roleId: string;
    },
  ) {
    return this.usersService.inviteUser({
      ...inviteUserDto,
      organizationId: req.user.currentOrganizationId,
      invitedById: req.user.id,
    });
  }

  @Post('accept-invitation')
  @ApiOperation({ summary: 'Accept invitation' })
  @ApiResponse({
    status: 200,
    description: 'Invitation accepted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Invalid invitation token',
  })
  async acceptInvitation(
    @Body() acceptInvitationDto: {
      token: string;
      password: string;
    },
  ) {
    return this.usersService.acceptInvitation(
      acceptInvitationDto.token,
      acceptInvitationDto.password,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }
}