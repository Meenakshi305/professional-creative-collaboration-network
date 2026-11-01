import { getToken } from './authService'
import { API_ORIGIN } from '../config/api'

// ============================================
// API CONFIGURATION
// ============================================

const API_BASE_URL = API_ORIGIN
const API = `${API_BASE_URL}/api`

// ============================================
// TYPES
// ============================================

export type PostMedia = {
  mediaId: number
  mediaType: string
  viewUrl: string
  downloadUrl: string
  originalFileName: string
}

export type Post = {
  postId: number
  userId: number
  username: string
  caption: string | null
  media: PostMedia[]
  createdAt: string
  updatedAt: string
}

// ============================================
// AUTHENTICATION
// ============================================

function getAuthorizationHeaders(): Record<string, string> {
  const token = getToken()

  if (!token || !token.trim()) {
    throw new Error(
      'Your login session is missing. Please log in again.'
    )
  }

  return {
    Authorization: `Bearer ${token.trim()}`,
  }
}

// ============================================
// API REQUEST HANDLER
// ============================================

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const authHeaders = getAuthorizationHeaders()
  const headers = new Headers(options.headers)

  headers.set('Authorization', authHeaders.Authorization)

  // The browser sets the multipart boundary for file uploads.
  if (options.body instanceof FormData) {
    headers.delete('Content-Type')
  }

  let response: Response

  try {
    response = await fetch(`${API}${endpoint}`, {
      ...options,
      headers,
      credentials: 'omit',
    })
  } catch {
    throw new Error(
      'Unable to connect to the server. Please try again shortly.'
    )
  }

  if (response.status === 401) {
    throw new Error(
      'Your session is invalid or expired. Please log in again.'
    )
  }

  if (response.status === 403) {
    throw new Error(
      'Access denied. You do not have permission to perform this action.'
    )
  }

  if (!response.ok) {
    const message = await response.text()

    throw new Error(
      message || `Request failed with status ${response.status}.`
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

// ============================================
// GET DASHBOARD FEED
// ============================================

export async function getFeedPosts(): Promise<Post[]> {
  return apiRequest<Post[]>('/feed', {
    method: 'GET',
  })
}

// ============================================
// GET MY POSTS
// ============================================

export async function getMyPosts(): Promise<Post[]> {
  return apiRequest<Post[]>('/posts/me', {
    method: 'GET',
  })
}

// ============================================
// GET ANOTHER USER'S POSTS
// ============================================

export async function getUserPosts(userId: number): Promise<Post[]> {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error('Invalid user ID.')
  }

  return apiRequest<Post[]>(`/users/${userId}/posts`, {
    method: 'GET',
  })
}

// ============================================
// CREATE POST
// ============================================

export async function createPost(
  caption: string,
  files: File[] = []
): Promise<Post> {
  const cleanCaption = caption.trim()

  if (!cleanCaption && files.length === 0) {
    throw new Error('Please enter a caption or select an image.')
  }

  const formData = new FormData()

  if (cleanCaption) {
    formData.append('caption', cleanCaption)
  }

  files.forEach(file => {
    formData.append('files', file)
  })

  return apiRequest<Post>('/posts', {
    method: 'POST',
    body: formData,
  })
}

// ============================================
// DELETE POST
// ============================================

export async function deletePost(postId: number): Promise<void> {
  return apiRequest<void>(`/posts/${postId}`, {
    method: 'DELETE',
  })
}

// ============================================
// MEDIA URL
// ============================================

export function mediaUrl(path: string): string {
  if (!path) {
    return ''
  }

  if (/^https?:\/\//i.test(path)) {
    return path
  }

  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}