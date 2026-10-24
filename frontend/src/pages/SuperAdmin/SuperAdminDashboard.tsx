import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import './SuperAdminDashboard.css'



type Section =
  | 'overview'
  | 'admins'
  | 'reports'
  | 'users'
  | 'moderation'
  | 'analytics'
  | 'access'
  | 'system'
  | 'audit'


type OverviewPeriod =
  | 'today'
  | '7d'
  | '30d'


type AdminStatus =
  | 'ACTIVE'
  | 'SUSPENDED'


type ReportStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'RESOLVED'
  | 'DISMISSED'
  | 'ESCALATED'


type ReportPriority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'URGENT'


type AssignmentStrategy =
  | 'LEAST_WORKLOAD'
  | 'ROUND_ROBIN'
  | 'PRIORITY_BASED'


type AdminAccount = {
  id: number
  name: string
  email: string
  status: AdminStatus
  assignedReports: number
  resolvedToday: number
  lastActive: string
  accessEnabled: boolean
  canManageUsers: boolean
  canReviewReports: boolean
  canModerateContent: boolean
  canViewAnalytics: boolean
  username?: string
  createdAt?: string
  forcePasswordChange?: boolean
}


type CandidateUser = {
  id: number
  name: string
  email: string
  role: string
}


type ManagedUser = {
  id: number
  name: string
  email: string
  role: string
  status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED'
}


type ModerationItem = {
  id: number
  type: 'POST' | 'PORTFOLIO' | 'EVENT' | 'OPPORTUNITY'
  title: string
  owner: string
  status: 'VISIBLE' | 'REMOVED'
}


type Report = {
  id: number
  target: string
  reason: string
  priority: ReportPriority
  status: ReportStatus
  assignedAdminId: number | null
  createdAt: string
  ageHours: number
  history?: string[]
  notes?: string[]
}


type PlatformModule = {
  id: string
  name: string
  description: string
  enabled: boolean
}


type AuditLog = {
  id: number
  admin: string
  action: string
  target: string
  time: string
}


type Toast = {
  type:
    | 'success'
    | 'error'
  message: string
} | null


const initialAdmins: AdminAccount[] = [
  {
    id: 2,
    name: 'Arjun Patel',
    email: 'arjun@example.com',
    status: 'ACTIVE',
    assignedReports: 4,
    resolvedToday: 8,
    lastActive: '2 min ago',
    accessEnabled: true,
    canManageUsers: true,
    canReviewReports: true,
    canModerateContent: true,
    canViewAnalytics: true,
  },
  {
    id: 3,
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    status: 'ACTIVE',
    assignedReports: 2,
    resolvedToday: 9,
    lastActive: '5 min ago',
    accessEnabled: true,
    canManageUsers: true,
    canReviewReports: true,
    canModerateContent: true,
    canViewAnalytics: true,
  },
  {
    id: 4,
    name: 'Daniel Lee',
    email: 'daniel@example.com',
    status: 'ACTIVE',
    assignedReports: 3,
    resolvedToday: 5,
    lastActive: '12 min ago',
    accessEnabled: true,
    canManageUsers: true,
    canReviewReports: true,
    canModerateContent: true,
    canViewAnalytics: true,
  },
  {
    id: 5,
    name: 'Emily Carter',
    email: 'emily@example.com',
    status: 'SUSPENDED',
    assignedReports: 0,
    resolvedToday: 2,
    lastActive: '2 days ago',
    accessEnabled: false,
    canManageUsers: false,
    canReviewReports: false,
    canModerateContent: false,
    canViewAnalytics: true,
  },
]


const candidateUsers: CandidateUser[] = [
  {
    id: 21,
    name: 'Ravi Kumar',
    email: 'ravi@example.com',
    role: 'CREATIVE_PROFESSIONAL',
  },
  {
    id: 22,
    name: 'Priya Sharma',
    email: 'priya@example.com',
    role: 'CREATIVE_PROFESSIONAL',
  },
  {
    id: 23,
    name: 'James Brown',
    email: 'james@example.com',
    role: 'ORGANISATION',
  },
]


const initialUsers: ManagedUser[] = [
  { id: 21, name: 'Ravi Kumar', email: 'ravi@example.com', role: 'CREATIVE_PROFESSIONAL', status: 'ACTIVE' },
  { id: 22, name: 'Priya Sharma', email: 'priya@example.com', role: 'CREATIVE_PROFESSIONAL', status: 'ACTIVE' },
  { id: 23, name: 'James Brown', email: 'james@example.com', role: 'ORGANISATION', status: 'ACTIVE' },
  { id: 24, name: 'Emily Carter', email: 'emily@example.com', role: 'CREATIVE_PROFESSIONAL', status: 'SUSPENDED' },
  { id: 25, name: 'Maya Chen', email: 'maya@example.com', role: 'CREATIVE_PROFESSIONAL', status: 'ACTIVE' },
]


const initialModerationItems: ModerationItem[] = [
  { id: 240, type: 'POST', title: 'Photography Showcase', owner: 'Ravi Kumar', status: 'VISIBLE' },
  { id: 76, type: 'PORTFOLIO', title: 'Brand Identity Project', owner: 'Priya Sharma', status: 'VISIBLE' },
  { id: 31, type: 'EVENT', title: 'Creative Networking Night', owner: 'Adelaide Creatives', status: 'VISIBLE' },
  { id: 51, type: 'OPPORTUNITY', title: 'Short Film Collaboration', owner: 'Daniel Lee', status: 'REMOVED' },
]


const initialReports: Report[] = [
  {
    id: 104,
    target: 'Post #240',
    reason: 'Harassment',
    priority: 'HIGH',
    status: 'OPEN',
    assignedAdminId: null,
    createdAt: 'Today 11:28 AM',
    ageHours: 5,
  },
  {
    id: 105,
    target: 'User #58',
    reason: 'Spam',
    priority: 'MEDIUM',
    status: 'UNDER_REVIEW',
    assignedAdminId: 2,
    createdAt: 'Today 10:45 AM',
    ageHours: 7,
  },
  {
    id: 106,
    target: 'Event #31',
    reason: 'Misleading information',
    priority: 'LOW',
    status: 'OPEN',
    assignedAdminId: 3,
    createdAt: 'Today 9:30 AM',
    ageHours: 8,
  },
  {
    id: 107,
    target: 'Portfolio #76',
    reason: 'Inappropriate content',
    priority: 'URGENT',
    status: 'OPEN',
    assignedAdminId: null,
    createdAt: 'Today 8:18 AM',
    ageHours: 14,
  },
  {
    id: 108,
    target: 'User #73',
    reason: 'Fake account',
    priority: 'HIGH',
    status: 'UNDER_REVIEW',
    assignedAdminId: 4,
    createdAt: 'Yesterday',
    ageHours: 28,
  },
  {
    id: 109,
    target: 'Opportunity #18',
    reason: 'Potential scam',
    priority: 'URGENT',
    status: 'ESCALATED',
    assignedAdminId: null,
    createdAt: 'Yesterday',
    ageHours: 31,
  },
]


const initialModules: PlatformModule[] = [
  {
    id: 'profiles',
    name: 'Profiles & Portfolios',
    description:
      'Professional profile and portfolio features',
    enabled: true,
  },
  {
    id: 'collaboration',
    name: 'Collaboration',
    description:
      'Collaboration opportunities and applications',
    enabled: true,
  },
  {
    id: 'events',
    name: 'Events',
    description:
      'Event creation, discovery and registrations',
    enabled: true,
  },
  {
    id: 'comments',
    name: 'Portfolio Comments',
    description:
      'Comments and feedback on creative work',
    enabled: true,
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description:
      'Platform notification delivery',
    enabled: true,
  },
  {
    id: 'maintenance',
    name: 'Maintenance Mode',
    description:
      'Restrict platform access during maintenance',
    enabled: false,
  },
]


const initialAuditLogs: AuditLog[] = [
  {
    id: 1,
    admin: 'Super Admin',
    action: 'ASSIGN_REPORT',
    target: 'Report #105 → Arjun Patel',
    time: '11:28 AM',
  },
  {
    id: 2,
    admin: 'Sarah Wilson',
    action: 'RESOLVE_REPORT',
    target: 'Report #98',
    time: '11:16 AM',
  },
  {
    id: 3,
    admin: 'Super Admin',
    action: 'ADD_ADMIN',
    target: 'Daniel Lee',
    time: '10:54 AM',
  },
  {
    id: 4,
    admin: 'Arjun Patel',
    action: 'SUSPEND_USER',
    target: 'User #58',
    time: '10:21 AM',
  },
]


type SuperOverviewPoint = {
  label: string
  reports: number
  moderation: number
}


function SuperOverviewLineChart({
  data,
  dataKey,
}: {
  data: SuperOverviewPoint[]
  dataKey: 'reports' | 'moderation'
}) {
  const width = 640
  const height = 220
  const padding = 30

  const values = data.map(item => Number(item[dataKey]))
  const maximum = Math.max(...values, 1)
  const minimum = Math.min(...values, 0)
  const range = maximum - minimum || 1

  const points = data.map((item, index) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2)
    const y = height - padding - ((Number(item[dataKey]) - minimum) / range) * (height - padding * 2)
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="super-overview-chart-wrapper">
      <svg
        className="super-overview-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Super Admin overview trend chart"
      >
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          className="super-overview-chart-axis"
        />

        <polyline
          points={points}
          fill="none"
          className="super-overview-chart-line"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {data.map((item, index) => {
          const x = padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2)
          const y = height - padding - ((Number(item[dataKey]) - minimum) / range) * (height - padding * 2)

          return (
            <g key={`${item.label}-${index}`}>
              <circle cx={x} cy={y} r="5" className="super-overview-chart-dot" />
              <text
                x={x}
                y={height - 8}
                textAnchor="middle"
                className="super-overview-chart-label"
              >
                {item.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}


function SuperAdminDashboard() {

  const [section, setSection] =
    useState<Section>('overview')

  const [period, setPeriod] =
    useState<OverviewPeriod>('today')

  const [admins, setAdmins] =
    useState(initialAdmins)

  const [reports, setReports] =
    useState(initialReports)


  const [users, setUsers] =
    useState<ManagedUser[]>(initialUsers)

  const [moderationItems, setModerationItems] =
    useState<ModerationItem[]>(initialModerationItems)

  const [modules, setModules] =
    useState(initialModules)

  const [auditLogs, setAuditLogs] =
    useState(initialAuditLogs)

  const [toast, setToast] =
    useState<Toast>(null)

  const [clock, setClock] =
    useState(new Date())

  const [updatedAt, setUpdatedAt] =
    useState(new Date())

  const [
    notificationsOpen,
    setNotificationsOpen
  ] = useState(false)


  const [dismissedNotificationIds, setDismissedNotificationIds] =
    useState<string[]>([])

  const [
    autoAssignEnabled,
    setAutoAssignEnabled
  ] = useState(true)

  const [
    assignmentStrategy,
    setAssignmentStrategy
  ] = useState<AssignmentStrategy>(
    'LEAST_WORKLOAD'
  )

  const [
    roundRobinIndex,
    setRoundRobinIndex
  ] = useState(0)

  const [
    adminSearch,
    setAdminSearch
  ] = useState('')

  const [
    reportSearch,
    setReportSearch
  ] = useState('')

  const [
    reportFilter,
    setReportFilter
  ] = useState<
    'ALL' |
    'ASSIGNED' |
    'UNASSIGNED'
  >('ALL')

  const [
    priorityFilter,
    setPriorityFilter
  ] = useState<
    'ALL' |
    ReportPriority
  >('ALL')

  const [userSearch, setUserSearch] = useState('')
  const [userStatusFilter, setUserStatusFilter] = useState('ALL')
  const [moderationSearch, setModerationSearch] = useState('')

  const [
    auditSearch,
    setAuditSearch
  ] = useState('')

  const [
    selectedCandidate,
    setSelectedCandidate
  ] = useState(
    candidateUsers[0]?.id ?? 0
  )


  const [addAdminOpen, setAddAdminOpen] = useState(false)
  const [promoteExistingOpen, setPromoteExistingOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<AdminAccount | null>(null)
  const [selectedReportDetail, setSelectedReportDetail] = useState<Report | null>(null)
  const [reportNote, setReportNote] = useState('')
  const [maxReportsPerAdmin, setMaxReportsPerAdmin] = useState(8)
  const [announcementAudience, setAnnouncementAudience] = useState('ALL_USERS')
  const [announcementText, setAnnouncementText] = useState('')
  const [lastAnnouncement, setLastAnnouncement] = useState<string | null>(null)
  const [newAdmin, setNewAdmin] = useState({
    fullName: '',
    username: '',
    email: '',
    temporaryPassword: '',
    status: 'ACTIVE' as AdminStatus,
    forcePasswordChange: true,
  })


  useEffect(() => {

    const timer =
      window.setInterval(
        () =>
          setClock(
            new Date()
          ),
        1000
      )

    return () =>
      window.clearInterval(
        timer
      )

  }, [])


  useEffect(() => {

    if (!toast) {
      return
    }

    const timer =
      window.setTimeout(
        () =>
          setToast(null),
        2500
      )

    return () =>
      window.clearTimeout(
        timer
      )

  }, [toast])


  const activeAdmins =
    admins.filter(
      admin =>
        admin.status ===
          'ACTIVE'
        &&
        admin.accessEnabled
    )


  const unassignedReports =
    reports.filter(
      report =>
        report.assignedAdminId ===
          null
        &&
        report.status !==
          'RESOLVED'
        &&
        report.status !==
          'DISMISSED'
    )


  const urgentReports =
    reports.filter(
      report =>
        report.priority ===
          'URGENT'
        &&
        report.status !==
          'RESOLVED'
    )


  const addAudit =
    (
      action: string,
      target: string,
      actor = 'Super Admin'
    ) => {

      const log: AuditLog = {
        id: Date.now(),
        admin: actor,
        action,
        target,
        time:
          new Date()
            .toLocaleTimeString(
              'en-AU',
              {
                hour:
                  '2-digit',
                minute:
                  '2-digit',
              }
            ),
      }

      setAuditLogs(
        current => [
          log,
          ...current,
        ]
      )
    }


  const updateWorkloads =
    (
      nextReports: Report[]
    ) => {

      setAdmins(
        current =>
          current.map(
            admin => ({
              ...admin,

              assignedReports:
                nextReports.filter(
                  report =>
                    report
                      .assignedAdminId
                    ===
                    admin.id
                    &&
                    report.status
                    !==
                    'RESOLVED'
                    &&
                    report.status
                    !==
                    'DISMISSED'
                ).length,
            })
          )
      )
    }


  const selectAdminForReport =
    (
      report: Report
    ):
      AdminAccount |
      null => {

      const eligibleAdmins =
        activeAdmins.filter(
          admin =>
            admin.assignedReports <
            maxReportsPerAdmin
        )

      if (
        eligibleAdmins.length ===
        0
      ) {
        return null
      }

      if (
        assignmentStrategy ===
        'ROUND_ROBIN'
      ) {

        return (
          eligibleAdmins[
            roundRobinIndex
            %
            eligibleAdmins.length
          ]
        )
      }

      if (
        assignmentStrategy ===
          'PRIORITY_BASED'
        &&
        report.priority ===
          'URGENT'
      ) {

        return [
          ...eligibleAdmins
        ].sort(
          (a, b) =>
            b.resolvedToday
            -
            a.resolvedToday
        )[0]
      }

      return [
        ...eligibleAdmins
      ].sort(
        (a, b) =>
          a.assignedReports
          -
          b.assignedReports
      )[0]
    }

  const assignReport =
    (
      reportId: number,
      adminId: number
    ) => {

      const admin =
        admins.find(
          item =>
            item.id ===
            adminId
        )

      if (
        !admin
        ||
        admin.status !==
          'ACTIVE'
        ||
        !admin.accessEnabled
      ) {

        setToast({
          type: 'error',
          message:
            'Selected Admin is not available.',
        })

        return
      }

      setReports(
        current => {

          const next =
            current.map(
              report =>
                report.id ===
                reportId
                  ? {
                      ...report,
                      assignedAdminId:
                        adminId,
                      history: [
                        ...(report.history ?? []),
                        `${new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}: assigned to ${admin.name}`,
                      ],
                    }
                  :
                    report
            )

          updateWorkloads(
            next
          )

          return next
        }
      )

      addAudit(
        'ASSIGN_REPORT',
        `Report #${reportId} → ${admin.name}`
      )

      setToast({
        type: 'success',
        message:
          `Report #${reportId} assigned to ${admin.name}.`,
      })
    }


  const autoAssignOne =
    (
      report: Report
    ) => {

      const admin =
        selectAdminForReport(
          report
        )

      if (!admin) {

        setToast({
          type: 'error',
          message:
            'No active Admin is available.',
        })

        return
      }

      assignReport(
        report.id,
        admin.id
      )

      if (
        assignmentStrategy ===
        'ROUND_ROBIN'
      ) {

        setRoundRobinIndex(
          index =>
            index + 1
        )
      }
    }


  const autoAssignAll = () => {

    if (
      activeAdmins.length ===
      0
    ) {

      setToast({
        type: 'error',
        message:
          'No active Admin is available.',
      })

      return
    }

    let index =
      roundRobinIndex

    const workload =
      new Map(
        activeAdmins.map(
          admin => [
            admin.id,
            admin.assignedReports,
          ]
        )
      )

    let assignedCount = 0

    const next =
      reports.map(
        report => {

          if (
            report.assignedAdminId !== null
            ||
            report.status === 'RESOLVED'
            ||
            report.status === 'DISMISSED'
          ) {
            return report
          }

          const available =
            activeAdmins.filter(
              admin =>
                (workload.get(admin.id) ?? 0)
                <
                maxReportsPerAdmin
            )

          if (!available.length) {
            return report
          }

          let selected: AdminAccount

          if (
            assignmentStrategy ===
            'ROUND_ROBIN'
          ) {
            selected =
              available[
                index % available.length
              ]
            index++
          } else if (
            assignmentStrategy === 'PRIORITY_BASED'
            && report.priority === 'URGENT'
          ) {
            selected = [...available].sort(
              (a, b) =>
                b.resolvedToday - a.resolvedToday
            )[0]
          } else {
            selected = [...available].sort(
              (a, b) =>
                (workload.get(a.id) ?? 0)
                -
                (workload.get(b.id) ?? 0)
            )[0]
          }

          workload.set(
            selected.id,
            (workload.get(selected.id) ?? 0) + 1
          )

          assignedCount++

          addAudit(
            'AUTO_ASSIGN_REPORT',
            `Report #${report.id} → ${selected.name}`
          )

          return {
            ...report,
            assignedAdminId: selected.id,
            history: [
              ...(report.history ?? []),
              `${new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}: auto-assigned to ${selected.name}`,
            ],
          }
        }
      )

    setReports(next)
    updateWorkloads(next)
    setRoundRobinIndex(index)

    setToast({
      type: assignedCount ? 'success' : 'error',
      message: assignedCount
        ? `${assignedCount} report${assignedCount === 1 ? '' : 's'} automatically assigned.`
        : `No reports could be assigned. Check the ${maxReportsPerAdmin}-report workload limit.`,
    })
  }

  const suspendAdmin =
    (
      adminId: number
    ) => {

      const admin =
        admins.find(
          item =>
            item.id ===
            adminId
        )

      if (!admin) {
        return
      }

      const newStatus:
        AdminStatus =
        admin.status ===
          'ACTIVE'
          ?
          'SUSPENDED'
          :
          'ACTIVE'


      setAdmins(
        current =>
          current.map(
            item =>
              item.id ===
              adminId
                ? {
                    ...item,
                    status:
                      newStatus,

                    accessEnabled:
                      newStatus
                      ===
                      'ACTIVE',
                  }
                :
                  item
          )
      )


      addAudit(
        newStatus ===
          'ACTIVE'
          ?
          'REACTIVATE_ADMIN'
          :
          'SUSPEND_ADMIN',
        admin.name
      )


      setToast({
        type: 'success',
        message:
          `${admin.name} is now ${newStatus.toLowerCase()}.`,
      })
    }


  const removeAdmin =
    (
      adminId: number
    ) => {

      const admin =
        admins.find(
          item =>
            item.id ===
            adminId
        )

      if (!admin) {
        return
      }

      const confirmed = window.confirm(
        `Remove ${admin.name} from Admin access? Their open reports will return to the unassigned queue.`
      )

      if (!confirmed) {
        return
      }

      const nextReports =
        reports.map(
          report =>
            report
              .assignedAdminId
            ===
            adminId
              ? {
                  ...report,
                  assignedAdminId:
                    null,
                }
              :
                report
        )


      setReports(
        nextReports
      )

      setAdmins(
        current =>
          current.filter(
            item =>
              item.id !==
              adminId
          )
      )

      updateWorkloads(
        nextReports
      )

      addAudit(
        'REMOVE_ADMIN',
        admin.name
      )


      setToast({
        type: 'success',
        message:
          `${admin.name} removed from Admin access.`,
      })
    }


  const promoteUser = () => {

    const user =
      candidateUsers.find(
        candidate =>
          candidate.id ===
          selectedCandidate
      )

    if (!user) {
      return
    }

    if (
      admins.some(
        admin =>
          admin.email ===
          user.email
      )
    ) {

      setToast({
        type: 'error',
        message:
          'This user is already an Admin.',
      })

      return
    }


    const newAdmin:
      AdminAccount = {

      id:
        user.id,

      name:
        user.name,

      email:
        user.email,

      status:
        'ACTIVE',

      assignedReports:
        0,

      resolvedToday:
        0,

      lastActive:
        'Not signed in',

      accessEnabled:
        true,

      canManageUsers:
        true,

      canReviewReports:
        true,

      canModerateContent:
        true,

      canViewAnalytics:
        true,
    }


    setAdmins(
      current => [
        ...current,
        newAdmin,
      ]
    )


    addAudit(
      'ADD_ADMIN',
      user.name
    )


    setToast({
      type: 'success',
      message:
        `${user.name} promoted to Admin.`,
    })
  }


  const createNewAdmin = () => {
    const fullName = newAdmin.fullName.trim()
    const username = newAdmin.username.trim()
    const email = newAdmin.email.trim().toLowerCase()
    const temporaryPassword = newAdmin.temporaryPassword

    if (!fullName || !username || !email || !temporaryPassword) {
      setToast({
        type: 'error',
        message: 'Complete all required Admin fields.',
      })
      return
    }

    if (temporaryPassword.length < 8) {
      setToast({
        type: 'error',
        message: 'Temporary password must contain at least 8 characters.',
      })
      return
    }

    if (
      admins.some(
        admin =>
          admin.email.toLowerCase() === email
          ||
          admin.username?.toLowerCase() === username.toLowerCase()
      )
    ) {
      setToast({
        type: 'error',
        message: 'An Admin with this email or username already exists.',
      })
      return
    }

    const id =
      Math.max(
        0,
        ...admins.map(admin => admin.id),
        ...users.map(user => user.id)
      ) + 1

    const created: AdminAccount = {
      id,
      name: fullName,
      username,
      email,
      status: newAdmin.status,
      assignedReports: 0,
      resolvedToday: 0,
      lastActive: 'Not signed in',
      accessEnabled: newAdmin.status === 'ACTIVE',
      canManageUsers: true,
      canReviewReports: true,
      canModerateContent: true,
      canViewAnalytics: true,
      createdAt: new Date().toLocaleDateString('en-AU'),
      forcePasswordChange: newAdmin.forcePasswordChange,
    }

    setAdmins(current => [...current, created])
    addAudit('CREATE_ADMIN', `${created.name} · ${created.email}`)

    setToast({
      type: 'success',
      message: `${created.name} created as an Admin.`,
    })

    setNewAdmin({
      fullName: '',
      username: '',
      email: '',
      temporaryPassword: '',
      status: 'ACTIVE',
      forcePasswordChange: true,
    })

    setAddAdminOpen(false)
  }


  const exportAdminReport = () => {
    const rows = [
      'Admin,Email,Status,Open Reports,Resolved Today,Last Active,Access',
      ...admins.map(
        admin =>
          `"${admin.name}","${admin.email}",${admin.status},${admin.assignedReports},${admin.resolvedToday},"${admin.lastActive}",${admin.accessEnabled ? 'Enabled' : 'Disabled'}`
      ),
    ]

    const blob = new Blob(
      [rows.join('\n')],
      { type: 'text/csv' }
    )

    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'admin-performance-report.csv'
    anchor.click()
    URL.revokeObjectURL(url)

    addAudit('EXPORT_ADMIN_REPORT', `${admins.length} Admin records`)
    setToast({ type: 'success', message: 'Admin performance report exported.' })
  }


  const autoBalanceWorkload = () => {
    const availableAdmins = admins.filter(
      admin => admin.status === 'ACTIVE' && admin.accessEnabled
    )

    if (!availableAdmins.length) {
      setToast({ type: 'error', message: 'No active Admin is available for workload balancing.' })
      return
    }

    const workload = new Map<number, number>(
      availableAdmins.map(admin => [admin.id, 0])
    )

    const orderedReports = [...reports].sort(
      (a, b) => {
        const weight: Record<ReportPriority, number> = {
          URGENT: 4,
          HIGH: 3,
          MEDIUM: 2,
          LOW: 1,
        }
        return weight[b.priority] - weight[a.priority]
      }
    )

    const assignments = new Map<number, number>()

    orderedReports.forEach(report => {
      if (report.status === 'RESOLVED' || report.status === 'DISMISSED') {
        return
      }

      const candidate = [...availableAdmins]
        .filter(admin => (workload.get(admin.id) ?? 0) < maxReportsPerAdmin)
        .sort(
          (a, b) =>
            (workload.get(a.id) ?? 0) - (workload.get(b.id) ?? 0)
        )[0]

      if (!candidate) {
        return
      }

      assignments.set(report.id, candidate.id)
      workload.set(candidate.id, (workload.get(candidate.id) ?? 0) + 1)
    })

    const next = reports.map(report => {
      const assignedAdminId = assignments.get(report.id)
      if (!assignedAdminId || assignedAdminId === report.assignedAdminId) {
        return report
      }

      const admin = availableAdmins.find(item => item.id === assignedAdminId)

      return {
        ...report,
        assignedAdminId,
        history: [
          ...(report.history ?? []),
          `${new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}: workload rebalanced to ${admin?.name ?? 'Admin'}`,
        ],
      }
    })

    setReports(next)
    updateWorkloads(next)
    addAudit('AUTO_BALANCE_WORKLOAD', `${assignments.size} active report assignments reviewed`)
    setToast({ type: 'success', message: 'Admin workload balanced across available Admins.' })
  }


  const forceLogoutAdmin = (admin: AdminAccount) => {
    addAudit('FORCE_LOGOUT_ADMIN', admin.name)
    setToast({
      type: 'success',
      message: `${admin.name}'s active session has been marked for termination in this demo.`,
    })
  }


  const updateReportStatus = (reportId: number, status: ReportStatus) => {
    const next = reports.map(report =>
      report.id === reportId
        ? {
            ...report,
            status,
            history: [
              ...(report.history ?? []),
              `${new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}: status changed to ${status.replaceAll('_', ' ')}`,
            ],
          }
        : report
    )

    setReports(next)
    updateWorkloads(next)

    setSelectedReportDetail(current =>
      current?.id === reportId
        ? next.find(report => report.id === reportId) ?? current
        : current
    )

    addAudit('UPDATE_REPORT_STATUS', `Report #${reportId} → ${status}`)
    setToast({ type: 'success', message: `Report #${reportId} updated to ${status.replaceAll('_', ' ')}.` })
  }


  const addReportNote = () => {
    if (!selectedReportDetail || !reportNote.trim()) {
      return
    }

    const note = `${new Date().toLocaleString('en-AU')}: ${reportNote.trim()}`

    const next = reports.map(report =>
      report.id === selectedReportDetail.id
        ? {
            ...report,
            notes: [...(report.notes ?? []), note],
            history: [...(report.history ?? []), `${new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}: internal note added`],
          }
        : report
    )

    setReports(next)
    setSelectedReportDetail(
      next.find(report => report.id === selectedReportDetail.id) ?? selectedReportDetail
    )
    addAudit('ADD_REPORT_NOTE', `Report #${selectedReportDetail.id}`)
    setReportNote('')
    setToast({ type: 'success', message: 'Internal report note added.' })
  }


  const publishAnnouncement = () => {
    if (!announcementText.trim()) {
      setToast({ type: 'error', message: 'Enter an announcement before publishing.' })
      return
    }

    const audienceLabel = announcementAudience.replaceAll('_', ' ')
    setLastAnnouncement(`${audienceLabel}: ${announcementText.trim()}`)
    addAudit('PUBLISH_ANNOUNCEMENT', audienceLabel)
    setAnnouncementText('')
    setToast({ type: 'success', message: 'Platform announcement published in this demo.' })
  }


  const getSlaLabel = (report: Report) => {
    if (report.status === 'RESOLVED' || report.status === 'DISMISSED') {
      return 'Closed'
    }

    if (report.ageHours >= 24) {
      return `Overdue ${report.ageHours - 24}h`
    }

    return `${24 - report.ageHours}h left`
  }


  const updateAccess =
    (
      adminId: number,
      field:
        | 'accessEnabled'
        | 'canManageUsers'
        | 'canReviewReports'
        | 'canModerateContent'
        | 'canViewAnalytics'
    ) => {

      setAdmins(
        current =>
          current.map(
            admin =>
              admin.id ===
              adminId
                ? {
                    ...admin,
                    [field]:
                      !admin[field],
                  }
                :
                  admin
          )
      )


      const admin =
        admins.find(
          item =>
            item.id ===
            adminId
        )


      addAudit(
        'UPDATE_ADMIN_ACCESS',
        `${admin?.name ?? 'Admin'} · ${field}`
      )
    }


  const toggleModule =
    (
      moduleId: string
    ) => {

      const module =
        modules.find(
          item =>
            item.id ===
            moduleId
        )

      if (!module) {
        return
      }

      setModules(
        current =>
          current.map(
            item =>
              item.id ===
              moduleId
                ? {
                    ...item,
                    enabled:
                      !item.enabled,
                  }
                :
                  item
          )
      )


      addAudit(
        'UPDATE_MODULE',
        `${module.name} → ${module.enabled ? 'OFF' : 'ON'}`
      )
    }


  const updateUserStatus = (
    userId: number,
    status: ManagedUser['status']
  ) => {
    const user = users.find(candidate => candidate.id === userId)
    if (!user) return

    if (status === 'SUSPENDED' || status === 'DEACTIVATED') {
      const confirmed = window.confirm(
        status === 'SUSPENDED'
          ? `Suspend ${user.name}?`
          : `Deactivate ${user.name}? The account history will be preserved.`
      )
      if (!confirmed) return
    }

    setUsers(current =>
      current.map(candidate =>
        candidate.id === userId ? { ...candidate, status } : candidate
      )
    )

    addAudit(
      status === 'SUSPENDED'
        ? 'SUSPEND_USER'
        : status === 'DEACTIVATED'
          ? 'DEACTIVATE_USER'
          : 'REACTIVATE_USER',
      `${user.name} (#${user.id})`
    )

    setToast({
      type: 'success',
      message: `${user.name} is now ${status.toLowerCase()}.`,
    })
  }


  const toggleModerationItem = (itemId: number) => {
    const item = moderationItems.find(candidate => candidate.id === itemId)
    if (!item) return

    const nextStatus: ModerationItem['status'] =
      item.status === 'VISIBLE' ? 'REMOVED' : 'VISIBLE'

    if (nextStatus === 'REMOVED') {
      const confirmed = window.confirm(
        `Remove "${item.title}" from public visibility?`
      )
      if (!confirmed) return
    }

    setModerationItems(current =>
      current.map(candidate =>
        candidate.id === itemId
          ? { ...candidate, status: nextStatus }
          : candidate
      )
    )

    addAudit(
      nextStatus === 'REMOVED' ? 'REMOVE_CONTENT' : 'RESTORE_CONTENT',
      `${item.type} #${item.id}`
    )

    setToast({
      type: 'success',
      message: `${item.title} ${nextStatus === 'REMOVED' ? 'removed' : 'restored'}.`,
    })
  }


  const filteredUsers = useMemo(() => {
    const search = userSearch.trim().toLowerCase()
    return users.filter(user => {
      const matchesSearch =
        !search || `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(search)
      const matchesStatus =
        userStatusFilter === 'ALL' || user.status === userStatusFilter
      return matchesSearch && matchesStatus
    })
  }, [users, userSearch, userStatusFilter])


  const filteredModerationItems = useMemo(() => {
    const search = moderationSearch.trim().toLowerCase()
    return moderationItems.filter(item =>
      !search || `${item.title} ${item.owner} ${item.type}`.toLowerCase().includes(search)
    )
  }, [moderationItems, moderationSearch])


  const filteredAdmins =
    useMemo(
      () => {

        const search =
          adminSearch
            .trim()
            .toLowerCase()

        return admins.filter(
          admin =>
            !search
            ||
            (
              admin.name
              +
              admin.email
            )
              .toLowerCase()
              .includes(
                search
              )
        )
      },
      [
        admins,
        adminSearch,
      ]
    )


  const filteredReports =
    useMemo(
      () => {

        const search =
          reportSearch
            .trim()
            .toLowerCase()

        return reports.filter(
          report => {

            const textMatches =
              !search
              ||
              (
                report.id
                +
                report.target
                +
                report.reason
              )
                .toLowerCase()
                .includes(
                  search
                )


            const assignmentMatches =
              reportFilter ===
                'ALL'
              ||
              (
                reportFilter ===
                  'ASSIGNED'
                &&
                report
                  .assignedAdminId
                !==
                null
              )
              ||
              (
                reportFilter ===
                  'UNASSIGNED'
                &&
                report
                  .assignedAdminId
                ===
                null
              )


            const priorityMatches =
              priorityFilter ===
                'ALL'
              ||
              report.priority ===
                priorityFilter


            return (
              textMatches
              &&
              assignmentMatches
              &&
              priorityMatches
            )
          }
        )
      },
      [
        reports,
        reportSearch,
        reportFilter,
        priorityFilter,
      ]
    )


  const filteredAuditLogs =
    useMemo(
      () => {

        const search =
          auditSearch
            .trim()
            .toLowerCase()

        return auditLogs.filter(
          log =>
            !search
            ||
            (
              log.admin
              +
              log.action
              +
              log.target
            )
              .toLowerCase()
              .includes(
                search
              )
        )
      },
      [
        auditLogs,
        auditSearch,
      ]
    )


  const multiplier =
    period === 'today'
      ? 1
      : period === '7d'
        ? 7
        : 30


  const openReportsCount =
    reports.filter(report => report.status === 'OPEN').length

  const underReviewCount =
    reports.filter(report => report.status === 'UNDER_REVIEW').length

  const escalatedCount =
    reports.filter(report => report.status === 'ESCALATED').length

  const overdueCount =
    reports.filter(
      report =>
        report.ageHours >= 24
        && report.status !== 'RESOLVED'
        && report.status !== 'DISMISSED'
    ).length

  const suspendedUsersCount =
    users.filter(user => user.status === 'SUSPENDED').length

  const removedContentCount =
    moderationItems.filter(item => item.status === 'REMOVED').length

  const visibleContentCount =
    moderationItems.filter(item => item.status === 'VISIBLE').length

  const periodResolved =
    admins.reduce(
      (total, admin) => total + admin.resolvedToday,
      0,
    ) * multiplier

  const platformCompletion =
    Math.round(
      (periodResolved /
        Math.max(
          periodResolved
          + openReportsCount
          + underReviewCount
          + escalatedCount,
          1,
        ))
      * 100,
    )

  const overviewTrendData =
    useMemo<SuperOverviewPoint[]>(() => {
      const labels =
        period === 'today'
          ? ['12 AM', '4 AM', '8 AM', '12 PM', '4 PM', '8 PM', 'Now']
          : period === '7d'
            ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            : ['1 Oct', '5 Oct', '10 Oct', '15 Oct', '20 Oct', '25 Oct', '30 Oct']

      const factor = period === 'today' ? 0.8 : period === '7d' ? 1.6 : 4.2

      return labels.map((label, index) => ({
        label,
        reports: Math.max(
          1,
          Math.round((4 + index * 0.8 + Math.sin(index) * 1.2) * factor),
        ),
        moderation: Math.max(
          1,
          Math.round((5 + index * 0.7 + Math.cos(index) * 1.1) * factor),
        ),
      }))
    }, [period])

  const overviewReportTotal =
    overviewTrendData.reduce(
      (total, point) => total + point.reports,
      0,
    )

  const overviewModerationTotal =
    overviewTrendData.reduce(
      (total, point) => total + point.moderation,
      0,
    )

  const priorityReports =
    [...reports]
      .filter(
        report =>
          report.status !== 'RESOLVED'
          && report.status !== 'DISMISSED'
      )
      .sort((first, second) => {
        const priorityOrder: Record<ReportPriority, number> = {
          URGENT: 4,
          HIGH: 3,
          MEDIUM: 2,
          LOW: 1,
        }

        return (
          priorityOrder[second.priority]
          - priorityOrder[first.priority]
          || second.ageHours - first.ageHours
        )
      })
      .slice(0, 5)

  const reportReasonSummary =
    Object.entries(
      reports.reduce<Record<string, number>>((summary, report) => {
        summary[report.reason] = (summary[report.reason] ?? 0) + 1
        return summary
      }, {}),
    )
      .map(([reason, count]) => ({ reason, count }))
      .sort((first, second) => second.count - first.count)
      .slice(0, 5)

  const reportReasonMaximum =
    Math.max(...reportReasonSummary.map(item => item.count), 1)

  const adminPerformance =
    [...admins]
      .sort((first, second) => {
        return (
          second.resolvedToday - first.resolvedToday
          || first.assignedReports - second.assignedReports
        )
      })
      .slice(0, 4)


  const metrics = [
    {
      label: 'Total Users',
      value: '1,250',
      detail: 'Registered platform accounts',
    },
    {
      label: 'Active Admins',
      value: activeAdmins.length,
      detail: 'Available administrators',
    },
    {
      label: 'Open Reports',
      value: openReportsCount,
      detail: 'Waiting for review',
    },
    {
      label: 'Under Review',
      value: underReviewCount,
      detail: 'Currently investigated',
    },
    {
      label: 'Urgent',
      value: urgentReports.length,
      detail: 'Immediate attention',
    },
    {
      label: 'Unassigned',
      value: unassignedReports.length,
      detail: 'Need Admin assignment',
    },
    {
      label: 'Resolved',
      value: periodResolved.toLocaleString(),
      detail: `Completed in ${period === 'today' ? 'today' : period === '7d' ? '7 days' : '30 days'}`,
    },
    {
      label: 'Avg. Resolution',
      value: '1.9h',
      detail: 'Platform moderation average',
    },
  ]

  const notifications = [
    ...(urgentReports.length
      ? [{ id: 'urgent', message: `${urgentReports.length} urgent report(s) require attention`, section: 'reports' as Section }]
      : []),
    ...(unassignedReports.length
      ? [{ id: 'unassigned', message: `${unassignedReports.length} reports are currently unassigned`, section: 'reports' as Section }]
      : []),
    ...(admins.some(admin => admin.status === 'SUSPENDED')
      ? [{ id: 'suspended-admins', message: 'One or more Admin accounts are suspended', section: 'admins' as Section }]
      : []),
    ...(users.some(user => user.status === 'SUSPENDED')
      ? [{ id: 'suspended-users', message: 'One or more platform users are suspended', section: 'users' as Section }]
      : []),
    ...(moderationItems.some(item => item.status === 'REMOVED')
      ? [{ id: 'removed-content', message: 'Moderated content is currently removed from public visibility', section: 'moderation' as Section }]
      : []),
  ]

  const visibleNotifications = notifications.filter(
    notification => !dismissedNotificationIds.includes(notification.id)
  )


  const navigation:
    {
      key: Section
      label: string
      badge?: number
    }[] = [

    {
      key: 'overview',
      label: 'Overview',
    },
    {
      key: 'admins',
      label:
        'Admin Management',
    },
    {
      key: 'reports',
      label:
        'Report Assignment',
      badge:
        unassignedReports.length,
    },
    {
      key: 'users',
      label:
        'Manage Users',
    },
    {
      key: 'moderation',
      label:
        'Content Moderation',
    },
    {
      key: 'analytics',
      label:
        'Analytics',
    },
    {
      key: 'access',
      label:
        'Admin Access',
    },{
      key: 'system',
      label:
        'System',
    },
    {
      key: 'audit',
      label:
        'Audit Logs',
    },
  ]


  const renderHeader =
    (
      title: string,
      description: string
    ) => (

      <header
        className=
          "super-admin-header"
      >

        <div>

          <span
            className=
              "super-workspace-label"
          >
            SUPER ADMIN WORKSPACE
          </span>

          <h1>
            {title}
          </h1>

          <p>
            {description}
          </p>

        </div>


        <div
          className=
            "super-header-actions"
        >

          <div
            className=
              "live-status"
          >

            <span
              className=
                "live-dot"
            />

            <div>

              <strong>
                Live
              </strong>

              <small>
                {
                  clock
                    .toLocaleTimeString(
                      'en-AU'
                    )
                }
              </small>

            </div>

            <button
              className=
                "refresh-button"
              onClick={() => {

                setUpdatedAt(
                  new Date()
                )

                setToast({
                  type:
                    'success',
                  message:
                    'Dashboard refreshed.',
                })

              }}
            >
              Refresh
            </button>

          </div>


          <div
            className=
              "notification-wrapper"
          >

            <button
              className=
                "notification-button"
              onClick={() =>
                setNotificationsOpen(
                  value =>
                    !value
                )
              }
            >
              🔔

              {visibleNotifications.length > 0 && (
                <span>
                  {visibleNotifications.length}
                </span>
              )}

            </button>


            {
              notificationsOpen
              &&
              (

                <div
                  className=
                    "notification-panel"
                >

                  <div className="notification-panel-heading">
                    <strong>Notifications</strong>
                    <div>
                      {visibleNotifications.length > 0 && (
                        <button
                          type="button"
                          className="notification-dismiss-all"
                          onClick={() =>
                            setDismissedNotificationIds(
                              notifications.map(notification => notification.id)
                            )
                          }
                        >
                          Dismiss all
                        </button>
                      )}
                      <button
                        type="button"
                        className="notification-close"
                        onClick={() => setNotificationsOpen(false)}
                        aria-label="Close notifications"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {visibleNotifications.length ? (
                    <div className="notification-list">
                      {visibleNotifications.map(notification => (
                        <div className="notification-item" key={notification.id}>
                          <button
                            type="button"
                            className="notification-message"
                            onClick={() => {
                              setSection(notification.section)
                              setNotificationsOpen(false)
                            }}
                          >
                            {notification.message}
                          </button>
                          <button
                            type="button"
                            className="notification-dismiss"
                            onClick={() =>
                              setDismissedNotificationIds(current => [
                                ...current,
                                notification.id,
                              ])
                            }
                          >
                            Dismiss
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="notification-empty">No new notifications.</p>
                  )}

                </div>
              )
            }

          </div>

        </div>

      </header>
    )


  return (

    <div
      className=
        "super-admin-layout"
    >

      <aside
        className=
          "super-admin-sidebar"
      >

        <div
          className=
            "sidebar-brand"
        >

          <div
            className=
              "brand-badge"
          >
            SA
          </div>

          <div>

            <h2>
              Super Admin
            </h2>

            <p>
              Creative Collaboration Network
            </p>

          </div>

        </div>


        <nav
          className=
            "sidebar-navigation"
        >

          {
            navigation.map(
              item => (

                <button
                  key=
                    {item.key}
                  className={
                    section ===
                    item.key
                      ?
                      'active'
                      :
                      ''
                  }
                  onClick={() =>
                    setSection(
                      item.key
                    )
                  }
                >

                  <span>
                    {item.label}
                  </span>

                  {
                    !!item.badge
                    &&
                    (
                      <span
                        className=
                          "nav-count"
                      >
                        {item.badge}
                      </span>
                    )
                  }

                </button>

              )
            )
          }

        </nav>


        <div
          className=
            "sidebar-footer"
        >

          <span>
            Last refresh
          </span>

          <strong>
            {
              updatedAt
                .toLocaleTimeString(
                  'en-AU',
                  {
                    hour:
                      '2-digit',
                    minute:
                      '2-digit',
                  }
                )
            }
          </strong>

          <small>
            Frontend demo data
          </small>

        </div>

      </aside>


      <main
        className=
          "super-admin-main"
      >

        {
          toast
          &&
          (
            <div
              className={
                `dashboard-toast ${toast.type}`
              }
            >
              {toast.message}
            </div>
          )
        }


        {
          section ===
          'overview'
          &&
          (
            <>

              {
                renderHeader(
                  'Super Admin Overview',
                  'Complete platform oversight with Admin-level operations plus administrator, security and system controls.'
                )
              }


              <div className="period-selector">
                {(['today', '7d', '30d'] as OverviewPeriod[]).map(item => (
                  <button
                    key={item}
                    className={period === item ? 'active' : ''}
                    onClick={() => setPeriod(item)}
                  >
                    {item === 'today' ? 'Today' : item === '7d' ? '7 Days' : '30 Days'}
                  </button>
                ))}
              </div>


              <section className="super-overview-attention">
                <div>
                  <strong>Platform Priority Attention</strong>
                  <span>
                    {urgentReports.length} urgent · {unassignedReports.length} unassigned · {overdueCount} overdue · {escalatedCount} escalated
                  </span>
                </div>

                <div className="super-overview-attention-actions">
                  <button onClick={() => setSection('reports')}>Review Queue</button>
                  <button onClick={() => setSection('audit')}>View Audit Activity</button>
                </div>
              </section>


              <section className="super-overview-metric-grid">
                {metrics.map(metric => (
                  <article className="super-overview-metric-card" key={metric.label}>
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                    <small>{metric.detail}</small>
                  </article>
                ))}
              </section>


              <section className="super-overview-grid">
                <article className="super-overview-card super-overview-chart-card">
                  <div className="super-overview-card-heading">
                    <div>
                      <h3>Platform Workload Trend</h3>
                      <p>Report volume across the selected period.</p>
                    </div>
                    <span className="super-overview-positive">+11.4%</span>
                  </div>

                  <SuperOverviewLineChart
                    data={overviewTrendData}
                    dataKey="reports"
                  />
                </article>


                <article className="super-overview-card">
                  <div className="super-overview-card-heading">
                    <div>
                      <h3>Platform Workload</h3>
                      <p>Current report-processing snapshot.</p>
                    </div>
                  </div>

                  <div className="super-overview-summary-grid">
                    <div>
                      <span>Tracked</span>
                      <strong>{reports.length}</strong>
                    </div>
                    <div>
                      <span>Open</span>
                      <strong>{openReportsCount}</strong>
                    </div>
                    <div>
                      <span>Under Review</span>
                      <strong>{underReviewCount}</strong>
                    </div>
                    <div>
                      <span>Resolved</span>
                      <strong>{periodResolved}</strong>
                    </div>
                  </div>

                  <div className="super-overview-completion-block">
                    <div>
                      <span>Completion</span>
                      <strong>{platformCompletion}%</strong>
                    </div>
                    <div className="super-overview-completion-bar">
                      <span style={{ width: `${platformCompletion}%` }} />
                    </div>
                  </div>
                </article>
              </section>


              <section className="super-overview-grid">
                <article className="super-overview-card">
                  <div className="super-overview-card-heading">
                    <div>
                      <h3>Priority Report Queue</h3>
                      <p>Highest-priority reports across all Admin queues.</p>
                    </div>
                    <button className="primary-button small" onClick={() => setSection('reports')}>
                      View All Reports
                    </button>
                  </div>

                  <div className="super-overview-list">
                    {priorityReports.map(report => {
                      const assignedAdmin = admins.find(admin => admin.id === report.assignedAdminId)

                      return (
                        <button
                          className="super-overview-list-row"
                          key={report.id}
                          onClick={() => setSection('reports')}
                        >
                          <div>
                            <strong>Report #{report.id} · {report.target}</strong>
                            <span>{report.reason} · {assignedAdmin?.name ?? 'Unassigned'}</span>
                            <small className={report.ageHours >= 24 ? 'super-overview-sla-overdue' : 'super-overview-sla-normal'}>
                              {report.ageHours}h old
                            </small>
                          </div>
                          <span className={`priority-badge ${report.priority.toLowerCase()}`}>
                            {report.priority}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </article>


                <article className="super-overview-card">
                  <div className="super-overview-card-heading">
                    <div>
                      <h3>Alerts & SLA</h3>
                      <p>Platform items requiring immediate oversight.</p>
                    </div>
                  </div>

                  <div className="super-overview-alert-list">
                    {urgentReports.length > 0 && (
                      <button className="super-overview-alert danger" onClick={() => setSection('reports')}>
                        <span>!</span>
                        <div>
                          <strong>{urgentReports.length} urgent report{urgentReports.length === 1 ? '' : 's'}</strong>
                          <small>Prioritise these reports first.</small>
                        </div>
                      </button>
                    )}

                    {overdueCount > 0 && (
                      <button className="super-overview-alert danger" onClick={() => setSection('reports')}>
                        <span>⏱</span>
                        <div>
                          <strong>{overdueCount} overdue SLA item{overdueCount === 1 ? '' : 's'}</strong>
                          <small>Reports older than 24 hours need escalation.</small>
                        </div>
                      </button>
                    )}

                    {unassignedReports.length > 0 && (
                      <button className="super-overview-alert warning" onClick={() => setSection('reports')}>
                        <span>↗</span>
                        <div>
                          <strong>{unassignedReports.length} unassigned report{unassignedReports.length === 1 ? '' : 's'}</strong>
                          <small>Use Auto Assign or assign an Admin manually.</small>
                        </div>
                      </button>
                    )}

                    {admins.some(admin => admin.status === 'SUSPENDED') && (
                      <button className="super-overview-alert warning" onClick={() => setSection('admins')}>
                        <span>A</span>
                        <div>
                          <strong>Suspended Admin account</strong>
                          <small>Review administrator availability and workload impact.</small>
                        </div>
                      </button>
                    )}
                  </div>
                </article>
              </section>


              <section className="super-overview-grid">
                <article className="super-overview-card">
                  <div className="super-overview-card-heading">
                    <div>
                      <h3>Top Report Reasons</h3>
                      <p>Most common reasons across the platform report queue.</p>
                    </div>
                  </div>

                  <div className="super-overview-reason-list">
                    {reportReasonSummary.map(item => {
                      const percentage = Math.round((item.count / reportReasonMaximum) * 100)

                      return (
                        <div key={item.reason}>
                          <div>
                            <span>{item.reason}</span>
                            <strong>{item.count}</strong>
                          </div>
                          <div className="super-overview-reason-bar">
                            <span style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </article>


                <article className="super-overview-card">
                  <div className="super-overview-card-heading">
                    <div>
                      <h3>Moderation Summary</h3>
                      <p>User and content moderation across the whole platform.</p>
                    </div>
                  </div>

                  <div className="super-overview-action-summary">
                    <button onClick={() => setSection('users')}>
                      <span>Active Users</span>
                      <strong>{users.filter(user => user.status === 'ACTIVE').length}</strong>
                    </button>
                    <button onClick={() => setSection('users')}>
                      <span>Suspended Users</span>
                      <strong>{suspendedUsersCount}</strong>
                    </button>
                    <button onClick={() => setSection('moderation')}>
                      <span>Removed Content</span>
                      <strong>{removedContentCount}</strong>
                    </button>
                    <button onClick={() => setSection('moderation')}>
                      <span>Visible Content</span>
                      <strong>{visibleContentCount}</strong>
                    </button>
                  </div>
                </article>
              </section>


              <section className="super-overview-grid">
                <article className="super-overview-card super-overview-chart-card">
                  <div className="super-overview-card-heading">
                    <div>
                      <h3>Moderation Activity Trend</h3>
                      <p>Platform moderation actions during the selected period.</p>
                    </div>
                    <span className="super-overview-neutral">{overviewModerationTotal} actions</span>
                  </div>

                  <SuperOverviewLineChart
                    data={overviewTrendData}
                    dataKey="moderation"
                  />
                </article>


                <article className="super-overview-card">
                  <div className="super-overview-card-heading">
                    <div>
                      <h3>Quick Actions</h3>
                      <p>Admin operations plus Super Admin platform controls.</p>
                    </div>
                  </div>

                  <div className="super-overview-quick-actions">
                    <button onClick={() => setSection('reports')}>
                      <strong>Report Assignment</strong>
                      <span>Assign, reassign and balance reports.</span>
                    </button>
                    <button onClick={() => setSection('users')}>
                      <strong>Manage Users</strong>
                      <span>Suspend, restore and review user accounts.</span>
                    </button>
                    <button onClick={() => setSection('moderation')}>
                      <strong>Moderate Content</strong>
                      <span>Review and restore platform content.</span>
                    </button>
                    <button onClick={() => setSection('analytics')}>
                      <strong>View Analytics</strong>
                      <span>Open platform-wide analytics.</span>
                    </button>
                    <button onClick={() => setSection('admins')}>
                      <strong>Manage Admins</strong>
                      <span>Create Admins and balance workload.</span>
                    </button>
                    <button onClick={() => setSection('system')}>
                      <strong>System Control</strong>
                      <span>Security, health and announcements.</span>
                    </button>
                  </div>
                </article>
              </section>


              <section className="super-overview-grid">
                <article className="super-overview-card">
                  <div className="super-overview-card-heading">
                    <div>
                      <h3>Admin Workload</h3>
                      <p>Current open workload across administrator accounts.</p>
                    </div>
                    <button className="secondary-button" onClick={() => setSection('admins')}>
                      Manage Admins
                    </button>
                  </div>

                  <div className="super-overview-admin-workload">
                    {admins.map(admin => (
                      <div key={admin.id}>
                        <div>
                          <strong>{admin.name}</strong>
                          <span>{admin.status} · {admin.resolvedToday} resolved today</span>
                        </div>
                        <div className="super-overview-workload-right">
                          <div className="super-overview-workload-bar">
                            <span style={{ width: `${Math.min(100, (admin.assignedReports / Math.max(maxReportsPerAdmin, 1)) * 100)}%` }} />
                          </div>
                          <strong>{admin.assignedReports}/{maxReportsPerAdmin}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>


                <article className="super-overview-card">
                  <div className="super-overview-card-heading">
                    <div>
                      <h3>Admin Performance</h3>
                      <p>Top Admin output and current workload.</p>
                    </div>
                  </div>

                  <div className="super-overview-performance-list">
                    {adminPerformance.map((admin, index) => (
                      <div key={admin.id}>
                        <span className="super-overview-rank">#{index + 1}</span>
                        <div>
                          <strong>{admin.name}</strong>
                          <small>{admin.resolvedToday} resolved today</small>
                        </div>
                        <strong>{admin.assignedReports} open</strong>
                      </div>
                    ))}
                  </div>
                </article>
              </section>


              <section className="super-overview-grid">
                <article className="super-overview-card">
                  <div className="super-overview-card-heading">
                    <div>
                      <h3>System Health</h3>
                      <p>Core platform service status.</p>
                    </div>
                    <button className="secondary-button" onClick={() => setSection('system')}>
                      Open System
                    </button>
                  </div>

                  <div className="super-overview-health-grid">
                    <div>
                      <span className="health-dot ok" />
                      <strong>Backend API</strong>
                      <small>Operational</small>
                    </div>
                    <div>
                      <span className="health-dot ok" />
                      <strong>Database</strong>
                      <small>Connected</small>
                    </div>
                    <div>
                      <span className="health-dot ok" />
                      <strong>Authentication</strong>
                      <small>Healthy</small>
                    </div>
                    <div>
                      <span className="health-dot ok" />
                      <strong>Notifications</strong>
                      <small>Operational</small>
                    </div>
                  </div>
                </article>


                <article className="super-overview-card">
                  <div className="super-overview-card-heading">
                    <div>
                      <h3>Security Snapshot</h3>
                      <p>High-level security and access indicators.</p>
                    </div>
                  </div>

                  <div className="super-overview-security-grid">
                    <div>
                      <span>Active Sessions</span>
                      <strong>34</strong>
                    </div>
                    <div>
                      <span>Failed Logins</span>
                      <strong>3</strong>
                    </div>
                    <div>
                      <span>Suspended Admins</span>
                      <strong>{admins.filter(admin => admin.status === 'SUSPENDED').length}</strong>
                    </div>
                    <div>
                      <span>Audit Events</span>
                      <strong>{auditLogs.length}</strong>
                    </div>
                  </div>
                </article>
              </section>


              <section className="super-overview-card super-overview-recent-actions">
                <div className="super-overview-card-heading">
                  <div>
                    <h3>Recent Platform Actions</h3>
                    <p>Latest administrative activity across the platform.</p>
                  </div>
                  <button className="secondary-button" onClick={() => setSection('audit')}>
                    View All Audit Logs
                  </button>
                </div>

                <div className="table-wrapper">
                  <table className="super-table">
                    <thead>
                      <tr>
                        <th>Admin</th>
                        <th>Action</th>
                        <th>Target</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.slice(0, 6).map(log => (
                        <tr key={log.id}>
                          <td><strong>{log.admin}</strong></td>
                          <td>{log.action.replaceAll('_', ' ')}</td>
                          <td>{log.target}</td>
                          <td>{log.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>


              <section className="super-overview-footer-summary">
                <div>
                  <span>Report activity</span>
                  <strong>{overviewReportTotal}</strong>
                  <small>Selected-period workload signal</small>
                </div>
                <div>
                  <span>Moderation actions</span>
                  <strong>{overviewModerationTotal}</strong>
                  <small>Selected-period moderation signal</small>
                </div>
                <div>
                  <span>Admin coverage</span>
                  <strong>{activeAdmins.length}/{admins.length}</strong>
                  <small>Active administrator availability</small>
                </div>
                <div>
                  <span>Platform health</span>
                  <strong>99.9%</strong>
                  <small>Demo operational availability</small>
                </div>
              </section>

            </>
          )
        }

        {
          section ===
          'admins'
          &&
          (
            <>

              {
                renderHeader(
                  'Admin Management',
                  'Create Admins, promote existing users, balance workload and monitor administrator performance.'
                )
              }


              <section className="dashboard-card admin-management-toolbar">
                <div>
                  <h3>Administrator Controls</h3>
                  <p>Create and manage Admin accounts without losing the existing workload and performance view.</p>
                </div>

                <div className="admin-management-actions">
                  <button className="primary-button" onClick={() => setAddAdminOpen(true)}>
                    + Add New Admin
                  </button>
                  <button className="secondary-button" onClick={() => setPromoteExistingOpen(value => !value)}>
                    Promote Existing User
                  </button>
                  <button className="secondary-button" onClick={autoBalanceWorkload}>
                    Auto Balance Workload
                  </button>
                  <button className="secondary-button" onClick={exportAdminReport}>
                    Export Admin Report
                  </button>
                </div>
              </section>


              {
                promoteExistingOpen
                &&
                (
                  <section className="dashboard-card promotion-card">
                    <div>
                      <h3>Promote Existing User</h3>
                      <p>Select an existing platform user and grant Admin access.</p>
                    </div>

                    <div className="promotion-controls">
                      <select
                        value={selectedCandidate}
                        onChange={event => setSelectedCandidate(Number(event.target.value))}
                      >
                        {candidateUsers.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name} · {user.role}
                          </option>
                        ))}
                      </select>

                      <button className="primary-button" onClick={promoteUser}>
                        Promote to Admin
                      </button>
                    </div>
                  </section>
                )
              }


              <section className="dashboard-card admin-performance-summary">
                <div className="management-stat">
                  <span>Total Admins</span>
                  <strong>{admins.length}</strong>
                  <small>Administrator accounts</small>
                </div>
                <div className="management-stat">
                  <span>Active</span>
                  <strong>{admins.filter(admin => admin.status === 'ACTIVE').length}</strong>
                  <small>Available for work</small>
                </div>
                <div className="management-stat">
                  <span>Current Workload</span>
                  <strong>{admins.reduce((total, admin) => total + admin.assignedReports, 0)}</strong>
                  <small>Open assigned reports</small>
                </div>
                <div className="management-stat">
                  <span>Resolved Today</span>
                  <strong>{admins.reduce((total, admin) => total + admin.resolvedToday, 0)}</strong>
                  <small>Combined Admin output</small>
                </div>
              </section>


              <section className="dashboard-card">

                <div className="admin-table-heading">
                  <input
                    className="table-search"
                    value={adminSearch}
                    onChange={event => setAdminSearch(event.target.value)}
                    placeholder="Search Admins by name or email..."
                  />
                  <span className="capacity-label">
                    Workload limit: {maxReportsPerAdmin} reports / Admin
                  </span>
                </div>

                <div className="table-wrapper">
                  <table className="super-table">
                    <thead>
                      <tr>
                        <th>Admin</th>
                        <th>Status</th>
                        <th>Workload</th>
                        <th>Resolved Today</th>
                        <th>Last Active</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredAdmins.map(admin => (
                        <tr key={admin.id}>
                          <td>
                            <strong>{admin.name}</strong>
                            <small>{admin.username ? `@${admin.username} · ` : ''}{admin.email}</small>
                          </td>

                          <td>
                            <span className={`status-pill ${admin.status.toLowerCase()}`}>
                              {admin.status}
                            </span>
                          </td>

                          <td>
                            <div className="professional-workload-cell">
                              <div className="professional-workload-bar">
                                <span
                                  style={{
                                    width: `${Math.min(100, (admin.assignedReports / Math.max(maxReportsPerAdmin, 1)) * 100)}%`,
                                  }}
                                />
                              </div>
                              <small>{admin.assignedReports}/{maxReportsPerAdmin}</small>
                            </div>
                          </td>

                          <td>{admin.resolvedToday}</td>
                          <td>{admin.lastActive}</td>

                          <td>
                            <div className="table-actions">
                              <button onClick={() => setSelectedAdmin(admin)}>View Details</button>
                              <button onClick={() => suspendAdmin(admin.id)}>
                                {admin.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                              </button>
                              <button className="danger" onClick={() => removeAdmin(admin.id)}>
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

            </>
          )
        }

        {
          section ===
          'reports'
          &&
          (
            <>

              {
                renderHeader(
                  'Report Assignment',
                  'Automatically or manually distribute reports, monitor SLA risk, reassign cases and inspect report history.'
                )
              }


              <section className="dashboard-card assignment-card">
                <div className="assignment-header">
                  <div>
                    <h3>Automatic Assignment</h3>
                    <p>Distribute new reports using the selected strategy and workload capacity.</p>
                  </div>

                  <button
                    className={`switch-button ${autoAssignEnabled ? 'enabled' : ''}`}
                    onClick={() => setAutoAssignEnabled(value => !value)}
                  >
                    {autoAssignEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="assignment-options professional-assignment-options">
                  <label>
                    Assignment Strategy
                    <select
                      value={assignmentStrategy}
                      onChange={event => setAssignmentStrategy(event.target.value as AssignmentStrategy)}
                    >
                      <option value="LEAST_WORKLOAD">Least Workload</option>
                      <option value="ROUND_ROBIN">Round Robin</option>
                      <option value="PRIORITY_BASED">Priority Based</option>
                    </select>
                  </label>

                  <label>
                    Max Open Reports / Admin
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={maxReportsPerAdmin}
                      onChange={event => setMaxReportsPerAdmin(Math.max(1, Number(event.target.value) || 1))}
                    />
                  </label>

                  <button
                    className="primary-button"
                    disabled={!autoAssignEnabled || unassignedReports.length === 0}
                    onClick={autoAssignAll}
                  >
                    Auto Assign Unassigned
                  </button>

                  <button className="secondary-button" onClick={autoBalanceWorkload}>
                    Rebalance All Workload
                  </button>
                </div>
              </section>


              <section className="report-summary-strip">
                <div><span>Unassigned</span><strong>{unassignedReports.length}</strong></div>
                <div><span>Urgent</span><strong>{urgentReports.length}</strong></div>
                <div><span>Overdue SLA</span><strong>{reports.filter(report => report.ageHours >= 24 && !['RESOLVED', 'DISMISSED'].includes(report.status)).length}</strong></div>
                <div><span>Under Review</span><strong>{reports.filter(report => report.status === 'UNDER_REVIEW').length}</strong></div>
              </section>


              <section className="dashboard-card">
                <div className="filter-bar">
                  <input
                    value={reportSearch}
                    onChange={event => setReportSearch(event.target.value)}
                    placeholder="Search reports..."
                  />

                  <select
                    value={reportFilter}
                    onChange={event => setReportFilter(event.target.value as 'ALL' | 'ASSIGNED' | 'UNASSIGNED')}
                  >
                    <option value="ALL">All Reports</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="UNASSIGNED">Unassigned</option>
                  </select>

                  <select
                    value={priorityFilter}
                    onChange={event => setPriorityFilter(event.target.value as 'ALL' | ReportPriority)}
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="URGENT">Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div className="table-wrapper">
                  <table className="super-table report-management-table">
                    <thead>
                      <tr>
                        <th>Report</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Assigned Admin</th>
                        <th>SLA</th>
                        <th>Assignment & Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredReports.map(report => {
                        const assignedAdmin = admins.find(admin => admin.id === report.assignedAdminId)
                        const slaLabel = getSlaLabel(report)
                        const slaClass = report.ageHours >= 24 && !['RESOLVED', 'DISMISSED'].includes(report.status)
                          ? 'sla-overdue-professional'
                          : 'sla-ok-professional'

                        return (
                          <tr key={report.id}>
                            <td>
                              <strong>#{report.id} · {report.target}</strong>
                              <small>{report.reason} · {report.createdAt}</small>
                            </td>

                            <td>
                              <span className={`priority-pill ${report.priority.toLowerCase()}`}>
                                {report.priority}
                              </span>
                            </td>

                            <td>{report.status.replaceAll('_', ' ')}</td>

                            <td>
                              {assignedAdmin
                                ? assignedAdmin.name
                                : <span className="unassigned">Unassigned</span>}
                            </td>

                            <td>
                              <span className={slaClass}>{slaLabel}</span>
                            </td>

                            <td>
                              <div className="assignment-actions report-actions-professional">
                                <select
                                  value={report.assignedAdminId ?? ''}
                                  onChange={event => {
                                    const id = Number(event.target.value)
                                    if (id) assignReport(report.id, id)
                                  }}
                                >
                                  <option value="">Select Admin</option>
                                  {activeAdmins.map(admin => (
                                    <option key={admin.id} value={admin.id}>
                                      {admin.name} · {admin.assignedReports}/{maxReportsPerAdmin} open
                                    </option>
                                  ))}
                                </select>

                                {report.assignedAdminId === null && (
                                  <button onClick={() => autoAssignOne(report)}>Auto Assign</button>
                                )}

                                <button onClick={() => {
                                  setSelectedReportDetail(report)
                                  setReportNote('')
                                }}>
                                  View Details
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

            </>
          )
        }

        {
          section ===
          'users'
          &&
          (
            <>
              {
                renderHeader(
                  'Manage Users',
                  'Manage platform user accounts with the same moderation controls available to Admins.'
                )
              }

              <section className="dashboard-card">
                <div className="card-heading">
                  <div>
                    <h3>Platform Users</h3>
                    <p>Suspend, reactivate or deactivate user accounts while preserving account history.</p>
                  </div>
                </div>

                <div className="super-warning">
                  Deactivated users remain in the database so moderation history, ownership records and account identity are preserved.
                </div>

                <div className="filter-bar">
                  <input
                    type="search"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={event => setUserSearch(event.target.value)}
                  />
                  <select
                    value={userStatusFilter}
                    onChange={event => setUserStatusFilter(event.target.value)}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="DEACTIVATED">Deactivated</option>
                  </select>
                </div>

                <div className="table-wrapper">
                  <table className="super-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(user => (
                        <tr key={user.id}>
                          <td><strong>{user.name}</strong><small>User #{user.id}</small></td>
                          <td>{user.email}</td>
                          <td>{user.role}</td>
                          <td>
                            <span className={`status-pill ${user.status.toLowerCase()}`}>
                              {user.status}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              {user.status === 'ACTIVE' && (
                                <button onClick={() => updateUserStatus(user.id, 'SUSPENDED')}>Suspend</button>
                              )}
                              {user.status === 'SUSPENDED' && (
                                <button onClick={() => updateUserStatus(user.id, 'ACTIVE')}>Reactivate</button>
                              )}
                              {user.status !== 'DEACTIVATED' ? (
                                <button className="danger" onClick={() => updateUserStatus(user.id, 'DEACTIVATED')}>Deactivate</button>
                              ) : (
                                <button onClick={() => updateUserStatus(user.id, 'ACTIVE')}>Restore Account</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )
        }


        {
          section ===
          'moderation'
          &&
          (
            <>
              {
                renderHeader(
                  'Content Moderation',
                  'Review and control reported or inappropriate platform content across the entire network.'
                )
              }

              <section className="dashboard-card">
                <div className="card-heading">
                  <div>
                    <h3>Moderation Queue</h3>
                    <p>Super Admin can perform every content action available to an Admin.</p>
                  </div>
                </div>

                <div className="filter-bar">
                  <input
                    type="search"
                    placeholder="Search content, owner or type..."
                    value={moderationSearch}
                    onChange={event => setModerationSearch(event.target.value)}
                  />
                </div>

                <div className="table-wrapper">
                  <table className="super-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Content</th>
                        <th>Owner</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredModerationItems.map(item => (
                        <tr key={`${item.type}-${item.id}`}>
                          <td><span className="content-type-pill">{item.type}</span></td>
                          <td><strong>{item.title}</strong><small>#{item.id}</small></td>
                          <td>{item.owner}</td>
                          <td>
                            <span className={`status-pill ${item.status.toLowerCase()}`}>
                              {item.status}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                className={item.status === 'VISIBLE' ? 'danger' : ''}
                                onClick={() => toggleModerationItem(item.id)}
                              >
                                {item.status === 'VISIBLE' ? 'Remove' : 'Restore'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )
        }


        {
          section ===
          'analytics'
          &&
          (
            <>

              {
                renderHeader(
                  'Analytics',
                  'Platform growth, engagement, reporting and administrator performance.'
                )
              }

             

            </>
          )
        }


        {
          section ===
          'access'
          &&
          (
            <>

              {
                renderHeader(
                  'Admin Access',
                  'Control individual Admin access and management capabilities.'
                )
              }


              <section
                className=
                  "dashboard-card"
              >

                <div
                  className=
                    "table-wrapper"
                >

                  <table
                    className=
                      "super-table access-table"
                  >

                    <thead>

                      <tr>
                        <th>
                          Admin
                        </th>
                        <th>
                          Sign-in
                        </th>
                        <th>
                          Users
                        </th>
                        <th>
                          Reports
                        </th>
                        <th>
                          Moderation
                        </th>
                        <th>
                          Analytics
                        </th>
                        <th>
                          Status
                        </th>
                      </tr>

                    </thead>

                    <tbody>

                      {
                        admins.map(
                          admin => (

                            <tr
                              key=
                                {admin.id}
                            >

                              <td>
                                <strong>
                                  {
                                    admin.name
                                  }
                                </strong>
                                <small>
                                  {
                                    admin.email
                                  }
                                </small>
                              </td>


                              <td>
                                <button
                                  className={
                                    `access-button ${admin.accessEnabled ? 'enabled' : ''}`
                                  }
                                  onClick={() =>
                                    updateAccess(
                                      admin.id,
                                      'accessEnabled'
                                    )
                                  }
                                >
                                  {
                                    admin
                                      .accessEnabled
                                      ?
                                      'Enabled'
                                      :
                                      'Disabled'
                                  }
                                </button>
                              </td>


                              <td>
                                <button
                                  className={
                                    `access-button ${admin.canManageUsers ? 'enabled' : ''}`
                                  }
                                  onClick={() =>
                                    updateAccess(
                                      admin.id,
                                      'canManageUsers'
                                    )
                                  }
                                >
                                  {
                                    admin
                                      .canManageUsers
                                      ?
                                      'Allowed'
                                      :
                                      'Blocked'
                                  }
                                </button>
                              </td>


                              <td>
                                <button
                                  className={
                                    `access-button ${admin.canReviewReports ? 'enabled' : ''}`
                                  }
                                  onClick={() =>
                                    updateAccess(
                                      admin.id,
                                      'canReviewReports'
                                    )
                                  }
                                >
                                  {
                                    admin
                                      .canReviewReports
                                      ?
                                      'Allowed'
                                      :
                                      'Blocked'
                                  }
                                </button>
                              </td>


                              <td>
                                <button
                                  className={
                                    `access-button ${admin.canModerateContent ? 'enabled' : ''}`
                                  }
                                  onClick={() =>
                                    updateAccess(
                                      admin.id,
                                      'canModerateContent'
                                    )
                                  }
                                >
                                  {
                                    admin
                                      .canModerateContent
                                      ?
                                      'Allowed'
                                      :
                                      'Blocked'
                                  }
                                </button>
                              </td>


                              <td>
                                <button
                                  className={
                                    `access-button ${admin.canViewAnalytics ? 'enabled' : ''}`
                                  }
                                  onClick={() =>
                                    updateAccess(
                                      admin.id,
                                      'canViewAnalytics'
                                    )
                                  }
                                >
                                  {
                                    admin
                                      .canViewAnalytics
                                      ?
                                      'Allowed'
                                      :
                                      'Blocked'
                                  }
                                </button>
                              </td>


                              <td>
                                {
                                  admin.status
                                }
                              </td>

                            </tr>

                          )
                        )
                      }

                    </tbody>

                  </table>

                </div>

              </section>

            </>
          )
        }


        


        {
          section ===
          'system'
          &&
          (
            <>

              {
                renderHeader(
                  'System',
                  'Platform services, security monitoring, announcements, backup visibility and operational health.'
                )
              }


              <section className="dashboard-card announcement-card">
                <div className="card-heading">
                  <div>
                    <h3>Platform Announcement</h3>
                    <p>Create an operational announcement for a selected audience.</p>
                  </div>
                </div>

                <div className="announcement-controls">
                  <select
                    value={announcementAudience}
                    onChange={event => setAnnouncementAudience(event.target.value)}
                  >
                    <option value="ALL_USERS">All Users</option>
                    <option value="ADMINS_ONLY">Admins Only</option>
                    <option value="CREATIVE_PROFESSIONALS">Creative Professionals</option>
                    <option value="ORGANISATIONS">Organisations</option>
                  </select>

                  <textarea
                    value={announcementText}
                    onChange={event => setAnnouncementText(event.target.value)}
                    placeholder="Example: Scheduled platform maintenance tonight at 11:00 PM."
                    rows={3}
                  />

                  <button className="primary-button" onClick={publishAnnouncement}>
                    Publish Announcement
                  </button>
                </div>

                {lastAnnouncement && (
                  <div className="last-announcement">
                    <span>Last published</span>
                    <strong>{lastAnnouncement}</strong>
                  </div>
                )}
              </section>


              <section className="dashboard-card">
                <div className="card-heading">
                  <div>
                    <h3>Service Status</h3>
                    <p>Platform service monitoring.</p>
                  </div>
                </div>

                <div className="system-grid">
                  <div><span className="health-dot ok" /><strong>Authentication</strong><small>Operational</small></div>
                  <div><span className="health-dot ok" /><strong>Spring Boot API</strong><small>Operational</small></div>
                  <div><span className="health-dot ok" /><strong>MySQL</strong><small>Connected</small></div>
                  <div><span className="health-dot ok" /><strong>JWT Security</strong><small>Healthy</small></div>
                </div>
              </section>


              <section className="dashboard-card">
                <div className="card-heading">
                  <div>
                    <h3>Security & Recovery Snapshot</h3>
                    <p>Operational indicators prepared for future backend health endpoints.</p>
                  </div>
                </div>

                <div className="security-grid">
                  <div><span>Active Sessions</span><strong>34</strong><small>Current authenticated sessions</small></div>
                  <div><span>Failed Logins</span><strong>3</strong><small>Recent failed sign-in attempts</small></div>
                  <div><span>Suspended Admins</span><strong>{admins.filter(admin => admin.status === 'SUSPENDED').length}</strong><small>Administrator accounts restricted</small></div>
                  <div><span>Audit Events</span><strong>{auditLogs.length}</strong><small>Recorded administrative events</small></div>
                  <div><span>Database Backup</span><strong className="healthy-text">Successful</strong><small>Last demo backup: Today 2:00 AM</small></div>
                  <div><span>Recovery Check</span><strong className="healthy-text">Ready</strong><small>Recovery workflow available</small></div>
                  <div><span>Maintenance Mode</span><strong>{modules.find(module => module.id === 'maintenance')?.enabled ? 'ON' : 'OFF'}</strong><small>Controlled in System Modules</small></div>
                  <div><span>Notification Service</span><strong className="healthy-text">Operational</strong><small>Administrative alerts available</small></div>
                </div>
              </section>

            </>
          )
        }

        {
          section ===
          'audit'
          &&
          (
            <>

              {
                renderHeader(
                  'Audit Logs',
                  'History of important administrative actions.'
                )
              }


              <section
                className=
                  "dashboard-card"
              >

                <div
                  className=
                    "filter-bar"
                >

                  <input
                    value=
                      {auditSearch}
                    onChange={
                      event =>
                        setAuditSearch(
                          event
                            .target
                            .value
                        )
                    }
                    placeholder=
                      "Search audit logs..."
                  />


                  <button
                    className=
                      "secondary-button"
                    onClick={() => {

                      const rows = [
                        'Admin,Action,Target,Time',
                        ...filteredAuditLogs.map(
                          log =>
                            `${log.admin},${log.action},${log.target},${log.time}`
                        ),
                      ]

                      const blob =
                        new Blob(
                          [
                            rows.join(
                              '\n'
                            ),
                          ],
                          {
                            type:
                              'text/csv',
                          }
                        )

                      const url =
                        URL
                          .createObjectURL(
                            blob
                          )

                      const anchor =
                        document
                          .createElement(
                            'a'
                          )

                      anchor.href =
                        url

                      anchor.download =
                        'audit-logs.csv'

                      anchor.click()

                      URL
                        .revokeObjectURL(
                          url
                        )

                    }}
                  >
                    Export CSV
                  </button>

                </div>


                <div
                  className=
                    "audit-timeline"
                >

                  {
                    filteredAuditLogs.map(
                      log => (

                        <div
                          className=
                            "audit-row"
                          key=
                            {log.id}
                        >

                          <span
                            className=
                              "audit-dot"
                          />

                          <div>

                            <strong>
                              {
                                log.action
                                  .replaceAll(
                                    '_',
                                    ' '
                                  )
                              }
                            </strong>

                            <p>
                              {
                                log.admin
                              } · {
                                log.target
                              }
                            </p>

                          </div>

                          <time>
                            {
                              log.time
                            }
                          </time>

                        </div>

                      )
                    )
                  }

                </div>

              </section>

            </>
          )
        }

      </main>


      {addAdminOpen && (
        <div className="super-modal-overlay" onClick={() => setAddAdminOpen(false)}>
          <div className="super-professional-modal" onClick={event => event.stopPropagation()}>
            <div className="super-modal-heading">
              <div>
                <span className="modal-eyebrow">ADMIN MANAGEMENT</span>
                <h2>Add New Admin</h2>
                <p>Create a new administrator profile. Backend account creation will be connected during API integration.</p>
              </div>
              <button className="modal-icon-close" onClick={() => setAddAdminOpen(false)}>×</button>
            </div>

            <div className="super-form-grid">
              <label>
                Full Name *
                <input value={newAdmin.fullName} onChange={event => setNewAdmin(current => ({ ...current, fullName: event.target.value }))} placeholder="Admin full name" />
              </label>
              <label>
                Username *
                <input value={newAdmin.username} onChange={event => setNewAdmin(current => ({ ...current, username: event.target.value }))} placeholder="username" />
              </label>
              <label className="full-width-field">
                Email *
                <input type="email" value={newAdmin.email} onChange={event => setNewAdmin(current => ({ ...current, email: event.target.value }))} placeholder="admin@example.com" />
              </label>
              <label>
                Temporary Password *
                <input type="password" value={newAdmin.temporaryPassword} onChange={event => setNewAdmin(current => ({ ...current, temporaryPassword: event.target.value }))} placeholder="Minimum 8 characters" />
              </label>
              <label>
                Initial Status
                <select value={newAdmin.status} onChange={event => setNewAdmin(current => ({ ...current, status: event.target.value as AdminStatus }))}>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </label>
            </div>

            <label className="checkbox-setting">
              <input
                type="checkbox"
                checked={newAdmin.forcePasswordChange}
                onChange={event => setNewAdmin(current => ({ ...current, forcePasswordChange: event.target.checked }))}
              />
              <span>
                <strong>Require password change on first login</strong>
                <small>Recommended for newly created Admin accounts.</small>
              </span>
            </label>

            <div className="super-modal-actions">
              <button className="secondary-button" onClick={() => setAddAdminOpen(false)}>Cancel</button>
              <button className="primary-button" onClick={createNewAdmin}>Create Admin</button>
            </div>
          </div>
        </div>
      )}


      {selectedAdmin && (
        <div className="super-modal-overlay" onClick={() => setSelectedAdmin(null)}>
          <div className="super-professional-modal admin-detail-modal" onClick={event => event.stopPropagation()}>
            <div className="super-modal-heading">
              <div>
                <span className="modal-eyebrow">ADMIN DETAILS</span>
                <h2>{selectedAdmin.name}</h2>
                <p>{selectedAdmin.email}{selectedAdmin.username ? ` · @${selectedAdmin.username}` : ''}</p>
              </div>
              <button className="modal-icon-close" onClick={() => setSelectedAdmin(null)}>×</button>
            </div>

            <div className="admin-detail-grid">
              <div><span>Status</span><strong>{selectedAdmin.status}</strong></div>
              <div><span>Open Reports</span><strong>{selectedAdmin.assignedReports}</strong></div>
              <div><span>Resolved Today</span><strong>{selectedAdmin.resolvedToday}</strong></div>
              <div><span>Last Active</span><strong>{selectedAdmin.lastActive}</strong></div>
              <div><span>Sign-in Access</span><strong>{selectedAdmin.accessEnabled ? 'Enabled' : 'Disabled'}</strong></div>
              <div><span>Created</span><strong>{selectedAdmin.createdAt ?? 'Existing account'}</strong></div>
            </div>

            <div className="admin-capability-list">
              <span className={selectedAdmin.canManageUsers ? 'enabled-capability' : ''}>Manage Users</span>
              <span className={selectedAdmin.canReviewReports ? 'enabled-capability' : ''}>Review Reports</span>
              <span className={selectedAdmin.canModerateContent ? 'enabled-capability' : ''}>Moderate Content</span>
              <span className={selectedAdmin.canViewAnalytics ? 'enabled-capability' : ''}>View Analytics</span>
            </div>

            <div className="super-modal-actions wrap-actions">
              <button className="secondary-button" onClick={() => forceLogoutAdmin(selectedAdmin)}>Force Logout</button>
              <button className="secondary-button" onClick={() => suspendAdmin(selectedAdmin.id)}>
                {selectedAdmin.status === 'ACTIVE' ? 'Suspend Admin' : 'Reactivate Admin'}
              </button>
              <button className="danger-button" onClick={() => {
                const id = selectedAdmin.id
                setSelectedAdmin(null)
                removeAdmin(id)
              }}>
                Remove Admin
              </button>
            </div>
          </div>
        </div>
      )}


      {selectedReportDetail && (
        <div className="super-modal-overlay" onClick={() => setSelectedReportDetail(null)}>
          <div className="super-professional-modal report-detail-modal-professional" onClick={event => event.stopPropagation()}>
            <div className="super-modal-heading">
              <div>
                <span className="modal-eyebrow">REPORT CONTROL</span>
                <h2>Report #{selectedReportDetail.id}</h2>
                <p>{selectedReportDetail.target} · {selectedReportDetail.reason}</p>
              </div>
              <button className="modal-icon-close" onClick={() => setSelectedReportDetail(null)}>×</button>
            </div>

            <div className="admin-detail-grid report-detail-summary">
              <div><span>Priority</span><strong>{selectedReportDetail.priority}</strong></div>
              <div><span>Status</span><strong>{selectedReportDetail.status.replaceAll('_', ' ')}</strong></div>
              <div><span>Age</span><strong>{selectedReportDetail.ageHours} hours</strong></div>
              <div><span>SLA</span><strong>{getSlaLabel(selectedReportDetail)}</strong></div>
              <div><span>Created</span><strong>{selectedReportDetail.createdAt}</strong></div>
              <div><span>Assigned</span><strong>{admins.find(admin => admin.id === selectedReportDetail.assignedAdminId)?.name ?? 'Unassigned'}</strong></div>
            </div>

            <div className="report-history-section">
              <h3>Report History</h3>
              <div className="report-history-list">
                <p>Created: {selectedReportDetail.createdAt}</p>
                {(selectedReportDetail.history ?? []).map((entry, index) => <p key={`${entry}-${index}`}>{entry}</p>)}
              </div>
            </div>

            <div className="report-history-section">
              <h3>Internal Notes</h3>
              <div className="report-note-list">
                {(selectedReportDetail.notes ?? []).length
                  ? selectedReportDetail.notes?.map((note, index) => <p key={`${note}-${index}`}>{note}</p>)
                  : <p>No internal notes yet.</p>}
              </div>
              <textarea value={reportNote} onChange={event => setReportNote(event.target.value)} placeholder="Add an internal moderation note..." rows={3} />
              <button className="secondary-button add-note-button" onClick={addReportNote}>Add Internal Note</button>
            </div>

            <div className="super-modal-actions wrap-actions">
              <button className="secondary-button" onClick={() => updateReportStatus(selectedReportDetail.id, 'UNDER_REVIEW')}>Under Review</button>
              <button className="secondary-button" onClick={() => updateReportStatus(selectedReportDetail.id, 'ESCALATED')}>Escalate</button>
              <button className="primary-button" onClick={() => updateReportStatus(selectedReportDetail.id, 'RESOLVED')}>Resolve</button>
              <button className="danger-button" onClick={() => updateReportStatus(selectedReportDetail.id, 'DISMISSED')}>Dismiss</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}


export default SuperAdminDashboard