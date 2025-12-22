import { UserRole } from '../../../models/User';
import { 
  IAuthorizationService, 
  AuthContext, 
  Permission, 
  Resource 
} from '../interfaces/IAuthorizationService';

export class AuthorizationService implements IAuthorizationService {
  private readonly roleHierarchy: Map<UserRole, UserRole[]> = new Map([
    [UserRole.ADMIN, [UserRole.ADMIN, UserRole.STAFF, UserRole.RIDER, UserRole.CUSTOMER]],
    [UserRole.STAFF, [UserRole.STAFF, UserRole.CUSTOMER]],
    [UserRole.RIDER, [UserRole.RIDER, UserRole.CUSTOMER]],
    [UserRole.CUSTOMER, [UserRole.CUSTOMER]],
  ]);

  private readonly rolePermissions: Map<UserRole, Permission[]> = new Map([
    [UserRole.ADMIN, [
      { action: 'create', resource: 'product' },
      { action: 'update', resource: 'product' },
      { action: 'delete', resource: 'product' },
      { action: 'read', resource: 'product' },
      { action: 'create', resource: 'promo' },
      { action: 'update', resource: 'promo' },
      { action: 'delete', resource: 'promo' },
      { action: 'read', resource: 'promo' },
      { action: 'read', resource: 'order' },
      { action: 'update', resource: 'order' },
      { action: 'read', resource: 'user' },
      { action: 'update', resource: 'user' },
      { action: 'read', resource: 'analytics' },
    ]],
    [UserRole.STAFF, [
      { action: 'read', resource: 'product' },
      { action: 'read', resource: 'order' },
      { action: 'update', resource: 'order' },
      { action: 'read', resource: 'promo' },
    ]],
    [UserRole.RIDER, [
      { action: 'read', resource: 'product' },
      { action: 'read', resource: 'order', conditions: { status: 'assigned' } },
      { action: 'update', resource: 'order', conditions: { assignedTo: 'self' } },
    ]],
    [UserRole.CUSTOMER, [
      { action: 'read', resource: 'product' },
      { action: 'create', resource: 'order' },
      { action: 'read', resource: 'order', conditions: { owner: 'self' } },
      { action: 'update', resource: 'order', conditions: { owner: 'self', status: 'pending' } },
      { action: 'create', resource: 'review' },
      { action: 'read', resource: 'review' },
      { action: 'update', resource: 'review', conditions: { owner: 'self' } },
      { action: 'delete', resource: 'review', conditions: { owner: 'self' } },
      { action: 'read', resource: 'cart', conditions: { owner: 'self' } },
      { action: 'update', resource: 'cart', conditions: { owner: 'self' } },
      { action: 'read', resource: 'loyalty', conditions: { owner: 'self' } },
    ]],
  ]);

  public hasPermission(context: AuthContext, permission: Permission): boolean {
    const userPermissions = this.getPermissionsForRole(context.role);
    
    return userPermissions.some(userPerm => {
      if (userPerm.action !== permission.action || userPerm.resource !== permission.resource) {
        return false;
      }

      // Check conditions if present
      if (userPerm.conditions) {
        return this.evaluateConditions(context, userPerm.conditions, permission.conditions);
      }

      return true;
    });
  }

  public hasRole(context: AuthContext, role: UserRole): boolean {
    return context.role === role;
  }

  public hasAnyRole(context: AuthContext, roles: UserRole[]): boolean {
    return roles.includes(context.role);
  }

  public canAccessResource(context: AuthContext, resource: Resource): boolean {
    // Check if user has general access to resource type
    const hasGeneralAccess = this.hasPermission(context, {
      action: 'read',
      resource: resource.type,
    });

    if (!hasGeneralAccess) {
      return false;
    }

    // Check ownership conditions
    if (resource.ownerId && resource.ownerId !== context.userId) {
      const userPermissions = this.getPermissionsForRole(context.role);
      const relevantPermission = userPermissions.find(
        p => p.action === 'read' && p.resource === resource.type
      );

      if (relevantPermission?.conditions?.owner === 'self') {
        return false;
      }
    }

    return true;
  }

  public getPermissionsForRole(role: UserRole): Permission[] {
    return this.rolePermissions.get(role) || [];
  }

  public hasRoleOrHigher(context: AuthContext, minimumRole: UserRole): boolean {
    const userRoles = this.roleHierarchy.get(context.role) || [];
    return userRoles.includes(minimumRole);
  }

  public canAssignRole(context: AuthContext, targetRole: UserRole): boolean {
    // Only admins can assign roles, and they can't assign higher roles than their own
    if (context.role !== UserRole.ADMIN) {
      return false;
    }

    const adminRoles = this.roleHierarchy.get(UserRole.ADMIN) || [];
    return adminRoles.includes(targetRole);
  }

  public getAccessibleResources(context: AuthContext, resourceType: string): string[] {
    const permissions = this.getPermissionsForRole(context.role);
    const relevantPermissions = permissions.filter(p => p.resource === resourceType);
    
    return relevantPermissions.map(p => p.action);
  }

  private evaluateConditions(
    context: AuthContext,
    permissionConditions: Record<string, any>,
    requestConditions?: Record<string, any>
  ): boolean {
    for (const [key, value] of Object.entries(permissionConditions)) {
      switch (key) {
        case 'owner':
          if (value === 'self' && requestConditions?.owner !== context.userId) {
            return false;
          }
          break;
        case 'assignedTo':
          if (value === 'self' && requestConditions?.assignedTo !== context.userId) {
            return false;
          }
          break;
        case 'status':
          if (requestConditions?.status && requestConditions.status !== value) {
            return false;
          }
          break;
        default:
          // Generic condition matching
          if (requestConditions?.[key] && requestConditions[key] !== value) {
            return false;
          }
      }
    }

    return true;
  }
}