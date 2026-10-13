import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import './SuperAdminDashboard.css'

import AnalyticsDashboard
  from '../../shared/Analytics/AnalyticsDashboard'


type Section =
  | 'overview'
  | 'admins'
  | 'reports'
  | 'analytics'
  | 'roles'
  | 'modules'
  | 'system'
  | 'audit'


type OverviewPeriod =
  | 'today'
  | '7d'
  | '30d'
  | '6m'
  | '1y'


type AdminAccount = {
  id: number
  name: string
  email: string
  role:
    | 'ADMIN'
    | 'SUPER_ADMIN'
  status:
    | 'ACTIVE'
    | 'SUSPENDED'
  assignedReports: number
  resolvedToday: number
}


type PlatformUser = {
  id: number
  name: string
  email: string
  role: string
  status: string
}


type Report = {
  id: number
  target: string
  reason: string
  priority:
    | 'LOW'
    | 'MEDIUM'
    | 'HIGH'
    | 'URGENT'
  status:
    | 'OPEN'
    | 'UNDER_REVIEW'
    | 'RESOLVED'
    | 'DISMISSED'
  assignedAdminId: number | null
  createdAt: string
  ageHours: number
}


type AuditLog = {
  id: number
  admin: string
  action: string
  target: string
  time: string
}


type OverviewPoint = {
  label: string
  activeUsers: number
  newUsers: number
  engagement: number
  reports: number
  resolved: number
}


type Creator = {
  id: number
  name: string
  username: string
  followers: number
  engagement: number
}


type Registration = {
  id: number
  name: string
  email: string
  role: string
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
    id: 1,
    name: 'Meenakshi',
    email: 'meenakshi@example.com',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    assignedReports: 0,
    resolvedToday: 12,
  },
  {
    id: 2,
    name: 'Arjun Patel',
    email: 'arjun@example.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    assignedReports: 4,
    resolvedToday: 8,
  },
  {
    id: 3,
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    assignedReports: 2,
    resolvedToday: 9,
  },
  {
    id: 4,
    name: 'Daniel Lee',
    email: 'daniel@example.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    assignedReports: 3,
    resolvedToday: 5,
  },
]


const availableUsers: PlatformUser[] = [
  {
    id: 21,
    name: 'Ravi Kumar',
    email: 'ravi@example.com',
    role: 'CREATIVE_PROFESSIONAL',
    status: 'ACTIVE',
  },
  {
    id: 22,
    name: 'Priya Sharma',
    email: 'priya@example.com',
    role: 'CREATIVE_PROFESSIONAL',
    status: 'ACTIVE',
  },
  {
    id: 23,
    name: 'James Brown',
    email: 'james@example.com',
    role: 'ORGANISATION',
    status: 'ACTIVE',
  },
]


const initialReports: Report[] = [
  {
    id: 104,
    target: 'Post #240',
    reason: 'Harassment',
    priority: 'HIGH',
    status: 'OPEN',
    assignedAdminId: null,
    createdAt: 'Today 11:28 PM',
    ageHours: 5,
  },
  {
    id: 105,
    target: 'User #58',
    reason: 'Spam',
    priority: 'MEDIUM',
    status: 'UNDER_REVIEW',
    assignedAdminId: 2,
    createdAt: 'Today 10:45 PM',
    ageHours: 7,
  },
  {
    id: 106,
    target: 'Event #31',
    reason: 'Misleading information',
    priority: 'LOW',
    status: 'OPEN',
    assignedAdminId: 3,
    createdAt: 'Today 9:30 PM',
    ageHours: 8,
  },
  {
    id: 107,
    target: 'Portfolio #76',
    reason: 'Inappropriate content',
    priority: 'URGENT',
    status: 'OPEN',
    assignedAdminId: null,
    createdAt: 'Today 8:18 PM',
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
]


const initialAuditLogs: AuditLog[] = [
  {
    id: 1,
    admin: 'Meenakshi',
    action: 'ASSIGN_REPORT',
    target: 'Report #105 → Arjun Patel',
    time: '11:28 PM',
  },
  {
    id: 2,
    admin: 'Sarah Wilson',
    action: 'RESOLVE_REPORT',
    target: 'Report #98',
    time: '11:16 PM',
  },
  {
    id: 3,
    admin: 'Meenakshi',
    action: 'ADD_ADMIN',
    target: 'Daniel Lee',
    time: '10:54 PM',
  },
  {
    id: 4,
    admin: 'Arjun Patel',
    action: 'SUSPEND_USER',
    target: 'User #58',
    time: '10:21 PM',
  },
  {
    id: 5,
    admin: 'Meenakshi',
    action: 'UPDATE_MODULE',
    target: 'Portfolio Comments',
    time: '9:48 PM',
  },
]


const topCreators: Creator[] = [
  {
    id: 21,
    name: 'Ravi Kumar',
    username: '@ravik',
    followers: 2482,
    engagement: 1248,
  },
  {
    id: 22,
    name: 'Priya Sharma',
    username: '@priyasharma',
    followers: 2175,
    engagement: 1043,
  },
  {
    id: 24,
    name: 'Daniel Lee',
    username: '@danielcreative',
    followers: 1940,
    engagement: 895,
  },
  {
    id: 25,
    name: 'Sarah Wilson',
    username: '@sarahw',
    followers: 1710,
    engagement: 760,
  },
]


const recentRegistrations: Registration[] = [
  {
    id: 301,
    name: 'Aisha Khan',
    email: 'aisha@example.com',
    role: 'CREATIVE_PROFESSIONAL',
    time: '8 min ago',
  },
  {
    id: 302,
    name: 'Studio North',
    email: 'hello@studionorth.com',
    role: 'ORGANISATION',
    time: '19 min ago',
  },
  {
    id: 303,
    name: 'Liam Cooper',
    email: 'liam@example.com',
    role: 'CREATIVE_PROFESSIONAL',
    time: '31 min ago',
  },
  {
    id: 304,
    name: 'Maya Singh',
    email: 'maya@example.com',
    role: 'CREATIVE_PROFESSIONAL',
    time: '47 min ago',
  },
]


const permissions = [
  {
    permission:
      'View platform dashboard',
    admin: true,
    superAdmin: true,
  },
  {
    permission:
      'Manage users',
    admin: true,
    superAdmin: true,
  },
  {
    permission:
      'Review assigned reports',
    admin: true,
    superAdmin: true,
  },
  {
    permission:
      'Moderate content',
    admin: true,
    superAdmin: true,
  },
  {
    permission:
      'View audit logs',
    admin: true,
    superAdmin: true,
  },
  {
    permission:
      'Add or remove administrators',
    admin: false,
    superAdmin: true,
  },
  {
    permission:
      'Assign reports to administrators',
    admin: false,
    superAdmin: true,
  },
  {
    permission:
      'Manage roles and permissions',
    admin: false,
    superAdmin: true,
  },
  {
    permission:
      'Manage system modules',
    admin: false,
    superAdmin: true,
  },
  {
    permission:
      'Manage global settings',
    admin: false,
    superAdmin: true,
  },
]


const periodLabels: Record<
  OverviewPeriod,
  string
> = {
  today: 'Today',
  '7d': '7 Days',
  '30d': '30 Days',
  '6m': '6 Months',
  '1y': '1 Year',
}


function buildOverviewData(
  period: OverviewPeriod,
): OverviewPoint[] {

  let labels: string[] = []
  let multiplier = 1

  if (period === 'today') {
    labels = [
      '12 AM',
      '4 AM',
      '8 AM',
      '12 PM',
      '4 PM',
      '8 PM',
      'Now',
    ]

    multiplier = 0.35
  }

  if (period === '7d') {
    labels = [
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
    ]

    multiplier = 1
  }

  if (period === '30d') {
    labels = [
      '1 Oct',
      '5 Oct',
      '10 Oct',
      '15 Oct',
      '20 Oct',
      '25 Oct',
      '30 Oct',
    ]

    multiplier = 3.6
  }

  if (period === '6m') {
    labels = [
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
    ]

    multiplier = 17
  }

  if (period === '1y') {
    labels = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]

    multiplier = 31
  }

  return labels.map(
    (
      label,
      index,
    ) => {

      const activeUsers =
        Math.max(
          40,
          Math.round(
            (
              380
              +
              index * 22
              +
              Math.sin(
                index * 0.8
              ) * 34
            )
            *
            (
              period === 'today'
                ? 0.7
                : 1
            )
          )
        )

      const newUsers =
        Math.max(
          1,
          Math.round(
            (
              14
              +
              index * 3
              +
              Math.cos(index) * 4
            )
            *
            multiplier
          )
        )

      const engagement =
        Math.max(
          1,
          Math.round(
            (
              410
              +
              index * 60
              +
              Math.sin(
                index * 0.7
              ) * 90
            )
            *
            multiplier
          )
        )

      const reports =
        Math.max(
          1,
          Math.round(
            (
              4
              +
              index * 0.7
              +
              Math.cos(
                index * 0.9
              ) * 1.4
            )
            *
            Math.max(
              1,
              multiplier * 0.35,
            )
          )
        )

      const resolved =
        Math.max(
          0,
          Math.round(
            reports * 0.82
          )
        )

      return {
        label,
        activeUsers,
        newUsers,
        engagement,
        reports,
        resolved,
      }
    }
  )
}


function LineChart({
  data,
  dataKey,
}: {
  data: OverviewPoint[]
  dataKey:
    | 'activeUsers'
    | 'newUsers'
    | 'engagement'
    | 'reports'
    | 'resolved'
}) {

  const width = 620
  const height = 210
  const padding = 28

  const values =
    data.map(
      item =>
        Number(
          item[dataKey]
        )
    )

  const max =
    Math.max(
      ...values,
      1,
    )

  const min =
    Math.min(
      ...values,
      0,
    )

  const range =
    max - min || 1

  const points =
    data
      .map(
        (
          item,
          index,
        ) => {

          const x =
            padding
            +
            (
              index
              /
              Math.max(
                data.length - 1,
                1,
              )
            )
            *
            (
              width
              -
              padding * 2
            )

          const y =
            height
            -
            padding
            -
            (
              (
                Number(
                  item[dataKey]
                )
                -
                min
              )
              /
              range
            )
            *
            (
              height
              -
              padding * 2
            )

          return `${x},${y}`
        }
      )
      .join(' ')

  return (
    <div className="chart-wrapper">

      <svg
        className="line-chart"
        viewBox={
          `0 0 ${width} ${height}`
        }
        role="img"
        aria-label="Overview trend chart"
      >

        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          className="chart-axis"
        />

        <polyline
          points={points}
          fill="none"
          className="chart-line"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {
          data.map(
            (
              item,
              index,
            ) => {

              const x =
                padding
                +
                (
                  index
                  /
                  Math.max(
                    data.length - 1,
                    1,
                  )
                )
                *
                (
                  width
                  -
                  padding * 2
                )

              const y =
                height
                -
                padding
                -
                (
                  (
                    Number(
                      item[dataKey]
                    )
                    -
                    min
                  )
                  /
                  range
                )
                *
                (
                  height
                  -
                  padding * 2
                )

              return (
                <g
                  key={
                    `${item.label}-${index}`
                  }
                >
                  <circle
                    cx={x}
                    cy={y}
                    r="5"
                    className="chart-dot"
                  />

                  <text
                    x={x}
                    y={height - 8}
                    textAnchor="middle"
                    className="chart-label"
                  >
                    {
                      item.label
                    }
                  </text>
                </g>
              )
            }
          )
        }

      </svg>

    </div>
  )
}


function SuperAdminDashboard() {

  const [
    section,
    setSection,
  ] =
    useState<Section>(
      'overview'
    )

  const [
    overviewPeriod,
    setOverviewPeriod,
  ] =
    useState<OverviewPeriod>(
      '7d'
    )

  const [
    admins,
    setAdmins,
  ] =
    useState<AdminAccount[]>(
      initialAdmins
    )

  const [
    reports,
    setReports,
  ] =
    useState<Report[]>(
      initialReports
    )

  const [
    auditLogs,
    setAuditLogs,
  ] =
    useState<AuditLog[]>(
      initialAuditLogs
    )

  const [
    showAddAdmin,
    setShowAddAdmin,
  ] =
    useState(false)

  const [
    selectedUserId,
    setSelectedUserId,
  ] =
    useState<number | null>(
      null
    )

  const [
    assigningReport,
    setAssigningReport,
  ] =
    useState<Report | null>(
      null
    )

  const [
    selectedAdminId,
    setSelectedAdminId,
  ] =
    useState<number | null>(
      null
    )

  const [
    lastUpdated,
    setLastUpdated,
  ] =
    useState(
      new Date()
    )

  const [
    toast,
    setToast,
  ] =
    useState<Toast>(
      null
    )

  const [
    modules,
    setModules,
  ] =
    useState([
      {
        id: 1,
        name: 'Profiles',
        enabled: true,
      },
      {
        id: 2,
        name: 'Portfolio',
        enabled: true,
      },
      {
        id: 3,
        name: 'Portfolio Comments',
        enabled: true,
      },
      {
        id: 4,
        name: 'Networking',
        enabled: true,
      },
      {
        id: 5,
        name: 'Collaboration',
        enabled: true,
      },
      {
        id: 6,
        name: 'Events',
        enabled: true,
      },
      {
        id: 7,
        name: 'Payments',
        enabled: true,
      },
    ])

  const [
    settings,
    setSettings,
  ] =
    useState({
      registrationEnabled:
        true,
      eventCreationEnabled:
        true,
      collaborationEnabled:
        true,
      maintenanceMode:
        false,
    })


  useEffect(
    () => {

      const timer =
        window.setInterval(
          () => {

            setLastUpdated(
              new Date()
            )

          },
          60000,
        )

      return () =>
        window.clearInterval(
          timer
        )

    },
    [],
  )


  useEffect(
    () => {

      if (!toast) {
        return
      }

      const timer =
        window.setTimeout(
          () => {
            setToast(
              null
            )
          },
          3000,
        )

      return () =>
        window.clearTimeout(
          timer
        )

    },
    [
      toast,
    ],
  )


  const overviewData =
    useMemo(
      () =>
        buildOverviewData(
          overviewPeriod
        ),
      [
        overviewPeriod,
      ],
    )


  const overviewTotals =
    useMemo(
      () => {

        return overviewData.reduce(
          (
            result,
            point,
          ) => {

            result.newUsers +=
              point.newUsers

            result.engagement +=
              point.engagement

            result.reports +=
              point.reports

            result.resolved +=
              point.resolved

            return result
          },
          {
            newUsers: 0,
            engagement: 0,
            reports: 0,
            resolved: 0,
          },
        )

      },
      [
        overviewData,
      ],
    )


  const activeUsersNow =
    overviewData.length > 0
      ? overviewData[
          overviewData.length - 1
        ].activeUsers
      : 0


  const normalAdmins =
    useMemo(
      () =>
        admins.filter(
          admin =>
            admin.role
            ===
            'ADMIN'
        ),
      [
        admins,
      ],
    )


  const activeAdmins =
    normalAdmins.filter(
      admin =>
        admin.status
        ===
        'ACTIVE'
    ).length


  const openReports =
    reports.filter(
      report =>
        report.status
        ===
        'OPEN'
        ||
        report.status
        ===
        'UNDER_REVIEW'
    ).length


  const unassignedReports =
    reports.filter(
      report =>
        report.assignedAdminId
        ===
        null
    ).length


  const urgentReports =
    reports.filter(
      report =>
        report.priority
        ===
        'URGENT'
        &&
        report.status
        !==
        'RESOLVED'
        &&
        report.status
        !==
        'DISMISSED'
    ).length


  const overdueReports =
    reports.filter(
      report =>
        report.ageHours >= 24
        &&
        report.status
        !==
        'RESOLVED'
        &&
        report.status
        !==
        'DISMISSED'
    ).length


  


  const enabledModules =
    modules.filter(
      module =>
        module.enabled
    ).length


  const showToast =
    (
      type:
        | 'success'
        | 'error',
      message: string,
    ) => {

      setToast({
        type,
        message,
      })

    }


  const addAuditLog =
    (
      action: string,
      target: string,
    ) => {

      const now =
        new Date()

      setAuditLogs(
        previous => [
          {
            id: Date.now(),
            admin: 'Super Admin',
            action,
            target,
            time:
              now.toLocaleTimeString(
                [],
                {
                  hour:
                    '2-digit',
                  minute:
                    '2-digit',
                }
              ),
          },
          ...previous,
        ]
      )
    }


  const handleRefresh =
    () => {

      setLastUpdated(
        new Date()
      )

      showToast(
        'success',
        'Dashboard refreshed successfully.',
      )
    }


  const handleAddAdmin =
    () => {

      if (!selectedUserId) {
        showToast(
          'error',
          'Select a user first.',
        )
        return
      }

      const user =
        availableUsers.find(
          candidate =>
            candidate.id
            ===
            selectedUserId
        )

      if (!user) {
        showToast(
          'error',
          'Unable to find the selected user.',
        )
        return
      }

      const alreadyAdmin =
        admins.some(
          admin =>
            admin.email
            ===
            user.email
        )

      if (alreadyAdmin) {
        showToast(
          'error',
          'This user already has administrator access.',
        )
        return
      }

      setAdmins(
        previous => [
          ...previous,
          {
            id:
              user.id,
            name:
              user.name,
            email:
              user.email,
            role:
              'ADMIN',
            status:
              'ACTIVE',
            assignedReports:
              0,
            resolvedToday:
              0,
          },
        ]
      )

      addAuditLog(
        'ADD_ADMIN',
        user.name,
      )

      showToast(
        'success',
        `${user.name} was added as an administrator.`,
      )

      setSelectedUserId(
        null
      )

      setShowAddAdmin(
        false
      )
    }


  const removeAdmin =
    (
      adminId: number,
    ) => {

      const admin =
        admins.find(
          candidate =>
            candidate.id
            ===
            adminId
        )

      if (
        !admin
        ||
        admin.role
        ===
        'SUPER_ADMIN'
      ) {
        return
      }

      const confirmed =
        window.confirm(
          `Remove administrator access from ${admin.name}?`,
        )

      if (!confirmed) {
        return
      }

      setAdmins(
        previous =>
          previous.filter(
            candidate =>
              candidate.id
              !==
              adminId
          )
      )

      setReports(
        previous =>
          previous.map(
            report =>
              report.assignedAdminId
              ===
              adminId
                ? {
                    ...report,
                    assignedAdminId:
                      null,
                    status:
                      'OPEN',
                  }
                : report
          )
      )

      addAuditLog(
        'REMOVE_ADMIN',
        admin.name,
      )

      showToast(
        'success',
        `${admin.name} is no longer an administrator.`,
      )
    }


  const toggleAdminStatus =
    (
      adminId: number,
    ) => {

      const admin =
        admins.find(
          candidate =>
            candidate.id
            ===
            adminId
        )

      if (
        !admin
        ||
        admin.role
        ===
        'SUPER_ADMIN'
      ) {
        return
      }

      const newStatus =
        admin.status
        ===
        'ACTIVE'
          ? 'SUSPENDED'
          : 'ACTIVE'

      if (
        newStatus
        ===
        'SUSPENDED'
      ) {

        const confirmed =
          window.confirm(
            `Suspend ${admin.name}?`,
          )

        if (!confirmed) {
          return
        }
      }

      setAdmins(
        previous =>
          previous.map(
            candidate =>
              candidate.id
              ===
              adminId
                ? {
                    ...candidate,
                    status:
                      newStatus,
                  }
                : candidate
          )
      )

      addAuditLog(
        newStatus
        ===
        'SUSPENDED'
          ? 'SUSPEND_ADMIN'
          : 'REACTIVATE_ADMIN',
        admin.name,
      )

      showToast(
        'success',
        `${admin.name} is now ${newStatus.toLowerCase()}.`,
      )
    }


  const assignReport =
    () => {

      if (
        !assigningReport
        ||
        !selectedAdminId
      ) {
        showToast(
          'error',
          'Select an administrator first.',
        )
        return
      }

      const selectedAdmin =
        admins.find(
          admin =>
            admin.id
            ===
            selectedAdminId
        )

      if (
        !selectedAdmin
        ||
        selectedAdmin.status
        !==
        'ACTIVE'
      ) {
        showToast(
          'error',
          'The selected administrator is not available.',
        )
        return
      }

      setReports(
        previous =>
          previous.map(
            report =>
              report.id
              ===
              assigningReport.id
                ? {
                    ...report,
                    assignedAdminId:
                      selectedAdminId,
                    status:
                      'UNDER_REVIEW',
                  }
                : report
          )
      )

      addAuditLog(
        assigningReport
          .assignedAdminId
          ? 'REASSIGN_REPORT'
          : 'ASSIGN_REPORT',
        `Report #${
          assigningReport.id
        } → ${
          selectedAdmin.name
        }`,
      )

      showToast(
        'success',
        `Report #${assigningReport.id} assigned to ${selectedAdmin.name}.`,
      )

      setAssigningReport(
        null
      )

      setSelectedAdminId(
        null
      )
    }


  const toggleModule =
    (
      moduleId: number,
    ) => {

      const module =
        modules.find(
          candidate =>
            candidate.id
            ===
            moduleId
        )

      if (!module) {
        return
      }

      const nextEnabled =
        !module.enabled

      setModules(
        previous =>
          previous.map(
            candidate =>
              candidate.id
              ===
              moduleId
                ? {
                    ...candidate,
                    enabled:
                      nextEnabled,
                  }
                : candidate
          )
      )

      addAuditLog(
        'UPDATE_MODULE',
        `${module.name}: ${
          nextEnabled
            ? 'Enabled'
            : 'Disabled'
        }`,
      )

      showToast(
        'success',
        `${module.name} ${
          nextEnabled
            ? 'enabled'
            : 'disabled'
        }.`,
      )
    }


  const formatTime =
    () =>
      lastUpdated
        .toLocaleTimeString(
          [],
          {
            hour:
              '2-digit',
            minute:
              '2-digit',
            second:
              '2-digit',
          }
        )


  return (
    <div className="super-admin-layout">

      <aside className="super-admin-sidebar">

        <div className="sidebar-brand">

          <div className="brand-badge">
            SA
          </div>

          <div>
            <h2>
              Super Admin
            </h2>

            <p>
              Creative Collab
            </p>
          </div>

        </div>

        <nav className="sidebar-navigation">

          <button
            className={
              section
              ===
              'overview'
                ? 'active'
                : ''
            }
            onClick={
              () =>
                setSection(
                  'overview'
                )
            }
          >
            Overview
          </button>

          <button
            className={
              section
              ===
              'admins'
                ? 'active'
                : ''
            }
            onClick={
              () =>
                setSection(
                  'admins'
                )
            }
          >
            Admin Management
          </button>

          <button
            className={
              section
              ===
              'reports'
                ? 'active'
                : ''
            }
            onClick={
              () =>
                setSection(
                  'reports'
                )
            }
          >
            Report Assignment

            {
              unassignedReports > 0
              &&
              (
                <span className="nav-count">
                  {
                    unassignedReports
                  }
                </span>
              )
            }
          </button>

          <button
            className={
              section
              ===
              'analytics'
                ? 'active'
                : ''
            }
            onClick={
              () =>
                setSection(
                  'analytics'
                )
            }
          >
            Analytics
          </button>

          <button
            className={
              section
              ===
              'roles'
                ? 'active'
                : ''
            }
            onClick={
              () =>
                setSection(
                  'roles'
                )
            }
          >
            Roles & Permissions
          </button>

          <button
            className={
              section
              ===
              'modules'
                ? 'active'
                : ''
            }
            onClick={
              () =>
                setSection(
                  'modules'
                )
            }
          >
            System Modules
          </button>

          <button
            className={
              section
              ===
              'system'
                ? 'active'
                : ''
            }
            onClick={
              () =>
                setSection(
                  'system'
                )
            }
          >
            System
          </button>

          <button
            className={
              section
              ===
              'audit'
                ? 'active'
                : ''
            }
            onClick={
              () =>
                setSection(
                  'audit'
                )
            }
          >
            Full Audit Logs
          </button>

        </nav>

      </aside>


      <main className="super-admin-main">

        <header className="super-admin-header">

          <div>

            <h1>
              {
                section
                ===
                'overview'
                &&
                'Platform Overview'
              }

              {
                section
                ===
                'admins'
                &&
                'Admin Management'
              }

              {
                section
                ===
                'reports'
                &&
                'Report Assignment'
              }

              {
                section
                ===
                'analytics'
                &&
                'Platform Analytics'
              }

              {
                section
                ===
                'roles'
                &&
                'Roles & Permissions'
              }

              {
                section
                ===
                'modules'
                &&
                'System Modules'
              }

              {
                section
                ===
                'system'
                &&
                'System Control'
              }

              {
                section
                ===
                'audit'
                &&
                'Full Audit Logs'
              }
            </h1>

            <p>
              Manage administration,
              moderation and platform
              operations.
            </p>

          </div>

          {
            section
            !==
            'analytics'
            &&
            (
              <div className="live-status">

                <span className="live-dot" />

                <div>
                  <strong>
                    Live
                  </strong>

                  <small>
                    Updated
                    {' '}
                    {
                      formatTime()
                    }
                  </small>
                </div>

                <button
                  className="refresh-button"
                  onClick={
                    handleRefresh
                  }
                >
                  Refresh
                </button>

              </div>
            )
          }

        </header>


        {
          toast
          &&
          (
            <div
              className={
                `dashboard-toast ${toast.type}`
              }
            >
              {
                toast.message
              }
            </div>
          )
        }


        {
          section
          ===
          'overview'
          &&
          (
            <>

              <div className="period-selector">

                {
                  (
                    [
                      'today',
                      '7d',
                      '30d',
                      '6m',
                      '1y',
                    ] as OverviewPeriod[]
                  ).map(
                    period => (
                      <button
                        key={
                          period
                        }
                        className={
                          overviewPeriod
                          ===
                          period
                            ? 'active'
                            : ''
                        }
                        onClick={
                          () =>
                            setOverviewPeriod(
                              period
                            )
                        }
                      >
                        {
                          periodLabels[
                            period
                          ]
                        }
                      </button>
                    )
                  )
                }

              </div>


              <section className="metric-grid">

                <article className="metric-card">
                  <span>
                    Total Users
                  </span>

                  <strong>
                    {
                      (
                        1250
                        +
                        overviewTotals
                          .newUsers
                      )
                        .toLocaleString()
                    }
                  </strong>

                  <small className="positive-copy">
                    +8.2% from previous period
                  </small>
                </article>


                <article className="metric-card">
                  <span>
                    Active Users
                  </span>

                  <strong>
                    {
                      activeUsersNow
                        .toLocaleString()
                    }
                  </strong>

                  <small>
                    Current {
                      periodLabels[
                        overviewPeriod
                      ].toLowerCase()
                    } activity
                  </small>
                </article>


                <article className="metric-card">
                  <span>
                    New Users
                  </span>

                  <strong>
                    {
                      overviewTotals
                        .newUsers
                        .toLocaleString()
                    }
                  </strong>

                  <small className="positive-copy">
                    +6.8% registrations
                  </small>
                </article>


                <article className="metric-card">
                  <span>
                    Administrators
                  </span>

                  <strong>
                    {
                      activeAdmins
                    }
                  </strong>

                  <small>
                    Active platform administrators
                  </small>
                </article>


                <article className="metric-card">
                  <span>
                    Reports
                  </span>

                  <strong>
                    {
                      overviewTotals
                        .reports
                        .toLocaleString()
                    }
                  </strong>

                  <small>
                    {
                      unassignedReports
                    }
                    {' '}
                    currently unassigned
                  </small>
                </article>


                <article className="metric-card">
                  <span>
                    Resolved
                  </span>

                  <strong>
                    {
                      overviewTotals
                        .resolved
                        .toLocaleString()
                    }
                  </strong>

                  <small className="positive-copy">
                    82% period resolution rate
                  </small>
                </article>

              </section>


              <section className="dashboard-grid">

                <article className="dashboard-card chart-card">

                  <div className="card-heading">

                    <div>
                      <h3>
                        User Activity Trend
                      </h3>

                      <p>
                        Active users for {
                          periodLabels[
                            overviewPeriod
                          ].toLowerCase()
                        }.
                      </p>
                    </div>

                    <span className="trend-positive">
                      +12.4%
                    </span>

                  </div>

                  <LineChart
                    data={
                      overviewData
                    }
                    dataKey="activeUsers"
                  />

                </article>


                <article className="dashboard-card">

                  <div className="card-heading">

                    <div>
                      <h3>
                        System Alerts
                      </h3>

                      <p>
                        Items needing platform attention.
                      </p>
                    </div>

                  </div>


                  <div className="system-alert-list">

                    {
                      unassignedReports > 0
                      &&
                      (
                        <button
                          type="button"
                          className="system-alert warning"
                          onClick={
                            () =>
                              setSection(
                                'reports'
                              )
                          }
                        >
                          <span>
                            ⚠
                          </span>

                          <div>
                            <strong>
                              {
                                unassignedReports
                              }
                              {' '}
                              unassigned reports
                            </strong>

                            <small>
                              Assign them to available administrators.
                            </small>
                          </div>
                        </button>
                      )
                    }


                    {
                      urgentReports > 0
                      &&
                      (
                        <button
                          type="button"
                          className="system-alert danger"
                          onClick={
                            () =>
                              setSection(
                                'reports'
                              )
                          }
                        >
                          <span>
                            !
                          </span>

                          <div>
                            <strong>
                              {
                                urgentReports
                              }
                              {' '}
                              urgent report
                              {
                                urgentReports
                                ===
                                1
                                  ? ''
                                  : 's'
                              }
                            </strong>

                            <small>
                              Immediate moderation attention recommended.
                            </small>
                          </div>
                        </button>
                      )
                    }


                    {
                      overdueReports > 0
                      &&
                      (
                        <button
                          type="button"
                          className="system-alert warning"
                          onClick={
                            () =>
                              setSection(
                                'reports'
                              )
                          }
                        >
                          <span>
                            ⏱
                          </span>

                          <div>
                            <strong>
                              {
                                overdueReports
                              }
                              {' '}
                              overdue moderation item
                              {
                                overdueReports
                                ===
                                1
                                  ? ''
                                  : 's'
                              }
                            </strong>

                            <small>
                              Older than 24 hours.
                            </small>
                          </div>
                        </button>
                      )
                    }


                    <div className="system-alert healthy">
                      <span>
                        ✓
                      </span>

                      <div>
                        <strong>
                          Platform services healthy
                        </strong>

                        <small>
                          API, database and modules are operational.
                        </small>
                      </div>
                    </div>

                  </div>

                </article>

              </section>


              <section className="dashboard-grid">

                <article className="dashboard-card chart-card">

                  <div className="card-heading">
                    <div>
                      <h3>
                        Report Trend
                      </h3>

                      <p>
                        Moderation demand across the selected period.
                      </p>
                    </div>

                    <span className="trend-neutral">
                      {
                        overviewTotals
                          .reports
                      }
                      {' '}
                      total
                    </span>
                  </div>

                  <LineChart
                    data={
                      overviewData
                    }
                    dataKey="reports"
                  />

                </article>


                <article className="dashboard-card">

                  <div className="card-heading">
                    <div>
                      <h3>
                        Pending Admin Tasks
                      </h3>

                      <p>
                        Current work requiring action.
                      </p>
                    </div>
                  </div>

                  <div className="pending-task-list">

                    <button
                      type="button"
                      onClick={
                        () =>
                          setSection(
                            'reports'
                          )
                      }
                    >
                      <span>
                        Unassigned Reports
                      </span>

                      <strong>
                        {
                          unassignedReports
                        }
                      </strong>
                    </button>


                    <button
                      type="button"
                      onClick={
                        () =>
                          setSection(
                            'reports'
                          )
                      }
                    >
                      <span>
                        Urgent Reports
                      </span>

                      <strong>
                        {
                          urgentReports
                        }
                      </strong>
                    </button>


                    <button
                      type="button"
                      onClick={
                        () =>
                          setSection(
                            'admins'
                          )
                      }
                    >
                      <span>
                        Suspended Admins
                      </span>

                      <strong>
                        {
                          normalAdmins.filter(
                            admin =>
                              admin.status
                              ===
                              'SUSPENDED'
                          ).length
                        }
                      </strong>
                    </button>


                    <button
                      type="button"
                      onClick={
                        () =>
                          setSection(
                            'modules'
                          )
                      }
                    >
                      <span>
                        Disabled Modules
                      </span>

                      <strong>
                        {
                          modules.length
                          -
                          enabledModules
                        }
                      </strong>
                    </button>

                  </div>

                </article>

              </section>


              <section className="dashboard-grid">

                <article className="dashboard-card">

                  <div className="card-heading">

                    <div>
                      <h3>
                        Top Creators
                      </h3>

                      <p>
                        Highest follower counts and engagement.
                      </p>
                    </div>

                    <button
                      className="secondary-button"
                      onClick={
                        () =>
                          setSection(
                            'analytics'
                          )
                      }
                    >
                      Full Analytics
                    </button>

                  </div>


                  <div className="top-creator-list">

                    {
                      topCreators.map(
                        (
                          creator,
                          index,
                        ) => (
                          <div
                            key={
                              creator.id
                            }
                            className="top-creator-row"
                          >

                            <span className="creator-rank">
                              {
                                index + 1
                              }
                            </span>

                            <div className="creator-details">
                              <strong>
                                {
                                  creator.name
                                }
                              </strong>

                              <small>
                                {
                                  creator.username
                                }
                              </small>
                            </div>

                            <div className="creator-stat">
                              <strong>
                                {
                                  creator.followers
                                    .toLocaleString()
                                }
                              </strong>

                              <small>
                                followers
                              </small>
                            </div>

                            <div className="creator-stat">
                              <strong>
                                {
                                  creator.engagement
                                    .toLocaleString()
                                }
                              </strong>

                              <small>
                                engagement
                              </small>
                            </div>

                          </div>
                        )
                      )
                    }

                  </div>

                </article>


                <article className="dashboard-card">

                  <div className="card-heading">

                    <div>
                      <h3>
                        Recent Registrations
                      </h3>

                      <p>
                        New people and organisations joining the platform.
                      </p>
                    </div>

                  </div>


                  <div className="registration-list">

                    {
                      recentRegistrations.map(
                        registration => (
                          <div
                            key={
                              registration.id
                            }
                          >

                            <div>
                              <strong>
                                {
                                  registration.name
                                }
                              </strong>

                              <small>
                                {
                                  registration.email
                                }
                              </small>
                            </div>

                            <div>
                              <span className="role-badge">
                                {
                                  registration.role
                                }
                              </span>

                              <small>
                                {
                                  registration.time
                                }
                              </small>
                            </div>

                          </div>
                        )
                      )
                    }

                  </div>

                </article>

              </section>


              <section className="dashboard-grid">

                <article className="dashboard-card">

                  <div className="card-heading">

                    <div>
                      <h3>
                        Admin Workload & Performance
                      </h3>

                      <p>
                        Current moderation workload and today's resolutions.
                      </p>
                    </div>

                    <button
                      className="primary-button"
                      onClick={
                        () => {
                          setSection(
                            'admins'
                          )
                          setShowAddAdmin(
                            true
                          )
                        }
                      }
                    >
                      + Add Administrator
                    </button>

                  </div>


                  <div className="table-container">

                    <table>

                      <thead>
                        <tr>
                          <th>
                            Administrator
                          </th>
                          <th>
                            Status
                          </th>
                          <th>
                            Assigned
                          </th>
                          <th>
                            Resolved Today
                          </th>
                          <th>
                            Completion
                          </th>
                        </tr>
                      </thead>

                      <tbody>

                        {
                          normalAdmins.map(
                            admin => {

                              const completion =
                                Math.min(
                                  100,
                                  Math.round(
                                    (
                                      admin.resolvedToday
                                      /
                                      Math.max(
                                        admin.resolvedToday
                                        +
                                        admin.assignedReports,
                                        1,
                                      )
                                    )
                                    *
                                    100
                                  )
                                )

                              return (
                                <tr
                                  key={
                                    admin.id
                                  }
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
                                    <span
                                      className={
                                        `status-badge ${
                                          admin.status
                                            .toLowerCase()
                                        }`
                                      }
                                    >
                                      {
                                        admin.status
                                      }
                                    </span>
                                  </td>

                                  <td>
                                    {
                                      admin.assignedReports
                                    }
                                  </td>

                                  <td>
                                    {
                                      admin.resolvedToday
                                    }
                                  </td>

                                  <td>
                                    <div className="workload-cell">
                                      <div className="workload-bar">
                                        <span
                                          style={{
                                            width:
                                              `${completion}%`,
                                          }}
                                        />
                                      </div>

                                      <small>
                                        {
                                          completion
                                        }
                                        %
                                      </small>
                                    </div>
                                  </td>
                                </tr>
                              )
                            }
                          )
                        }

                      </tbody>

                    </table>

                  </div>

                </article>


                <article className="dashboard-card">

                  <div className="card-heading">

                    <div>
                      <h3>
                        Platform Health
                      </h3>

                      <p>
                        Live service and configuration visibility.
                      </p>
                    </div>

                  </div>


                  <div className="health-grid">

                    <div>
                      <span>
                        API
                      </span>

                      <strong className="healthy-text">
                        Healthy
                      </strong>
                    </div>

                    <div>
                      <span>
                        Database
                      </span>

                      <strong className="healthy-text">
                        Connected
                      </strong>
                    </div>

                    <div>
                      <span>
                        Modules
                      </span>

                      <strong>
                        {
                          enabledModules
                        }
                        /
                        {
                          modules.length
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Active Admins
                      </span>

                      <strong>
                        {
                          activeAdmins
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Open Reports
                      </span>

                      <strong>
                        {
                          openReports
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        SLA Risk
                      </span>

                      <strong
                        className={
                          overdueReports > 0
                            ? 'danger-text'
                            : 'healthy-text'
                        }
                      >
                        {
                          overdueReports
                        }
                      </strong>
                    </div>

                  </div>

                </article>

              </section>


              <section className="dashboard-card">

                <div className="card-heading">

                  <div>
                    <h3>
                      Recent Administrative Activity
                    </h3>

                    <p>
                      Latest recorded platform administration actions.
                    </p>
                  </div>

                  <button
                    className="secondary-button"
                    onClick={
                      () =>
                        setSection(
                          'audit'
                        )
                    }
                  >
                    View Full Audit Log
                  </button>

                </div>


                <div className="table-container">

                  <table>

                    <thead>
                      <tr>
                        <th>
                          Administrator
                        </th>
                        <th>
                          Action
                        </th>
                        <th>
                          Target
                        </th>
                        <th>
                          Time
                        </th>
                      </tr>
                    </thead>

                    <tbody>

                      {
                        auditLogs
                          .slice(
                            0,
                            5,
                          )
                          .map(
                            log => (
                              <tr
                                key={
                                  log.id
                                }
                              >
                                <td>
                                  <strong>
                                    {
                                      log.admin
                                    }
                                  </strong>
                                </td>

                                <td>
                                  <span className="audit-action">
                                    {
                                      log.action
                                    }
                                  </span>
                                </td>

                                <td>
                                  {
                                    log.target
                                  }
                                </td>

                                <td>
                                  {
                                    log.time
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
          section
          ===
          'admins'
          &&
          (
            <section className="dashboard-card">

              <div className="card-heading">

                <div>
                  <h3>
                    Administrator Accounts
                  </h3>

                  <p>
                    Only Super Admin can add,
                    suspend or remove administrator privileges.
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={
                    () =>
                      setShowAddAdmin(
                        true
                      )
                  }
                >
                  + Add Administrator
                </button>

              </div>


              <div className="table-container">

                <table>

                  <thead>
                    <tr>
                      <th>
                        Name
                      </th>
                      <th>
                        Email
                      </th>
                      <th>
                        Role
                      </th>
                      <th>
                        Status
                      </th>
                      <th>
                        Assigned Reports
                      </th>
                      <th>
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {
                      admins.map(
                        admin => (
                          <tr
                            key={
                              admin.id
                            }
                          >

                            <td>
                              <strong>
                                {
                                  admin.name
                                }
                              </strong>
                            </td>

                            <td>
                              {
                                admin.email
                              }
                            </td>

                            <td>
                              <span className="role-badge">
                                {
                                  admin.role
                                }
                              </span>
                            </td>

                            <td>
                              <span
                                className={
                                  `status-badge ${
                                    admin.status
                                      .toLowerCase()
                                  }`
                                }
                              >
                                {
                                  admin.status
                                }
                              </span>
                            </td>

                            <td>
                              {
                                admin.assignedReports
                              }
                            </td>

                            <td>

                              {
                                admin.role
                                ===
                                'SUPER_ADMIN'
                                  ? (
                                    <span className="protected-label">
                                      Protected
                                    </span>
                                  )
                                  : (
                                    <div className="action-buttons">

                                      <button
                                        className="secondary-button"
                                        onClick={
                                          () =>
                                            toggleAdminStatus(
                                              admin.id
                                            )
                                        }
                                      >
                                        {
                                          admin.status
                                          ===
                                          'ACTIVE'
                                            ? 'Suspend'
                                            : 'Reactivate'
                                        }
                                      </button>

                                      <button
                                        className="danger-button"
                                        onClick={
                                          () =>
                                            removeAdmin(
                                              admin.id
                                            )
                                        }
                                      >
                                        Remove Admin
                                      </button>

                                    </div>
                                  )
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
          )
        }


        {
          section
          ===
          'reports'
          &&
          (
            <>

              <section className="metric-grid compact">

                <article className="metric-card">
                  <span>
                    Unassigned
                  </span>

                  <strong>
                    {
                      unassignedReports
                    }
                  </strong>
                </article>

                <article className="metric-card">
                  <span>
                    Under Review
                  </span>

                  <strong>
                    {
                      reports.filter(
                        report =>
                          report.status
                          ===
                          'UNDER_REVIEW'
                      ).length
                    }
                  </strong>
                </article>

                <article className="metric-card">
                  <span>
                    Urgent
                  </span>

                  <strong>
                    {
                      urgentReports
                    }
                  </strong>
                </article>

                <article className="metric-card">
                  <span>
                    Overdue
                  </span>

                  <strong>
                    {
                      overdueReports
                    }
                  </strong>
                </article>

              </section>


              <section className="dashboard-card">

                <div className="card-heading">

                  <div>
                    <h3>
                      Report Assignment Queue
                    </h3>

                    <p>
                      Assign or reassign moderation reports
                      to available administrators.
                    </p>
                  </div>

                </div>


                <div className="table-container">

                  <table>

                    <thead>
                      <tr>
                        <th>
                          Report
                        </th>
                        <th>
                          Target
                        </th>
                        <th>
                          Reason
                        </th>
                        <th>
                          Priority
                        </th>
                        <th>
                          Age
                        </th>
                        <th>
                          Assigned To
                        </th>
                        <th>
                          Status
                        </th>
                        <th>
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>

                      {
                        reports.map(
                          report => {

                            const assignedAdmin =
                              admins.find(
                                admin =>
                                  admin.id
                                  ===
                                  report.assignedAdminId
                              )

                            return (
                              <tr
                                key={
                                  report.id
                                }
                              >

                                <td>
                                  <strong>
                                    #
                                    {
                                      report.id
                                    }
                                  </strong>

                                  <small>
                                    {
                                      report.createdAt
                                    }
                                  </small>
                                </td>

                                <td>
                                  {
                                    report.target
                                  }
                                </td>

                                <td>
                                  {
                                    report.reason
                                  }
                                </td>

                                <td>
                                  <span
                                    className={
                                      `priority-badge ${
                                        report.priority
                                          .toLowerCase()
                                      }`
                                    }
                                  >
                                    {
                                      report.priority
                                    }
                                  </span>
                                </td>

                                <td>
                                  <span
                                    className={
                                      report.ageHours
                                      >=
                                      24
                                        ? 'sla-overdue'
                                        : 'sla-normal'
                                    }
                                  >
                                    {
                                      report.ageHours
                                    }
                                    h
                                  </span>
                                </td>

                                <td>
                                  {
                                    assignedAdmin
                                      ? assignedAdmin.name
                                      : 'Unassigned'
                                  }
                                </td>

                                <td>
                                  <span className="status-badge">
                                    {
                                      report.status
                                        .replace(
                                          '_',
                                          ' '
                                        )
                                    }
                                  </span>
                                </td>

                                <td>
                                  <button
                                    className="primary-button small"
                                    onClick={
                                      () => {
                                        setAssigningReport(
                                          report
                                        )

                                        setSelectedAdminId(
                                          report.assignedAdminId
                                        )
                                      }
                                    }
                                  >
                                    {
                                      assignedAdmin
                                        ? 'Reassign'
                                        : 'Assign'
                                    }
                                  </button>
                                </td>

                              </tr>
                            )
                          }
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
          section
          ===
          'analytics'
          &&
          (
            <AnalyticsDashboard
              mode="superAdmin"
            />
          )
        }


        {
          section
          ===
          'roles'
          &&
          (
            <section className="dashboard-card">

              <div className="card-heading">
                <div>
                  <h3>
                    Role Permissions
                  </h3>

                  <p>
                    Platform permissions for Admin
                    and Super Admin accounts.
                  </p>
                </div>
              </div>


              <div className="table-container">

                <table>

                  <thead>
                    <tr>
                      <th>
                        Permission
                      </th>
                      <th>
                        Admin
                      </th>
                      <th>
                        Super Admin
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {
                      permissions.map(
                        item => (
                          <tr
                            key={
                              item.permission
                            }
                          >
                            <td>
                              {
                                item.permission
                              }
                            </td>

                            <td>
                              {
                                item.admin
                                  ? (
                                    <span className="permission-yes">
                                      ✓ Allowed
                                    </span>
                                  )
                                  : (
                                    <span className="permission-no">
                                      — Restricted
                                    </span>
                                  )
                              }
                            </td>

                            <td>
                              {
                                item.superAdmin
                                  ? (
                                    <span className="permission-yes">
                                      ✓ Allowed
                                    </span>
                                  )
                                  : (
                                    <span className="permission-no">
                                      — Restricted
                                    </span>
                                  )
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
          )
        }


        {
          section
          ===
          'modules'
          &&
          (
            <section className="dashboard-card">

              <div className="card-heading">

                <div>
                  <h3>
                    System Modules
                  </h3>

                  <p>
                    Enable or disable platform modules globally.
                  </p>
                </div>

              </div>


              <div className="module-grid">

                {
                  modules.map(
                    module => (
                      <div
                        className="module-card"
                        key={
                          module.id
                        }
                      >

                        <div>
                          <strong>
                            {
                              module.name
                            }
                          </strong>

                          <span>
                            {
                              module.enabled
                                ? 'Available to users'
                                : 'Currently disabled'
                            }
                          </span>
                        </div>

                        <button
                          className={
                            `toggle-button ${
                              module.enabled
                                ? 'enabled'
                                : ''
                            }`
                          }
                          onClick={
                            () =>
                              toggleModule(
                                module.id
                              )
                          }
                        >
                          {
                            module.enabled
                              ? 'Enabled'
                              : 'Disabled'
                          }
                        </button>

                      </div>
                    )
                  )
                }

              </div>

            </section>
          )
        }


        {
          section
          ===
          'system'
          &&
          (
            <>

              <section className="metric-grid compact">

                <article className="metric-card">
                  <span>
                    API Status
                  </span>

                  <strong className="healthy-text">
                    Healthy
                  </strong>
                </article>

                <article className="metric-card">
                  <span>
                    Database
                  </span>

                  <strong className="healthy-text">
                    Connected
                  </strong>
                </article>

                <article className="metric-card">
                  <span>
                    Enabled Modules
                  </span>

                  <strong>
                    {
                      enabledModules
                    }
                  </strong>
                </article>

                <article className="metric-card">
                  <span>
                    Service Status
                  </span>

                  <strong className="healthy-text">
                    Online
                  </strong>
                </article>

              </section>


              <section className="dashboard-card">

                <div className="card-heading">
                  <div>
                    <h3>
                      Global System Settings
                    </h3>

                    <p>
                      Super Admin-only platform controls.
                    </p>
                  </div>
                </div>


                <div className="settings-list">

                  <label>
                    <div>
                      <strong>
                        User Registration
                      </strong>

                      <span>
                        Allow new users to create accounts.
                      </span>
                    </div>

                    <input
                      type="checkbox"
                      checked={
                        settings.registrationEnabled
                      }
                      onChange={
                        () =>
                          setSettings(
                            previous => ({
                              ...previous,
                              registrationEnabled:
                                !previous.registrationEnabled,
                            })
                          )
                      }
                    />
                  </label>


                  <label>
                    <div>
                      <strong>
                        Event Creation
                      </strong>

                      <span>
                        Allow permitted accounts to publish events.
                      </span>
                    </div>

                    <input
                      type="checkbox"
                      checked={
                        settings.eventCreationEnabled
                      }
                      onChange={
                        () =>
                          setSettings(
                            previous => ({
                              ...previous,
                              eventCreationEnabled:
                                !previous.eventCreationEnabled,
                            })
                          )
                      }
                    />
                  </label>


                  <label>
                    <div>
                      <strong>
                        Collaboration Applications
                      </strong>

                      <span>
                        Allow users to apply for collaboration opportunities.
                      </span>
                    </div>

                    <input
                      type="checkbox"
                      checked={
                        settings.collaborationEnabled
                      }
                      onChange={
                        () =>
                          setSettings(
                            previous => ({
                              ...previous,
                              collaborationEnabled:
                                !previous.collaborationEnabled,
                            })
                          )
                      }
                    />
                  </label>


                  <label>
                    <div>
                      <strong>
                        Maintenance Mode
                      </strong>

                      <span>
                        Temporarily restrict normal platform access.
                      </span>
                    </div>

                    <input
                      type="checkbox"
                      checked={
                        settings.maintenanceMode
                      }
                      onChange={
                        () =>
                          setSettings(
                            previous => ({
                              ...previous,
                              maintenanceMode:
                                !previous.maintenanceMode,
                            })
                          )
                      }
                    />
                  </label>

                </div>

              </section>

            </>
          )
        }


        {
          section
          ===
          'audit'
          &&
          (
            <section className="dashboard-card">

              <div className="card-heading">
                <div>
                  <h3>
                    Administrator Audit Logs
                  </h3>

                  <p>
                    Recent administrative actions across the platform.
                  </p>
                </div>
              </div>


              <div className="table-container">

                <table>

                  <thead>
                    <tr>
                      <th>
                        Administrator
                      </th>
                      <th>
                        Action
                      </th>
                      <th>
                        Target / Details
                      </th>
                      <th>
                        Time
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {
                      auditLogs.map(
                        log => (
                          <tr
                            key={
                              log.id
                            }
                          >
                            <td>
                              <strong>
                                {
                                  log.admin
                                }
                              </strong>
                            </td>

                            <td>
                              <span className="audit-action">
                                {
                                  log.action
                                }
                              </span>
                            </td>

                            <td>
                              {
                                log.target
                              }
                            </td>

                            <td>
                              {
                                log.time
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
          )
        }

      </main>


      {
        showAddAdmin
        &&
        (
          <div className="modal-overlay">

            <div className="admin-modal">

              <div className="modal-heading">

                <div>
                  <h2>
                    Add Administrator
                  </h2>

                  <p>
                    Assign the ADMIN role to an existing active platform user.
                  </p>
                </div>

                <button
                  className="modal-close"
                  onClick={
                    () => {
                      setShowAddAdmin(
                        false
                      )

                      setSelectedUserId(
                        null
                      )
                    }
                  }
                >
                  ×
                </button>

              </div>


              <label className="form-field">
                Select User

                <select
                  value={
                    selectedUserId
                    ??
                    ''
                  }
                  onChange={
                    event =>
                      setSelectedUserId(
                        Number(
                          event.target.value
                        )
                        ||
                        null
                      )
                  }
                >
                  <option value="">
                    Select an existing user
                  </option>

                  {
                    availableUsers.map(
                      user => (
                        <option
                          key={
                            user.id
                          }
                          value={
                            user.id
                          }
                        >
                          {
                            user.name
                          }
                          {' — '}
                          {
                            user.email
                          }
                        </option>
                      )
                    )
                  }
                </select>

              </label>


              {
                selectedUserId
                &&
                (
                  <div className="selected-user-preview">

                    {
                      (() => {

                        const user =
                          availableUsers.find(
                            candidate =>
                              candidate.id
                              ===
                              selectedUserId
                          )

                        if (!user) {
                          return null
                        }

                        return (
                          <>
                            <strong>
                              {
                                user.name
                              }
                            </strong>

                            <span>
                              {
                                user.email
                              }
                            </span>

                            <span>
                              Current role:
                              {' '}
                              {
                                user.role
                              }
                            </span>

                            <span>
                              New role: ADMIN
                            </span>
                          </>
                        )
                      })()
                    }

                  </div>
                )
              }


              <div className="modal-actions">

                <button
                  className="secondary-button"
                  onClick={
                    () => {
                      setShowAddAdmin(
                        false
                      )

                      setSelectedUserId(
                        null
                      )
                    }
                  }
                >
                  Cancel
                </button>

                <button
                  className="primary-button"
                  disabled={
                    !selectedUserId
                  }
                  onClick={
                    handleAddAdmin
                  }
                >
                  Add Administrator
                </button>

              </div>

            </div>

          </div>
        )
      }


      {
        assigningReport
        &&
        (
          <div className="modal-overlay">

            <div className="admin-modal">

              <div className="modal-heading">

                <div>
                  <h2>
                    {
                      assigningReport
                        .assignedAdminId
                        ? 'Reassign Report'
                        : 'Assign Report'
                    }
                  </h2>

                  <p>
                    Report #
                    {
                      assigningReport.id
                    }
                    {' — '}
                    {
                      assigningReport.reason
                    }
                  </p>
                </div>

                <button
                  className="modal-close"
                  onClick={
                    () => {
                      setAssigningReport(
                        null
                      )

                      setSelectedAdminId(
                        null
                      )
                    }
                  }
                >
                  ×
                </button>

              </div>


              <div className="report-detail-box">

                <span>
                  Target
                </span>

                <strong>
                  {
                    assigningReport.target
                  }
                </strong>

                <span>
                  Priority
                </span>

                <strong>
                  {
                    assigningReport.priority
                  }
                </strong>

                <span>
                  Age
                </span>

                <strong>
                  {
                    assigningReport.ageHours
                  }
                  h
                </strong>

              </div>


              <label className="form-field">
                Assign to Administrator

                <select
                  value={
                    selectedAdminId
                    ??
                    ''
                  }
                  onChange={
                    event =>
                      setSelectedAdminId(
                        Number(
                          event.target.value
                        )
                        ||
                        null
                      )
                  }
                >
                  <option value="">
                    Select administrator
                  </option>

                  {
                    normalAdmins
                      .filter(
                        admin =>
                          admin.status
                          ===
                          'ACTIVE'
                      )
                      .map(
                        admin => (
                          <option
                            key={
                              admin.id
                            }
                            value={
                              admin.id
                            }
                          >
                            {
                              admin.name
                            }
                            {' — '}
                            {
                              admin.assignedReports
                            }
                            {' '}
                            assigned
                          </option>
                        )
                      )
                  }
                </select>

              </label>


              <div className="modal-actions">

                <button
                  className="secondary-button"
                  onClick={
                    () => {
                      setAssigningReport(
                        null
                      )

                      setSelectedAdminId(
                        null
                      )
                    }
                  }
                >
                  Cancel
                </button>

                <button
                  className="primary-button"
                  disabled={
                    !selectedAdminId
                  }
                  onClick={
                    assignReport
                  }
                >
                  {
                    assigningReport
                      .assignedAdminId
                      ? 'Reassign Report'
                      : 'Assign Report'
                  }
                </button>

              </div>

            </div>

          </div>
        )
      }

    </div>
  )
}


export default SuperAdminDashboard
