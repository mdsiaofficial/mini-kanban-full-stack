import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { StringValue } from 'ms';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    const tokens = await this.generateTokens(user.id, user.email);
    await this.usersService.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.usersService.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      ...tokens,
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      
      const user = await this.usersService.findByIdWithRefreshToken(payload.sub);
      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isRefreshTokenValid = await bcrypt.compare(token, user.refreshToken);
      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user.id, user.email);
      return {
        user: { id: user.id, email: user.email, name: user.name },
        ...tokens,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: number) {
    await this.usersService.removeRefreshToken(userId);
    return { message: 'Logged out successfully' };
  }

  private async generateTokens(userId: number, email: string) {
    const payload = { sub: userId, email };
    
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as StringValue,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
