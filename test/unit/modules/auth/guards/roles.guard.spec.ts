/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { SupabaseService } from '@/modules/supabase/supabase.service';

describe('RolesGuard - Unit Tests', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let supabaseService: SupabaseService;

  const mockSupabaseService = {
    getClient: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        Reflector,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
    supabaseService = module.get<SupabaseService>(SupabaseService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockExecutionContext: Partial<ExecutionContext>;
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {
        user: {
          userId: 'test-user-id',
          email: 'test@example.com',
        },
      };

      mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;
    });

    it('should allow access when no roles are required', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const result = await guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is not authenticated', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['CITIZEN']);
      mockRequest.user = null;

      await expect(
        guard.canActivate(mockExecutionContext as ExecutionContext),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow access for CITIZEN role', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['CITIZEN']);

      mockSupabaseService.getClient().single.mockResolvedValueOnce({
        data: {
          role_id: 'citizen-role-id',
          roles: { code: 'CITIZEN' },
        },
        error: null,
      });

      const result = await guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(true);
      expect(mockRequest.user.role).toBe('CITIZEN');
      expect(mockRequest.user.roleId).toBe('citizen-role-id');
    });

    it('should allow access for MUNICIPALITY_STAFF role', async () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['MUNICIPALITY_STAFF']);

      mockSupabaseService.getClient().single.mockResolvedValueOnce({
        data: {
          role_id: 'staff-role-id',
          roles: { code: 'MUNICIPALITY_STAFF' },
        },
        error: null,
      });

      const result = await guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(true);
      expect(mockRequest.user.role).toBe('MUNICIPALITY_STAFF');
      expect(mockRequest.user.roleId).toBe('staff-role-id');
    });

    it('should throw ForbiddenException when user does not have required role', async () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['MUNICIPALITY_STAFF']);

      mockSupabaseService.getClient().single.mockResolvedValueOnce({
        data: {
          role_id: 'citizen-role-id',
          roles: { code: 'CITIZEN' },
        },
        error: null,
      });

      await expect(
        guard.canActivate(mockExecutionContext as ExecutionContext),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user role query fails', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['CITIZEN']);

      mockSupabaseService.getClient().single.mockResolvedValueOnce({
        data: null,
        error: new Error('Database error'),
      });

      await expect(
        guard.canActivate(mockExecutionContext as ExecutionContext),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user has no role assigned', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['CITIZEN']);

      mockSupabaseService.getClient().single.mockResolvedValueOnce({
        data: {
          role_id: 'some-role-id',
          roles: null,
        },
        error: null,
      });

      await expect(
        guard.canActivate(mockExecutionContext as ExecutionContext),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow access when user has one of multiple required roles', async () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['CITIZEN', 'MUNICIPALITY_STAFF']);

      mockSupabaseService.getClient().single.mockResolvedValueOnce({
        data: {
          role_id: 'citizen-role-id',
          roles: { code: 'CITIZEN' },
        },
        error: null,
      });

      const result = await guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(true);
      expect(mockRequest.user.role).toBe('CITIZEN');
    });
  });
});
