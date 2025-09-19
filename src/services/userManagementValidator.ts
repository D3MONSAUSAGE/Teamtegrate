import { UserRole } from '@/types';

/**
 * Validation service to prevent bypassing the central user management service
 */
export class UserManagementValidator {
  private static instance: UserManagementValidator;
  private validationLog: Array<{ timestamp: Date; action: string; source: string; userId?: string }> = [];

  private constructor() {}

  static getInstance(): UserManagementValidator {
    if (!UserManagementValidator.instance) {
      UserManagementValidator.instance = new UserManagementValidator();
    }
    return UserManagementValidator.instance;
  }

  /**
   * Log validation events for audit trail
   */
  private logValidation(action: string, source: string, userId?: string) {
    this.validationLog.push({
      timestamp: new Date(),
      action,
      source,
      userId
    });

    // Keep only last 1000 entries to prevent memory issues
    if (this.validationLog.length > 1000) {
      this.validationLog = this.validationLog.slice(-1000);
    }

    console.log(`🔍 UserManagementValidator: ${action} from ${source}`, { userId });
  }

  /**
   * Validate user creation request
   */
  validateUserCreation(email: string, name: string, role: UserRole, source: string): boolean {
    this.logValidation('validateUserCreation', source);

    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address');
    }

    if (!name || name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters');
    }

    const validRoles: UserRole[] = ['user', 'team_leader', 'manager', 'admin', 'superadmin'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid user role');
    }

    return true;
  }

  /**
   * Validate user update request
   */
  validateUserUpdate(userId: string, updates: any, source: string): boolean {
    this.logValidation('validateUserUpdate', source, userId);

    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID');
    }

    if (!updates || typeof updates !== 'object') {
      throw new Error('Invalid update data');
    }

    // Validate individual fields if present
    if (updates.email && !updates.email.includes('@')) {
      throw new Error('Invalid email address');
    }

    if (updates.name && updates.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters');
    }

    if (updates.role) {
      const validRoles: UserRole[] = ['user', 'team_leader', 'manager', 'admin', 'superadmin'];
      if (!validRoles.includes(updates.role)) {
        throw new Error('Invalid user role');
      }
    }

    return true;
  }

  /**
   * Validate role change request
   */
  validateRoleChange(userId: string, newRole: UserRole, source: string): boolean {
    this.logValidation('validateRoleChange', source, userId);

    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID');
    }

    const validRoles: UserRole[] = ['user', 'team_leader', 'manager', 'admin', 'superadmin'];
    if (!validRoles.includes(newRole)) {
      throw new Error('Invalid target role');
    }

    return true;
  }

  /**
   * Validate user deletion request
   */
  validateUserDeletion(userId: string, source: string): boolean {
    this.logValidation('validateUserDeletion', source, userId);

    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID');
    }

    return true;
  }

  /**
   * Get validation logs for debugging
   */
  getValidationLogs(limit: number = 100): Array<{ timestamp: Date; action: string; source: string; userId?: string }> {
    return this.validationLog.slice(-limit);
  }

  /**
   * Clear validation logs
   */
  clearValidationLogs(): void {
    this.validationLog = [];
    console.log('🧹 UserManagementValidator: Validation logs cleared');
  }
}

export const userManagementValidator = UserManagementValidator.getInstance();
