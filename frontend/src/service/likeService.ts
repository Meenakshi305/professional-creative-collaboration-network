
import { getToken } from './authService'

// ==========================================
// API CONFIGURATION
// ==========================================

const API_BASE_URL = 'http://localhost:8080/api'

// ==========================================
// TYPES
// ==========================================

export type LikeStatus = {
  postId: number
  likeCount: number
  likedByMe: boolean
}

// ==========================================
// AUTHENTICATED API REQUEST
// ==========================================

async function likeRequest(
  postId: number,
  method: 'GET' | 'POST' | 'DELETE'
): Promise<LikeStatus> {

  const token = getToken()

  if (!token) {
    throw new Error(
      'You are not logged in. Please log in again.'
    )
  }

  if (!Number.isInteger(postId) || postId <= 0) {
    throw new Error('Invalid post ID')
  }

  const response = await fetch(
    `${API_BASE_URL}/posts/${postId}/likes`,
    {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      cache: 'no-store'
    }
  )

  // ==========================================
  // HANDLE ERRORS
  // ==========================================

  if (!response.ok) {

    let errorMessage = ''

    const responseText = await response.text()

    try {
      const errorData = JSON.parse(responseText)

      errorMessage =
        errorData.message ||
        errorData.error ||
        errorData.detail ||
        ''
    } catch {
      errorMessage = responseText
    }

    if (response.status === 401) {
      throw new Error(
        'Your login session has expired. Please log in again.'
      )
    }

    if (response.status === 403) {
      throw new Error(
        'Like request denied (403). Check JWT authentication and Spring Security permissions.'
      )
    }

    if (response.status === 404) {
      throw new Error(
        `Post ${postId} or the Like API was not found.`
      )
    }

    throw new Error(
      errorMessage ||
      `Unable to update likes (${response.status})`
    )
  }

  // ==========================================
  // VALIDATE RESPONSE
  // ==========================================

  const result: LikeStatus = await response.json()

  if (
    typeof result.postId !== 'number' ||
    typeof result.likeCount !== 'number' ||
    typeof result.likedByMe !== 'boolean'
  ) {
    throw new Error(
      'Invalid Like response received from the backend.'
    )
  }

  return result
}

// ==========================================
// GET LIKE COUNT AND STATUS
// GET /api/posts/{postId}/likes
// ==========================================

export async function getLikeStatus(
  postId: number
): Promise<LikeStatus> {

  return likeRequest(postId, 'GET')
}

// ==========================================
// LIKE POST
// POST /api/posts/{postId}/likes
// ==========================================

export async function likePost(
  postId: number
): Promise<LikeStatus> {

  return likeRequest(postId, 'POST')
}

// ==========================================
// UNLIKE POST
// DELETE /api/posts/{postId}/likes
// ==========================================

export async function unlikePost(
  postId: number
): Promise<LikeStatus> {

  return likeRequest(postId, 'DELETE')
}
