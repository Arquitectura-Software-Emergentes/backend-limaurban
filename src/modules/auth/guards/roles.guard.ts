import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { SupabaseService } from '../../supabase/supabase.service';
import { UserFromJwt } from '../interfaces/jwt-payload.interface';

type RoleCode = 'CITIZEN' | 'MUNICIPALITY_STAFF';

interface RequestWithUser extends Request {
  user: UserFromJwt;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private supabaseService: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<RoleCode[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || !user.userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const { data: userData, error: userError } = await this.supabaseService
      .getClient()
      .from('users')
      .select(
        `
        role_id,
        roles (
          code
        )
      `,
      )
      .eq('id', user.userId)
      .single();

    if (userError || !userData) {
      throw new ForbiddenException('Failed to fetch user data');
    }

    interface UserRole {
      role_id: string;
      roles: { code: string } | null;
    }

    const userRoleData = userData as unknown as UserRole;
    const userRoleCode = userRoleData.roles?.code as RoleCode | undefined;

    if (!userRoleCode) {
      throw new ForbiddenException('User does not have a valid role assigned');
    }

    const hasRole = requiredRoles.includes(userRoleCode);

    if (!hasRole) {
      throw new ForbiddenException(
        `User does not have required roles: ${requiredRoles.join(', ')}. User role: ${userRoleCode}`,
      );
    }

    request.user.role = userRoleCode;
    request.user.roleId = userRoleData.role_id;

    return true;
  }
}
