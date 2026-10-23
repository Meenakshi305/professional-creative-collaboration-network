
import { getToken } from './authService'

// ============================================
// API CONFIGURATION
// ============================================

const API_BASE_URL = 'http://localhost:8080'
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
    Authorization: `Bearer ${token.trim()}`
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

  headers.set(
    'Authorization',
    authHeaders.Authorization
  )

  // Never set Content-Type for FormData.
  // The browser generates the multipart boundary.
  if (options.body instanceof FormData) {
    headers.delete('Content-Type')
  }

  let response: Response

  try {
    response = await fetch(`${API}${endpoint}`, {
      ...options,
      headers,
      credentials: 'omit'
    })
  } catch {
    throw new Error(
      'Unable to connect to Spring Boot at localhost:8080.'
    )
  }

  if (response.status === 401) {
    throw new Error(
      'Your session is invalid or expired. Please log in again.'
    )
  }

  if (response.status === 403) {
    throw new Error(
      '403 Forbidden: Access denied. Verify your JWT token, Spring Security configuration and CSRF settings.'
    )
  }

  if (!response.ok) {
    const message = await response.text()

    throw new Error(
      message ||
      `Request failed with status ${response.status}`
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

// ============================================
// GET DASHBOARD FEED
// My posts + followed users' posts
// ============================================

export async function getFeedPosts(): Promise<Post[]> {
  return apiRequest<Post[]>('/feed', {
    method: 'GET'
  })
}

// ============================================
// GET MY POSTS
// ============================================

export async function getMyPosts(): Promise<Post[]> {
  return apiRequest<Post[]>('/posts/me', {
    method: 'GET'
  })
}

// ============================================
// GET ANOTHER USER'S POSTS
// ============================================

export async function getUserPosts(
  userId: number
): Promise<Post[]> {

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error('Invalid user ID')
  }

  return apiRequest<Post[]>(
    `/users/${userId}/posts`,
    {
      method: 'GET'
    }
  )
}

// ============================================
// CREATE POST
// Text + image uploads
// ============================================

export async function createPost(
  caption: string,
  files: File[] = []
): Promise<Post> {

  const cleanCaption = caption.trim()

  if (!cleanCaption && files.length === 0) {
    throw new Error(
      'Please enter a caption or select an image.'
    )
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
    body: formData
  })
}

// ============================================
// DELETE POST
// ============================================

export async function deletePost(
  postId: number
): Promise<void> {

  return apiRequest<void>(
    `/posts/${postId}`,
    {
      method: 'DELETE'
    }
  )
}

// ============================================
// MEDIA URL
// Existing MEGA-backed media endpoint
// ============================================

export function mediaUrl(path: string): string {

  if (!path) {
    return ''
  }

  if (/^https?:\/\//i.test(path)) {
    return path
  }

  return `${API_BASE_URL}${
    path.startsWith('/') ? path : `/${path}`
  }`
}
