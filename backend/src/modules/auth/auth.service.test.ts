import { describe, test, expect, beforeEach, afterEach, vi } from 'bun:test';
import { UnauthorizedException, ConflictException } from '@nestjs/common';

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2b$10$hashedpassword'),
    compare: vi.fn().mockResolvedValue(true),
  },
  hash: vi.fn().mockResolvedValue('$2b$10$hashedpassword'),
  compare: vi.fn().mockResolvedValue(true),
}));

vi.mock('../users/users.service', () => ({
  UsersService: vi.fn().mockImplementation(() => ({
    findByEmail: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    saveRefreshToken: vi.fn(),
    removeRefreshToken: vi.fn(),
  })),
}));

vi.mock('@nestjs/jwt', () => ({
  JwtService: vi.fn().mockImplementation(() => ({
    signAsync: vi.fn().mockResolvedValue('mock-token'),
    verify: vi.fn(),
  })),
}));

import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUsersService: any;
  let mockJwtService: any;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    password: '$2b$10$hashedpassword',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUsersService = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      saveRefreshToken: vi.fn(),
      removeRefreshToken: vi.fn(),
    };

    mockJwtService = {
      signAsync: vi.fn().mockResolvedValue('mock-token'),
      verify: vi.fn(),
    };

    (UsersService as any).mockImplementation(() => mockUsersService);
    (JwtService as any).mockImplementation(() => mockJwtService);

    authService = new AuthService(
      mockUsersService as UsersService,
      mockJwtService as JwtService,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('register', () => {
    test('should register a new user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      });
      mockUsersService.saveRefreshToken.mockResolvedValue(undefined);

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@example.com');
      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: '$2b$10$hashedpassword',
        name: 'Test User',
      });
    });

    test('should throw ConflictException if email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    test('should login with valid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.saveRefreshToken.mockResolvedValue(undefined);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@example.com');
    });

    test('should throw UnauthorizedException for non-existent user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    test('should throw UnauthorizedException for invalid password', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    test('should logout successfully', async () => {
      mockUsersService.removeRefreshToken.mockResolvedValue(undefined);

      const result = await authService.logout(1);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(mockUsersService.removeRefreshToken).toHaveBeenCalledWith(1);
    });
  });

  describe('refreshToken', () => {
    test('should refresh tokens with valid refresh token', async () => {
      const mockUserWithToken = {
        ...mockUser,
        refreshToken: '$2b$10$validrefreshtoken',
      };
      mockJwtService.verify.mockReturnValue({ sub: 1, email: 'test@example.com' });
      mockUsersService.findById.mockResolvedValue(mockUserWithToken);
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await authService.refreshToken('valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    test('should throw UnauthorizedException for invalid refresh token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(
        authService.refreshToken('invalid-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
