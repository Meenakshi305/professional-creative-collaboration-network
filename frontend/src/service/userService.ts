import {
  getCurrentUser,
  getToken
} from './authService'


const API_BASE_URL =
  'http://localhost:8080/api'


// ============================================
// SEARCH USER TYPE
// ============================================

export type SearchUser = {

  userId: number

  fullName: string

  username: string

  bio: string | null

  skills: string | null

  profileImageUrl: string | null
}


// ============================================
// SUGGESTED USER TYPE
// ============================================

export type SuggestedUser = {

  userId: number

  fullName: string

  username: string

  skills: string | null

  bio: string | null

  profileImageUrl: string | null

  matchedSkills: string[]

  matchScore: number
}


// ============================================
// ERROR RESPONSE
// ============================================

type ErrorResponse = {

  message?: string
}


// ============================================
// READ RESPONSE
// ============================================

async function readResponse(
  response: Response
): Promise<unknown> {

  const text =
    await response.text()


  if (!text) {

    return null
  }


  try {

    return JSON.parse(
      text
    )

  } catch {

    return text
  }
}


// ============================================
// GET ERROR MESSAGE
// ============================================

function getErrorMessage(
  data: unknown,
  fallback: string
) {

  if (
    typeof data === 'object'
    &&
    data !== null
    &&
    'message' in data
  ) {

    const message =
      (data as ErrorResponse)
        .message


    if (
      typeof message === 'string'
      &&
      message.trim()
    ) {

      return message
    }
  }


  if (
    typeof data === 'string'
    &&
    data.trim()
  ) {

    return data
  }


  return fallback
}


// ============================================
// SEARCH USERS
// ============================================

export async function searchUsers(
  query: string
): Promise<SearchUser[]> {

  const cleanQuery =
    query.trim()


  if (!cleanQuery) {

    return []
  }


  const token =
    getToken()


  const response =
    await fetch(
      `${API_BASE_URL}/users/search?query=${encodeURIComponent(cleanQuery)}`,
      {
        method:
          'GET',

        headers:
          token
            ? {
                Authorization:
                  `Bearer ${token}`
              }
            : {}
      }
    )


  const data =
    await readResponse(
      response
    )


  if (!response.ok) {

    throw new Error(
      getErrorMessage(
        data,
        'Unable to search users.'
      )
    )
  }


  if (!Array.isArray(data)) {

    return []
  }


  return data as SearchUser[]
}


// ============================================
// GET SUGGESTED CREATIVES
// ============================================

export async function getSuggestedUsers():
Promise<SuggestedUser[]> {

  const currentUser =
    await getCurrentUser()


  const token =
    getToken()


  const response =
    await fetch(
      `${API_BASE_URL}/users/suggestions`,
      {
        method:
          'GET',

        headers: {

          'X-User-Id':
            String(
              currentUser.userId
            ),

          ...(token
            ? {
                Authorization:
                  `Bearer ${token}`
              }
            : {})
        }
      }
    )


  const data =
    await readResponse(
      response
    )


  if (!response.ok) {

    throw new Error(
      getErrorMessage(
        data,
        'Unable to load suggested creatives.'
      )
    )
  }


  if (!Array.isArray(data)) {

    return []
  }


  return data as SuggestedUser[]
}