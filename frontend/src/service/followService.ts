import {
  getCurrentUser,
  getToken
} from './authService'


const API_BASE_URL =
  'http://localhost:8080/api'


type CountResponse = {
  count: number
}


type FollowStatusResponse = {
  following: boolean
}


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
// ERROR MESSAGE
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
// AUTH HEADERS
// ============================================

async function getAuthHeaders() {

  const token =
    getToken()


  if (!token) {

    throw new Error(
      'No active login session.'
    )
  }


  const currentUser =
    await getCurrentUser()


  return {

    Authorization:
      `Bearer ${token}`,

    'X-User-Id':
      String(
        currentUser.userId
      )

  }
}


// ============================================
// GET FOLLOWERS COUNT
// ============================================

export async function getFollowersCount(
  userId: number
): Promise<number> {

  try {

    const response =
      await fetch(
        `${API_BASE_URL}/users/${userId}/followers/count`
      )


    if (!response.ok) {

      console.warn(
        'Unable to load followers count:',
        response.status
      )


      return 0
    }


    const data =
      await readResponse(
        response
      )


    if (
      typeof data !== 'object'
      ||
      data === null
      ||
      !('count' in data)
    ) {

      return 0
    }


    return Number(
      (
        data as CountResponse
      ).count ?? 0
    )


  } catch (error) {

    console.warn(
      'Followers count error:',
      error
    )


    return 0
  }
}


// ============================================
// GET FOLLOWING COUNT
// ============================================

export async function getFollowingCount(
  userId: number
): Promise<number> {

  try {

    const response =
      await fetch(
        `${API_BASE_URL}/users/${userId}/following/count`
      )


    if (!response.ok) {

      console.warn(
        'Unable to load following count:',
        response.status
      )


      return 0
    }


    const data =
      await readResponse(
        response
      )


    if (
      typeof data !== 'object'
      ||
      data === null
      ||
      !('count' in data)
    ) {

      return 0
    }


    return Number(
      (
        data as CountResponse
      ).count ?? 0
    )


  } catch (error) {

    console.warn(
      'Following count error:',
      error
    )


    return 0
  }
}


// ============================================
// GET FOLLOW STATUS
// ============================================

export async function getFollowStatus(
  targetUserId: number
): Promise<boolean> {

  try {

    const headers =
      await getAuthHeaders()


    const response =
      await fetch(
        `${API_BASE_URL}/users/${targetUserId}/follow-status`,
        {
          method: 'GET',

          headers
        }
      )


    if (!response.ok) {

      console.warn(
        'Unable to load follow status:',
        response.status
      )


      return false
    }


    const data =
      await readResponse(
        response
      )


    if (
      typeof data !== 'object'
      ||
      data === null
      ||
      !('following' in data)
    ) {

      return false
    }


    return Boolean(
      (
        data as FollowStatusResponse
      ).following
    )


  } catch (error) {

    console.warn(
      'Follow status error:',
      error
    )


    return false
  }
}


// ============================================
// FOLLOW USER
// ============================================

export async function followUser(
  targetUserId: number
): Promise<void> {

  const headers =
    await getAuthHeaders()


  const response =
    await fetch(
      `${API_BASE_URL}/users/${targetUserId}/follow`,
      {
        method: 'POST',

        headers
      }
    )


  if (!response.ok) {

    const data =
      await readResponse(
        response
      )


    console.error(
      'Follow failed:',
      response.status,
      data
    )


    throw new Error(
      getErrorMessage(
        data,
        `Unable to follow user. Status ${response.status}.`
      )
    )
  }
}


// ============================================
// UNFOLLOW USER
// ============================================

export async function unfollowUser(
  targetUserId: number
): Promise<void> {

  const headers =
    await getAuthHeaders()


  const response =
    await fetch(
      `${API_BASE_URL}/users/${targetUserId}/unfollow`,
      {
        method: 'DELETE',

        headers
      }
    )


  if (!response.ok) {

    const data =
      await readResponse(
        response
      )


    console.error(
      'Unfollow failed:',
      response.status,
      data
    )


    throw new Error(
      getErrorMessage(
        data,
        `Unable to unfollow user. Status ${response.status}.`
      )
    )
  }
}