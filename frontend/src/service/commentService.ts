
import { getToken } from './authService'

const API = 'http://localhost:8080/api'

export type PostComment = {
  commentId: number
  postId: number
  userId: number
  username: string
  content: string
  createdAt: string
  ownComment: boolean
}

async function request<T>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: object
): Promise<T> {
  const token = getToken()

  if (!token) {
    throw new Error('Please log in again.')
  }

  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined
        ? { 'Content-Type': 'application/json' }
        : {})
    },
    ...(body !== undefined
      ? { body: JSON.stringify(body) }
      : {})
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(
      `Comment request failed (${response.status}): ${message}`
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const getPostComments = (postId: number) =>
  request<PostComment[]>(`/posts/${postId}/comments`)

export const addPostComment = (
  postId: number,
  content: string
) =>
  request<PostComment>(
    `/posts/${postId}/comments`,
    'POST',
    { content: content.trim() }
  )

export const updatePostComment = (
  postId: number,
  commentId: number,
  content: string
) =>
  request<PostComment>(
    `/posts/${postId}/comments/${commentId}`,
    'PUT',
    { content: content.trim() }
  )

export const deletePostComment = (
  postId: number,
  commentId: number
) =>
  request<void>(
    `/posts/${postId}/comments/${commentId}`,
    'DELETE'
  )
