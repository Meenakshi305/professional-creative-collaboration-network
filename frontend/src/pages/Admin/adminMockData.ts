export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING'
export type AccountType = 'PERSON' | 'ORGANISATION'
export type AnalyticsPeriod = '7d' | '30d' | '90d' | '1y'

export interface AdminUser {
  id: number
  name: string
  email: string
  accountType: AccountType
  status: UserStatus
  joinedDate: string
}

export type ReportStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'RESOLVED'
  | 'DISMISSED'

export interface AdminReport {
  id: number
  reportedBy: string
  targetType: string
  targetName: string
  reason: string
  status: ReportStatus
  createdDate: string
}

export interface ActivityItem {
  id: number
  action: string
  description: string
  time: string
}

export interface TrendPoint {
  label: string
  value: number
}

export interface EngagementPoint {
  label: string
  likes: number
  comments: number
  follows: number
}

export interface RankedCreator {
  id: number
  name: string
  category: string
  interactions: number
  likes: number
  followersGained: number
}

export interface RankedPost {
  id: number
  title: string
  creator: string
  likes: number
}

export interface ProfileViewItem {
  id: number
  name: string
  category: string
  views: number
}

export interface ReportCategory {
  name: string
  value: number
}

export interface FunnelStep {
  label: string
  value: number
}

export interface AnalyticsSummary {
  newUsers: number
  activeUsers: number
  totalLikes: number
  followersGained: number
  eventRegistrations: number
  applications: number
  reportsCreated: number
  newUsersChange: number
  activeUsersChange: number
  totalLikesChange: number
  followersChange: number
}

export interface AnalyticsDataset {
  label: string
  summary: AnalyticsSummary
  userGrowth: TrendPoint[]
  activeUsersTrend: TrendPoint[]
  engagement: EngagementPoint[]
  topCreators: RankedCreator[]
  topPosts: RankedPost[]
  mostViewedProfiles: ProfileViewItem[]
  accountDistribution: {
    active: number
    suspended: number
    pending: number
  }
  accountTypes: {
    people: number
    organisations: number
  }
  collaborationFunnel: FunnelStep[]
  eventRegistrationsTrend: TrendPoint[]
  reportCategories: ReportCategory[]
}

export const adminStats = {
  totalUsers: 1250,
  activeUsers: 1104,
  suspendedUsers: 32,
  organisations: 85,
  openReports: 18,
  activeEvents: 24,
  openOpportunities: 41,
}

export const mockUsers: AdminUser[] = [
  {
    id: 1,
    name: 'Ravi Kumar',
    email: 'ravi.demo@example.com',
    accountType: 'PERSON',
    status: 'ACTIVE',
    joinedDate: '08 Oct 2026',
  },
  {
    id: 2,
    name: 'Meena Sharma',
    email: 'meena.demo@example.com',
    accountType: 'PERSON',
    status: 'ACTIVE',
    joinedDate: '07 Oct 2026',
  },
  {
    id: 3,
    name: 'Adelaide Creatives',
    email: 'adelaide.creatives@example.com',
    accountType: 'ORGANISATION',
    status: 'ACTIVE',
    joinedDate: '05 Oct 2026',
  },
  {
    id: 4,
    name: 'Daniel Wilson',
    email: 'daniel@example.com',
    accountType: 'PERSON',
    status: 'SUSPENDED',
    joinedDate: '02 Oct 2026',
  },
  {
    id: 5,
    name: 'Creative Studio SA',
    email: 'studio@example.com',
    accountType: 'ORGANISATION',
    status: 'PENDING',
    joinedDate: '01 Oct 2026',
  },
]

export const mockReports: AdminReport[] = [
  {
    id: 101,
    reportedBy: 'Meena Sharma',
    targetType: 'Post',
    targetName: 'Community event post',
    reason: 'Inappropriate content',
    status: 'OPEN',
    createdDate: '09 Oct 2026',
  },
  {
    id: 102,
    reportedBy: 'Ravi Kumar',
    targetType: 'User',
    targetName: 'Daniel Wilson',
    reason: 'Harassment',
    status: 'UNDER_REVIEW',
    createdDate: '08 Oct 2026',
  },
  {
    id: 103,
    reportedBy: 'Adelaide Creatives',
    targetType: 'Portfolio',
    targetName: 'Poster Design',
    reason: 'Copyright concern',
    status: 'RESOLVED',
    createdDate: '06 Oct 2026',
  },
  {
    id: 104,
    reportedBy: 'Meena Sharma',
    targetType: 'Event',
    targetName: 'Creative Photography Meetup',
    reason: 'Incorrect information',
    status: 'DISMISSED',
    createdDate: '04 Oct 2026',
  },
]

export const recentActivities: ActivityItem[] = [
  {
    id: 1,
    action: 'User Registered',
    description: 'A new creative professional account was created.',
    time: '10 minutes ago',
  },
  {
    id: 2,
    action: 'Report Submitted',
    description: 'A new content report requires administrator review.',
    time: '25 minutes ago',
  },
  {
    id: 3,
    action: 'Event Published',
    description: 'A new creative networking event was published.',
    time: '1 hour ago',
  },
  {
    id: 4,
    action: 'Opportunity Created',
    description: 'A new collaboration opportunity was created.',
    time: '2 hours ago',
  },
  {
    id: 5,
    action: 'User Suspended',
    description: 'An account was suspended following moderation review.',
    time: '3 hours ago',
  },
]

const commonCreators: RankedCreator[] = [
  {
    id: 1,
    name: 'Ravi Kumar',
    category: 'Graphic Designer',
    interactions: 1240,
    likes: 842,
    followersGained: 176,
  },
  {
    id: 2,
    name: 'Meena Sharma',
    category: 'Photographer',
    interactions: 1015,
    likes: 715,
    followersGained: 148,
  },
  {
    id: 3,
    name: 'Creative Studio SA',
    category: 'Organisation',
    interactions: 890,
    likes: 643,
    followersGained: 126,
  },
  {
    id: 4,
    name: 'Daniel Smith',
    category: 'UI/UX Designer',
    interactions: 760,
    likes: 588,
    followersGained: 103,
  },
  {
    id: 5,
    name: 'Sarah Wilson',
    category: 'Illustrator',
    interactions: 685,
    likes: 512,
    followersGained: 94,
  },
]

const commonPosts: RankedPost[] = [
  {
    id: 1,
    title: 'Photography Workshop',
    creator: 'Ravi Kumar',
    likes: 842,
  },
  {
    id: 2,
    title: 'Graphic Design Tips',
    creator: 'Meena Sharma',
    likes: 715,
  },
  {
    id: 3,
    title: 'Adelaide Art Festival',
    creator: 'Creative Studio SA',
    likes: 643,
  },
  {
    id: 4,
    title: 'UI Design Inspiration',
    creator: 'Daniel Smith',
    likes: 588,
  },
  {
    id: 5,
    title: 'Creative Meetup',
    creator: 'Sarah Wilson',
    likes: 512,
  },
]

const commonProfiles: ProfileViewItem[] = [
  {
    id: 1,
    name: 'Ravi Kumar',
    category: 'Graphic Designer',
    views: 1850,
  },
  {
    id: 2,
    name: 'Meena Sharma',
    category: 'Photographer',
    views: 1420,
  },
  {
    id: 3,
    name: 'Sarah Wilson',
    category: 'Illustrator',
    views: 1105,
  },
  {
    id: 4,
    name: 'Creative Studio SA',
    category: 'Organisation',
    views: 980,
  },
  {
    id: 5,
    name: 'Daniel Smith',
    category: 'UI/UX Designer',
    views: 870,
  },
]

const commonReportCategories: ReportCategory[] = [
  { name: 'Harassment', value: 31 },
  { name: 'Inappropriate Content', value: 26 },
  { name: 'Spam', value: 21 },
  { name: 'Copyright', value: 14 },
  { name: 'Other', value: 8 },
]

export const analyticsByPeriod: Record<AnalyticsPeriod, AnalyticsDataset> = {
  '7d': {
    label: 'Last 7 Days',
    summary: {
      newUsers: 38,
      activeUsers: 910,
      totalLikes: 3842,
      followersGained: 1105,
      eventRegistrations: 214,
      applications: 96,
      reportsCreated: 24,
      newUsersChange: 9.4,
      activeUsersChange: 5.8,
      totalLikesChange: 14.6,
      followersChange: 7.2,
    },
    userGrowth: [
      { label: 'Fri', value: 1212 },
      { label: 'Sat', value: 1218 },
      { label: 'Sun', value: 1224 },
      { label: 'Mon', value: 1230 },
      { label: 'Tue', value: 1238 },
      { label: 'Wed', value: 1244 },
      { label: 'Thu', value: 1250 },
    ],
    activeUsersTrend: [
      { label: 'Fri', value: 720 },
      { label: 'Sat', value: 810 },
      { label: 'Sun', value: 845 },
      { label: 'Mon', value: 790 },
      { label: 'Tue', value: 910 },
      { label: 'Wed', value: 1020 },
      { label: 'Thu', value: 960 },
    ],
    engagement: [
      { label: 'Fri', likes: 410, comments: 102, follows: 118 },
      { label: 'Sat', likes: 498, comments: 121, follows: 135 },
      { label: 'Sun', likes: 552, comments: 142, follows: 149 },
      { label: 'Mon', likes: 510, comments: 130, follows: 144 },
      { label: 'Tue', likes: 620, comments: 154, follows: 167 },
      { label: 'Wed', likes: 666, comments: 170, follows: 196 },
      { label: 'Thu', likes: 586, comments: 161, follows: 196 },
    ],
    topCreators: commonCreators.map((creator, index) => ({
      ...creator,
      interactions: Math.round(creator.interactions * (0.30 - index * 0.01)),
      likes: Math.round(creator.likes * (0.28 - index * 0.01)),
      followersGained: Math.round(creator.followersGained * 0.30),
    })),
    topPosts: commonPosts.map((post, index) => ({
      ...post,
      likes: Math.round(post.likes * (0.28 - index * 0.01)),
    })),
    mostViewedProfiles: commonProfiles.map((profile, index) => ({
      ...profile,
      views: Math.round(profile.views * (0.25 - index * 0.005)),
    })),
    accountDistribution: {
      active: 88,
      suspended: 3,
      pending: 9,
    },
    accountTypes: {
      people: 93,
      organisations: 7,
    },
    collaborationFunnel: [
      { label: 'Opportunities Created', value: 41 },
      { label: 'Applications', value: 286 },
      { label: 'Accepted', value: 74 },
      { label: 'Teams Created', value: 38 },
    ],
    eventRegistrationsTrend: [
      { label: 'Fri', value: 24 },
      { label: 'Sat', value: 32 },
      { label: 'Sun', value: 28 },
      { label: 'Mon', value: 26 },
      { label: 'Tue', value: 38 },
      { label: 'Wed', value: 35 },
      { label: 'Thu', value: 31 },
    ],
    reportCategories: commonReportCategories,
  },
  '30d': {
    label: 'Last 30 Days',
    summary: {
      newUsers: 126,
      activeUsers: 1104,
      totalLikes: 18240,
      followersGained: 4820,
      eventRegistrations: 860,
      applications: 286,
      reportsCreated: 126,
      newUsersChange: 12.8,
      activeUsersChange: 5.2,
      totalLikesChange: 14.2,
      followersChange: 7.2,
    },
    userGrowth: [
      { label: 'Week 1', value: 1130 },
      { label: 'Week 2', value: 1162 },
      { label: 'Week 3', value: 1194 },
      { label: 'Week 4', value: 1250 },
    ],
    activeUsersTrend: [
      { label: 'Week 1', value: 910 },
      { label: 'Week 2', value: 964 },
      { label: 'Week 3', value: 1028 },
      { label: 'Week 4', value: 1104 },
    ],
    engagement: [
      { label: 'Week 1', likes: 3200, comments: 940, follows: 1010 },
      { label: 'Week 2', likes: 4180, comments: 1100, follows: 1160 },
      { label: 'Week 3', likes: 4980, comments: 1290, follows: 1240 },
      { label: 'Week 4', likes: 5880, comments: 1510, follows: 1410 },
    ],
    topCreators: commonCreators,
    topPosts: commonPosts,
    mostViewedProfiles: commonProfiles,
    accountDistribution: {
      active: 88,
      suspended: 3,
      pending: 9,
    },
    accountTypes: {
      people: 93,
      organisations: 7,
    },
    collaborationFunnel: [
      { label: 'Opportunities Created', value: 420 },
      { label: 'Applications', value: 2840 },
      { label: 'Accepted', value: 610 },
      { label: 'Teams Created', value: 385 },
    ],
    eventRegistrationsTrend: [
      { label: 'Week 1', value: 175 },
      { label: 'Week 2', value: 198 },
      { label: 'Week 3', value: 226 },
      { label: 'Week 4', value: 261 },
    ],
    reportCategories: commonReportCategories,
  },
  '90d': {
    label: 'Last 90 Days',
    summary: {
      newUsers: 344,
      activeUsers: 1168,
      totalLikes: 52140,
      followersGained: 13820,
      eventRegistrations: 2360,
      applications: 884,
      reportsCreated: 318,
      newUsersChange: 18.6,
      activeUsersChange: 8.1,
      totalLikesChange: 21.5,
      followersChange: 13.4,
    },
    userGrowth: [
      { label: 'Jul', value: 906 },
      { label: 'Aug', value: 1034 },
      { label: 'Sep', value: 1168 },
      { label: 'Oct', value: 1250 },
    ],
    activeUsersTrend: [
      { label: 'Jul', value: 770 },
      { label: 'Aug', value: 892 },
      { label: 'Sep', value: 1014 },
      { label: 'Oct', value: 1104 },
    ],
    engagement: [
      { label: 'Jul', likes: 14200, comments: 3800, follows: 3460 },
      { label: 'Aug', likes: 16840, comments: 4210, follows: 4140 },
      { label: 'Sep', likes: 21100, comments: 5050, follows: 6220 },
    ],
    topCreators: commonCreators.map((creator) => ({
      ...creator,
      interactions: Math.round(creator.interactions * 2.7),
      likes: Math.round(creator.likes * 2.7),
      followersGained: Math.round(creator.followersGained * 2.5),
    })),
    topPosts: commonPosts.map((post) => ({
      ...post,
      likes: Math.round(post.likes * 2.6),
    })),
    mostViewedProfiles: commonProfiles.map((profile) => ({
      ...profile,
      views: Math.round(profile.views * 2.4),
    })),
    accountDistribution: {
      active: 89,
      suspended: 3,
      pending: 8,
    },
    accountTypes: {
      people: 93,
      organisations: 7,
    },
    collaborationFunnel: [
      { label: 'Opportunities Created', value: 1080 },
      { label: 'Applications', value: 6940 },
      { label: 'Accepted', value: 1480 },
      { label: 'Teams Created', value: 920 },
    ],
    eventRegistrationsTrend: [
      { label: 'Jul', value: 640 },
      { label: 'Aug', value: 770 },
      { label: 'Sep', value: 950 },
    ],
    reportCategories: commonReportCategories,
  },
  '1y': {
    label: 'Last 1 Year',
    summary: {
      newUsers: 1098,
      activeUsers: 1104,
      totalLikes: 168420,
      followersGained: 42810,
      eventRegistrations: 7860,
      applications: 2980,
      reportsCreated: 1032,
      newUsersChange: 42.6,
      activeUsersChange: 31.2,
      totalLikesChange: 56.8,
      followersChange: 39.5,
    },
    userGrowth: [
      { label: 'Nov', value: 152 },
      { label: 'Jan', value: 312 },
      { label: 'Mar', value: 498 },
      { label: 'May', value: 690 },
      { label: 'Jul', value: 906 },
      { label: 'Sep', value: 1168 },
      { label: 'Oct', value: 1250 },
    ],
    activeUsersTrend: [
      { label: 'Nov', value: 118 },
      { label: 'Jan', value: 246 },
      { label: 'Mar', value: 392 },
      { label: 'May', value: 560 },
      { label: 'Jul', value: 770 },
      { label: 'Sep', value: 1014 },
      { label: 'Oct', value: 1104 },
    ],
    engagement: [
      { label: 'Nov', likes: 6200, comments: 1400, follows: 1820 },
      { label: 'Jan', likes: 11400, comments: 2720, follows: 3100 },
      { label: 'Mar', likes: 16800, comments: 4100, follows: 4520 },
      { label: 'May', likes: 22100, comments: 5240, follows: 5880 },
      { label: 'Jul', likes: 28600, comments: 6800, follows: 7100 },
      { label: 'Sep', likes: 35800, comments: 8420, follows: 8520 },
      { label: 'Oct', likes: 47520, comments: 10340, follows: 11870 },
    ],
    topCreators: commonCreators.map((creator) => ({
      ...creator,
      interactions: Math.round(creator.interactions * 8.8),
      likes: Math.round(creator.likes * 8.4),
      followersGained: Math.round(creator.followersGained * 7.8),
    })),
    topPosts: commonPosts.map((post) => ({
      ...post,
      likes: Math.round(post.likes * 7.6),
    })),
    mostViewedProfiles: commonProfiles.map((profile) => ({
      ...profile,
      views: Math.round(profile.views * 7.4),
    })),
    accountDistribution: {
      active: 88,
      suspended: 3,
      pending: 9,
    },
    accountTypes: {
      people: 93,
      organisations: 7,
    },
    collaborationFunnel: [
      { label: 'Opportunities Created', value: 4180 },
      { label: 'Applications', value: 22940 },
      { label: 'Accepted', value: 5210 },
      { label: 'Teams Created', value: 3385 },
    ],
    eventRegistrationsTrend: [
      { label: 'Nov', value: 380 },
      { label: 'Jan', value: 620 },
      { label: 'Mar', value: 810 },
      { label: 'May', value: 980 },
      { label: 'Jul', value: 1180 },
      { label: 'Sep', value: 1580 },
      { label: 'Oct', value: 2310 },
    ],
    reportCategories: commonReportCategories,
  },
}
