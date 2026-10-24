export type NotificationType =
  | 'follow'
  | 'like'
  | 'comment'
  | 'collaboration'

export type NotificationItem = {
  id: number
  message: string
  type: NotificationType
  createdAt: string
}

const API_URL = 'http://localhost:8080/api/notifications'

async function checkResponse(response: Response): Promise<void> {
  if (response.ok) return

  if (response.status === 401) {
    throw new Error('Your session has expired. Please sign in again.')
  }

  if (response.status === 403) {
    throw new Error('You do not have permission to access notifications.')
  }

  throw new Error(`Notification request failed (${response.status}).`)
}

/* Fetch remaining notifications, newest first */
export async function getNotifications(
  token: string,
  signal?: AbortSignal
): Promise<NotificationItem[]> {
  const response = await fetch(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    },
    signal
  })

  await checkResponse(response)

  const notifications: NotificationItem[] = await response.json()

  return notifications.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  )
}

/* Dismiss one notification */
export async function dismissNotification(
  id: number,
  token: string
): Promise<void> {
  const response = await fetch(`${API_URL}/${id}/dismiss`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  await checkResponse(response)
}