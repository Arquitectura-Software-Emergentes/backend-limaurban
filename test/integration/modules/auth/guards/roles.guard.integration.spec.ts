import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { SupabaseService } from '@/modules/supabase/supabase.service';
import { ConfigModule } from '@nestjs/config';

describe('RolesGuard - Integration Tests with Real DB', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let supabaseService: SupabaseService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
      ],
      providers: [RolesGuard, Reflector, SupabaseService],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
    supabaseService = module.get<SupabaseService>(SupabaseService);

    // Wait for SupabaseService to initialize
    await module.init();
  });

  describe('Real Database Integration', () => {
    const REAL_USERS = {
      STEVE_CITIZEN: {
        id: '9d9011e4-1049-4a35-8201-ea3a8afb7e79',
        name: 'Steve Roger Castillo Robles',
        expectedRole: 'CITIZEN',
      },
      BARBARA_STAFF: {
        id: '92ca983e-0dff-4b28-b6e7-846d531bb728',
        name: 'Bárbara Quezada',
        expectedRole: 'MUNICIPALITY_STAFF',
      },
      JIMENA_STAFF: {
        id: 'b1abe629-285f-4637-93e7-ab2cb7d71bf6',
        name: 'Jimena Cama',
        expectedRole: 'MUNICIPALITY_STAFF',
      },
    };

    it('should fetch CITIZEN role for Steve', async () => {
      const supabase = supabaseService.getClient();

      const { data, error } = await supabase
        .from('users')
        .select(
          `
          id,
          full_name,
          role_id,
          role:roles!role_id (code, description)
        `,
        )
        .eq('id', REAL_USERS.STEVE_CITIZEN.id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      if (!data) throw new Error('Data is null');

      expect(data.full_name).toBe(REAL_USERS.STEVE_CITIZEN.name);
      expect(data.role).toBeDefined();
      const roleCode = Array.isArray(data.role)
        ? (data.role[0] as { code: string })?.code
        : (data.role as { code: string })?.code;
      expect(roleCode).toBe(REAL_USERS.STEVE_CITIZEN.expectedRole);
    });

    it('should fetch MUNICIPALITY_STAFF role for Bárbara', async () => {
      const supabase = supabaseService.getClient();

      const { data, error } = await supabase
        .from('users')
        .select(
          `
          id,
          full_name,
          role_id,
          role:roles!role_id (code, description)
        `,
        )
        .eq('id', REAL_USERS.BARBARA_STAFF.id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      if (!data) throw new Error('Data is null');

      expect(data.full_name).toBe(REAL_USERS.BARBARA_STAFF.name);
      expect(data.role).toBeDefined();
      const roleCode = Array.isArray(data.role)
        ? (data.role[0] as { code: string })?.code
        : (data.role as { code: string })?.code;
      expect(roleCode).toBe(REAL_USERS.BARBARA_STAFF.expectedRole);
    });

    it('should fetch MUNICIPALITY_STAFF role for Jimena', async () => {
      const supabase = supabaseService.getClient();

      const { data, error } = await supabase
        .from('users')
        .select(
          `
          id,
          full_name,
          role_id,
          role:roles!role_id (code, description)
        `,
        )
        .eq('id', REAL_USERS.JIMENA_STAFF.id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      if (!data) throw new Error('Data is null');

      expect(data.full_name).toBe(REAL_USERS.JIMENA_STAFF.name);
      expect(data.role).toBeDefined();
      const roleCode = Array.isArray(data.role)
        ? (data.role[0] as { code: string })?.code
        : (data.role as { code: string })?.code;
      expect(roleCode).toBe(REAL_USERS.JIMENA_STAFF.expectedRole);
    });

    it('should allow CITIZEN to access endpoint with @Roles("CITIZEN")', async () => {
      const mockExecutionContext: Partial<ExecutionContext> = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { userId: REAL_USERS.STEVE_CITIZEN.id },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      };

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['CITIZEN']);

      const result = await guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(true);
    });

    it('should allow MUNICIPALITY_STAFF to access endpoint with @Roles("MUNICIPALITY_STAFF")', async () => {
      const mockExecutionContext: Partial<ExecutionContext> = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { userId: REAL_USERS.BARBARA_STAFF.id },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      };

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['MUNICIPALITY_STAFF']);

      const result = await guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(true);
    });

    it('should reject CITIZEN trying to access MUNICIPALITY_STAFF endpoint', async () => {
      const mockExecutionContext: Partial<ExecutionContext> = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { userId: REAL_USERS.STEVE_CITIZEN.id },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      };

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['MUNICIPALITY_STAFF']);

      await expect(
        guard.canActivate(mockExecutionContext as ExecutionContext),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow MUNICIPALITY_STAFF to access endpoint requiring CITIZEN or MUNICIPALITY_STAFF', async () => {
      const mockExecutionContext: Partial<ExecutionContext> = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { userId: REAL_USERS.JIMENA_STAFF.id },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      };

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['CITIZEN', 'MUNICIPALITY_STAFF']);

      const result = await guard.canActivate(
        mockExecutionContext as ExecutionContext,
      );

      expect(result).toBe(true);
    });

    it('should verify all 3 users exist in database', async () => {
      const supabase = supabaseService.getClient();

      const { data, error } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', [
          REAL_USERS.STEVE_CITIZEN.id,
          REAL_USERS.BARBARA_STAFF.id,
          REAL_USERS.JIMENA_STAFF.id,
        ]);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      if (!data) throw new Error('Data is null');

      expect(data).toHaveLength(3);
    });

    it('should verify exactly 2 roles exist (CITIZEN, MUNICIPALITY_STAFF)', async () => {
      const supabase = supabaseService.getClient();

      const { data, error } = await supabase
        .from('roles')
        .select('role_id, code, description')
        .order('code');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      if (!data) throw new Error('Data is null');

      expect(data).toHaveLength(2);
      expect(data.map((r: { code: string }) => r.code)).toEqual([
        'CITIZEN',
        'MUNICIPALITY_STAFF',
      ]);
    });
  });
});
