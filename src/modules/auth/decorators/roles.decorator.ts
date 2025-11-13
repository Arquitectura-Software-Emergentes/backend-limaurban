import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

type RoleCode = 'CITIZEN' | 'MUNICIPALITY_STAFF';

export const Roles = (...roles: RoleCode[]) => SetMetadata(ROLES_KEY, roles);
