export type AdminAccountStatus =
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'PENDING'

export type AdminRole =
  | 'ADMIN'
  | 'SUPER_ADMIN'

export type ModuleStatus =
  | 'ENABLED'
  | 'DISABLED'

export interface SuperAdminAccount {
  id: number
  name: string
  email: string
  role: AdminRole
  status: AdminAccountStatus
  lastLogin: string
  createdDate: string
}

export interface SystemModule {
  id: number
  name: string
  code: string
  description: string
  status: ModuleStatus
  parentModule: string | null
}

export interface SuperAdminAuditLog {
  id: number
  actor: string
  role: AdminRole
  action: string
  target: string
  date: string
  ipAddress: string
}

export interface RolePermission {
  id: number
  permission: string
  admin: boolean
  superAdmin: boolean
}

export interface SystemHealthItem {
  id: number
  name: string
  value: string
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL'
}

export const superAdminStats = {
  totalUsers: 1250,
  activeUsers: 1104,
  totalAdmins: 6,
  activeAdmins: 5,
  suspendedUsers: 32,
  organisations: 85,
  openReports: 18,
  activeEvents: 24,
  openOpportunities: 41,
  enabledModules: 8,
  totalModules: 9,
  auditActionsToday: 27,
}

export const adminAccounts: SuperAdminAccount[] = [
  {
    id: 1,
    name: 'Meenakshi Rao',
    email: 'meenakshi.admin@example.com',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    lastLogin: '09 Oct 2026, 5:08 PM',
    createdDate: '15 Jul 2026',
  },
  {
    id: 2,
    name: 'Arjun Patel',
    email: 'arjun.admin@example.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    lastLogin: '09 Oct 2026, 4:42 PM',
    createdDate: '02 Aug 2026',
  },
  {
    id: 3,
    name: 'Sarah Wilson',
    email: 'sarah.admin@example.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    lastLogin: '09 Oct 2026, 2:15 PM',
    createdDate: '10 Aug 2026',
  },
  {
    id: 4,
    name: 'Daniel Lee',
    email: 'daniel.admin@example.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    lastLogin: '08 Oct 2026, 8:30 PM',
    createdDate: '18 Aug 2026',
  },
  {
    id: 5,
    name: 'Priya Sharma',
    email: 'priya.admin@example.com',
    role: 'ADMIN',
    status: 'PENDING',
    lastLogin: 'Never',
    createdDate: '09 Oct 2026',
  },
  {
    id: 6,
    name: 'James Brown',
    email: 'james.admin@example.com',
    role: 'ADMIN',
    status: 'SUSPENDED',
    lastLogin: '02 Oct 2026, 11:40 AM',
    createdDate: '22 Jul 2026',
  },
]

export const systemModules: SystemModule[] = [
  {
    id: 1,
    name: 'Profiles',
    code: 'PROFILE',
    description: 'Professional profiles, skills and achievements.',
    status: 'ENABLED',
    parentModule: null,
  },
  {
    id: 2,
    name: 'Portfolio',
    code: 'PORTFOLIO',
    description: 'Creative portfolio items, media and visibility.',
    status: 'ENABLED',
    parentModule: null,
  },
  {
    id: 3,
    name: 'Portfolio Comments',
    code: 'PORTFOLIO_COMMENTS',
    description: 'Comments and moderation for portfolio items.',
    status: 'ENABLED',
    parentModule: 'Portfolio',
  },
  {
    id: 4,
    name: 'Networking',
    code: 'NETWORKING',
    description: 'Posts, reactions and following.',
    status: 'ENABLED',
    parentModule: null,
  },
  {
    id: 5,
    name: 'Collaboration',
    code: 'COLLABORATION',
    description: 'Opportunities, applications and project teams.',
    status: 'ENABLED',
    parentModule: null,
  },
  {
    id: 6,
    name: 'Events',
    code: 'EVENTS',
    description: 'Creative events and registrations.',
    status: 'ENABLED',
    parentModule: null,
  },
  {
    id: 7,
    name: 'Payments',
    code: 'PAYMENTS',
    description: 'Event payment records and Stripe workflow.',
    status: 'ENABLED',
    parentModule: null,
  },
  {
    id: 8,
    name: 'Reports & Safety',
    code: 'REPORTS',
    description: 'Reporting, moderation and platform safety.',
    status: 'ENABLED',
    parentModule: null,
  },
  {
    id: 9,
    name: 'Public Portfolio Comments',
    code: 'PUBLIC_PORTFOLIO_COMMENTS',
    description: 'Optional public commenting feature.',
    status: 'DISABLED',
    parentModule: 'Portfolio',
  },
]

export const rolePermissions: RolePermission[] = [
  {
    id: 1,
    permission: 'View platform statistics',
    admin: true,
    superAdmin: true,
  },
  {
    id: 2,
    permission: 'Manage user status',
    admin: true,
    superAdmin: true,
  },
  {
    id: 3,
    permission: 'Review reports',
    admin: true,
    superAdmin: true,
  },
  {
    id: 4,
    permission: 'Moderate posts and portfolios',
    admin: true,
    superAdmin: true,
  },
  {
    id: 5,
    permission: 'Moderate events and opportunities',
    admin: true,
    superAdmin: true,
  },
  {
    id: 6,
    permission: 'View audit logs',
    admin: true,
    superAdmin: true,
  },
  {
    id: 7,
    permission: 'Create and remove admin accounts',
    admin: false,
    superAdmin: true,
  },
  {
    id: 8,
    permission: 'Change admin roles',
    admin: false,
    superAdmin: true,
  },
  {
    id: 9,
    permission: 'Enable or disable system modules',
    admin: false,
    superAdmin: true,
  },
  {
    id: 10,
    permission: 'Change system-wide settings',
    admin: false,
    superAdmin: true,
  },
]

export const superAdminAuditLogs: SuperAdminAuditLog[] = [
  {
    id: 9001,
    actor: 'Meenakshi Rao',
    role: 'SUPER_ADMIN',
    action: 'ADMIN_CREATED',
    target: 'Priya Sharma',
    date: '09 Oct 2026, 4:55 PM',
    ipAddress: '192.168.1.10',
  },
  {
    id: 9002,
    actor: 'Arjun Patel',
    role: 'ADMIN',
    action: 'USER_SUSPENDED',
    target: 'Daniel Wilson',
    date: '09 Oct 2026, 4:20 PM',
    ipAddress: '192.168.1.24',
  },
  {
    id: 9003,
    actor: 'Sarah Wilson',
    role: 'ADMIN',
    action: 'REPORT_RESOLVED',
    target: 'Report #102',
    date: '09 Oct 2026, 3:42 PM',
    ipAddress: '192.168.1.31',
  },
  {
    id: 9004,
    actor: 'Meenakshi Rao',
    role: 'SUPER_ADMIN',
    action: 'MODULE_DISABLED',
    target: 'Public Portfolio Comments',
    date: '09 Oct 2026, 1:15 PM',
    ipAddress: '192.168.1.10',
  },
  {
    id: 9005,
    actor: 'Daniel Lee',
    role: 'ADMIN',
    action: 'EVENT_STATUS_CHANGED',
    target: 'Creative Photography Meetup',
    date: '08 Oct 2026, 8:12 PM',
    ipAddress: '192.168.1.45',
  },
]

export const systemHealth: SystemHealthItem[] = [
  {
    id: 1,
    name: 'Frontend',
    value: 'Online',
    status: 'HEALTHY',
  },
  {
    id: 2,
    name: 'Backend API',
    value: 'Mock / pending integration',
    status: 'WARNING',
  },
  {
    id: 3,
    name: 'MySQL Database',
    value: 'Schema ready',
    status: 'HEALTHY',
  },
  {
    id: 4,
    name: 'Authentication',
    value: 'JWT configured',
    status: 'HEALTHY',
  },
  {
    id: 5,
    name: 'Payments',
    value: 'Integration pending',
    status: 'WARNING',
  },
]

export const systemUsageTrend = [
  {
    month: 'May',
    users: 710,
    admins: 3,
    reports: 28,
  },
  {
    month: 'Jun',
    users: 790,
    admins: 3,
    reports: 34,
  },
  {
    month: 'Jul',
    users: 890,
    admins: 4,
    reports: 39,
  },
  {
    month: 'Aug',
    users: 1005,
    admins: 4,
    reports: 31,
  },
  {
    month: 'Sep',
    users: 1134,
    admins: 5,
    reports: 25,
  },
  {
    month: 'Oct',
    users: 1250,
    admins: 6,
    reports: 18,
  },
]
