import { UserRole } from '../../../models/User';

export interface AuthContext {
  id: string;
  userId: string;
  email: string;
  role: UserRole;
}

export interface Resource {
  type: string;
  id?: string;
  ownerId?: string;
}

export interface Permission {
  action: string;
  resource: string;
  conditions?: Record<string, any>;
}

export interface IAuthorizationService {
  hasPermission(context: AuthContext, permission: Permission): boolean;
  hasRole(context: AuthContext, role: UserRole): boolean;
  hasAnyRole(context: AuthContext, roles: UserRole[]): boolean;
  canAccessResource(context: AuthContext, resource: Resource): boolean;
  getPermissionsForRole(role: UserRole): Permission[];
}