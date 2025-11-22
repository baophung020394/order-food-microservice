import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../config/redis.config';
import Redis from 'ioredis';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async register(registerDto: RegisterDto): Promise<{
    user: Partial<User>;
    accessToken: string;
    refreshToken: string;
  }> {
    console.log('[AuthService] Starting register process...');
    const { username, password, fullName, role } = registerDto;

    // Check if user already exists
    console.log('[AuthService] Checking if user exists:', username);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const existingUser: User | null = await this.userRepository.findOne({
      where: { username },
    });
    console.log('[AuthService] User exists check completed');

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Hash password
    console.log('[AuthService] Hashing password...');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('[AuthService] Password hashed');

    // Create user
    console.log('[AuthService] Creating user entity...');
    const user = this.userRepository.create({
      username,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      passwordHash,
      fullName,
      role: role || UserRole.STAFF,
      isActive: true,
    });

    console.log('[AuthService] Saving user to database...');
    const savedUser = await this.userRepository.save(user);
    console.log('[AuthService] User saved successfully:', savedUser.id);

    // Generate tokens
    console.log('[AuthService] Generating tokens...');
    const tokens = await this.generateTokens(savedUser);
    console.log('[AuthService] Tokens generated');

    // Emit user.created event to Redis
    console.log('[AuthService] Publishing user.created event to Redis...');
    await this.redis.publish(
      'user.created',
      JSON.stringify({
        userId: savedUser.id,
        username: savedUser.username,
        role: savedUser.role,
      }),
    );
    console.log('[AuthService] Event published to Redis');

    // Remove password hash from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userWithoutPassword } = savedUser;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto): Promise<{
    user: Partial<User>;
    accessToken: string;
    refreshToken: string;
  }> {
    const { username, password }: { username: string; password: string } =
      loginDto as { username: string; password: string };

    // Find user
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const user: User | null = await this.userRepository.findOne({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Verify password
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Remove password hash from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  async refresh(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Find refresh token
    const token = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
      relations: ['user'],
    });

    if (!token || !token.user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is expired
    if (token.expiresAt < new Date()) {
      await this.refreshTokenRepository.remove(token);
      throw new UnauthorizedException('Refresh token expired');
    }

    // Check if user is still active
    if (!token.user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(token.user);

    // Remove old refresh token
    await this.refreshTokenRepository.remove(token);

    return tokens;
  }

  async getProfile(userId: string): Promise<Partial<User>> {
    const user: User | null = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getAllUsers(userRole: UserRole): Promise<Partial<User>[]> {
    // Only admin can list all users
    if (userRole !== UserRole.ADMIN) {
      throw new UnauthorizedException('Only admin can list all users');
    }

    const users = await this.userRepository.find({
      order: { createdAt: 'DESC' },
    });

    return users.map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ passwordHash: _, ...userWithoutPassword }) => userWithoutPassword,
    );
  }

  async logout(
    userId: string,
    refreshToken?: string,
  ): Promise<{ message: string }> {
    // If refreshToken is provided, logout only that specific token
    // Otherwise, logout all refresh tokens for the user (logout from all devices)
    if (refreshToken) {
      const token = await this.refreshTokenRepository.findOne({
        where: {
          userId,
          token: refreshToken,
        },
      });

      if (token) {
        await this.refreshTokenRepository.remove(token);
        console.log(
          `[AuthService] Logged out refresh token for user: ${userId}`,
        );
        return { message: 'Logged out successfully' };
      }
    } else {
      // Delete all refresh tokens for the user
      const tokens = await this.refreshTokenRepository.find({
        where: { userId },
      });

      if (tokens.length > 0) {
        await this.refreshTokenRepository.remove(tokens);
        console.log(
          `[AuthService] Logged out all devices for user: ${userId} (${tokens.length} tokens removed)`,
        );
      }
    }

    return { message: 'Logged out successfully' };
  }

  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token
    const refreshTokenPayload = {
      sub: user.id,
      type: 'refresh',
    };
    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      expiresIn: '30s',
    });

    // Save refresh token to database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const refreshTokenEntity = this.refreshTokenRepository.create({
      userId: user.id,
      token: refreshToken,
      expiresAt,
    });

    await this.refreshTokenRepository.save(refreshTokenEntity);

    return {
      accessToken,
      refreshToken,
    };
  }
}
