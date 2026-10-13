
import type { SearchUser } from './userService'

// Sample users for frontend testing only.
// These are NOT registered database users.

export const demoUsers: SearchUser[] = [
  {
    userId: 10001,
    fullName: 'Oliver Miller',
    username: 'olivermiller',
    bio: 'Photographer based in Adelaide.',
    skills: 'Photography, Photo Editing',
    profileImageUrl: null
  },
  {
    userId: 10002,
    fullName: 'Sophia Wilson',
    username: 'sophiawilson',
    bio: 'Graphic designer and digital artist.',
    skills: 'Graphic Design, Illustration',
    profileImageUrl: null
  },
  {
    userId: 10003,
    fullName: 'Ethan Brown',
    username: 'ethanbrown',
    bio: 'Video editor and content creator.',
    skills: 'Video Editing, Content Creation',
    profileImageUrl: null
  }
]

export function searchDemoUsers(query: string): SearchUser[] {
  const searchTerm = query.trim().toLowerCase()

  if (!searchTerm) {
    return []
  }

  return demoUsers.filter(user =>
    [
      user.fullName,
      user.username,
      user.bio ?? '',
      user.skills ?? ''
    ].some(value =>
      value.toLowerCase().includes(searchTerm)
    )
  )
}
