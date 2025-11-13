export interface JwtPayload {
  sub: string;
  email: string;
  role: 'authenticated' | 'anon';
  iat: number;
  exp: number;
}

export interface UserFromJwt {
  userId: string;
  email: string;
  role?: 'CITIZEN' | 'MUNICIPALITY_STAFF';
  roleId?: string;
}
