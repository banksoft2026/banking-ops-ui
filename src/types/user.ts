export interface User {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  employeeId?: string;
  department?: string;
  branchCode?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'SUSPENDED';
  mfaEnabled?: boolean;
  failedLoginCount?: number;
  lastLoginAt?: string;
  lastLoginIp?: string;
  mustChangePassword?: boolean;
  createdAt?: string;
  roles?: RoleSummary[];
}

export interface RoleSummary {
  roleId: string;
  roleCode: string;
  roleName: string;
  roleLevel: string;
  isPrimaryRole: boolean;
}

export interface Role {
  roleId: string;
  roleCode: string;
  roleName: string;
  roleLevel: 'ADMIN' | 'CHECKER' | 'MAKER' | 'VIEWER';
  description?: string;
  isSystem: boolean;
  requiresMfa?: boolean;
  sessionTimeoutMin?: number;
  isActive: boolean;
  createdAt?: string;
  userCount?: number;
}
